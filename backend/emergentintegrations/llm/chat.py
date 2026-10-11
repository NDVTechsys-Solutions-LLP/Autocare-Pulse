import json

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
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.provider = "openai"
        self.model = "gpt-5.4"

    def with_model(self, provider, model):
        self.provider = provider
        self.model = model
        return self

    async def stream_message(self, message):
        text = getattr(message, "text", "")
        # Heuristic categorization for offline/local mode
        cat = "Engine"
        low = text.lower()
        if any(w in low for w in ["brake", "stopping", "abs"]):
            cat = "Brakes"
        elif any(w in low for w in ["battery", "charge", "voltage", "start"]):
            cat = "Battery"
        elif any(w in low for w in ["light", "headlamp", "indicator", "wiring", "electrical"]):
            cat = "Electrical"
        elif any(w in low for w in ["tyre", "tire", "puncture", "wheel", "air"]):
            cat = "Tyres"
        elif any(w in low for w in ["gear", "clutch", "transmission"]):
            cat = "Transmission"
        elif any(w in low for w in ["dent", "scratch", "bumper", "mirror", "body"]):
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
