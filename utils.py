def find_lead(leads, email):
    for lead in leads:
        if lead.email.strip().lower() == email.strip().lower():
            return lead
    return None


def find_all_by_service(leads, service):
    matches = []

    for lead in leads:
        if lead.service.strip().lower() == service.strip().lower():
            matches.append(lead)

    return matches