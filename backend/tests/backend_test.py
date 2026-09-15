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
        assert r.json()["email"] == "testuser@example.com"

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
        pytest.tech_id = [t for t in techs if t["email"] == "ravi.tech@autocare.com"][0]["dealer_id"]

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
