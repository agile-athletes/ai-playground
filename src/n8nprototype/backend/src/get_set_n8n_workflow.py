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
      - Ensures only allowed properties are included in the request body.
      - Removes top-level keys: "id", "versionId", "meta", etc. which are managed by n8n.
      - For nodes, removes "id" and for webhook nodes, removes "webhookId".

    :param workflow_json: A dictionary representing the workflow JSON.
    :return: A new dictionary with the elements removed.
    """
    # Create a deep copy to avoid modifying the original input.
    cleaned = copy.deepcopy(workflow_json)

    # Only include the essential properties for the workflow update
    # Based on the n8n API documentation and error messages
    allowed_keys = ["name", "nodes", "connections", "settings", "staticData"]
    filtered_workflow = {k: cleaned[k] for k in allowed_keys if k in cleaned}
    
    # Clean nodes: remove properties that are managed by n8n
    if "nodes" in filtered_workflow:
        for node in filtered_workflow["nodes"]:
            # Remove node ID as it's managed by n8n
            if "id" in node:
                node.pop("id", None)
            
            # Remove webhookId for webhook nodes
            if node.get("type") == "n8n-nodes-base.webhook" and "webhookId" in node:
                node.pop("webhookId", None)
    
    return filtered_workflow


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
        # Print the JSON payload for debugging
        print(f"Sending workflow update request to: {url}")
        json_data = json.dumps(workflow_json)
        
        response = requests.put(url, headers=headers, data=json_data)
        
        # Print detailed response information for debugging
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {response.headers}")
        
        # Try to parse the response body as JSON for more detailed error information
        try:
            response_body = response.json()
            print(f"Response body: {json.dumps(response_body, indent=2)}")
        except ValueError:
            print(f"Response body (text): {response.text}")
        
        response.raise_for_status()  # Raise exception for HTTP errors.
        return response.json()
    except requests.RequestException as e:
        print(f"Error updating workflow: {e}")
        return None


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
    """
    Sends a query to an n8n workflow via its webhook URL.
    
    :param messages: The messages to send to the workflow.
    :param webhook_url: The webhook URL to send the request to.
    :return: The JSON response from the workflow if successful, otherwise None.
    """
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # Format the payload according to what the webhook expects
    # The webhook expects a body field containing the messages
    payload = {"body": messages}
    
    try:
        print(f"Sending request to webhook URL: {webhook_url}")
        print(f"Request payload: {json.dumps(payload)}")
        
        response = requests.post(webhook_url, data=json.dumps(payload), headers=headers)
        
        # Print detailed response information for debugging
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {response.headers}")
        
        # Try to parse the response body as JSON for more detailed error information
        try:
            response_body = response.json()
            print(f"Response body: {json.dumps(response_body, indent=2)}")
        except ValueError:
            print(f"Response body (text): {response.text}")
        
        response.raise_for_status()  # Raises an HTTPError for bad responses
        return response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"Error sending data to n8n: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Error response status code: {e.response.status_code}")
            print(f"Error response headers: {e.response.headers}")
            try:
                print(f"Error response body: {e.response.json()}")
            except ValueError:
                print(f"Error response body (text): {e.response.text}")
        return None

"""
curl -X 'POST' \
  'http://localhost:5678/api/v1/workflows/8pwD1Tqlsbh5itS4/activate' \
  -H 'accept: application/json' \
  -H 'X-N8N-API-KEY: n8n_api_b3dd7bd2d6276d86b2a6990f310a91d3f46cd5d289bfc834dfacdcf0f85d695a4011a14cf7c49069' \
  -d ''
"""
