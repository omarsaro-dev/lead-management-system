def is_valid_email(email):
    return isinstance(email, str) and "@" in email and "." in email


def is_valid_phone(phone):
    return isinstance(phone, str) and phone.isdigit() and len(phone) == 11


def is_valid_service(service):
    valid_services = {
        "ai automation",
        "ai chatbot",
        "web development"
    }

    return service.strip().lower() in valid_services