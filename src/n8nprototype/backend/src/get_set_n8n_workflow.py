import copy
import json

import requests

def get_workflow_by_id(workflow_id, api_key):
    """
    Retrieves a specific workflow by ID from the n8n API.

    :param workflow_id: The ID of the workflow.
    :param api_key: The n8n API key for authentication.
    :return: JSON response if successful, otherwise None.
    """
    url = f"http://localhost:5678/api/v1/workflows/{workflow_id}"
    headers = {
        "accept": "application/json",
        "X-N8N-API-KEY": api_key
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors.
        return response.json()
    except requests.RequestException as e:
        print(f"Error retrieving workflow: {e}")
        return None


def strip_elements_for_put(workflow_json):
    """
    Cleans the workflow JSON by stripping out elements that should not be sent when updating a workflow via PUT.

    This function performs the following cleanups:
      - Removes top-level keys: "id", "versionId", and "meta" which are managed by n8n.
      - For nodes of type "n8n-nodes-base.webhook", removes the "webhookId" key.

    :param workflow_json: A dictionary representing the workflow JSON.
    :return: A new dictionary with the elements removed.
    """
    # Create a deep copy to avoid modifying the original input.
    cleaned = copy.deepcopy(workflow_json)

    # Remove top-level keys not allowed in a PUT update.
    for key in ["id", "versionId", "meta", "pinData", "active", "tags"]:
        cleaned.pop(key, None)

    # Clean nodes: remove "webhookId" for webhook nodes.
    nodes = cleaned.get("nodes", [])
    for node in nodes:
        node.pop("id", None)
        if node.get("type") == "n8n-nodes-base.webhook":
            node.pop("webhookId", None)

    return cleaned

def update_workflow_by_id(workflow_id, workflow_json, api_key):
    """
    Updates a workflow in n8n using a PUT request.

    :param workflow_id: The workflow ID to update.
    :param workflow_json: The JSON payload (already cleaned for PUT).
    :param api_key: The API key for authentication.
    :return: The JSON response from the API if successful, otherwise None.
    """
    url = f"http://localhost:5678/api/v1/workflows/{workflow_id}"
    headers = {
        "accept": "application/json",
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    try:
        response = requests.put(url, headers=headers, data=json.dumps(workflow_json))
        response.raise_for_status()  # Raise exception for HTTP errors.
        return response.json()
    except requests.RequestException as e:
        print(f"Error updating workflow: {e}")
        return None

"""
curl -X 'POST' \
  'http://localhost:5678/api/v1/workflows/8pwD1Tqlsbh5itS4/activate' \
  -H 'accept: application/json' \
  -H 'X-N8N-API-KEY: n8n_api_b3dd7bd2d6276d86b2a6990f310a91d3f46cd5d289bfc834dfacdcf0f85d695a4011a14cf7c49069' \
  -d ''
"""
def activate_workflow(workflow_id, api_key):
    url = f"http://localhost:5678/api/v1/workflows/{workflow_id}/activate"
    headers = {
        "accept": "application/json",
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, data="")
        response.raise_for_status()  # Raise exception for HTTP errors.
        return response.json()
    except requests.RequestException as e:
        print(f"Error activating workflow: {e}")
        return None


def create_workflow(workflow_json, api_key):
    url = "http://localhost:5678/api/v1/workflows"
    headers = {
        "accept": "application/json",
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(workflow_json))
        response.raise_for_status()  # Raise exception for HTTP errors.
        return response.json()
    except requests.RequestException as e:
        print(f"Error creating workflow: {e}")
        return None


def delete_workflow(workflow_id, api_key):
    url = f"http://localhost:5678/api/v1/workflows/{workflow_id}"
    headers = {
        "accept": "application/json",
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    try:
        response = requests.delete(url, headers=headers)
        response.raise_for_status()  # Raise exception for HTTP errors.
        return response.json()
    except requests.RequestException as e:
        print(f"Error deleting workflow: {e}")
        return None


def query_prompt_on_n8n(messages, webhook_url):
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(webhook_url, data=json.dumps(messages), headers=headers)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error sending data to n8n: {e}")
        return None
