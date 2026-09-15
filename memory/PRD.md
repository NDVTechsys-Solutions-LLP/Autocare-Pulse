# AutoCare Pulse — Product Requirements Document

## Original Problem Statement
Incident management platform for automobile / two-wheeler manufacturers to support customers via dealers. Users (customers) log in with Google and raise incidents by voice, manual text, or photo of the vehicle issue and send to the dealer. Dealer side has an AI orchestration layer that identifies and prioritizes incidents, an incident queue with team assignment, transparent status to the user, resolution + KPI monitoring, and escalation paths when KPIs breach. Amazon Connect as the contact-center layer for dealer and user.

## Architecture
- **Frontend**: React 19 (CRA/craco), Tailwind + shadcn/ui, framer-motion, recharts. Dark tactical theme ("Performance Pro x Swiss High-Contrast"), Barlow Condensed + Plus Jakarta Sans.
- **Backend**: FastAPI, all routes under `/api`. Motor/MongoDB.
- **Auth**: Customers = Emergent-managed Google OAuth (httpOnly `session_token` cookie). Dealers = email/password with bcrypt + JWT (`dealer_token` in localStorage).
- **AI**: GPT-5.4 via emergentintegrations (EMERGENT_LLM_KEY) for incident triage (category/severity/priority/summary/action, image-aware). Whisper (`whisper-1`) for voice transcription.
- **Storage**: Emergent object storage for car issue photos.
- **Amazon Connect**: SIMULATED contact-center panel (softphone, agent states, call log). Real AWS Connect wiring pending customer-provided AWS credentials (env vars stubbed: AWS_CONNECT_INSTANCE_ID, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).

## User Personas
- **Customer**: vehicle owner reporting an issue; wants fast intake and transparent status.
- **Dealer Manager**: triages queue, assigns technicians, monitors KPIs, escalates.
- **Technician**: assignee working incidents.
- **OEM Escalation Leads**: L2 Regional, L3 Quality Head.

## Core Requirements (static)
- Dual login (Google customer / email dealer).
- Voice + manual + photo incident creation.
- AI auto-classification & prioritization with SLA.
- Incident queue, technician assignment, status workflow.
- Transparent live tracking timeline for customer.
- KPI dashboard (open, SLA breaches, avg resolution, CSAT) + escalation paths.
- Amazon Connect contact-center panel.

## Implemented (2026-06)
- Google auth (session cookie) + dealer JWT auth; startup seed of manager (ndvtechsys.solutions@gmail.com) + 3 technicians.
- Incident create (manual/voice/photo) with GPT-5.4 triage; image-aware triage when photo attached.
- Whisper voice transcription endpoint.
- Object-storage photo upload + authenticated-less file serve.
- Customer dashboard: raise-incident dialog (Text/Voice/Photo), incident list, live progress timeline detail.
- Dealer console: KPI bar, orchestration queue w/ priority filter + SLA countdown/breach glow, assign/status/priority PATCH with timeline events, 3-level escalation, resolve; KPI & Escalation tab (category bar, priority pie, breach list); simulated Amazon Connect CCP panel (agent states, place call, call log).
- Verified: testing agent 100% backend (17/17) + 100% frontend.

## Backlog
- **P1**: Wire real Amazon Connect once AWS creds provided (replace simulation in /api/dealer/connect/*). Gate /api/files with ownership check for photo privacy.
- **P2**: Customer email/SMS notifications on status change; technician-specific login view; CSAT survey capture (currently derived); model name via env var; escalate returns 409 at max level.
- **P3**: Real-time push (websockets) instead of 7s polling; dealer analytics history charts over time; multi-dealer / multi-OEM tenancy.

## Next Tasks
1. Amazon Connect real integration (needs AWS Connect instance ARN, region, IAM keys, contact flow ID).
2. Notifications on incident status change.
3. Photo access authorization.
