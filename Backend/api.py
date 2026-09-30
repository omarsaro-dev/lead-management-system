import sqlite3

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

import ngrok
import uvicorn

from lead_manegment.Backend.models import Lead
from lead_manegment.Backend.storage import (
    delete_lead_by_email,
    find_lead_by_email,
    load_leads,
    save_lead,
    update_lead_by_email,
    update_lead_qualification,
)
from lead_manegment.Backend.validators import is_valid_email, is_valid_phone, is_valid_service

app = FastAPI(title="Lead Management API", version="1.0.0")

app = FastAPI()

if __name__ == "__main__":
    listener = ngrok.forward(8000, authtoken="3JznaRfqnVbB43R68KiRZC4fbov_3usn2bftuLEmFRzQJNZie")
    print(f"Public URL: {listener.url()}")

    uvicorn.run("api:app", host="127.0.0.1", port=8000)

class LeadFields(BaseModel):
    name: str
    phone: str
    service: str
    state: str

    @field_validator("name", "state")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if value := value.strip():
            return value
        raise ValueError("This field cannot be empty")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        value = value.strip()
        if not is_valid_phone(value):
            raise ValueError("Phone must contain exactly 11 digits")
        return value

    @field_validator("service")
    @classmethod
    def validate_service(cls, value: str) -> str:
        value = value.strip()
        if not is_valid_service(value):
            raise ValueError("Unsupported service")
        return value


class LeadCreate(LeadFields):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip()
        if not is_valid_email(value):
            raise ValueError("Invalid email")
        return value


class LeadUpdate(LeadFields):
    pass


class LeadQualification(BaseModel):
    score: int
    priority: str
    ai_summary: str
    next_action: str


@app.exception_handler(sqlite3.Error)
async def handle_database_error(
    _request: Request, _error: sqlite3.Error
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database is temporarily unavailable"},
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/leads")
def get_leads() -> list[dict[str, str]]:
    return [lead.show_info() for lead in load_leads()]


@app.get("/leads/{email}")
def get_lead(email: str) -> dict[str, str]:
    lead = find_lead_by_email(email)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead.show_info()


@app.post("/leads", status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate) -> dict[str, str]:
    lead = Lead(
        payload.name,
        payload.email,
        payload.phone,
        payload.service,
        payload.state,
    )
    try:
        save_lead(lead)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already exists") from None
    return lead.show_info()


@app.put("/leads/{email}")
def replace_lead(email: str, payload: LeadUpdate) -> dict[str, str]:
    if find_lead_by_email(email) is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    updated = update_lead_by_email(
        email,
        payload.phone,
        payload.state,
        payload.service,
        name=payload.name,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = find_lead_by_email(email)
    return lead.show_info()


@app.patch("/leads/{email}/qualification")
def qualify_lead(email: str, payload: LeadQualification) -> LeadQualification:
    if not update_lead_qualification(email, **payload.model_dump()):
        raise HTTPException(status_code=404, detail="Lead not found")
    return payload


@app.delete("/leads/{email}", status_code=status.HTTP_204_NO_CONTENT)
def remove_lead(email: str) -> Response:
    if not delete_lead_by_email(email):
        raise HTTPException(status_code=404, detail="Lead not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
