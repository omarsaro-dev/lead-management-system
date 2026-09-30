import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import lead_manegment.Backend.storage as storage
from lead_manegment.Backend.api import app
from lead_manegment.Backend.models import Lead


class QualificationTests(unittest.TestCase):
    def setUp(self):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        db_patch = patch.object(storage, "DB_FILE", Path(temp_dir.name) / "leads.db")
        db_patch.start()
        self.addCleanup(db_patch.stop)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        storage.save_lead(Lead("Ahmed", "ahmed@test.com", "01012345678", "AI Automation", "new"))
        self.payload = {
            "score": 85,
            "priority": "high",
            "ai_summary": "عميل مهتم بخدمة AI Automation",
            "next_action": "التواصل معه خلال 24 ساعة",
        }

    def test_qualification_persists_and_preserves_lead(self):
        for score in (85, 90):
            self.payload["score"] = score
            response = self.client.patch(
                "/leads/AHMED@test.com/qualification", json=self.payload
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), self.payload)
            with closing(sqlite3.connect(storage.DB_FILE)) as conn:
                row = conn.execute(
                    "SELECT score, priority, ai_summary, next_action, name, status FROM leads"
                ).fetchone()
            self.assertEqual(row, (*self.payload.values(), "Ahmed", "new"))

    def test_missing_lead(self):
        response = self.client.patch("/leads/missing@test.com/qualification", json=self.payload)
        self.assertEqual(response.status_code, 404)

    def test_invalid_payload_does_not_write(self):
        for payload in ({}, {**self.payload, "score": "invalid"}):
            response = self.client.patch("/leads/ahmed@test.com/qualification", json=payload)
            self.assertEqual(response.status_code, 422)
        with closing(sqlite3.connect(storage.DB_FILE)) as conn:
            self.assertEqual(conn.execute("SELECT score FROM leads").fetchone(), (None,))


if __name__ == "__main__":
    unittest.main()
