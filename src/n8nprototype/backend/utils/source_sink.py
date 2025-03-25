import requests
import json

# Function to source text to n8n
def source_to_n8n(payload, webhook_url, jwt_token=""):
    """
    Sends payload data to n8n via a webhook.

    :param webhook_url: The URL of the n8n webhook
    :return: The response from the n8n webhook
    """
    headers = {"Content-Type": "application/json", "Authorization": "Bearer "+jwt_token}

    try:
        response = requests.post(webhook_url, data=json.dumps(payload), headers=headers)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error sending data to n8n: {e}")
        return None

# Function to sink data from n8n to console
def sink_from_n8n(data):
    """
    Receives data from n8n and prints it to the console.

    :param data: The data received from n8n
    """
    print("Received data from n8n:")
    return json.dumps(data, indent=2)

# Example usage
if __name__ == "__main__":
    # Example webhook URL (replace with your actual n8n webhook URL)
    # webhook_url = "http://localhost:5678/webhook-test/5b58f7ff-2c87-4850-8cce-583ee8009f04"
    webhook_url = "http://localhost:5678/webhook/5b58f7ff-2c87-4850-8cce-583ee8009f04"

    sample_data = [{"role":"user","content":"Loop these messages back."}]
    # Source example
    result = source_to_n8n(sample_data, webhook_url)
    if result:
        print(f"Response from n8n: {result} {type(result)}")
