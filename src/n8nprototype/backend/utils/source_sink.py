import requests
import json

# Function to source text to n8n
def source_to_n8n(payload, webhook_url, jwt_token="", headers=None):
    """
    Sends payload data to n8n via a webhook.

    :param payload: The data to send to n8n
    :param webhook_url: The URL of the n8n webhook
    :param jwt_token: Optional JWT token for authentication
    :param headers: Optional additional headers to include in the request
    :return: The response from the n8n webhook
    """
    # Set up default headers
    request_headers = {"Content-Type": "application/json"}
    
    # Add JWT token if provided
    if jwt_token:
        request_headers["Authorization"] = f"Bearer {jwt_token}"
    
    # Add any additional headers
    if headers and isinstance(headers, dict):
        request_headers.update(headers)

    try:
        print(f"Sending request to: {webhook_url}")
        print(f"Headers: {request_headers}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Make the request with increased timeout and full response capture
        response = requests.post(webhook_url, json=payload, headers=request_headers, timeout=30)
        
        # Print response details for debugging
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {response.headers}")
        
        # For non-200 responses, print the response text
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            
            # Check for CORS issues in the response
            if 'Access-Control-Allow-Origin' not in response.headers:
                print("Warning: CORS headers missing in response")
            
            # Still return the response for further processing
            return {"error": True, "status_code": response.status_code, "message": response.text}
        
        # For successful responses, return the JSON
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error sending data to n8n: {e}")
        return {"error": True, "message": str(e)}

# Function to sink data from n8n to console
def sink_from_n8n(data):
    """
    Processes data received from n8n.

    :param data: The data received from n8n
    :return: The processed data
    """
    # Check if data is an error response
    if isinstance(data, dict) and data.get("error", False):
        print(f"Error in response: {data.get('message', 'Unknown error')}")
        return data
    
    # Check if data is a string (possibly JSON)
    if isinstance(data, str):
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            pass
    
    # If data contains a 'text' field with JSON content (common in n8n responses)
    if isinstance(data, dict) and 'text' in data:
        text = data['text']
        # Check if the text is JSON wrapped in markdown code blocks
        if text.startswith('```json') and text.endswith('```'):
            json_str = text.replace('```json', '', 1).replace('```', '', 1).strip()
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
    
    # Return the data as is if no processing is needed
    return data

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
