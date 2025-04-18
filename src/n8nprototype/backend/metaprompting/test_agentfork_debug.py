#!/usr/bin/env python3
"""
Debug script for the agentfork webhook issue
"""
import sys
import os
import json
import requests
import time

# Set a timeout for the request to prevent hanging
TIMEOUT_SECONDS = 10

def test_agentfork_webhook_debug():
    """Test webhook call to n8n agentfork workflow with debugging"""
    n8n_agentfork_url = "http://localhost:5678/webhook-test/agentfork"
    
    # Add more detailed headers for debugging CORS issues
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "callbackurl": "http://localhost:8000/callback",  # Add a proper callback URL
        "Origin": "http://localhost:8000",  # Add origin for CORS debugging
        "User-Agent": "Python-Requests-Debug/1.0"
    }
    
    print(f"Making request to: {n8n_agentfork_url}")
    print(f"With headers: {json.dumps(headers, indent=2)}")
    
    try:
        # Make the POST request to the webhook with a timeout
        start_time = time.time()
        print(f"Starting request at: {start_time}")
        
        response = requests.post(
            n8n_agentfork_url,
            headers=headers,
            timeout=TIMEOUT_SECONDS  # Add timeout to prevent hanging
        )
        
        end_time = time.time()
        print(f"Request completed in {end_time - start_time:.2f} seconds")
        
        # Print detailed response information
        print(f"Status code: {response.status_code}")
        print(f"Response headers: {json.dumps(dict(response.headers), indent=2)}")
        
        # Check if the response contains valid JSON
        try:
            response_data = response.json()
            print("Response data (JSON):")
            print(json.dumps(response_data, indent=2))
        except json.JSONDecodeError:
            print(f"Response is not JSON: {response.text}")
            
    except requests.exceptions.Timeout:
        print(f"Request timed out after {TIMEOUT_SECONDS} seconds!")
        print("This suggests the n8n server is not responding within the expected timeframe.")
    except requests.exceptions.ConnectionError as e:
        print(f"Connection error: {e}")
        print("This suggests the n8n server might not be running or is not accessible.")
    except Exception as e:
        print(f"Unexpected error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_agentfork_webhook_debug()
