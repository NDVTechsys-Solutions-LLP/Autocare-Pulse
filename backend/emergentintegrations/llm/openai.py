class OpenAISpeechToText:
    def __init__(self, api_key=None):
        self.api_key = api_key

    async def transcribe(self, file=None, model="whisper-1", response_format="json"):
        class STTResult:
            text = "Voice issue report transcribed."
        return STTResult()
