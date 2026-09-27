from models import Lead
from storage import DATA_FILE, load_leads, save_leads
from validators import is_valid_email, is_valid_phone, is_valid_service
from utils import find_lead, find_all_by_service




def add_lead(leads):
    name = input("Name: ").strip()
    email = input("Email: ").strip()
    phone = input("Phone: ").strip()
    service = input("Service: ").strip()
    state = input("State: ").strip()

    if not is_valid_email(email):
        print("Invalid email")
        return

    if not is_valid_phone(phone):
        print("Invalid phone: enter exactly 11 digits, for example 01012345678.")
        return

    if not is_valid_service(service):
        print("Invalid service: choose AI Automation, AI Chatbot, or Web Development.")
        return

    existing_lead = find_lead(leads, email)

    if existing_lead is not None:
        print("Lead already exists")
        return

    lead = Lead(name, email, phone, service, state)
    leads.append(lead)
    save_leads(leads)

    print("Lead added successfully.")


def find_lead_menu(leads):
    email = input("Please Enter Email: ").strip()
    lead = find_lead(leads, email)

    if lead is None:
        print("Lead not found")
    else:
        print("Lead found")
        print(lead.show_info())


def update_lead(leads):
    email = input("Please Enter Email: ").strip()
    lead = find_lead(leads, email)

    if lead is None:
        print("Lead not found")
        return

    new_phone = input("Enter Phone Num: ").strip()
    new_state = input("Enter New State: ").strip()
    new_service = input("Enter New Service: ").strip()

    if not is_valid_phone(new_phone):
        print("Invalid phone: enter exactly 11 digits, for example 01012345678.")
        return

    if not is_valid_service(new_service):
        print("Invalid service: choose AI Automation, AI Chatbot, or Web Development.")
        return

    lead.update_phone(new_phone)
    lead.change_state(new_state)
    lead.change_service(new_service)

    save_leads(leads)

    print("Lead updated successfully.")


def show_all_leads(leads):
    if not leads:
        print("No leads found")
        return

    for lead in leads:
        print(lead.show_info())


def delete_lead(leads):
    email = input("Please Enter Email: ").strip()
    lead = find_lead(leads, email)

    if lead is None:
        print("Lead not found")
        return

    leads.remove(lead)
    save_leads(leads)

    print("Lead deleted successfully.")


def find_leads(leads):
    service = input("Enter Your Service: ").strip()
    matches = find_all_by_service(leads, service)

    if not matches:
        print("Lead not found")
        return

    for lead in matches:
        print(lead.show_info())


def main():
    leads = load_leads()
    print(f"Data file: {DATA_FILE}")
    while True:
        print("\n===== Lead Management System =====")
        print("1. Add Lead")
        print("2. Find Lead")
        print("3. Update Lead")
        print("4. Show All Leads")
        print("5. Delete Lead")
        print("6. Find Leads by Service")
        print("7. Exit")

        choice = input("Choose: ").strip()

        leads = load_leads()

        if choice == "1":
            add_lead(leads)

        elif choice == "2":
            find_lead_menu(leads)

        elif choice == "3":
            update_lead(leads)

        elif choice == "4":
            show_all_leads(leads)

        elif choice == "5":
            delete_lead(leads)

        elif choice == "6":
            find_leads(leads)

        elif choice == "7":
            break

        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()
