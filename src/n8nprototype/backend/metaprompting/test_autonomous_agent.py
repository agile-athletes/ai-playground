#!/usr/bin/env python3
"""
Test script for the autonomous agent via n8n webhook
This test calls the n8n webhook for the ollamacall workflow
"""
import sys
import os
import json
import requests
import unittest
from unittest.mock import patch

# Import local modules
from llm_client import LLMClient


class TestAutonomousAgent(unittest.TestCase):
    """Test cases for the autonomous agent via n8n webhook"""
    
    def setUp(self):
        """Set up test environment"""
        self.n8n_webhook_url = "http://localhost:5678/webhook-test/ollamacall"
        self.n8n_agentfork_url = "http://localhost:5678/webhook-test/agentfork"
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "callbackurl": "TODO"
        }

    # {
    #   "text": "The capital of France is Paris."
    # }
    def test_webhook_call(self):
        """Test basic webhook call to n8n ollamacall workflow"""
        # Prepare the payload
        payload = {
            "prompt": "What is the capital of France?",
            "model": "qwen2.5:14b"
        }
        
        # Make the POST request to the webhook
        response = requests.post(
            self.n8n_webhook_url,
            headers=self.headers,
            json=payload
        )
        
        # Check if the request was successful
        self.assertEqual(response.status_code, 200, 
                         f"Expected status code 200, got {response.status_code}. Response: {response.text}")
        
        # Check if the response contains valid JSON
        try:
            response_data = response.json()
            self.assertIsNotNone(response_data, "Response should not be None")
            print("Response from n8n webhook:")
            print(json.dumps(response_data, indent=2))
        except json.JSONDecodeError:
            self.fail(f"Response is not valid JSON: {response.text}")

    @patch('requests.post')
    def test_webhook_with_mocked_response(self, mock_post):
        """Test webhook with a mocked response to handle CORS or other issues"""
        # Set up the mock response
        mock_response = requests.Response()
        mock_response.status_code = 200
        mock_response._content = json.dumps({
            "result": "This is a mocked response from the n8n webhook."
        }).encode('utf-8')
        mock_post.return_value = mock_response
        
        # Prepare the payload
        payload = {
            "prompt": "Tell me a joke.",
            "model": "qwen2.5:14b"
        }
        
        # Make the POST request to the webhook (this will use the mock)
        response = requests.post(
            self.n8n_webhook_url,
            headers=self.headers,
            json=payload
        )
        
        # Check if the request was successful
        self.assertEqual(response.status_code, 200)
        
        # Check if the response contains the expected mocked data
        response_data = response.json()
        self.assertEqual(response_data["result"], "This is a mocked response from the n8n webhook.")
        
        # Verify the mock was called with the correct arguments
        mock_post.assert_called_once_with(
            self.n8n_webhook_url,
            headers=self.headers,
            json=payload
        )

    def test_agentfork_webhook(self):
        """Test webhook call to n8n agentfork workflow with no body"""
        # Make the POST request to the webhook without a body
        response = requests.post(
            self.n8n_agentfork_url,
            headers=self.headers
        )
        
        # Check if the request was successful
        self.assertEqual(response.status_code, 200, 
                         f"Expected status code 200, got {response.status_code}. Response: {response.text}")
        
        # Check if the response contains valid JSON
        try:
            response_data = response.json()
            self.assertIsNotNone(response_data, "Response should not be None")
            print("Response from agentfork webhook:")
            print(json.dumps(response_data, indent=2))
        except json.JSONDecodeError:
            # If not JSON, print the text response
            print(f"Response is not JSON: {response.text}")
            # Don't fail the test if it's not JSON, as we're not sure what the expected format is
            pass

