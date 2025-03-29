from src.n8nprototype.backend.utils import source_sink
from unittest import TestCase
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to Python path
sys.path.append('c:\\Users\\Thnk User\\WindsurfProjects\\ai-playground')

# Load environment variables
load_dotenv()

from src.n8nprototype.backend.src.file_io import read_file
from src.n8nprototype.backend.src.extract_from_and_set_workflow import set_prompt_from_basic
from src.n8nprototype.backend.src.get_set_n8n_workflow import update_workflow_by_id, activate_workflow

# Get API key from environment variables
LOCALHOST_N8N_API_KEY = os.getenv('LOCALHOST_N8N_API_KEY')
if not LOCALHOST_N8N_API_KEY:
    print("WARNING: LOCALHOST_N8N_API_KEY not found in environment variables")

# Workflow ID and paths
WORKFLOW_ID = "JqhrnYIwvwOtTtMv"  # Select workflow ID
MARKDOWN_PATH = "../../workflows/SelectWorkflowExperiment/select-workflow-prompt.md"

class PromptTest(TestCase):

    def setUp(self):
        self.sample_response = {}
        self.expected_dict = {
            "attentions": [
                {
                    "id": 1,
                    "parent_id": None,
                    "name": "You are all set",
                    "value": "Please enter your issue.",
                    "weight": 0.8
                }
            ],
            "workflows": [
                {
                    "id": 1,
                    "parent_id": None,
                    "name": "SELECT-Workflow",
                    "value": {
                        "type": "workflow",
                        "label": "Select",
                        "url": "fc3a4402-8ec8-4aec-a252-b9b8d0a07868",
                        "selected": False
                    },
                    "weight": 0.8
                }
            ],
            "reasoning": [
                {
                    "id": 1,
                    "parent_id": None,
                    "name": "Considerations",
                    "value": {
                        "type": "next-navigation",
                        "consideration": "The provided question does not show clear formulation of the issue, it seems to be a part of an action rather than describing the full context.",
                        "suggested": "Please provide more details about your business or the problem you are facing."
                    },
                    "weight": 0.6
                }
            ]
        }

    def test_update_select_workflow_prompt(self):
        # Update the workflow with new prompt from markdown file
        markdown_content = read_file(MARKDOWN_PATH)  # Read the markdown prompt file
        
        # Get current workflow from n8n
        response = os.popen(f'curl -s -X GET "http://localhost:5678/api/v1/workflows/{WORKFLOW_ID}" -H "accept: application/json" -H "X-N8N-API-KEY: {LOCALHOST_N8N_API_KEY}"').read()
        workflow = json.loads(response)
        
        # Prepare workflow for update (keep only necessary properties)
        allowed_keys = ["name", "nodes", "connections", "settings", "staticData"]
        workflow_for_update = {k: workflow[k] for k in allowed_keys if k in workflow}
        
        # Clean nodes to avoid n8n API errors
        if "nodes" in workflow_for_update:
            for node in workflow_for_update["nodes"]:
                if "id" in node:
                    node.pop("id", None)
                if node.get("type") == "n8n-nodes-base.webhook" and "webhookId" in node:
                    node.pop("webhookId", None)
        
        # Update the prompt in the workflow
        updated = set_prompt_from_basic(workflow_for_update, markdown_content)
        self.assertTrue(updated, "Failed to update workflow with new prompt")
        
        # Update the workflow in n8n
        updated_workflow = update_workflow_by_id(WORKFLOW_ID, workflow_for_update, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(updated_workflow, "Failed to update workflow")
        
        # Activate the workflow
        activation_result = activate_workflow(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(activation_result, "Failed to activate workflow")
        
        # print(f"Workflow {WORKFLOW_ID} updated with new prompt from {MARKDOWN_PATH}")

    def test_first_post_to_select_workflow_it(self):
        # Get a token from authenticate workflow
        authenticate_url = "http://localhost:5678/webhook/authenticate"
        result = source_sink.source_to_n8n([], authenticate_url)
        token = result[0]["token"]

        # Example webhook URL (replace with your actual n8n webhook URL)
        webhook_url = f'http://localhost:5678/webhook-test/{WORKFLOW_ID}/webhook/selectworkflow'
        sample_data = [{"role": "user", "content": "I want to validate my SOFT issue."}]

        # Use the source function to send data
        result = source_sink.source_to_n8n(sample_data, webhook_url, jwt_token=token)
        
        # Verify the response matches expected format
        self.assertIn("workflows", result)
        self.assertIn("attentions", result)
        # self.assertIn("reasoning", result)
        
        # Check if at least one workflow is returned
        self.assertTrue(len(result["workflows"]) > 0)
        
        # Verify workflow properties
        workflow = result["workflows"][0]
        self.assertIn("value", workflow)
        self.assertIn("label", workflow["value"])
        
        # Print result for debugging
        print(f"Response: {json.dumps(result, indent=2)}")
