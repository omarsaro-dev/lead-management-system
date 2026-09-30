def is_valid_email(email):
    if not isinstance(email, str) or email.count("@") != 1:
        return False

    if any(character.isspace() for character in email):
        return False

    name, domain = email.split("@")
    return bool(name) and "." in domain and all(domain.split("."))


def is_valid_phone(phone):
    return isinstance(phone, str) and phone.isdigit() and len(phone) == 11


def is_valid_service(service):
    valid_services = {
        "ai automation",
        "ai chatbot",
        "web development"
    }

    return service.strip().lower() in valid_services
