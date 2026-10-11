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


class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=None):
        self.api_key = api_key or os.environ.get("EMERGENT_LLM_KEY")
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

        # Local fallback heuristic
        cat = "Engine"
        low = text.lower()
        if any(w in low for w in ["brake", "stopping", "abs", "pads", "disc"]):
            cat = "Brakes"
        elif any(w in low for w in ["battery", "charge", "voltage", "start", "alternator"]):
            cat = "Battery"
        elif any(w in low for w in ["light", "headlamp", "indicator", "wiring", "electrical"]):
            cat = "Electrical"
        elif any(w in low for w in ["tyre", "tire", "puncture", "wheel", "air", "pressure"]):
            cat = "Tyres"
        elif any(w in low for w in ["gear", "clutch", "transmission"]):
            cat = "Transmission"
        elif any(w in low for w in ["dent", "scratch", "bumper", "mirror", "body", "paint"]):
            cat = "Body"

        triage = {
            "category": cat,
            "severity": 4 if cat in ["Brakes", "Engine"] else 3,
            "priority": "High" if cat in ["Brakes", "Engine"] else "Medium",
            "summary": text[:80] if text else "Customer vehicle issue reported",
            "recommended_action": f"Perform diagnostic scan for {cat} system and verify customer concern."
        }
        yield TextDelta(json.dumps(triage))
        yield StreamDone()
