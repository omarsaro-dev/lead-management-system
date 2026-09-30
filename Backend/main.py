import sqlite3

from lead_manegment.Backend.models import Lead
from lead_manegment.Backend.storage import (
    DB_FILE,
    count_leads,
    count_leads_by_service,
    delete_lead_by_email,
    find_lead_by_email,
    find_leads_by_name,
    find_leads_by_service,
    load_leads,
    load_leads_with_services,
    save_lead,
    update_lead_by_email,
)
from lead_manegment.Backend.validators import is_valid_email, is_valid_phone, is_valid_service


def add_lead():
    name = input("Name: ").strip()
    email = input("Email: ").strip()
    phone = input("Phone: ").strip()
    service = input("Service: ").strip()
    state = input("State: ").strip()

    if not name:
        print("Name cannot be empty")
        return

    if not is_valid_email(email):
        print("Invalid email")

        return

    if not is_valid_phone(phone):
        print("Invalid phone: enter exactly 11 digits, for example 01012345678.")
        return

    if not is_valid_service(service):
        print("Invalid service: choose AI Automation, AI Chatbot, or Web Development.")
        return

    existing_lead = find_lead_by_email(email)

    if existing_lead is not None:
        print("Lead already exists")
        return

    lead = Lead(name, email, phone, service, state)
    try:
        save_lead(lead)
    except sqlite3.IntegrityError:
        print("Lead already exists")
        return

    print("Lead added successfully.")


def find_lead_menu():
    email = input("Please Enter Email: ").strip()
    lead = find_lead_by_email(email)

    if lead is None:
        print("Lead not found")
    else:
        print("Lead found")
        print(lead.show_info())


def update_lead():
    email = input("Please Enter Email: ").strip()
    lead = find_lead_by_email(email)

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

    if not update_lead_by_email(email, new_phone, new_state, new_service):
        print("Lead not found")
        return

    print("Lead updated successfully.")


def show_all_leads():
    leads = load_leads()
    if not leads:
        print("No leads found")
        return

    for lead in leads:
        print(lead.show_info())


def delete_lead():
    email = input("Please Enter Email: ").strip()
    if not delete_lead_by_email(email):
        print("Lead not found")
        return

    print("Lead deleted successfully.")


def find_leads():
    service = input("Enter Your Service: ").strip()
    matches = find_leads_by_service(service)

    if not matches:
        print("Lead not found")
        return

    for lead in matches:
        print(lead.show_info())


def find_leads_by_name_menu():
    name_part = input("Enter part of the name: ").strip()
    if not name_part:
        print("Enter a name to search")
        return

    matches = find_leads_by_name(name_part)
    if not matches:
        print("No leads found")
        return

    for lead in matches:
        print(lead.show_info())


def show_lead_count():
    print(f"Total leads: {count_leads()}")


def show_lead_counts_by_service():
    counts = count_leads_by_service()
    if not counts:
        print("No leads found")
        return

    for service, count in counts:
        print(f"{service}: {count}")


def show_leads_with_services():
    rows = load_leads_with_services()
    if not rows:
        print("No leads found")
        return

    for name, email, service in rows:
        print(f"{name} | {email} | {service}")


def main():
    print(f"Database file: {DB_FILE}")
    while True:
        print("\n===== Lead Management System =====")
        print("1.Add Lead")
        print("2.Find Lead")
        print("3.Update Lead")
        print("4.Show All Leads")
        print("5.Delete Lead")
        print("6.Find Leads by Service")
        print("7.Find Leads by Name")
        print("8.Count Leads")
        print("9.Count Leads by Service")
        print("10.Show Leads with JOIN")
        print("11.Exit")

        choice = input("Choose: ").strip()

        try:
            if choice == "1":
                add_lead()

            elif choice == "2":
                find_lead_menu()

            elif choice == "3":
                update_lead()

            elif choice == "4":
                show_all_leads()

            elif choice == "5":
                delete_lead()

            elif choice == "6":
                find_leads()

            elif choice == "7":
                find_leads_by_name_menu()

            elif choice == "8":
                show_lead_count()

            elif choice == "9":
                show_lead_counts_by_service()

            elif choice == "10":
                show_leads_with_services()

            elif choice == "11":
                break

            else:
                print("Invalid choice")
        except sqlite3.Error as error:
            print(f"Database error: {error}")

if __name__ == "__main__":
    main()
