# Image Integration Testing Rules
- Always use base64-encoded images for tests (JPEG/PNG/WEBP only).
- Do not use SVG/BMP/HEIC, blank or solid-color images.
- Every image must contain real visual features (objects, edges, textures).
- If not PNG/JPEG/WEBP, transcode to PNG/JPEG before upload; re-detect MIME after transforms.
- Animated images: extract first frame only. Resize oversized images.

App-specific:
- Photo upload endpoint: POST /api/upload (multipart 'file'), returns {path}.
- Incident create with photo: POST /api/incidents with photo_paths=[path]; backend loads the object and passes it to GPT-5.4 for damage-aware triage.
- File serve: GET /api/files/{path} returns the stored image.
