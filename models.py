class Lead:
    def __init__(self, name, email, phone, service, state):
        self.name = name
        self.email = email
        self.phone = phone
        self.service = service
        self.state = state

    def show_info(self):
        return {
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "service": self.service,
            "state": self.state
        }

    def update_phone(self, new_phone):
        self.phone = new_phone

    def change_state(self, new_state):
        self.state = new_state

    def change_service(self, new_service):
        self.service = new_service

    def classify_service(self):
        services = {
            "ai automation": "AI Automation",
            "web development": "Web Development",
            "ai chatbot": "AI Chatbot"
        }
        return services.get(self.service.lower(), "Other Service")

    def is_valid_email(self):
        if "@" not in self.email or "." not in self.email:
            return "Invalid Email"
        return "Valid Email"