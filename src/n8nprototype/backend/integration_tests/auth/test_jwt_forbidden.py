#!/usr/bin/env python3
"""
Test script for calling n8n webhook with an invalid JWT token
- Tests the endpoint: https://n8n.agile-athletes.de/webhook-test/a1bc4733-9b4a-4e77-b72d-b28a9a141495
- Expects a 403 Forbidden response due to invalid JWT
"""
import unittest
import requests
import json
import jwt
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set a timeout for the request to prevent hanging
TIMEOUT_SECONDS = 10


class TestJwtForbidden(unittest.TestCase):
    """Test case for calling n8n webhook with JWT tokens"""
    
    def setUp(self):
        """Set up test environment"""
        self.webhook_url = "https://n8n.agile-athletes.de/webhook/a1bc4733-9b4a-4e77-b72d-b28a9a141495"
        
        # Headers to address CORS issues
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": "http://localhost:8000"
        }
        
        # Create an invented JWT token
        self.invented_jwt = self.create_invented_jwt()
    
    def create_invented_jwt(self):
        """Create an invented JWT token for testing"""
        # Current time and expiration time (24 hours from now)
        now = datetime.datetime.utcnow()
        expiration = now + datetime.timedelta(hours=480)

        # Create payload with standard claims and some custom ones
        payload = {
            "iat": now.timestamp(),                # Issued at
            "exp": expiration.timestamp(),         # Expiration time
            "user_id": "user@example.com"          # Custom claim: user ID
        }
        
        # Get the secret key from environment variables or use a fallback for testing
        secret = os.environ.get('JWT_SECRET', 'fallback_secret_key')
        
        # Create the token
        token = jwt.encode(payload, secret, algorithm="HS256")
        # this will raise if invalid
        decoded = jwt.decode(token, secret, algorithms=["HS256"], options={"require": ["exp", "iat"]})
        print("Decoded OK:", decoded)

        print(f"Created invented JWT token: {token}")
        return token
    
    def test_webhook_with_invalid_jwt(self):
        """Test calling the n8n webhook with an invalid JWT token, expecting a 403 response"""
        # Add the invented JWT token to the headers
        auth_headers = self.headers.copy()
        auth_headers["Authorization"] = f"Bearer {self.invented_jwt}"

        try:
            # Make GET request to the webhook with the invalid JWT
            print(f"Sending GET request to: {self.webhook_url}")
            print(f"Headers: {json.dumps(auth_headers, indent=2)}")
            
            response = requests.get(
                self.webhook_url,
                headers=auth_headers,
                timeout=TIMEOUT_SECONDS
            )
            
            # Print response details for debugging
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response body: {response.text}")
            
            # Check if we got the expected 403 Forbidden response
            self.assertEqual(response.status_code, 401,
                           f"Expected status code 403, got {response.status_code}. Response: {response.text}")
            
            print("Test successful: Received expected 403 Forbidden response")
            
        except requests.exceptions.Timeout:
            self.fail(f"Request timeout after {TIMEOUT_SECONDS} seconds!")
        except requests.exceptions.ConnectionError as e:
            self.fail(f"Connection error: {e}")
        except Exception as e:
            self.fail(f"Unexpected error: {type(e).__name__}: {e}")
            
    def test_webhook_with_valid_jwt(self):
        """Test calling the n8n webhook with a valid JWT token, expecting a 200 response"""
        # Create a valid JWT token with the correct user_id
        now = datetime.datetime.utcnow()
        expiration = now + datetime.timedelta(hours=24)

        # Create payload with standard claims and the correct user_id
        payload = {
            "iat": now.timestamp(),                # Issued at
            "exp": expiration.timestamp(),         # Expiration time
            "user_id": "dinesh@agile-athletes.de"  # Custom claim: user ID for happy flow
        }
        
        # Get the secret key from environment variables or use a fallback for testing
        secret = os.environ.get('JWT_SECRET', 'fallback_secret_key')
        
        # Create the token
        valid_token = jwt.encode(payload, secret, algorithm="HS256")
        print(f"Created valid JWT token: {valid_token}")
        
        # Add the valid JWT token to the headers
        auth_headers = self.headers.copy()
        auth_headers["Authorization"] = f"Bearer {valid_token}"

        try:
            # Make GET request to the webhook with the valid JWT
            print(f"Sending GET request to: {self.webhook_url}")
            print(f"Headers: {json.dumps(auth_headers, indent=2)}")
            
            response = requests.get(
                self.webhook_url,
                headers=auth_headers,
                timeout=TIMEOUT_SECONDS
            )
            
            # Print response details for debugging
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response body: {response.text}")
            
            # Check if we got the expected 200 OK response
            self.assertEqual(response.status_code, 200,
                           f"Expected status code 200, got {response.status_code}. Response: {response.text}")
            
            # Optionally verify the response content
            try:
                response_data = response.json()
                print(f"Response data: {json.dumps(response_data, indent=2)}")
                # Add assertions for the response data if needed
            except json.JSONDecodeError:
                print("Response is not JSON format")
            
            print("Test successful: Received expected 200 OK response")
            
        except requests.exceptions.Timeout:
            self.fail(f"Request timeout after {TIMEOUT_SECONDS} seconds!")
        except requests.exceptions.ConnectionError as e:
            self.fail(f"Connection error: {e}")
        except Exception as e:
            self.fail(f"Unexpected error: {type(e).__name__}: {e}")

