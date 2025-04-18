#!/usr/bin/env python3
"""
Test script for the ollamacall webhook to compare with agentfork
"""
import sys
import os
import json
import requests
import time

# Set a timeout for the request to prevent hanging
TIMEOUT_SECONDS = 10

def test_ollamacall_webhook():
    """Test webhook call to n8n ollamacall workflow for comparison"""
    n8n_ollamacall_url = "http://localhost:5678/webhook-test/ollamacall"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "callbackurl": "http://localhost:8000/callback",
        "Origin": "http://localhost:8000"
    }
    
    # Add a minimal payload
    payload = {
        "prompt": "What is the capital of France?",
        "model": "qwen2.5:14b"
    }
    
    print(f"Making request to: {n8n_ollamacall_url}")
    print(f"With headers: {json.dumps(headers, indent=2)}")
    print(f"With payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Make the POST request to the webhook with a timeout
        start_time = time.time()
        print(f"Starting request at: {start_time}")
        
        response = requests.post(
            n8n_ollamacall_url,
            headers=headers,
            json=payload,
            timeout=TIMEOUT_SECONDS
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
    test_ollamacall_webhook()
