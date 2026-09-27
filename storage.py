import json
import shutil
from pathlib import Path
from models import Lead


DATA_FILE = Path(__file__).resolve().parent / "data" / "leads.json"


def load_leads():
    try:
        with open(DATA_FILE, "r", encoding="utf-8-sig") as file:
            content = file.read()
    except FileNotFoundError:
        return []

    if not content.strip():
        return []

    data = json.loads(content)
    if not isinstance(data, list):
        raise ValueError("leads.json must contain a list: [ ... ]")
    leads = []

    for lead_data in data:
        lead = Lead(
            lead_data["name"],
            lead_data["email"],
            lead_data["phone"],
            lead_data["service"],
            lead_data["state"]
        )
        leads.append(lead)

    return leads


def save_leads(leads):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    lead_data = []
    for lead in leads:
        lead_data.append(lead.show_info())

    load_leads()

    temporary_file = DATA_FILE.with_suffix(".tmp")
    with open(temporary_file, "w", encoding="utf-8") as file:
        json.dump(lead_data, file, indent=4, ensure_ascii=False)

    if DATA_FILE.exists():
        shutil.copy2(DATA_FILE, DATA_FILE.with_suffix(".json.bak"))
    temporary_file.replace(DATA_FILE)

if __name__ == "__main__":
    print("Run main.py to add, update, or delete leads.")
    print(f"Data file: {DATA_FILE}")
