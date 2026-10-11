from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Query, Request, Response, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import Response as FastResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import re
import json
import logging
import uuid
import tempfile
import bcrypt
import jwt as pyjwt
import requests
import boto3
from botocore.exceptions import ClientError
import hmac
import ipaddress
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone, ImageContent
from emergentintegrations.llm.openai import OpenAISpeechToText

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

DEFAULT_EMERGENT_KEY = "sk-emergent-93c1b246cAd0cA63c8"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY") or DEFAULT_EMERGENT_KEY
JWT_SECRET = os.environ.get("JWT_SECRET", "dev_secret")

# Object storage config
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "autocare-pulse"
storage_key = None

MIME_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
PRIORITY_SLA = {"High": 4, "Medium": 24, "Low": 72}
ESCALATION_LEVELS = ["Dealer Service Manager", "OEM Regional Lead", "OEM Quality Head"]
SERVICE_DURATION_MIN = {"High": 90, "Medium": 120, "Low": 60}
BUSINESS_START_HOUR = 9
BUSINESS_END_HOUR = 18

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def now_utc():
    return datetime.now(timezone.utc)


def iso(dt):
    return dt.isoformat() if isinstance(dt, datetime) else dt


def parse_dt(v):
    if isinstance(v, str):
        v = datetime.fromisoformat(v)
    if v.tzinfo is None:
        v = v.replace(tzinfo=timezone.utc)
    return v


# ---------------- Storage ----------------
def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    if not EMERGENT_LLM_KEY:
        logger.info("No EMERGENT_LLM_KEY configured; cloud storage initialization skipped.")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json().get("storage_key")
        return storage_key
    except Exception as e:
        logger.warning(f"Cloud storage init skipped: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        local_dir = ROOT_DIR / "uploads"
        local_dir.mkdir(parents=True, exist_ok=True)
        safe_name = path.replace("/", "_")
        local_file = local_dir / safe_name
        local_file.write_bytes(data)
        return {"path": path, "size": len(data)}
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        if key:
            resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        safe_name = path.replace("/", "_")
        local_file = (ROOT_DIR / "uploads") / safe_name
        if local_file.exists():
            return local_file.read_bytes(), MIME_TYPES.get(path.rsplit(".", 1)[-1].lower(), "application/octet-stream")
        return b"", "application/octet-stream"
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------- Models ----------------
class DealerLogin(BaseModel):
    email: str
    password: str


class IncidentCreate(BaseModel):
    title: Optional[str] = None
    description: str
    vehicle_model: str
    vehicle_vin: Optional[str] = ""
    source: str = "manual"  # manual | voice
    photo_paths: List[str] = []
    dealership_id: Optional[str] = None
    dealership_name: Optional[str] = None


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    priority: Optional[str] = None
    note: Optional[str] = None


# ---------------- Email (Emergent-managed Resend) ----------------
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "AutoCare Pulse")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> None:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{EMAIL_BASE_URL}/api/v1/email/send", headers={"X-Email-Key": EMAIL_KEY}, json=payload)
    resp.raise_for_status()


async def notify_customer_chat(inc, agent_name, text):
    try:
        link = (os.environ.get("APP_BASE_URL") or "").rstrip("/") + "/dashboard"
        subject = f"New reply on your {EMAIL_FROM_NAME} incident {inc['id']}"
        html = (
            f'<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#111">'
            f'<p>Hi {escape(inc.get("customer_name") or "there")},</p>'
            f'<p><strong>{escape(agent_name)}</strong> replied on your incident <strong>{escape(inc["id"])}</strong>'
            f' ({escape(inc.get("vehicle_model", ""))}):</p>'
            f'<blockquote style="border-left:3px solid #E63946;margin:0;padding:8px 16px;color:#333">{escape(text)}</blockquote>'
            f'<p><a href="{escape(link)}" style="display:inline-block;background:#E63946;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Open your incident</a></p>'
            f'<p style="font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)}. We never ask for your password or card details by email.</p>'
            f'</td></tr></table>'
        )
        await send_email(to=inc["customer_email"], subject=subject, html=html)
    except Exception as e:
        logger.error(f"chat email notify failed: {e}")


async def notify_customer_generic(inc, headline, message):
    try:
        if not inc.get("customer_email"):
            return
        link = (os.environ.get("APP_BASE_URL") or "").rstrip("/") + "/dashboard"
        subject = f"{headline} — {inc['id']}"
        html = (
            f'<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#111">'
            f'<p>Hi {escape(inc.get("customer_name") or "there")},</p>'
            f'<p><strong>{escape(headline)}</strong></p>'
            f'<p>{escape(message)}</p>'
            f'<p>Incident <strong>{escape(inc["id"])}</strong> · {escape(inc.get("vehicle_model", ""))} · {escape(inc.get("dealership_name", ""))}</p>'
            f'<p><a href="{escape(link)}" style="display:inline-block;background:#E63946;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Track your incident</a></p>'
            f'<p style="font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)}.</p>'
            f'</td></tr></table>'
        )
        await send_email(to=inc["customer_email"], subject=subject, html=html)
    except Exception as e:
        logger.error(f"generic notify failed: {e}")


async def notify_customer_appointment(inc):
    appt = inc.get("appointment") or {}
    msg = (
        f"Your service appointment is booked for {appt.get('slot_start', '')} with {appt.get('technician_name', 'our team')}. "
        f"You are number {appt.get('position', '?')} in the queue ({appt.get('lanes_total', '?')} service bays running)."
    )
    await notify_customer_generic(inc, "Service appointment booked", msg)


# ---------------- Auth helpers ----------------
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    if session.get("expires_at") and parse_dt(session["expires_at"]) < now_utc():
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_dealer(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    dealer = await db.dealers.find_one({"dealer_id": payload.get("dealer_id")}, {"_id": 0, "password_hash": 0})
    if not dealer:
        raise HTTPException(status_code=401, detail="Dealer not found")
    return dealer


# ---------------- AI ----------------
async def ai_classify(description: str, vehicle_model: str, image_b64: Optional[str] = None):
    system = (
        "You are an expert Chief Automotive Diagnostic & Resolution AI for car and two-wheeler dealerships. "
        "Analyze the customer's vehicle malfunction. Your core task is to determine whether the issue is:\n"
        "1) A SOLVABLE / DIY ISSUE: Can be safely checked, adjusted, or resolved by the customer/driver with basic DIY steps (e.g. wiper cleaning/linkage, tire pressure inflation/checking, door lock lubrication, key fob battery replacement, fuse replacement, fluid top-up, loose gas cap tightening).\n"
        "OR\n"
        "2) AN UNSOLVABLE / HAZARDOUS ISSUE: Cannot and should NOT be solved by DIY. Requires professional workshop tools, lift, parts replacement, or towing (e.g. brake failure/leak, engine knocking/overheating/smoke, transmission failure, steering binding, suspension break, high-voltage EV fault). It MUST instruct the customer to REQUEST SERVICE.\n\n"
        "Return ONLY a valid minified JSON object with the keys:\n"
        "\"category\": one of [Brakes, Engine, Tyres, Wipers, Locks, Battery, Electrical, Transmission, Suspension, Body, Cooling, Other],\n"
        "\"severity\": integer 1 to 5 (5 is critical safety hazard/drivability loss),\n"
        "\"priority\": \"High\" (safety hazard/non-drivable), \"Medium\" (drivable with caution), or \"Low\" (minor/cosmetic),\n"
        "\"summary\": concise, descriptive summary of the specific malfunction,\n"
        "\"is_solvable\": boolean (true if solvable via DIY/minor fix, false if must request professional service),\n"
        "\"solvability_label\": string (\"Solvable via DIY Fix\" or \"Service Required · Professional Attention Needed\"),\n"
        "\"solution\": step-by-step resolution. If solvable, provide numbered DIY fix steps. If not solvable, explicitly say: \"Not self-solvable. Request dealer workshop service or roadside assistance immediately.\" with reasons why.\n"
        "\"recommended_action\": formatted multi-line string for display on the customer dashboard and dealer console."
    )
    prompt = f"Vehicle: {vehicle_model}\nCustomer report: {description}"
    if image_b64:
        prompt += "\nAn image of the vehicle issue is attached. Factor visible damage into the assessment."
    try:
        api_key = EMERGENT_LLM_KEY or os.environ.get("EMERGENT_LLM_KEY") or DEFAULT_EMERGENT_KEY
        chat = LlmChat(api_key=api_key, session_id=f"triage-{uuid.uuid4().hex[:8]}", system_message=system).with_model("openai", "gpt-5.4")
        if image_b64:
            msg = UserMessage(text=prompt, file_contents=[ImageContent(image_base64=image_b64)])
        else:
            msg = UserMessage(text=prompt)
        out = ""
        async for ev in chat.stream_message(msg):
            if isinstance(ev, TextDelta):
                out += ev.content
            elif isinstance(ev, StreamDone):
                break
        out = out.strip()
        m = re.search(r"\{.*\}", out, re.DOTALL)
        data = json.loads(m.group(0) if m else out)
        prio = data.get("priority", "Medium")
        if prio not in PRIORITY_SLA:
            prio = "Medium"

        is_solvable = bool(data.get("is_solvable", False))
        solvability_label = data.get("solvability_label") or ("Solvable via DIY Fix" if is_solvable else "Service Required · Professional Attention Needed")
        solution = data.get("solution") or data.get("recommended_action") or ""
        rec_action = data.get("recommended_action") or solution

        # Strip any legacy emoji markers
        rec_action = rec_action.replace("🟢 ", "").replace("🔴 ", "").replace("⚠️ ", "").replace("💡 ", "")

        # Ensure recommended_action is clearly labeled if not already
        if is_solvable and not rec_action.startswith("DIY RESOLUTION"):
            rec_action = f"DIY RESOLUTION DIRECTIVE:\n{rec_action}"
        elif not is_solvable and not rec_action.startswith("WORKSHOP SERVICE") and not rec_action.startswith("CRITICAL SAFETY"):
            rec_action = f"WORKSHOP SERVICE REQUIRED:\n{rec_action}"

        return {
            "category": data.get("category", "Other"),
            "severity": int(data.get("severity", 3)),
            "priority": prio,
            "summary": data.get("summary", description[:80]),
            "is_solvable": is_solvable,
            "solvability_label": solvability_label,
            "solution": solution,
            "recommended_action": rec_action,
        }
    except Exception as e:
        logger.error(f"AI classify failed: {e}")
        # Intelligent fallback
        low = description.lower()
        is_solv = any(w in low for w in ["wiper", "blade", "lock", "latch", "tire", "tyre", "fob", "battery"])
        if any(w in low for w in ["brake", "breaks", "knock", "smoke", "overheat"]):
            is_solv = False
        return {
            "category": "Other",
            "severity": 3,
            "priority": "High" if not is_solv else "Medium",
            "summary": description[:80],
            "is_solvable": is_solv,
            "solvability_label": "Solvable via DIY Fix" if is_solv else "Service Required · Professional Attention Needed",
            "solution": "Inspect component according to user manual." if is_solv else "Critical safety hazard. Do not operate vehicle. Request professional service immediately.",
            "recommended_action": "DIY RESOLUTION DIRECTIVE:\nInspect and adjust component according to owner manual." if is_solv else "WORKSHOP SERVICE REQUIRED:\nDo not drive. Request authorized dealer service or roadside recovery.",
            "ai_error": True
        }


# ---------------- Auth routes ----------------
@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    r = requests.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", headers={"X-Session-ID": session_id}, timeout=30)
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data.get("name"), "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": data["email"], "name": data.get("name"), "picture": data.get("picture"), "role": "customer", "created_at": iso(now_utc())})
    session_token = data["session_token"]
    expires_at = now_utc() + timedelta(days=7)
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": session_token, "expires_at": iso(expires_at), "created_at": iso(now_utc())})
    response.set_cookie("session_token", session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user


@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api_router.post("/auth/dealer/login")
async def dealer_login(request: Request):
    try:
        body = await request.json()
    except Exception:
        try:
            raw_bytes = await request.body()
            body = json.loads(raw_bytes.decode())
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    email = (body.get("email") or "").strip().lower()
    password = (body.get("password") or "").strip()
    dealer = await db.dealers.find_one({"email": email})
    if not dealer or not bcrypt.checkpw(password.encode(), dealer["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = pyjwt.encode({"dealer_id": dealer["dealer_id"], "exp": now_utc() + timedelta(days=7)}, JWT_SECRET, algorithm="HS256")
    return {"token": token, "dealer": {"dealer_id": dealer["dealer_id"], "email": dealer["email"], "name": dealer["name"], "role": dealer["role"], "dealership_id": dealer.get("dealership_id"), "dealership_name": dealer.get("dealership_name")}}


@api_router.get("/auth/dealer/me")
async def dealer_me(dealer=Depends(get_current_dealer)):
    return dealer


# ---------------- Files ----------------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin").lower()
    ct = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, ct)
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"], "original_filename": file.filename, "content_type": ct, "size": result.get("size", len(data)), "user_id": user["user_id"], "is_deleted": False, "created_at": iso(now_utc())})
    return {"path": result["path"]}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, ct = get_object(path)
    return FastResponse(content=data, media_type=record.get("content_type", ct))


# ---------------- Voice ----------------
@api_router.post("/voice/transcribe")
async def transcribe(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        return {"text": ""}
    filename = file.filename or "voice.webm"
    buf = io.BytesIO(data)
    buf.name = filename
    api_key = EMERGENT_LLM_KEY or os.environ.get("EMERGENT_LLM_KEY")
    stt = OpenAISpeechToText(api_key=api_key)
    resp = await stt.transcribe(file=buf, model="whisper-1", response_format="json")
    text = (getattr(resp, "text", "") or "").strip()

    # Smart automotive cleanup & translation:
    # 1. Strips hallucinated/extraneous trailing noise (like "Angel")
    # 2. Translates Hindi / Hinglish / regional Indian languages into natural English
    # 3. Ensures vehicle terminology (shock absorber, brakes, battery, clutch) is accurate
    if text and api_key:
        try:
            cleanup_prompt = (
                f'User spoke their vehicle symptom: "{text}". '
                'Clean up any speech recognition artifacts or phonetic mishearings (e.g. extraneous random words at the end). '
                'If spoken in Hindi, Hinglish, or any regional language, translate it accurately to natural English. '
                'If already in English, correct automotive phonetic typos (e.g. "break" -> "brake", "bearings" -> "bearings", "lock" -> "shock" if referring to suspension). '
                'Return ONLY the clean English symptom text without commentary or quotes.'
            )
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{STORAGE_BASE}/llm/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "You are an automotive service voice translator and transcript cleaner. Output only the clean English symptom report."},
                            {"role": "user", "content": cleanup_prompt}
                        ],
                        "temperature": 0.1
                    }
                )
                if res.status_code == 200:
                    cleaned = res.json()["choices"][0]["message"]["content"].strip('"\n ')
                    if cleaned:
                        text = cleaned
        except Exception as e:
            logger.warning(f"Voice cleanup error: {e}")

    return {"text": text}



import math


def haversine(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@api_router.get("/dealerships")
async def list_dealerships(lat: Optional[float] = None, lng: Optional[float] = None):
    ds = await db.dealerships.find({}, {"_id": 0}).to_list(100)
    for d in ds:
        if lat is not None and lng is not None and d.get("lat") is not None:
            d["distance_km"] = round(haversine(lat, lng, d["lat"], d["lng"]), 1)
        else:
            d["distance_km"] = None
    if lat is not None and lng is not None:
        ds.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else 1e9)
        if ds:
            ds[0]["recommended_reason"] = "Nearest to you"
    else:
        ds.sort(key=lambda x: -x.get("services_count", 0))
        if ds:
            ds[0]["recommended_reason"] = "Most serviced"
    return ds


# ---------------- Incidents ----------------
def incident_public(doc):
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


async def build_incident(user, payload: IncidentCreate, image_b64=None):
    ai = await ai_classify(payload.description, payload.vehicle_model, image_b64)
    created = now_utc()
    sla_hours = PRIORITY_SLA[ai["priority"]]
    inc_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    dealership = None
    if payload.dealership_id:
        dealership = await db.dealerships.find_one({"id": payload.dealership_id}, {"_id": 0})
    if not dealership:
        dealership = await db.dealerships.find_one({}, {"_id": 0}, sort=[("services_count", -1)])
    dealership_id = dealership["id"] if dealership else None
    dealership_name = dealership["name"] if dealership else "Unassigned"
    doc = {
        "id": inc_id,
        "user_id": user["user_id"],
        "customer_name": user.get("name"),
        "customer_email": user.get("email"),
        "customer_picture": user.get("picture"),
        "title": payload.title or ai["summary"],
        "description": payload.description,
        "vehicle_model": payload.vehicle_model,
        "vehicle_vin": payload.vehicle_vin or "",
        "source": payload.source,
        "photo_paths": payload.photo_paths,
        "dealership_id": dealership_id,
        "dealership_name": dealership_name,
        "category": ai["category"],
        "severity": ai["severity"],
        "priority": ai["priority"],
        "ai_summary": ai["summary"],
        "is_solvable": ai.get("is_solvable", False),
        "solvability_label": ai.get("solvability_label", ""),
        "solution": ai.get("solution", ""),
        "recommended_action": ai["recommended_action"],
        "ai_error": ai.get("ai_error", False),
        "status": "ai_triaged",
        "assignee_id": None,
        "assignee_name": None,
        "escalation_level": 0,
        "sla_hours": sla_hours,
        "sla_due": iso(created + timedelta(hours=sla_hours)),
        "created_at": iso(created),
        "resolved_at": None,
        "timeline": [
            {"status": "submitted", "at": iso(created), "note": f"Incident raised via {payload.source} · routed to {dealership_name}"},
            {"status": "ai_triaged", "at": iso(created), "note": f"AI triage: {ai['category']} / {ai['priority']} priority (severity {ai['severity']}/5)"},
        ],
    }
    await db.incidents.insert_one(doc)
    return incident_public(await db.incidents.find_one({"id": inc_id}, {"_id": 0}))


@api_router.post("/incidents")
async def create_incident(payload: IncidentCreate, user=Depends(get_current_user)):
    image_b64 = None
    if payload.photo_paths:
        try:
            raw, _ = get_object(payload.photo_paths[0])
            import base64
            image_b64 = base64.b64encode(raw).decode()
        except Exception as e:
            logger.error(f"image load for AI failed: {e}")
    return await build_incident(user, payload, image_b64)


@api_router.get("/incidents")
async def list_incidents(user=Depends(get_current_user)):
    docs = await db.incidents.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.get("/incidents/{inc_id}")
async def get_incident(inc_id: str, user=Depends(get_current_user)):
    doc = await db.incidents.find_one({"id": inc_id, "user_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


@api_router.get("/incidents/{inc_id}/rsa")
async def rsa_track(inc_id: str, user=Depends(get_current_user)):
    inc = await db.incidents.find_one({"id": inc_id, "user_id": user["user_id"]}, {"_id": 0})
    if not inc or not inc.get("rsa"):
        raise HTTPException(status_code=404, detail="No roadside unit dispatched")
    rsa = inc["rsa"]
    disp = parse_dt(rsa["dispatched_at"])
    eta = rsa.get("eta_min", 45)
    elapsed = (now_utc() - disp).total_seconds() / 60
    progress = max(0.0, min(elapsed / eta, 1.0)) if eta > 0 else 1.0
    o = rsa.get("origin") or {"lat": 37.77, "lng": -122.42}
    d = rsa.get("dest") or {"lat": o["lat"] + 0.03, "lng": o["lng"] + 0.03}
    cur = {"lat": o["lat"] + (d["lat"] - o["lat"]) * progress, "lng": o["lng"] + (d["lng"] - o["lng"]) * progress}
    return {
        "unit": rsa.get("unit"), "eta_min": eta, "dispatched_at": rsa["dispatched_at"],
        "remaining_min": int(max(eta - elapsed, 0)), "progress": round(progress, 3),
        "status": "arrived" if progress >= 1 else "en_route", "origin": o, "dest": d, "current": cur,
    }


@api_router.post("/incidents/{inc_id}/reschedule")
async def reschedule(inc_id: str, body: dict, user=Depends(get_current_user)):
    inc = await db.incidents.find_one({"id": inc_id, "user_id": user["user_id"]}, {"_id": 0})
    if not inc:
        raise HTTPException(status_code=404, detail="Not found")
    if inc.get("resolution_path") != "slot" or not inc.get("appointment"):
        raise HTTPException(status_code=400, detail="No service slot to reschedule")
    raw = (body.get("scheduled_at") or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Pick a new time")
    try:
        newstart = parse_dt(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid time")
    if (newstart <= now_utc()):
        raise HTTPException(status_code=400, detail="Pick a future time")
    if newstart.hour < BUSINESS_START_HOUR or newstart.hour >= BUSINESS_END_HOUR:
        raise HTTPException(status_code=400, detail="Choose a time within service hours (09:00–18:00 UTC)")
    appt = dict(inc["appointment"])
    dur = appt.get("duration_min", 90)
    appt["slot_start"] = iso(newstart)
    appt["slot_end"] = iso(newstart + timedelta(minutes=dur))
    appt["locked"] = True
    appt["position"] = None
    await db.incidents.update_one({"id": inc_id}, {"$set": {"appointment": appt}, "$push": {"timeline": {"status": inc.get("status", "assigned"), "at": iso(now_utc()), "note": f"Customer rescheduled the appointment to {iso(newstart)}"}}})
    return incident_public(await db.incidents.find_one({"id": inc_id}, {"_id": 0}))


# ---------------- Dealer incident ops ----------------
def with_sla_flags(docs):
    now = now_utc()
    out = []
    for d in docs:
        d = dict(d)
        due = parse_dt(d["sla_due"])
        breached = d["status"] != "resolved" and now > due
        d["sla_breached"] = breached
        d["sla_remaining_min"] = int((due - now).total_seconds() / 60)
        out.append(d)
    return out


@api_router.get("/dealer/incidents")
async def dealer_incidents(dealership_id: Optional[str] = None, dealer=Depends(get_current_dealer)):
    query = {}
    if dealership_id and dealership_id != "all":
        query["dealership_id"] = dealership_id
    elif dealer.get("role") != "manager" and dealer.get("email") != "ndvtechsys.solutions@gmail.com":
        query["dealership_id"] = dealer.get("dealership_id")
    docs = await db.incidents.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return with_sla_flags(docs)


@api_router.get("/dealer/team")
async def dealer_team(dealership_id: Optional[str] = None, dealer=Depends(get_current_dealer)):
    query = {"role": "technician"}
    if dealership_id and dealership_id != "all":
        query["dealership_id"] = dealership_id
    techs = await db.dealers.find(query, {"_id": 0, "password_hash": 0}).to_list(100)
    return techs


@api_router.patch("/dealer/incidents/{inc_id}")
async def update_incident(inc_id: str, payload: IncidentUpdate, dealer=Depends(get_current_dealer)):
    doc = await db.incidents.find_one({"id": inc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    updates = {}
    events = []
    now = now_utc()
    if payload.assignee_id:
        tech = await db.dealers.find_one({"dealer_id": payload.assignee_id}, {"_id": 0})
        updates["assignee_id"] = payload.assignee_id
        updates["assignee_name"] = tech["name"] if tech else "Unassigned"
        if doc["status"] in ("submitted", "ai_triaged"):
            updates["status"] = "assigned"
        events.append({"status": updates.get("status", doc["status"]), "at": iso(now), "note": f"Assigned to {updates['assignee_name']}"})
    if payload.priority and payload.priority in PRIORITY_SLA:
        updates["priority"] = payload.priority
        updates["sla_hours"] = PRIORITY_SLA[payload.priority]
        updates["sla_due"] = iso(parse_dt(doc["created_at"]) + timedelta(hours=PRIORITY_SLA[payload.priority]))
        events.append({"status": doc["status"], "at": iso(now), "note": f"Priority changed to {payload.priority}"})
    if payload.status:
        updates["status"] = payload.status
        if payload.status == "resolved":
            updates["resolved_at"] = iso(now)
        events.append({"status": payload.status, "at": iso(now), "note": payload.note or f"Status updated to {payload.status.replace('_', ' ')}"})
    elif payload.note:
        events.append({"status": doc["status"], "at": iso(now), "note": payload.note})
    if events:
        await db.incidents.update_one({"id": inc_id}, {"$set": updates, "$push": {"timeline": {"$each": events}}})
    else:
        await db.incidents.update_one({"id": inc_id}, {"$set": updates})
    if payload.status == "resolved" and doc.get("resolution_path") == "slot":
        await recompute_slots(doc.get("dealership_id"))
    return incident_public(await db.incidents.find_one({"id": inc_id}, {"_id": 0}))


@api_router.post("/dealer/incidents/{inc_id}/escalate")
async def escalate(inc_id: str, dealer=Depends(get_current_dealer)):
    doc = await db.incidents.find_one({"id": inc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    level = min(doc.get("escalation_level", 0) + 1, len(ESCALATION_LEVELS))
    target = ESCALATION_LEVELS[level - 1]
    await db.incidents.update_one({"id": inc_id}, {"$set": {"escalation_level": level}, "$push": {"timeline": {"status": doc["status"], "at": iso(now_utc()), "note": f"Escalated to Level {level}: {target}"}}})
    return incident_public(await db.incidents.find_one({"id": inc_id}, {"_id": 0}))


def _align_business(dt):
    if dt.hour < BUSINESS_START_HOUR:
        return dt.replace(hour=BUSINESS_START_HOUR, minute=0, second=0, microsecond=0)
    if dt.hour >= BUSINESS_END_HOUR:
        return (dt + timedelta(days=1)).replace(hour=BUSINESS_START_HOUR, minute=0, second=0, microsecond=0)
    return dt.replace(second=0, microsecond=0)


async def recompute_slots(dealership_id):
    """Auto-adjust the service queue across available technicians (parallel bays)."""
    techs = await db.dealers.find({"role": "technician", "dealership_id": dealership_id}, {"_id": 0, "password_hash": 0}).to_list(100)
    lanes_n = max(len(techs), 1)
    pending = await db.incidents.find({"dealership_id": dealership_id, "resolution_path": "slot", "status": {"$ne": "resolved"}}, {"_id": 0}).to_list(500)
    pending = [p for p in pending if not (p.get("appointment") or {}).get("locked")]
    order = {"High": 0, "Medium": 1, "Low": 2}
    pending.sort(key=lambda d: (order.get(d.get("priority"), 1), (d.get("appointment") or {}).get("booked_at") or d.get("created_at")))
    now = now_utc()
    lane_free = [_align_business(now) for _ in range(lanes_n)]
    for idx, inc in enumerate(pending):
        dur = SERVICE_DURATION_MIN.get(inc.get("priority"), 90)
        li = min(range(lanes_n), key=lambda i: lane_free[i])
        start = _align_business(lane_free[li])
        end = start + timedelta(minutes=dur)
        if end.hour > BUSINESS_END_HOUR or (end.hour == BUSINESS_END_HOUR and end.minute > 0):
            start = (start + timedelta(days=1)).replace(hour=BUSINESS_START_HOUR, minute=0, second=0, microsecond=0)
            end = start + timedelta(minutes=dur)
        lane_free[li] = end
        tech = techs[li] if li < len(techs) else None
        appt = inc.get("appointment") or {}
        prev_start = appt.get("slot_start")
        appt.update({
            "slot_start": iso(start), "slot_end": iso(end), "duration_min": dur,
            "technician_id": tech["dealer_id"] if tech else None,
            "technician_name": tech["name"] if tech else "Service Bay",
            "position": idx + 1, "lane": li + 1, "lanes_total": lanes_n,
        })
        appt.setdefault("booked_at", iso(now_utc()))
        await db.incidents.update_one({"id": inc["id"]}, {"$set": {"appointment": appt}})
        if prev_start and prev_start != iso(start):
            await db.incidents.update_one({"id": inc["id"]}, {"$push": {"timeline": {"status": inc.get("status", "assigned"), "at": iso(now_utc()), "note": f"Appointment auto-adjusted to {iso(start)} (queue re-balanced) — position {idx + 1}"}}})
            shifted = await db.incidents.find_one({"id": inc["id"]}, {"_id": 0})
            await notify_customer_appointment(shifted)
    return pending


@api_router.post("/dealer/incidents/{inc_id}/dispatch")
async def dispatch(inc_id: str, body: dict, background_tasks: BackgroundTasks, dealer=Depends(get_current_dealer)):
    inc = await db.incidents.find_one({"id": inc_id}, {"_id": 0})
    if not inc:
        raise HTTPException(status_code=404, detail="Not found")
    if inc.get("status") in ("resolved", "closed"):
        raise HTTPException(status_code=400, detail="Incident is already resolved")
    mode = body.get("mode")
    now = now_utc()
    if mode == "rsa":
        eta = int(body.get("eta_min", 45))
        dship = await db.dealerships.find_one({"id": inc.get("dealership_id")}, {"_id": 0}) or {}
        origin = {"lat": dship.get("lat", 37.77), "lng": dship.get("lng", -122.42)}
        dest = {"lat": origin["lat"] + 0.03, "lng": origin["lng"] - 0.025}
        rsa = {"dispatched_at": iso(now), "eta_min": eta, "unit": body.get("unit", "RSA Rapid Unit"), "agent": dealer["name"], "origin": origin, "dest": dest}
        await db.incidents.update_one({"id": inc_id}, {"$set": {"resolution_path": "rsa", "rsa": rsa, "status": "in_progress"}, "$push": {"timeline": {"status": "in_progress", "at": iso(now), "note": f"Roadside Assistance dispatched ({rsa['unit']}), ETA {eta} min — by {dealer['name']}"}}})
        background_tasks.add_task(notify_customer_generic, inc, "Roadside Assistance dispatched", f"An RSA unit ({rsa['unit']}) is on the way — ETA {eta} minutes.")
    elif mode == "remote":
        note = body.get("note", "Attempting remote diagnosis and guided fix.")
        remote = {"started_at": iso(now), "note": note, "by": dealer["name"]}
        await db.incidents.update_one({"id": inc_id}, {"$set": {"resolution_path": "remote", "remote": remote, "status": "in_progress"}, "$push": {"timeline": {"status": "in_progress", "at": iso(now), "note": f"Remote resolution started: {note}"}}})
        background_tasks.add_task(notify_customer_generic, inc, "We're helping you remotely", note)
    elif mode == "slot":
        await db.incidents.update_one({"id": inc_id}, {"$set": {"resolution_path": "slot", "status": "assigned"}})
        if body.get("remote_failed"):
            await db.incidents.update_one({"id": inc_id}, {"$push": {"timeline": {"status": "assigned", "at": iso(now), "note": "Remote resolution unsuccessful — booking a service slot."}}})
        await recompute_slots(inc.get("dealership_id"))
        updated = await db.incidents.find_one({"id": inc_id}, {"_id": 0})
        appt = updated.get("appointment") or {}
        await db.incidents.update_one({"id": inc_id}, {"$push": {"timeline": {"status": "assigned", "at": iso(now), "note": f"Service slot booked: {appt.get('slot_start', '')} with {appt.get('technician_name', '')} (queue position {appt.get('position', '?')} of {appt.get('lanes_total', '?')} bays)"}}})
        background_tasks.add_task(notify_customer_appointment, updated)
    else:
        raise HTTPException(status_code=400, detail="Invalid mode (use rsa | remote | slot)")
    return incident_public(await db.incidents.find_one({"id": inc_id}, {"_id": 0}))


# ---------------- KPIs ----------------
@api_router.get("/dealer/kpis")
async def kpis(dealership_id: Optional[str] = None, dealer=Depends(get_current_dealer)):
    query = {}
    if dealership_id and dealership_id != "all":
        query["dealership_id"] = dealership_id
    elif dealer.get("role") != "manager" and dealer.get("email") != "ndvtechsys.solutions@gmail.com":
        query["dealership_id"] = dealer.get("dealership_id")
    docs = with_sla_flags(await db.incidents.find(query, {"_id": 0}).to_list(2000))
    total = len(docs)
    open_ = [d for d in docs if d["status"] != "resolved"]
    resolved = [d for d in docs if d["status"] == "resolved"]
    breaches = [d for d in docs if d["sla_breached"]]
    res_times = []
    for d in resolved:
        if d.get("resolved_at"):
            res_times.append((parse_dt(d["resolved_at"]) - parse_dt(d["created_at"])).total_seconds() / 3600)
    avg_res = round(sum(res_times) / len(res_times), 1) if res_times else 0
    sla_compliance = round((1 - len(breaches) / total) * 100) if total else 100
    by_priority = {p: len([d for d in docs if d["priority"] == p]) for p in PRIORITY_SLA}
    by_category = {}
    for d in docs:
        by_category[d["category"]] = by_category.get(d["category"], 0) + 1
    return {
        "total": total,
        "open": len(open_),
        "resolved": len(resolved),
        "breaches": len(breaches),
        "avg_resolution_hours": avg_res,
        "sla_compliance": sla_compliance,
        "csat": 92 if sla_compliance >= 85 else 78,
        "by_priority": by_priority,
        "by_category": by_category,
        "escalations_active": len([d for d in docs if d.get("escalation_level", 0) > 0 and d["status"] != "resolved"]),
    }


# ---------------- Amazon Connect (real via boto3, simulation fallback) ----------------
CONNECT_REQUIRED = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "AWS_CONNECT_INSTANCE_ID", "AWS_CONNECT_CONTACT_FLOW_ID"]
_connect_client = None


def connect_configured():
    return all((os.environ.get(k) or "").strip() for k in CONNECT_REQUIRED)


def get_connect_client():
    global _connect_client
    if _connect_client is None:
        _connect_client = boto3.client(
            "connect",
            region_name=os.environ["AWS_REGION"],
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )
    return _connect_client


def connect_error(exc):
    err = exc.response.get("Error", {}) if hasattr(exc, "response") else {}
    code = err.get("Code", "AWS_ERROR")
    status = 400
    if code in ("ThrottlingException", "LimitExceededException"):
        status = 429
    elif code in ("AccessDeniedException", "UnauthorizedOperation"):
        status = 403
    elif code == "ResourceNotFoundException":
        status = 404
    return HTTPException(status_code=status, detail=f"Amazon Connect: {code} — {err.get('Message', str(exc))}")


async def connect_live_metrics():
    client = get_connect_client()
    data = client.get_current_metric_data(
        InstanceId=os.environ["AWS_CONNECT_INSTANCE_ID"],
        Filters={"Channels": ["VOICE"]},
        Groupings=["CHANNEL"],
        CurrentMetrics=[
            {"Name": "AGENTS_ONLINE", "Unit": "COUNT"},
            {"Name": "AGENTS_AVAILABLE", "Unit": "COUNT"},
            {"Name": "CONTACTS_IN_QUEUE", "Unit": "COUNT"},
            {"Name": "OLDEST_CONTACT_AGE", "Unit": "SECONDS"},
        ],
        MaxResults=100,
    )
    out = {}
    for res in data.get("MetricResults", []):
        for m in res.get("Collections", []):
            out[m["Metric"]["Name"]] = m.get("Value", 0)
    return out


@api_router.get("/dealer/connect/status")
async def connect_status(dealer=Depends(get_current_dealer)):
    calls = await db.connect_calls.find({}, {"_id": 0}).sort("started_at", -1).to_list(50)
    if connect_configured():
        metrics = {"AGENTS_ONLINE": 0, "AGENTS_AVAILABLE": 0, "CONTACTS_IN_QUEUE": 0, "OLDEST_CONTACT_AGE": 0}
        try:
            metrics.update(await connect_live_metrics())
        except Exception as e:
            logger.error(f"Connect metrics failed: {e}")
        return {"mode": "live", "instance_id": os.environ.get("AWS_CONNECT_INSTANCE_ID", ""), "source_phone": os.environ.get("AWS_CONNECT_SOURCE_PHONE", ""), "ccp_url": os.environ.get("AWS_CONNECT_CCP_URL", ""), "calls": calls, "metrics": metrics}
    d_id = dealer.get("dealership_id")
    is_master = dealer.get("role") == "manager" or dealer.get("email") == "ndvtechsys.solutions@gmail.com"
    inc_q = {"status": {"$ne": "resolved"}} if is_master else {"status": {"$ne": "resolved"}, "dealership_id": d_id}
    tech_q = {"role": "technician"} if is_master else {"role": "technician", "dealership_id": d_id}
    open_count = await db.incidents.count_documents(inc_q)
    tech_count = await db.dealers.count_documents(tech_q)
    metrics = {"AGENTS_ONLINE": tech_count, "AGENTS_AVAILABLE": max(tech_count - 1, 0), "CONTACTS_IN_QUEUE": open_count, "OLDEST_CONTACT_AGE": 0}
    return {"mode": "simulation", "instance_id": "", "source_phone": "", "ccp_url": "", "calls": calls, "metrics": metrics}


@api_router.post("/dealer/connect/call")
async def connect_call(body: dict, dealer=Depends(get_current_dealer)):
    call_id = f"CALL-{uuid.uuid4().hex[:6].upper()}"
    destination = (body.get("destination_phone_number") or "").strip()
    contact_id = None
    live = connect_configured()
    if live:
        if not re.match(r"^\+[1-9]\d{7,14}$", destination):
            raise HTTPException(status_code=400, detail="Enter a valid destination phone in E.164 format, e.g. +14155550100")
        params = {
            "InstanceId": os.environ["AWS_CONNECT_INSTANCE_ID"],
            "ContactFlowId": os.environ["AWS_CONNECT_CONTACT_FLOW_ID"],
            "DestinationPhoneNumber": destination,
            "ClientToken": f"{call_id}-{int(now_utc().timestamp())}",
            "TrafficType": "GENERAL",
            "RingTimeoutInSeconds": 60,
            "Attributes": {"incidentId": str(body.get("incident_id") or ""), "agent": dealer["name"]},
        }
        queue_id = (os.environ.get("AWS_CONNECT_QUEUE_ID") or "").strip()
        source = (os.environ.get("AWS_CONNECT_SOURCE_PHONE") or "").strip()
        if queue_id:
            params["QueueId"] = queue_id
        if source:
            params["SourcePhoneNumber"] = source
        if not queue_id and not source:
            raise HTTPException(status_code=400, detail="Set AWS_CONNECT_SOURCE_PHONE or AWS_CONNECT_QUEUE_ID in backend/.env")
        try:
            result = get_connect_client().start_outbound_voice_contact(**params)
            contact_id = result.get("ContactId")
        except ClientError as exc:
            raise connect_error(exc)
    call = {
        "id": call_id,
        "contact_id": contact_id,
        "incident_id": body.get("incident_id"),
        "customer_name": body.get("customer_name", "Customer"),
        "destination": destination,
        "direction": "outbound",
        "agent": dealer["name"],
        "status": "initiated" if live else "connected",
        "mode": "live" if live else "simulation",
        "started_at": iso(now_utc()),
        "transcript": body.get("transcript", "Outbound voice contact started via Amazon Connect." if live else "Agent connected with customer via Amazon Connect softphone (simulation)."),
    }
    await db.connect_calls.insert_one(dict(call))
    if body.get("incident_id"):
        note = f"Amazon Connect {'live ' if live else ''}call {call_id}{f' (ContactId {contact_id})' if contact_id else ''} placed by {dealer['name']}"
        await db.incidents.update_one({"id": body["incident_id"]}, {"$push": {"timeline": {"status": "in_progress", "at": iso(now_utc()), "note": note}}})
    return call


@api_router.post("/dealer/connect/chat")
async def connect_chat(body: dict, dealer=Depends(get_current_dealer)):
    inc = body.get("incident_id")
    if connect_configured():
        try:
            result = get_connect_client().start_chat_contact(
                InstanceId=os.environ["AWS_CONNECT_INSTANCE_ID"],
                ContactFlowId=os.environ["AWS_CONNECT_CONTACT_FLOW_ID"],
                ParticipantDetails={"DisplayName": body.get("display_name", "Customer")},
                SupportedMessagingContentTypes=["text/plain"],
                ChatDurationInMinutes=60,
                ClientToken=f"chat-{uuid.uuid4().hex[:8]}",
                Attributes={"incidentId": str(inc or "")},
                InitialMessage={"Content": body.get("message", "Hello from AutoCare service."), "ContentType": "text/plain"},
            )
            contact_id = result["ContactId"]
            resp = {"mode": "live", "contact_id": contact_id, "participant_id": result["ParticipantId"], "participant_token": result["ParticipantToken"]}
        except ClientError as exc:
            raise connect_error(exc)
    else:
        contact_id = f"CHAT-{uuid.uuid4().hex[:6].upper()}"
        resp = {"mode": "simulation", "contact_id": contact_id, "participant_id": None, "participant_token": None}
    await db.connect_calls.insert_one({
        "id": contact_id, "contact_id": contact_id, "incident_id": inc,
        "customer_name": body.get("display_name", "Customer"), "destination": "",
        "direction": "chat", "channel": "CHAT/SMS", "agent": dealer["name"],
        "status": "open", "mode": resp["mode"], "started_at": iso(now_utc()),
        "transcript": "Amazon Connect chat/SMS session opened." + ("" if resp["mode"] == "live" else " (simulation)"),
    })
    if inc:
        await db.incidents.update_one({"id": inc}, {"$push": {"timeline": {"status": "in_progress", "at": iso(now_utc()), "note": f"Amazon Connect chat/SMS {contact_id} opened by {dealer['name']}"}}})
        await db.connect_chat_messages.insert_one({"id": str(uuid.uuid4()), "incident_id": inc, "sender": "system", "sender_name": "Amazon Connect", "text": f"Chat/SMS session {contact_id} opened by {dealer['name']}.", "at": iso(now_utc())})
    return resp


@api_router.get("/dealer/connect/metrics")
async def connect_metrics(dealer=Depends(get_current_dealer)):
    if connect_configured():
        current = {"AGENTS_ONLINE": 0, "AGENTS_AVAILABLE": 0, "CONTACTS_IN_QUEUE": 0, "OLDEST_CONTACT_AGE": 0}
        try:
            current.update(await connect_live_metrics())
        except Exception as e:
            logger.error(f"Connect current metrics failed: {e}")
        historical = {"CONTACTS_HANDLED": 0, "CONTACTS_ABANDONED": 0, "HANDLE_TIME": 0}
        try:
            client = get_connect_client()
            now = now_utc()
            end = now.replace(minute=(now.minute // 5) * 5, second=0, microsecond=0)
            start = end - timedelta(hours=1)
            data = client.get_metric_data(
                InstanceId=os.environ["AWS_CONNECT_INSTANCE_ID"],
                StartTime=start, EndTime=end,
                Filters={"Channels": ["VOICE"]}, Groupings=["CHANNEL"],
                HistoricalMetrics=[
                    {"Name": "CONTACTS_HANDLED", "Unit": "COUNT", "Statistic": "SUM"},
                    {"Name": "CONTACTS_ABANDONED", "Unit": "COUNT", "Statistic": "SUM"},
                    {"Name": "HANDLE_TIME", "Unit": "SECONDS", "Statistic": "AVG"},
                ],
                MaxResults=100,
            )
            for res in data.get("MetricResults", []):
                for m in res.get("Collections", []):
                    historical[m["Metric"]["Name"]] = m.get("Value", 0)
        except Exception as e:
            logger.error(f"Connect historical metrics failed: {e}")
        return {"mode": "live", "current": current, "historical": historical}
    open_count = await db.incidents.count_documents({"status": {"$ne": "resolved"}})
    resolved_count = await db.incidents.count_documents({"status": "resolved"})
    tech = await db.dealers.count_documents({"role": "technician"})
    docs = await db.incidents.find({"status": "resolved"}, {"_id": 0, "created_at": 1, "resolved_at": 1}).to_list(1000)
    times = [(parse_dt(d["resolved_at"]) - parse_dt(d["created_at"])).total_seconds() for d in docs if d.get("resolved_at")]
    avg = sum(times) / len(times) if times else 0
    return {
        "mode": "simulation",
        "current": {"AGENTS_ONLINE": tech, "AGENTS_AVAILABLE": max(tech - 1, 0), "CONTACTS_IN_QUEUE": open_count, "OLDEST_CONTACT_AGE": 0},
        "historical": {"CONTACTS_HANDLED": resolved_count, "CONTACTS_ABANDONED": 0, "HANDLE_TIME": round(avg)},
    }


# ---------------- Connect chat thread, recordings, callbacks ----------------
_s3_client = None


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3", region_name=os.environ["AWS_REGION"], aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"], aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
    return _s3_client


async def _add_chat_message(incident_id, sender, sender_name, text):
    doc = {"id": str(uuid.uuid4()), "incident_id": incident_id, "sender": sender, "sender_name": sender_name, "text": text, "at": iso(now_utc())}
    await db.connect_chat_messages.insert_one(dict(doc))
    return doc


@api_router.get("/incidents/{inc_id}/chat")
async def customer_chat_list(inc_id: str, user=Depends(get_current_user)):
    inc = await db.incidents.find_one({"id": inc_id, "user_id": user["user_id"]}, {"_id": 0, "id": 1})
    if not inc:
        raise HTTPException(status_code=404, detail="Not found")
    return await db.connect_chat_messages.find({"incident_id": inc_id}, {"_id": 0}).sort("at", 1).to_list(500)


@api_router.post("/incidents/{inc_id}/chat")
async def customer_chat_send(inc_id: str, body: dict, user=Depends(get_current_user)):
    inc = await db.incidents.find_one({"id": inc_id, "user_id": user["user_id"]}, {"_id": 0, "id": 1})
    if not inc:
        raise HTTPException(status_code=404, detail="Not found")
    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message required")
    return await _add_chat_message(inc_id, "customer", user.get("name", "Customer"), text)


@api_router.get("/dealer/incidents/{inc_id}/chat")
async def dealer_chat_list(inc_id: str, dealer=Depends(get_current_dealer)):
    return await db.connect_chat_messages.find({"incident_id": inc_id}, {"_id": 0}).sort("at", 1).to_list(500)


@api_router.post("/dealer/incidents/{inc_id}/chat")
async def dealer_chat_send(inc_id: str, body: dict, background_tasks: BackgroundTasks, dealer=Depends(get_current_dealer)):
    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message required")
    msg = await _add_chat_message(inc_id, "agent", dealer["name"], text)
    inc = await db.incidents.find_one({"id": inc_id}, {"_id": 0})
    if inc and inc.get("customer_email"):
        background_tasks.add_task(notify_customer_chat, inc, dealer["name"], text)
    return msg


@api_router.get("/dealer/connect/recordings/{inc_id}")
async def list_recordings(inc_id: str, dealer=Depends(get_current_dealer)):
    return await db.connect_calls.find({"incident_id": inc_id, "direction": "outbound"}, {"_id": 0}).sort("started_at", -1).to_list(100)


@api_router.get("/dealer/connect/recording/{call_id}")
async def get_recording(call_id: str, dealer=Depends(get_current_dealer)):
    call = await db.connect_calls.find_one({"id": call_id}, {"_id": 0})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    if call.get("recording_url"):
        return {"url": call["recording_url"], "source": "url"}
    bucket = (os.environ.get("AWS_CONNECT_RECORDINGS_BUCKET") or "").strip()
    if connect_configured() and bucket and call.get("recording_key"):
        try:
            url = get_s3_client().generate_presigned_url("get_object", Params={"Bucket": bucket, "Key": call["recording_key"]}, ExpiresIn=3600)
            return {"url": url, "source": "s3"}
        except ClientError as exc:
            raise connect_error(exc)
    if connect_configured() and bucket and not call.get("recording_key") and call.get("contact_id"):
        try:
            s3 = get_s3_client()
            prefix = (os.environ.get("AWS_CONNECT_RECORDINGS_PREFIX") or "").strip()
            token = None
            while True:
                kw = {"Bucket": bucket, "MaxKeys": 1000}
                if prefix:
                    kw["Prefix"] = prefix
                if token:
                    kw["ContinuationToken"] = token
                resp = s3.list_objects_v2(**kw)
                for obj in resp.get("Contents", []):
                    if call["contact_id"] in obj["Key"]:
                        await db.connect_calls.update_one({"id": call_id}, {"$set": {"recording_key": obj["Key"]}})
                        url = s3.generate_presigned_url("get_object", Params={"Bucket": bucket, "Key": obj["Key"]}, ExpiresIn=3600)
                        return {"url": url, "source": "s3-auto"}
                if resp.get("IsTruncated"):
                    token = resp.get("NextContinuationToken")
                else:
                    break
        except ClientError as exc:
            raise connect_error(exc)
    raise HTTPException(status_code=404, detail="Recording not available yet. It appears once the call ends and Amazon Connect syncs it to S3.")


@api_router.post("/dealer/connect/recording/{call_id}")
async def set_recording(call_id: str, body: dict, dealer=Depends(get_current_dealer)):
    call = await db.connect_calls.find_one({"id": call_id}, {"_id": 0})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    updates = {}
    if body.get("recording_url"):
        updates["recording_url"] = body["recording_url"].strip()
    if body.get("recording_key"):
        updates["recording_key"] = body["recording_key"].strip()
    if not updates:
        raise HTTPException(status_code=400, detail="Provide recording_url or recording_key")
    await db.connect_calls.update_one({"id": call_id}, {"$set": updates})
    return {"ok": True, **updates}


async def _place_outbound(destination, incident_id, agent_name):
    live = connect_configured()
    contact_id = None
    if live:
        if not re.match(r"^\+[1-9]\d{7,14}$", destination or ""):
            raise HTTPException(status_code=400, detail="Valid E.164 phone required, e.g. +14155550100")
        params = {
            "InstanceId": os.environ["AWS_CONNECT_INSTANCE_ID"],
            "ContactFlowId": os.environ["AWS_CONNECT_CONTACT_FLOW_ID"],
            "DestinationPhoneNumber": destination,
            "ClientToken": f"cb-{uuid.uuid4().hex[:10]}",
            "TrafficType": "GENERAL",
            "RingTimeoutInSeconds": 60,
            "Attributes": {"incidentId": str(incident_id or ""), "reason": "callback"},
        }
        queue_id = (os.environ.get("AWS_CONNECT_QUEUE_ID") or "").strip()
        source = (os.environ.get("AWS_CONNECT_SOURCE_PHONE") or "").strip()
        if queue_id:
            params["QueueId"] = queue_id
        if source:
            params["SourcePhoneNumber"] = source
        if not queue_id and not source:
            raise HTTPException(status_code=400, detail="Set AWS_CONNECT_SOURCE_PHONE or AWS_CONNECT_QUEUE_ID")
        try:
            result = get_connect_client().start_outbound_voice_contact(**params)
            contact_id = result.get("ContactId")
        except ClientError as exc:
            raise connect_error(exc)
    return contact_id, live


@api_router.post("/incidents/{inc_id}/callback")
async def request_callback(inc_id: str, body: dict, user=Depends(get_current_user)):
    inc = await db.incidents.find_one({"id": inc_id, "user_id": user["user_id"]}, {"_id": 0})
    if not inc:
        raise HTTPException(status_code=404, detail="Not found")
    phone = (body.get("phone") or "").strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    scheduled_raw = (body.get("scheduled_at") or "").strip()
    scheduled_at = None
    if scheduled_raw:
        try:
            scheduled_at = parse_dt(scheduled_raw)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid scheduled time")
    live = connect_configured()
    contact_id = None
    if scheduled_at and scheduled_at > now_utc():
        status = "scheduled"
    elif live:
        contact_id, _ = await _place_outbound(phone, inc_id, "Callback")
        status = "placed"
    else:
        status = "pending"
    cb = {
        "id": f"CB-{uuid.uuid4().hex[:6].upper()}",
        "incident_id": inc_id,
        "user_id": user["user_id"],
        "dealership_id": inc.get("dealership_id"),
        "customer_name": user.get("name", "Customer"),
        "phone": phone,
        "status": status,
        "contact_id": contact_id,
        "scheduled_at": iso(scheduled_at) if scheduled_at else None,
        "mode": "live" if live else "simulation",
        "created_at": iso(now_utc()),
    }
    await db.callbacks.insert_one(dict(cb))
    if status == "scheduled":
        note = f"Customer scheduled a callback on {phone} for {iso(scheduled_at)}"
    elif contact_id:
        note = f"Customer requested a callback on {phone} — routed to Amazon Connect ({contact_id})"
    else:
        note = f"Customer requested a callback on {phone} — queued for the dealer team"
    await db.incidents.update_one({"id": inc_id}, {"$push": {"timeline": {"status": inc["status"], "at": iso(now_utc()), "note": note}}})
    return cb


@api_router.get("/incidents/{inc_id}/callbacks")
async def customer_callbacks(inc_id: str, user=Depends(get_current_user)):
    return await db.callbacks.find({"incident_id": inc_id, "user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.get("/dealer/callbacks")
async def dealer_callbacks(dealership_id: Optional[str] = None, dealer=Depends(get_current_dealer)):
    query = {}
    if dealership_id and dealership_id != "all":
        query["dealership_id"] = dealership_id
    elif dealer.get("role") != "manager" and dealer.get("email") != "ndvtechsys.solutions@gmail.com":
        query["dealership_id"] = dealer.get("dealership_id")
    return await db.callbacks.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/dealer/callbacks/{cb_id}/place")
async def place_callback(cb_id: str, dealer=Depends(get_current_dealer)):
    cb = await db.callbacks.find_one({"id": cb_id}, {"_id": 0})
    if not cb:
        raise HTTPException(status_code=404, detail="Callback not found")
    contact_id, live = await _place_outbound(cb["phone"], cb["incident_id"], dealer["name"])
    await db.callbacks.update_one({"id": cb_id}, {"$set": {"status": "placed", "contact_id": contact_id, "handled_by": dealer["name"]}})
    if cb.get("incident_id"):
        note = f"Callback {cb_id} placed to {cb['phone']} by {dealer['name']}" + (f" (ContactId {contact_id})" if contact_id else "")
        await db.incidents.update_one({"id": cb["incident_id"]}, {"$push": {"timeline": {"status": "in_progress", "at": iso(now_utc()), "note": note}}})
    return {"ok": True, "contact_id": contact_id, "status": "placed"}


async def process_due_callbacks():
    now = now_utc()
    due = await db.callbacks.find({"status": "scheduled"}, {"_id": 0}).to_list(500)
    for cb in due:
        try:
            if parse_dt(cb.get("scheduled_at")) > now:
                continue
        except Exception:
            continue
        contact_id = None
        try:
            contact_id, live = await _place_outbound(cb["phone"], cb["incident_id"], "Scheduler")
            new_status = "placed" if live else "pending"
        except Exception as e:
            logger.error(f"scheduled callback {cb['id']} placement failed: {e}")
            new_status = "pending"
        await db.callbacks.update_one({"id": cb["id"]}, {"$set": {"status": new_status, "contact_id": contact_id}})
        if cb.get("incident_id"):
            note = f"Scheduled callback {cb['id']} due — " + (f"routed to Amazon Connect ({contact_id})" if contact_id else "queued for the dealer team")
            await db.incidents.update_one({"id": cb["incident_id"]}, {"$push": {"timeline": {"status": "in_progress", "at": iso(now_utc()), "note": note}}})


@api_router.post("/cron/callbacks")
async def cron_callbacks(background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    secret = os.environ.get("WEBHOOK_CRON_SECRET", "")
    token = authorization.split(" ", 1)[1] if authorization and authorization.startswith("Bearer ") else ""
    if not secret or not hmac.compare_digest(token, secret):
        raise HTTPException(status_code=401, detail="Unauthorized")
    background_tasks.add_task(process_due_callbacks)
    return {"ok": True, "accepted": True}


# ---------------- Startup seed ----------------
async def seed():
    dealerships = [
        {"id": "d_metro", "name": "AutoCare Metro Center", "city": "San Francisco, CA", "lat": 37.7749, "lng": -122.4194, "services_count": 1240, "rating": 4.8, "phone": "+14155550101"},
        {"id": "d_silicon", "name": "AutoCare Silicon Auto", "city": "San Jose, CA", "lat": 37.3382, "lng": -121.8863, "services_count": 1520, "rating": 4.9, "phone": "+14085550102"},
        {"id": "d_bayview", "name": "AutoCare Bayview Motors", "city": "Oakland, CA", "lat": 37.8044, "lng": -122.2712, "services_count": 890, "rating": 4.6, "phone": "+15105550103"},
        {"id": "d_northbay", "name": "AutoCare North Bay Service", "city": "Santa Rosa, CA", "lat": 38.4405, "lng": -122.7141, "services_count": 430, "rating": 4.4, "phone": "+17075550104"},
    ]
    dmap = {d["id"]: d["name"] for d in dealerships}
    for d in dealerships:
        await db.dealerships.update_one({"id": d["id"]}, {"$set": d}, upsert=True)
    managers = [
        ("ndvtechsys.solutions@gmail.com", "Service Manager", "d_metro"),
        ("silicon.manager@autocare.com", "Silicon Manager", "d_silicon"),
        ("bayview.manager@autocare.com", "Bayview Manager", "d_bayview"),
        ("northbay.manager@autocare.com", "North Bay Manager", "d_northbay"),
    ]
    for email, name, did in managers:
        pw = bcrypt.hashpw("DealerPass123!".encode(), bcrypt.gensalt()).decode()
        if await db.dealers.find_one({"email": email}):
            await db.dealers.update_one({"email": email}, {"$set": {"dealership_id": did, "dealership_name": dmap[did], "password_hash": pw}})
        else:
            await db.dealers.insert_one({"dealer_id": f"dealer_{uuid.uuid4().hex[:10]}", "email": email, "password_hash": pw, "name": name, "role": "manager", "dealership_id": did, "dealership_name": dmap[did], "created_at": iso(now_utc())})
    techs = [
        ("Ravi Kumar", "ravi.tech@autocare.com", "d_metro"),
        ("Maria Chen", "maria.tech@autocare.com", "d_metro"),
        ("James Okoro", "james.tech@autocare.com", "d_metro"),
        ("Aisha Khan", "aisha.tech@autocare.com", "d_silicon"),
        ("Diego Torres", "diego.tech@autocare.com", "d_silicon"),
        ("Liam Walsh", "liam.tech@autocare.com", "d_bayview"),
        ("Noah Kim", "noah.tech@autocare.com", "d_bayview"),
        ("Sara Lopez", "sara.tech@autocare.com", "d_northbay"),
        ("Omar Farouk", "omar.tech@autocare.com", "d_northbay"),
    ]
    for name, email, did in techs:
        pw = bcrypt.hashpw("TechPass123!".encode(), bcrypt.gensalt()).decode()
        if await db.dealers.find_one({"email": email}):
            await db.dealers.update_one({"email": email}, {"$set": {"dealership_id": did, "dealership_name": dmap[did], "password_hash": pw}})
        else:
            await db.dealers.insert_one({"dealer_id": f"dealer_{uuid.uuid4().hex[:10]}", "email": email, "password_hash": pw, "name": name, "role": "technician", "specialty": "General Service", "dealership_id": did, "dealership_name": dmap[did], "created_at": iso(now_utc())})
    # Backfill legacy incidents/callbacks without a dealership to the flagship (owner) branch
    await db.incidents.update_many({"$or": [{"dealership_id": {"$exists": False}}, {"dealership_id": None}]}, {"$set": {"dealership_id": "d_metro", "dealership_name": dmap["d_metro"]}})
    await db.callbacks.update_many({"dealership_id": {"$exists": False}}, {"$set": {"dealership_id": "d_metro"}})


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    await seed()


@api_router.get("/")
async def root():
    return {"message": "AutoCare Pulse API"}


@api_router.get("/health")
async def health():
    enable_hc = os.environ.get("ENABLE_HEALTH_CHECK", "false").lower() in ("true", "1")
    return {"status": "ok", "health_check_enabled": enable_hc, "time": iso(now_utc())}


app.include_router(api_router)
raw_origins = [o.strip(' "\'') for o in os.environ.get('CORS_ORIGINS', '*').split(',') if o.strip(' "\'')]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=r"^https?://.*",
    allow_origins=raw_origins if raw_origins else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
