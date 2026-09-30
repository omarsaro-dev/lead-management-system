import sqlite3
from contextlib import contextmanager
from pathlib import Path

from lead_manegment.Backend.models import Lead

DATA_DIR = Path(__file__).resolve().parent / "data"
DB_FILE = DATA_DIR / "leads.db"


@contextmanager
def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def init_db():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                service TEXT,
                status TEXT
            );
            """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS services (
                name TEXT PRIMARY KEY
            );
            """)
        c.execute("""INSERT OR IGNORE INTO services (name)
            SELECT DISTINCT service
            FROM leads
            WHERE service IS NOT NULL AND TRIM(service) <> ''""")
        existing_columns = {
            row[1] for row in c.execute("PRAGMA table_info(leads)").fetchall()
        }
        for column, column_type in (
            ("score", "INTEGER"),
            ("priority", "TEXT"),
            ("ai_summary", "TEXT"),
            ("next_action", "TEXT"),
        ):
            if column not in existing_columns:
                c.execute(f"ALTER TABLE leads ADD COLUMN {column} {column_type}")
        conn.commit()


def load_leads():
    init_db()
    leads = []

    with get_connection() as conn:
        c = conn.cursor()
        c.execute(
            "SELECT name, email, phone, service, status FROM leads ORDER BY name ASC"
        )
        rows = c.fetchall()

        for row in rows:
            lead = Lead(
                name=row[0], email=row[1], phone=row[2], service=row[3], state=row[4]
            )
            leads.append(lead)

    return leads


def count_leads():
    init_db()
    with get_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM leads")
        return c.fetchone()[0]


def count_leads_by_service():
    init_db()
    with get_connection() as conn:
        c = conn.cursor()
        c.execute("""SELECT service, COUNT(*)
            FROM leads
            GROUP BY service
            ORDER BY service""")
        return c.fetchall()


def load_leads_with_services():
    init_db()
    with get_connection() as conn:
        c = conn.cursor()
        c.execute("""SELECT leads.name, leads.email, services.name
            FROM leads
            INNER JOIN services ON leads.service = services.name
            ORDER BY leads.name""")
        return c.fetchall()


def save_lead(lead):
    init_db()
    with get_connection() as conn:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO leads (name, email, phone, service, status)
            VALUES (?, ?, ?, ?, ?)
            """,
            (lead.name, lead.email, lead.phone, lead.service, lead.state),
        )
        conn.commit()


def save_leads(leads):
    """Insert or update multiple leads in a single transaction."""
    init_db()
    with get_connection() as conn:
        conn.executemany(
            """
            INSERT INTO leads (name, email, phone, service, status)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                name=excluded.name,
                phone=excluded.phone,
                service=excluded.service,
                status=excluded.status
            """,
            [
                (lead.name, lead.email, lead.phone, lead.service, lead.state)
                for lead in leads
            ],
        )


def delete_lead_by_email(email):
    init_db()
    with get_connection() as conn:
        c = conn.cursor()
        c.execute(
            "DELETE FROM leads WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))",
            (email,),
        )
        conn.commit()
        return c.rowcount > 0


def find_lead_by_email(email):
    init_db()

    with get_connection() as conn:
        c = conn.cursor()

        c.execute(
            """SELECT name, email, phone, service, status
            FROM leads
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))""",
            (email,),
        )

        row = c.fetchone()

        if row is None:
            return None

        return Lead(
            name=row[0],
            email=row[1],
            phone=row[2],
            service=row[3],
            state=row[4],
        )


def find_leads_by_service(service):
    init_db()

    with get_connection() as conn:
        c = conn.cursor()

        c.execute(
            """SELECT name, email, phone, service, status
            FROM leads
            WHERE LOWER(TRIM(service)) = LOWER(TRIM(?))
            ORDER BY id""",
            (service,),
        )

        rows = c.fetchall()

        return [
            Lead(
                name=row[0],
                email=row[1],
                phone=row[2],
                service=row[3],
                state=row[4],
            )
            for row in rows
        ]


def update_lead_by_email(email, phone, status, service, name=None):
    init_db()

    with get_connection() as conn:
        c = conn.cursor()

        c.execute(
            """UPDATE leads
            SET name = COALESCE(?, name), phone = ?, status = ?, service = ?
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))""",
            (name, phone, status, service, email),
        )

        conn.commit()
        return c.rowcount > 0


def update_lead_qualification(email, score, priority, ai_summary, next_action):
    init_db()
    with get_connection() as conn:
        cursor = conn.execute(
            """UPDATE leads
            SET score = ?, priority = ?, ai_summary = ?, next_action = ?
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))""",
            (score, priority, ai_summary, next_action, email),
        )
        return cursor.rowcount > 0


def find_leads_by_name(name_part):
    init_db()

    with get_connection() as conn:
        c = conn.cursor()
        c.execute(
            """SELECT name, email, phone, service, status
            FROM leads
            WHERE name LIKE ?
            ORDER BY name ASC""",
            (f"%{name_part}%",),
        )
        rows = c.fetchall()

    return [
        Lead(
            name=row[0],
            email=row[1],
            phone=row[2],
            service=row[3],
            state=row[4],
        )
        for row in rows
    ]


if __name__ == "__main__":
    init_db()
    print(f"Database initialized successfully at: {DB_FILE}")
