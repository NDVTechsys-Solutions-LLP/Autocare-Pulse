import pytest
import requests

API = "http://localhost:8000/api"

def test_demo_request_dispatch():
    payload = {
        "name": "Integration Tester",
        "email": "test-user@example.com",
        "phone": "+1-555-0199",
        "organization": "AutoCare Fleet Solutions",
        "description": "Walkthrough request test",
    }
    r = requests.post(f"{API}/demo-request", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert "demo_id" in data
    assert "AutoCare Pulse" in data["message"]

def test_get_a_code_dispatch():
    payload = {
        "name": "Quote Lead",
        "email": "lead@example.com",
        "phone": "+1-555-0188",
        "subject": "Bay Diagnostic Integration",
        "description": "Looking for 10-bay licensing quote",
        "preferred_contact": "email",
    }
    r = requests.post(f"{API}/get-a-code", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert "quote_id" in data
    assert "AutoCare Pulse" in data["message"]

def test_report_question_dispatch():
    payload = {
        "question": "Can AutoCare Pulse connect with custom IoT CANbus hardware?",
        "category": "Hardware Integration",
        "email": "hardware-dev@example.com",
        "user_context": "AutoCare Pulse Assistant",
    }
    r = requests.post(f"{API}/support/report-question", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert "report_id" in data
    assert "AutoCare Pulse" in data["message"]
