from typing import Any

import requests

API_BASE_URL = "https://jsonplaceholder.typicode.com"
REQUEST_TIMEOUT = 10


def get_users() -> list[dict[str, Any]]:
    response = requests.get(f"{API_BASE_URL}/users", timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.json()


def create_post(title: str, body: str, user_id: int) -> dict[str, Any]:
    post_data = {"title": title, "body": body, "userId": user_id}
    response = requests.post(
        f"{API_BASE_URL}/posts", json=post_data, timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()
    return response.json()


def update_post(post_id: int, title: str, body: str, user_id: int) -> dict[str, Any]:
    post_data = {"title": title, "body": body, "userId": user_id}
    response = requests.put(
        f"{API_BASE_URL}/posts/{post_id}",
        json=post_data,
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def delete_post(post_id: int) -> bool:
    response = requests.delete(
        f"{API_BASE_URL}/posts/{post_id}", timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()
    return response.status_code in (200, 204)


def main() -> None:
    print("1. GET users")
    print("2. POST a post")
    print("3. PUT a post")
    print("4. DELETE a post")
    choice = input("Choose an API request: ").strip()

    try:
        if choice == "1":
            for user in get_users():
                print(user["name"], "-", user["email"])
        elif choice == "2":
            print(create_post("Learning APIs", "My first POST request", 1))
        elif choice == "3":
            print(update_post(1, "Updated title", "Updated body", 1))
        elif choice == "4":
            print("Deleted:", delete_post(1))
        else:
            print("Invalid choice")
    except requests.RequestException as error:
        print("Request failed:", error)


if __name__ == "__main__":
    main()