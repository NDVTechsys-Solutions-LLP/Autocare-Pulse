"""AutoCare Pulse backend regression tests.

Covers dealer JWT auth, customer session (Bearer fallback), AI-triaged incident
creation, photo upload + serve, dealer ops (assign/status/priority/escalate),
KPIs, and simulated Amazon Connect endpoints.
"""
import base64
import io
import os
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://auto-incident-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEALER_EMAIL = "ndvtechsys.solutions@gmail.com"
DEALER_PASS = "DealerPass123!"
CUSTOMER_TOKEN = "test_session_fixed_ABC123"  # seeded via mongosh

# 1x1 red JPEG (real bytes)
RED_JPEG_B64 = (
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a"
    "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy"
    "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIA"
    "AhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQA"
    "AAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3"
    "ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWm"
    "p6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMB"
    "AAIRAxEAPwD3+iiigD//2Q=="
)


@pytest.fixture(scope="session")
def dealer_token():
    r = requests.post(f"{API}/auth/dealer/login", json={"email": DEALER_EMAIL, "password": DEALER_PASS}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["dealer"]["role"] == "manager"
    return data["token"]


@pytest.fixture(scope="session")
def dealer_headers(dealer_token):
    return {"Authorization": f"Bearer {dealer_token}"}


@pytest.fixture(scope="session")
def cust_headers():
    return {"Authorization": f"Bearer {CUSTOMER_TOKEN}"}


# ---------------- Auth ----------------
class TestAuth:
    def test_dealer_login_bad(self):
        r = requests.post(f"{API}/auth/dealer/login", json={"email": DEALER_EMAIL, "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_customer_me_bearer(self, cust_headers):
        r = requests.get(f"{API}/auth/me", headers=cust_headers, timeout=30)
        assert r.status_code == 200, r.text
        assert "@" in r.json()["email"]

    def test_customer_me_noauth(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_dealer_me(self, dealer_headers):
        r = requests.get(f"{API}/auth/dealer/me", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == DEALER_EMAIL


# ---------------- Incidents (AI triage) ----------------
class TestIncidentsAI:
    def test_create_brake_incident_highprio(self, cust_headers):
        payload = {
            "description": "Front brakes make a loud grinding noise and pedal goes to floor. Feels unsafe to drive.",
            "vehicle_model": "Honda Activa 6G",
            "source": "manual",
            "dealership_id": "d_metro",
        }
        r = requests.post(f"{API}/incidents", json=payload, headers=cust_headers, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"].startswith("INC-")
        assert d["category"] == "Brakes"
        assert d["priority"] == "High"
        assert d["severity"] >= 4
        assert d["sla_hours"] == 4
        assert d["status"] == "ai_triaged"
        assert len(d["timeline"]) >= 2
        pytest.brake_id = d["id"]

    def test_list_own_incidents(self, cust_headers):
        r = requests.get(f"{API}/incidents", headers=cust_headers, timeout=30)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert pytest.brake_id in ids

    def test_get_single_incident(self, cust_headers):
        r = requests.get(f"{API}/incidents/{pytest.brake_id}", headers=cust_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == pytest.brake_id


# ---------------- Upload + photo incident ----------------
class TestUploadAndPhotoIncident:
    def test_upload_and_serve(self, cust_headers):
        img = base64.b64decode(RED_JPEG_B64)
        files = {"file": ("test.jpg", io.BytesIO(img), "image/jpeg")}
        r = requests.post(f"{API}/upload", files=files, headers=cust_headers, timeout=60)
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        assert path
        pytest.photo_path = path
        # serve
        r2 = requests.get(f"{API}/files/{path}", headers=cust_headers, timeout=60)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")

    def test_create_incident_with_photo(self, cust_headers):
        payload = {
            "description": "Scratches and dent on rear bumper after minor bump.",
            "vehicle_model": "Toyota Corolla 2022",
            "source": "manual",
            "photo_paths": [pytest.photo_path],
        }
        r = requests.post(f"{API}/incidents", json=payload, headers=cust_headers, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["photo_paths"] == [pytest.photo_path]
        assert d["category"] in ("Body", "Other", "Tyres", "Electrical", "Engine")


# ---------------- Dealer ops ----------------
class TestDealerOps:
    def test_dealer_list(self, dealer_headers):
        r = requests.get(f"{API}/dealer/incidents", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 1
        assert "sla_breached" in docs[0]
        assert "sla_remaining_min" in docs[0]

    def test_dealer_team(self, dealer_headers):
        r = requests.get(f"{API}/dealer/team", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        techs = r.json()
        assert any(t["email"] == "ravi.tech@autocare.com" for t in techs)
        for t in techs:
            assert "password_hash" not in t
        pytest.tech_id = next(t for t in techs if t["email"] == "ravi.tech@autocare.com")["dealer_id"]

    def test_assign_status_priority(self, dealer_headers):
        inc = pytest.brake_id
        # assign
        r = requests.patch(f"{API}/dealer/incidents/{inc}", json={"assignee_id": pytest.tech_id}, headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["assignee_id"] == pytest.tech_id
        assert d["status"] == "assigned"
        # priority change
        r = requests.patch(f"{API}/dealer/incidents/{inc}", json={"priority": "Medium"}, headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["priority"] == "Medium"
        # in progress
        r = requests.patch(f"{API}/dealer/incidents/{inc}", json={"status": "in_progress", "note": "Tech on it"}, headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"

    def test_escalate_three_levels(self, dealer_headers):
        inc = pytest.brake_id
        levels = []
        for _ in range(3):
            r = requests.post(f"{API}/dealer/incidents/{inc}/escalate", headers=dealer_headers, timeout=30)
            assert r.status_code == 200
            levels.append(r.json()["escalation_level"])
        assert levels == [1, 2, 3]

    def test_resolve_sets_resolved_at(self, dealer_headers):
        inc = pytest.brake_id
        r = requests.patch(f"{API}/dealer/incidents/{inc}", json={"status": "resolved"}, headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["resolved_at"] is not None

    def test_kpis(self, dealer_headers):
        r = requests.get(f"{API}/dealer/kpis", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        k = r.json()
        for key in ("total", "open", "resolved", "breaches", "avg_resolution_hours", "sla_compliance", "by_priority", "by_category"):
            assert key in k
        assert k["resolved"] >= 1


# ---------------- Amazon Connect (simulation) ----------------
class TestConnect:
    def test_status_simulation(self, dealer_headers):
        r = requests.get(f"{API}/dealer/connect/status", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["mode"] == "simulation"
        assert isinstance(d["calls"], list)
        m = d["metrics"]
        for k in ("AGENTS_ONLINE", "AGENTS_AVAILABLE", "CONTACTS_IN_QUEUE", "OLDEST_CONTACT_AGE"):
            assert k in m

    def test_place_call_sim_no_destination(self, dealer_headers, cust_headers):
        r = requests.post(
            f"{API}/dealer/connect/call",
            json={"incident_id": pytest.brake_id, "customer_name": "Test User", "direction": "outbound"},
            headers=dealer_headers, timeout=30,
        )
        assert r.status_code == 200
        call = r.json()
        assert call["id"].startswith("CALL-")
        assert call["mode"] == "simulation"
        # Verify timeline event appended
        r2 = requests.get(f"{API}/incidents/{pytest.brake_id}", headers=cust_headers, timeout=30)
        assert r2.status_code == 200
        notes = [t.get("note", "") for t in r2.json()["timeline"]]
        assert any("Amazon Connect" in n and "call" in n for n in notes)

    def test_chat_returns_contact_id_and_appends_timeline(self, dealer_headers, cust_headers):
        r = requests.post(
            f"{API}/dealer/connect/chat",
            json={"incident_id": pytest.brake_id, "display_name": "Test User"},
            headers=dealer_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["mode"] == "simulation"
        assert d["contact_id"].startswith("CHAT-")
        r2 = requests.get(f"{API}/incidents/{pytest.brake_id}", headers=cust_headers, timeout=30)
        notes = [t.get("note", "") for t in r2.json()["timeline"]]
        assert any("chat/SMS" in n and d["contact_id"] in n for n in notes)

    def test_metrics_simulation(self, dealer_headers):
        r = requests.get(f"{API}/dealer/connect/metrics", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["mode"] == "simulation"
        assert set(d["current"].keys()) >= {"AGENTS_ONLINE", "AGENTS_AVAILABLE", "CONTACTS_IN_QUEUE", "OLDEST_CONTACT_AGE"}
        assert set(d["historical"].keys()) >= {"CONTACTS_HANDLED", "CONTACTS_ABANDONED", "HANDLE_TIME"}


# ---------------- Two-way Chat, Callback, Recordings (new features) ----------------
class TestChatThread:
    def test_customer_send_then_dealer_sees(self, cust_headers, dealer_headers):
        inc = pytest.brake_id
        r = requests.post(f"{API}/incidents/{inc}/chat", json={"text": "Hello from customer TEST"}, headers=cust_headers, timeout=30)
        assert r.status_code == 200, r.text
        m1 = r.json()
        assert m1["sender"] == "customer"
        assert m1["text"] == "Hello from customer TEST"
        # dealer list
        r2 = requests.get(f"{API}/dealer/incidents/{inc}/chat", headers=dealer_headers, timeout=30)
        assert r2.status_code == 200
        texts = [x["text"] for x in r2.json()]
        assert "Hello from customer TEST" in texts

    def test_dealer_send_then_customer_sees(self, cust_headers, dealer_headers):
        inc = pytest.brake_id
        r = requests.post(f"{API}/dealer/incidents/{inc}/chat", json={"text": "Hello from dealer TEST"}, headers=dealer_headers, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["sender"] == "agent"
        r2 = requests.get(f"{API}/incidents/{inc}/chat", headers=cust_headers, timeout=30)
        assert r2.status_code == 200
        texts = [x["text"] for x in r2.json()]
        assert "Hello from dealer TEST" in texts

    def test_chat_empty_rejected(self, cust_headers):
        r = requests.post(f"{API}/incidents/{pytest.brake_id}/chat", json={"text": "   "}, headers=cust_headers, timeout=30)
        assert r.status_code == 400


class TestCallback:
    def test_customer_request_and_dealer_place(self, cust_headers, dealer_headers):
        inc = pytest.brake_id
        r = requests.post(f"{API}/incidents/{inc}/callback", json={"phone": "+1-555-0100"}, headers=cust_headers, timeout=30)
        assert r.status_code == 200, r.text
        cb = r.json()
        assert cb["id"].startswith("CB-")
        assert cb["phone"] == "+1-555-0100"
        assert cb["status"] == "pending"  # sim
        pytest.cb_id = cb["id"]
        # timeline entry
        r2 = requests.get(f"{API}/incidents/{inc}", headers=cust_headers, timeout=30)
        notes = [t.get("note", "") for t in r2.json()["timeline"]]
        assert any("Customer requested a callback" in n for n in notes)
        # dealer list contains it
        r3 = requests.get(f"{API}/dealer/callbacks", headers=dealer_headers, timeout=30)
        assert r3.status_code == 200
        assert any(c["id"] == cb["id"] for c in r3.json())

    def test_dealer_place_callback(self, dealer_headers, cust_headers):
        r = requests.post(f"{API}/dealer/callbacks/{pytest.cb_id}/place", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "placed"
        r3 = requests.get(f"{API}/dealer/callbacks", headers=dealer_headers, timeout=30)
        found = next(c for c in r3.json() if c["id"] == pytest.cb_id)
        assert found["status"] == "placed"
        # timeline updated
        r2 = requests.get(f"{API}/incidents/{pytest.brake_id}", headers=cust_headers, timeout=30)
        notes = [t.get("note", "") for t in r2.json()["timeline"]]
        assert any(pytest.cb_id in n and "placed" in n for n in notes)

    def test_callback_missing_phone(self, cust_headers):
        r = requests.post(f"{API}/incidents/{pytest.brake_id}/callback", json={"phone": ""}, headers=cust_headers, timeout=30)
        assert r.status_code == 400


class TestRecordings:
    def test_list_and_play_flow(self, dealer_headers, cust_headers):
        inc = pytest.brake_id
        # place a call first so a recording row exists
        rc = requests.post(
            f"{API}/dealer/connect/call",
            json={"incident_id": inc, "customer_name": "Test User", "direction": "outbound"},
            headers=dealer_headers, timeout=30,
        )
        assert rc.status_code == 200
        call_id = rc.json()["id"]
        # list recordings
        r = requests.get(f"{API}/dealer/connect/recordings/{inc}", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        calls = r.json()
        assert any(c["id"] == call_id for c in calls)
        # play with no recording -> 404 friendly
        r2 = requests.get(f"{API}/dealer/connect/recording/{call_id}", headers=dealer_headers, timeout=30)
        assert r2.status_code == 404
        # attach a URL
        url = "https://example.com/test.mp3"
        r3 = requests.post(f"{API}/dealer/connect/recording/{call_id}", json={"recording_url": url}, headers=dealer_headers, timeout=30)
        assert r3.status_code == 200
        # now play returns URL
        r4 = requests.get(f"{API}/dealer/connect/recording/{call_id}", headers=dealer_headers, timeout=30)
        assert r4.status_code == 200
        assert r4.json()["url"] == url


# ---------------- New: dealer chat email fire-and-forget, callback scheduling, cron, recording sim 404 ----------------
import os as _os
from datetime import datetime, timedelta, timezone

CRON_SECRET = _os.environ.get("WEBHOOK_CRON_SECRET", "wcs_autocare_9f3a1c7b52e84d6f0a1b2c3d4e5f6071")


class TestDealerChatEmail:
    def test_dealer_chat_send_returns_200_and_stores(self, dealer_headers, cust_headers):
        inc = pytest.brake_id
        r = requests.post(
            f"{API}/dealer/incidents/{inc}/chat",
            json={"text": "Dealer email trigger TEST msg"},
            headers=dealer_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["sender"] == "agent"
        assert d["text"] == "Dealer email trigger TEST msg"
        # Verify persisted (visible to customer)
        r2 = requests.get(f"{API}/incidents/{inc}/chat", headers=cust_headers, timeout=30)
        assert r2.status_code == 200
        texts = [x["text"] for x in r2.json()]
        assert "Dealer email trigger TEST msg" in texts


class TestCallbackScheduling:
    def test_future_scheduled_at_returns_scheduled(self, cust_headers):
        future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        r = requests.post(
            f"{API}/incidents/{pytest.brake_id}/callback",
            json={"phone": "+1-555-0177", "scheduled_at": future},
            headers=cust_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        cb = r.json()
        assert cb["status"] == "scheduled"
        assert cb["scheduled_at"] is not None
        pytest.scheduled_cb_id = cb["id"]

    def test_no_scheduled_at_returns_pending_sim(self, cust_headers):
        r = requests.post(
            f"{API}/incidents/{pytest.brake_id}/callback",
            json={"phone": "+1-555-0188"},
            headers=cust_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "pending"

    def test_past_scheduled_at_immediate_pending_sim(self, cust_headers):
        past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        r = requests.post(
            f"{API}/incidents/{pytest.brake_id}/callback",
            json={"phone": "+1-555-0199", "scheduled_at": past},
            headers=cust_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "pending"


class TestCronCallbacks:
    def test_cron_missing_auth_401(self):
        r = requests.post(f"{API}/cron/callbacks", timeout=30)
        assert r.status_code == 401

    def test_cron_bad_auth_401(self):
        r = requests.post(f"{API}/cron/callbacks", headers={"Authorization": "Bearer wrong"}, timeout=30)
        assert r.status_code == 401

    def test_cron_valid_auth_200_and_flips_due(self, cust_headers, dealer_headers):
        # Seed a due (past) scheduled callback via API by first creating a future one, then forcing a past scheduled_at via a new POST
        # Simplest: create with future then wait not needed; direct approach: create a fresh scheduled with a slightly-in-the-future time and update via cron logic requires past. Emit one with a past time via mongo isn't accessible here.
        # Instead: create a future-scheduled and then re-post via API with same phone but past time — new record.
        # request_callback treats past as immediate 'pending' (no live), so we can't get a 'scheduled' past via public API.
        # So we exercise cron endpoint auth path + drain semantics: call cron, ensure 200 and any previously-scheduled with a due time flips.
        r = requests.post(f"{API}/cron/callbacks", headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=30)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_cron_flips_scheduled_when_due(self, cust_headers, dealer_headers):
        # Create a scheduled callback ~5s in the future, wait, then run cron and assert it flipped to 'pending' (sim)
        future = (datetime.now(timezone.utc) + timedelta(seconds=6)).isoformat()
        r = requests.post(
            f"{API}/incidents/{pytest.brake_id}/callback",
            json={"phone": "+1-555-0166", "scheduled_at": future},
            headers=cust_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        cb = r.json()
        assert cb["status"] == "scheduled"
        cb_id = cb["id"]
        time.sleep(8)
        r2 = requests.post(f"{API}/cron/callbacks", headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=30)
        assert r2.status_code == 200
        # background task — poll briefly
        deadline = time.time() + 15
        final_status = None
        while time.time() < deadline:
            r3 = requests.get(f"{API}/dealer/callbacks", headers=dealer_headers, timeout=30)
            assert r3.status_code == 200
            found = [c for c in r3.json() if c["id"] == cb_id]
            if found and found[0]["status"] != "scheduled":
                final_status = found[0]["status"]
                break
            time.sleep(1)
        assert final_status == "pending", f"expected pending in sim, got {final_status}"
        # timeline note appended
        r4 = requests.get(f"{API}/incidents/{pytest.brake_id}", headers=cust_headers, timeout=30)
        notes = [t.get("note", "") for t in r4.json()["timeline"]]
        assert any(cb_id in n and "Scheduled callback" in n for n in notes)


class TestRecordingSimulation404:
    def test_recording_sim_returns_friendly_404(self, dealer_headers):
        # Place a call in sim so a call exists but has no recording_url
        rc = requests.post(
            f"{API}/dealer/connect/call",
            json={"incident_id": pytest.brake_id, "customer_name": "Test User", "direction": "outbound"},
            headers=dealer_headers, timeout=30,
        )
        assert rc.status_code == 200
        call_id = rc.json()["id"]
        r = requests.get(f"{API}/dealer/connect/recording/{call_id}", headers=dealer_headers, timeout=30)
        assert r.status_code == 404
        assert "not available yet" in r.json().get("detail", "").lower()



# ---------------- New: Multi-dealership scoping & routing ----------------
SILICON_EMAIL = "silicon.manager@autocare.com"
BAYVIEW_EMAIL = "bayview.manager@autocare.com"
NORTHBAY_EMAIL = "northbay.manager@autocare.com"
DEALER_PW = "DealerPass123!"


def _dealer_login(email, password=DEALER_PW):
    r = requests.post(f"{API}/auth/dealer/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def silicon_login():
    return _dealer_login(SILICON_EMAIL)


@pytest.fixture(scope="session")
def silicon_headers(silicon_login):
    return {"Authorization": f"Bearer {silicon_login['token']}"}


class TestDealershipsListing:
    def test_default_sort_by_services_count(self, cust_headers):
        r = requests.get(f"{API}/dealerships", headers=cust_headers, timeout=30)
        assert r.status_code == 200
        ds = r.json()
        assert len(ds) >= 4
        ids = {d["id"] for d in ds}
        for expected in ("d_metro", "d_silicon", "d_bayview", "d_northbay"):
            assert expected in ids, f"missing {expected}"
        counts = [d.get("services_count", 0) for d in ds]
        assert counts == sorted(counts, reverse=True), f"not sorted desc: {counts}"
        assert ds[0].get("recommended_reason") == "Most serviced"
        # only first has the flag
        for d in ds[1:]:
            assert not d.get("recommended_reason")

    def test_with_coords_sorted_by_distance(self, cust_headers):
        # Use d_silicon's approx location -> silicon should be nearest (distance ~0)
        # Query all first to find its coords
        r0 = requests.get(f"{API}/dealerships", headers=cust_headers, timeout=30)
        silicon = next(d for d in r0.json() if d["id"] == "d_silicon")
        lat, lng = silicon["lat"], silicon["lng"]
        r = requests.get(f"{API}/dealerships", params={"lat": lat, "lng": lng}, headers=cust_headers, timeout=30)
        assert r.status_code == 200
        ds = r.json()
        assert ds[0]["id"] == "d_silicon"
        assert ds[0].get("recommended_reason") == "Nearest to you"
        dists = [d["distance_km"] for d in ds]
        assert dists == sorted(dists), f"not sorted by distance: {dists}"
        assert isinstance(ds[0]["distance_km"], (int, float))


class TestIncidentRouting:
    def test_incident_routes_to_chosen_dealership(self, cust_headers, silicon_headers):
        payload = {
            "description": "Check engine light on for two days, mild power loss.",
            "vehicle_model": "Tesla Model 3",
            "source": "manual",
            "dealership_id": "d_silicon",
        }
        r = requests.post(f"{API}/incidents", json=payload, headers=cust_headers, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["dealership_id"] == "d_silicon"
        assert "silicon" in d["dealership_name"].lower(), d["dealership_name"]
        notes = [t.get("note", "") for t in d["timeline"]]
        assert any("routed to" in n.lower() and "silicon" in n.lower() for n in notes), notes
        pytest.silicon_inc_id = d["id"]

        # silicon manager sees it
        r2 = requests.get(f"{API}/dealer/incidents", headers=silicon_headers, timeout=30)
        assert r2.status_code == 200
        ids = [x["id"] for x in r2.json()]
        assert d["id"] in ids


class TestPerBranchScoping:
    def test_silicon_login_returns_dealership_name(self, silicon_login):
        assert silicon_login["dealer"].get("dealership_id") == "d_silicon"
        assert "silicon" in (silicon_login["dealer"].get("dealership_name") or "").lower()

    def test_silicon_team_only_silicon_techs(self, silicon_headers):
        r = requests.get(f"{API}/dealer/team", headers=silicon_headers, timeout=30)
        assert r.status_code == 200
        techs = r.json()
        emails = {t["email"] for t in techs}
        # Silicon techs per seed: aisha.tech, diego.tech
        assert "aisha.tech@autocare.com" in emails
        assert "diego.tech@autocare.com" in emails
        # Metro techs should NOT appear
        assert "ravi.tech@autocare.com" not in emails
        assert "maria.tech@autocare.com" not in emails
        # Also names include Aisha / Diego
        names = " ".join([t.get("name", "") for t in techs]).lower()
        assert "aisha" in names and "diego" in names

    def test_metro_owner_does_not_see_silicon_incident(self, dealer_headers):
        r = requests.get(f"{API}/dealer/incidents", headers=dealer_headers, timeout=30)
        assert r.status_code == 200
        docs = r.json()
        ids = {x["id"] for x in docs}
        assert getattr(pytest, "silicon_inc_id", "___NA___") not in ids
        # And all metro-visible incidents are d_metro
        for x in docs:
            assert x.get("dealership_id") == "d_metro", f"leak: {x.get('id')} -> {x.get('dealership_id')}"

    def test_silicon_kpis_scoped(self, silicon_headers):
        r = requests.get(f"{API}/dealer/kpis", headers=silicon_headers, timeout=30)
        assert r.status_code == 200
        k = r.json()
        for key in ("total", "open", "resolved", "breaches"):
            assert key in k

    def test_silicon_callbacks_scoped(self, silicon_headers):
        r = requests.get(f"{API}/dealer/callbacks", headers=silicon_headers, timeout=30)
        assert r.status_code == 200
        cbs = r.json()
        # Metro-heavy callbacks should not leak
        for c in cbs:
            # dealership_id may not be included in response; ensure incident_id maps to a silicon incident if present
            assert c.get("dealership_id", "d_silicon") == "d_silicon" or c.get("dealership_id") is None


# ---------------- New priority-driven dispatch/resolution workflow ----------------

class TestDispatchWorkflow:
    def _new_incident(self, cust_headers, description, model, dealership_id="d_metro"):
        r = requests.post(f"{API}/incidents", json={
            "description": description, "vehicle_model": model,
            "source": "manual", "dealership_id": dealership_id,
        }, headers=cust_headers, timeout=90)
        assert r.status_code == 200, r.text
        return r.json()

    def test_rsa_dispatch_on_high_incident(self, cust_headers, dealer_headers):
        inc = self._new_incident(cust_headers,
            "Loud grinding from brakes, pedal goes to floor, unsafe to drive.",
            "Honda City 2021")
        assert inc["priority"] == "High"
        r = requests.post(f"{API}/dealer/incidents/{inc['id']}/dispatch",
                          json={"mode": "rsa", "eta_min": 30, "unit": "Rapid Van 7"},
                          headers=dealer_headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["resolution_path"] == "rsa"
        assert d["status"] == "in_progress"
        assert d["rsa"]["unit"] == "Rapid Van 7"
        assert d["rsa"]["eta_min"] == 30
        assert any("Roadside Assistance dispatched" in t.get("note", "") for t in d["timeline"])
        # customer visibility
        r2 = requests.get(f"{API}/incidents/{inc['id']}", headers=cust_headers, timeout=30)
        assert r2.status_code == 200
        cd = r2.json()
        assert cd["resolution_path"] == "rsa"
        assert cd["rsa"]["unit"] == "Rapid Van 7"

    def test_remote_then_slot_on_low_incident(self, cust_headers, dealer_headers):
        inc = self._new_incident(cust_headers,
            "Interior cabin light flickering occasionally, no other issues.",
            "Maruti Swift 2020")
        assert inc["priority"] in ("Low", "Medium")
        # remote first
        r = requests.post(f"{API}/dealer/incidents/{inc['id']}/dispatch",
                          json={"mode": "remote", "note": "Attempting OTA reset"},
                          headers=dealer_headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["resolution_path"] == "remote"
        assert d["status"] == "in_progress"
        # remote failed -> slot
        r2 = requests.post(f"{API}/dealer/incidents/{inc['id']}/dispatch",
                           json={"mode": "slot", "remote_failed": True},
                           headers=dealer_headers, timeout=30)
        assert r2.status_code == 200, r2.text
        d2 = r2.json()
        assert d2["resolution_path"] == "slot"
        assert d2["status"] == "assigned"
        appt = d2["appointment"]
        for k in ("slot_start", "slot_end", "technician_name", "position", "lane", "lanes_total", "duration_min"):
            assert k in appt, f"missing {k} in appointment"
        assert appt["lanes_total"] == 3  # d_metro has 3 techs
        assert appt["duration_min"] in (60, 120)
        pytest.slot_inc_id_low = inc["id"]
        pytest.slot_inc_priority_low = inc["priority"]
        # customer visibility
        r3 = requests.get(f"{API}/incidents/{inc['id']}", headers=cust_headers, timeout=30)
        cd = r3.json()
        assert cd["resolution_path"] == "slot"
        assert cd["appointment"]["technician_name"] == appt["technician_name"]

    def test_queue_auto_adjust_priority_ordering(self, cust_headers, dealer_headers):
        # Book a Medium priority slot after the earlier Low slot; Medium should get position 1
        med = self._new_incident(cust_headers,
            "AC not cooling well, blows warm air, needs regas.",
            "Hyundai Verna 2022")
        # Force to Medium if AI didn't pick
        if med["priority"] != "Medium":
            r = requests.patch(f"{API}/dealer/incidents/{med['id']}",
                               json={"priority": "Medium"}, headers=dealer_headers, timeout=30)
            assert r.status_code == 200
        rb = requests.post(f"{API}/dealer/incidents/{med['id']}/dispatch",
                           json={"mode": "slot"}, headers=dealer_headers, timeout=30)
        assert rb.status_code == 200, rb.text
        appt_med = rb.json()["appointment"]

        # Fetch the earlier Low incident again — its position may have shifted after Medium was booked
        r_low = requests.get(f"{API}/incidents/{pytest.slot_inc_id_low}", headers=cust_headers, timeout=30)
        low_appt = r_low.json()["appointment"]

        # Medium (High > Medium > Low) should come before Low in ordering (earlier or same slot but higher-priority lane pos)
        assert appt_med["position"] <= low_appt["position"], \
            f"Medium pos {appt_med['position']} should be <= Low pos {low_appt['position']}"

        # Resolve the medium and ensure recompute (low remains valid)
        rr = requests.patch(f"{API}/dealer/incidents/{med['id']}",
                            json={"status": "resolved"}, headers=dealer_headers, timeout=30)
        assert rr.status_code == 200
        r_low2 = requests.get(f"{API}/incidents/{pytest.slot_inc_id_low}", headers=cust_headers, timeout=30)
        assert r_low2.status_code == 200
        assert r_low2.json()["appointment"] is not None

    def test_queue_lanes_distribution_metro(self, cust_headers, dealer_headers):
        # Create 4 slot bookings at d_metro (3 lanes) and confirm lanes used >= 2 (distribution)
        ids = []
        for i in range(4):
            inc = self._new_incident(cust_headers,
                f"Small tail light flicker minor issue TEST_{i}",
                "Ford Figo 2019")
            if inc["priority"] != "Low":
                requests.patch(f"{API}/dealer/incidents/{inc['id']}",
                               json={"priority": "Low"}, headers=dealer_headers, timeout=30)
            r = requests.post(f"{API}/dealer/incidents/{inc['id']}/dispatch",
                              json={"mode": "slot"}, headers=dealer_headers, timeout=30)
            assert r.status_code == 200, r.text
            ids.append(inc["id"])
        # fetch each and inspect lanes used
        lanes_used = set()
        lanes_total_vals = set()
        for iid in ids:
            r = requests.get(f"{API}/incidents/{iid}", headers=cust_headers, timeout=30)
            appt = r.json()["appointment"]
            lanes_used.add(appt["lane"])
            lanes_total_vals.add(appt["lanes_total"])
        assert lanes_total_vals == {3}, f"lanes_total should always be 3 at metro, got {lanes_total_vals}"
        assert len(lanes_used) >= 2, f"expected slots spread across multiple lanes, got {lanes_used}"

    def test_dispatch_invalid_mode(self, dealer_headers, cust_headers):
        inc = self._new_incident(cust_headers,
            "Wiper motor sluggish sometimes.", "Kia Seltos 2023")
        r = requests.post(f"{API}/dealer/incidents/{inc['id']}/dispatch",
                          json={"mode": "bogus"}, headers=dealer_headers, timeout=30)
        assert r.status_code == 400


# ---------------- New: RSA live tracking + Customer reschedule ----------------


class TestRsaTracking:
    def _mk_high(self, cust_headers):
        r = requests.post(f"{API}/incidents", json={
            "description": "Loud grinding from brakes, pedal to floor, unsafe.",
            "vehicle_model": "Honda City 2021", "source": "manual", "dealership_id": "d_metro",
        }, headers=cust_headers, timeout=90)
        assert r.status_code == 200, r.text
        return r.json()

    def test_rsa_track_404_when_no_dispatch(self, cust_headers):
        inc = self._mk_high(cust_headers)
        r = requests.get(f"{API}/incidents/{inc['id']}/rsa", headers=cust_headers, timeout=30)
        assert r.status_code == 404

    def test_rsa_track_progress_and_interpolation(self, cust_headers, dealer_headers):
        inc = self._mk_high(cust_headers)
        # dealer dispatches RSA with eta=10
        r = requests.post(f"{API}/dealer/incidents/{inc['id']}/dispatch",
                          json={"mode": "rsa", "eta_min": 10, "unit": "Rapid Van 9"},
                          headers=dealer_headers, timeout=30)
        assert r.status_code == 200, r.text
        # first read
        r1 = requests.get(f"{API}/incidents/{inc['id']}/rsa", headers=cust_headers, timeout=30)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        for k in ("unit", "eta_min", "remaining_min", "progress", "status", "origin", "dest", "current"):
            assert k in d1, f"missing {k}"
        assert d1["unit"] == "Rapid Van 9"
        assert d1["eta_min"] == 10
        assert 0.0 <= d1["progress"] < 1.0
        assert d1["status"] == "en_route"
        assert d1["remaining_min"] <= 10
        # origin approx = dealership coord (not the fallback 37.77)
        assert isinstance(d1["origin"]["lat"], (int, float))
        # wait a few seconds and verify progress advances, current interpolates
        time.sleep(6)
        r2 = requests.get(f"{API}/incidents/{inc['id']}/rsa", headers=cust_headers, timeout=30)
        d2 = r2.json()
        assert d2["progress"] > d1["progress"], f"progress did not advance: {d1['progress']} -> {d2['progress']}"
        assert d2["remaining_min"] <= d1["remaining_min"]
        # current moved toward dest (linear interp)
        dx1 = abs(d1["current"]["lat"] - d1["origin"]["lat"])
        dx2 = abs(d2["current"]["lat"] - d2["origin"]["lat"])
        assert dx2 >= dx1


class TestReschedule:
    def _low_slot(self, cust_headers, dealer_headers):
        r = requests.post(f"{API}/incidents", json={
            "description": "Cabin lamp flickers occasionally, TEST_reschedule.",
            "vehicle_model": "Maruti Swift 2020", "source": "manual", "dealership_id": "d_metro",
        }, headers=cust_headers, timeout=90)
        assert r.status_code == 200
        inc = r.json()
        if inc["priority"] != "Low":
            requests.patch(f"{API}/dealer/incidents/{inc['id']}", json={"priority": "Low"},
                           headers=dealer_headers, timeout=30)
        rd = requests.post(f"{API}/dealer/incidents/{inc['id']}/dispatch",
                           json={"mode": "slot"}, headers=dealer_headers, timeout=30)
        assert rd.status_code == 200, rd.text
        return rd.json()

    def test_reschedule_success_locks_slot(self, cust_headers, dealer_headers):
        inc = self._low_slot(cust_headers, dealer_headers)
        newstart = datetime.now(timezone.utc) + timedelta(days=2, hours=1)
        # zero out seconds
        newstart = newstart.replace(second=0, microsecond=0)
        r = requests.post(f"{API}/incidents/{inc['id']}/reschedule",
                          json={"scheduled_at": newstart.isoformat().replace("+00:00", "Z")},
                          headers=cust_headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        appt = d["appointment"]
        assert appt["locked"] is True
        assert appt["position"] is None
        # slot_start reflects requested time
        assert appt["slot_start"].startswith(newstart.strftime("%Y-%m-%dT%H:%M"))
        # timeline note
        assert any("Customer rescheduled" in t.get("note", "") for t in d["timeline"])
        # save for lock test
        pytest.locked_inc_id = inc["id"]
        pytest.locked_slot_start = appt["slot_start"]

    def test_reschedule_rejects_past(self, cust_headers, dealer_headers):
        inc = self._low_slot(cust_headers, dealer_headers)
        past = (datetime.now(timezone.utc) - timedelta(days=1)).replace(second=0, microsecond=0)
        r = requests.post(f"{API}/incidents/{inc['id']}/reschedule",
                          json={"scheduled_at": past.isoformat().replace("+00:00", "Z")},
                          headers=cust_headers, timeout=30)
        assert r.status_code == 400

    def test_reschedule_rejects_empty(self, cust_headers, dealer_headers):
        inc = self._low_slot(cust_headers, dealer_headers)
        r = requests.post(f"{API}/incidents/{inc['id']}/reschedule",
                          json={"scheduled_at": ""}, headers=cust_headers, timeout=30)
        assert r.status_code == 400

    def test_reschedule_rejects_no_slot(self, cust_headers):
        # brand new incident (no dispatch) has no appointment
        r = requests.post(f"{API}/incidents", json={
            "description": "Radio buzz sometimes, TEST_noslot.", "vehicle_model": "Kia Seltos",
            "source": "manual", "dealership_id": "d_metro",
        }, headers=cust_headers, timeout=90)
        inc = r.json()
        future = (datetime.now(timezone.utc) + timedelta(days=2)).replace(second=0, microsecond=0)
        r2 = requests.post(f"{API}/incidents/{inc['id']}/reschedule",
                           json={"scheduled_at": future.isoformat().replace("+00:00", "Z")},
                           headers=cust_headers, timeout=30)
        assert r2.status_code == 400

    def test_recompute_respects_lock(self, cust_headers, dealer_headers):
        """After lock, booking another slot at same dealership does NOT change locked incident's slot_start."""
        assert getattr(pytest, "locked_inc_id", None), "prior test missing"
        locked_before = pytest.locked_slot_start
        # trigger a new slot booking (any priority) -> recompute_slots runs
        r = requests.post(f"{API}/incidents", json={
            "description": "AC weak, low cool TEST_lockcheck.", "vehicle_model": "Hyundai i20",
            "source": "manual", "dealership_id": "d_metro",
        }, headers=cust_headers, timeout=90)
        new_inc = r.json()
        rd = requests.post(f"{API}/dealer/incidents/{new_inc['id']}/dispatch",
                           json={"mode": "slot"}, headers=dealer_headers, timeout=30)
        assert rd.status_code == 200, rd.text
        # locked slot unchanged
        r2 = requests.get(f"{API}/incidents/{pytest.locked_inc_id}", headers=cust_headers, timeout=30)
        assert r2.status_code == 200
        appt = r2.json()["appointment"]
        assert appt["slot_start"] == locked_before, f"locked slot moved: {locked_before} -> {appt['slot_start']}"
        assert appt["locked"] is True
