# Lead Management System

A beginner-friendly Python command-line application for managing leads.

## Run

Requires Python 3.10 or newer. No third-party packages are required.

```sh
cd lead_manegment
python main.py
```

If your terminal is already inside `lead_manegment`, just run `python main.py`.

Use the menu to add, find, update, list, or delete leads, or search by service.
Phone numbers must contain 11 digits. Supported services are AI Automation,
AI Chatbot, and Web Development.

## Tests

Install the project dependencies:

```sh
python -m pip install -r requirements.txt
```

Run the CRM and API tests from this directory:

```sh
python -m unittest discover -s . -p "test_*.py"
```

Run the interactive API lesson with `python api_client.py`. It demonstrates
GET, POST, PUT, and DELETE against JSONPlaceholder. The API simulates writes;
POST, PUT, and DELETE changes are not saved permanently.

Run the local Lead Management API from this directory:

```sh
python -m uvicorn api:app --reload
```

Open `http://127.0.0.1:8000/docs` to try its endpoints. The API uses the same
SQLite database as the command-line application.

## Data

Data is saved automatically in `data/leads.db` inside `lead_manegment`.
This SQLite database is created when the application starts. Existing JSON
files are not imported automatically. Automatic backups are not created.

## Files

- `main.py`: menu and actions
- `api.py`: FastAPI routes for lead CRUD
- `storage.py`: SQLite loading and saving
- `requirements.txt`: Python dependencies
- `api_client.py`: HTTP API examples
- `models.py`: Lead class
- `validators.py`: input validation
