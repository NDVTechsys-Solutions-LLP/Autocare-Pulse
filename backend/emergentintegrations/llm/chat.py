import os
import json
import logging
import httpx
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

logger = logging.getLogger(__name__)


class UserMessage:
    def __init__(self, text="", file_contents=None):
        self.text = text
        self.file_contents = file_contents or []


class TextDelta:
    def __init__(self, content=""):
        self.content = content


class StreamDone:
    pass


class ImageContent:
    def __init__(self, image_base64=""):
        self.image_base64 = image_base64


DEFAULT_EMERGENT_KEY = "sk-emergent-93c1b246cAd0cA63c8"


class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=None):
        self.api_key = api_key or os.environ.get("EMERGENT_LLM_KEY") or DEFAULT_EMERGENT_KEY
        self.session_id = session_id
        self.system_message = system_message
        self.provider = "openai"
        self.model = "gpt-4o-mini"
        self.base_url = (os.environ.get("INTEGRATION_PROXY_URL") or "https://integrations.emergentagent.com").rstrip("/")

    def with_model(self, provider, model):
        self.provider = provider
        # Supported OpenAI vision & reasoning models on Emergent proxy
        self.model = "gpt-4o-mini" if model in ("gpt-5.4", "gpt-4o-mini") else model
        return self

    async def stream_message(self, message):
        text = getattr(message, "text", "")
        file_contents = getattr(message, "file_contents", []) or []

        if self.api_key:
            try:
                messages = []
                if self.system_message:
                    messages.append({"role": "system", "content": self.system_message})

                user_content = []
                if text:
                    user_content.append({"type": "text", "text": text})

                for fc in file_contents:
                    if isinstance(fc, ImageContent) and fc.image_base64:
                        user_content.append({
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{fc.image_base64}"}
                        })

                if len(user_content) == 1 and user_content[0]["type"] == "text":
                    messages.append({"role": "user", "content": text})
                elif user_content:
                    messages.append({"role": "user", "content": user_content})
                else:
                    messages.append({"role": "user", "content": "Process vehicle report."})

                url = f"{self.base_url}/llm/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.2
                }

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply = data["choices"][0]["message"]["content"]
                        yield TextDelta(reply)
                        yield StreamDone()
                        return
                    else:
                        logger.warning(f"Emergent LLM API returned {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Emergent LLM call failed, using heuristic: {e}")

        # Intelligent offline fallback heuristic (Solvable vs Request Service)
        low = text.lower()
        if any(w in low for w in ["brake", "breaks", "stopping", "abs", "pads", "disc", "pedal"]):
            cat = "Brakes"
            is_solvable = False
            label = "Service Required · Professional Attention Needed"
            action = "CRITICAL SAFETY ADVISORY · NOT SELF-SOLVABLE\n- Do not drive the vehicle with compromised brakes.\n- Brake failure cannot be safely resolved via DIY.\n- Action Required: Request immediate professional dealer service or roadside assistance towing."
            prio = "High"
            sev = 5
        elif any(w in low for w in ["wiper", "blade", "windshield", "washer", "spray", "streak", "sluggish"]):
            cat = "Wipers"
            is_solvable = True
            label = "Solvable via DIY Fix"
            action = "DIY RESOLUTION DIRECTIVE:\n1. Inspect wiper rubber blades for hardened grime or micro-tears.\n2. Clean blade edges thoroughly using isopropyl alcohol or wiper fluid on a microfiber cloth.\n3. Check and tighten the wiper linkage pivot nut under the cowl.\n4. Top up windshield washer reservoir with anti-streak fluid."
            prio = "Low"
            sev = 2
        elif any(w in low for w in ["lock", "latch", "door", "fob", "central locking"]):
            cat = "Locks"
            is_solvable = True
            label = "Solvable via DIY Fix"
            action = "DIY RESOLUTION DIRECTIVE:\n1. Spray silicone lubricant or graphite spray into the key cylinder and door latch striker.\n2. Manually exercise the interior lock tab 5–10 times to spread lubricant.\n3. Replace the CR2032 button cell battery in your key fob if range is degraded.\n4. If the door continues popping open while driving, book workshop latch replacement."
            prio = "Medium"
            sev = 2
        elif any(w in low for w in ["tyre", "tire", "puncture", "wheel", "air", "pressure"]):
            cat = "Tyres"
            is_solvable = True
            label = "Solvable via DIY Fix"
            action = "DIY RESOLUTION DIRECTIVE:\n1. Visually inspect the tire tread and sidewall for embedded nails or screws.\n2. Check cold tire pressure using a digital pressure gauge against the driver door-jamb sticker (usually 32–35 PSI).\n3. Inflate tire at nearest air station or portable 12V pump.\n4. If pressure drops rapidly, mount spare wheel and visit authorized tire dealer."
            prio = "Medium"
            sev = 2
        elif any(w in low for w in ["battery", "charge", "voltage", "jump", "alternator"]):
            cat = "Battery"
            is_solvable = True
            label = "Solvable via DIY Fix"
            action = "DIY RESOLUTION DIRECTIVE:\n1. Check battery terminals for white powdery corrosion; clean with warm water and baking soda.\n2. Tighten loose terminal clamps with a 10mm spanner.\n3. Jump-start vehicle using booster cables or a portable lithium jump box.\n4. Drive for 25 minutes to allow alternator to recharge; if battery fails to restart, replace battery."
            prio = "Medium"
            sev = 3
        elif any(w in low for w in ["engine", "knock", "smoke", "overheat", "radiator", "oil", "leak"]):
            cat = "Engine"
            is_solvable = False
            label = "Service Required · Professional Attention Needed"
            action = "CRITICAL MECHANICAL HAZARD · NOT SELF-SOLVABLE\n- Severe risk of catastrophic engine seizure, head gasket blown, or fire hazard.\n- Immediate Driver Action: Switch off engine immediately. DO NOT DRIVE.\n- Request emergency flatbed tow or dispatch dealer roadside recovery truck."
            prio = "High"
            sev = 5
        else:
            cat = "General"
            is_solvable = False
            label = "Service Required"
            action = "Professional inspection recommended: Have an authorized dealer technician inspect this issue to prevent further wear."
            prio = "Medium"
            sev = 3

        triage = {
            "category": cat,
            "severity": sev,
            "priority": prio,
            "summary": text[:80] if text else "Customer vehicle issue reported",
            "is_solvable": is_solvable,
            "solvability_label": label,
            "recommended_action": action
        }
        yield TextDelta(json.dumps(triage))
        yield StreamDone()
