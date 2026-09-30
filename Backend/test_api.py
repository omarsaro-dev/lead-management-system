import requests

url = "http://127.0.0.1:8000/leads"

data = {
    "name": "Ahmed",
    "email": "ahmed@test.com",
    "phone": "01012345678",
    "service": "Web Development",
    "state": "new"
}

response = requests.post(url, json=data)

print(response.status_code)
print(response.json())