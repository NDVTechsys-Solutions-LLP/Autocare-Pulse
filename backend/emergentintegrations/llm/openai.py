import os
import logging
import httpx

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

logger = logging.getLogger(__name__)


class OpenAISpeechToText:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("EMERGENT_LLM_KEY")
        self.base_url = (os.environ.get("INTEGRATION_PROXY_URL") or "https://integrations.emergentagent.com").rstrip("/")

    async def transcribe(self, file=None, model="whisper-1", response_format="json", **kwargs):
        class STTResult:
            def __init__(self, text):
                self.text = text

        if not self.api_key:
            logger.warning("No EMERGENT_LLM_KEY provided for speech-to-text.")
            return STTResult("")

        try:
            filename = "voice.webm"
            content = b""
            if hasattr(file, "read"):
                content = file.read()
                filename = getattr(file, "name", "voice.webm") or "voice.webm"
                if hasattr(file, "seek"):
                    file.seek(0)
            elif isinstance(file, bytes):
                content = file

            if not content:
                return STTResult("")

            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
            ct = "audio/webm"
            if ext in ("wav", "wave"):
                ct = "audio/wav"
            elif ext in ("mp3", "mpeg"):
                ct = "audio/mpeg"
            elif ext in ("m4a", "mp4"):
                ct = "audio/mp4"
            elif ext in ("ogg", "opus"):
                ct = "audio/ogg"

            clean_filename = f"audio.{ext}"
            files = {"file": (clean_filename, content, ct)}
            data = {
                "model": model or "whisper-1",
                "prompt": "Automotive vehicle service report, car and motorcycle: engine, gearbox, clutch, shock absorber, brakes, battery, ignition, radiator, carburetor, suspension, exhaust, tyre puncture, EV motor, Creta, Swift, Activa, Pulsar, Duke, loud sound, vibration, smoke, overheating, breakdown."
            }
            headers = {"Authorization": f"Bearer {self.api_key}"}

            url = f"{self.base_url}/llm/audio/transcriptions"
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, files=files, data=data)
                if resp.status_code == 200:
                    res_json = resp.json()
                    transcribed_text = (res_json.get("text") or "").strip()
                    return STTResult(transcribed_text)
                else:
                    logger.warning(f"Emergent STT error {resp.status_code}: {resp.text}")
                    return STTResult("")
        except Exception as e:
            logger.error(f"Speech-to-text error: {e}")
            return STTResult("")
