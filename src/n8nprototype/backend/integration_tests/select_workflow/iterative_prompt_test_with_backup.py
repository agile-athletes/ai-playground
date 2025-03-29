import json
import os
import unittest
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.append('c:\\Users\\Thnk User\\WindsurfProjects\\ai-playground')

# Load environment variables
load_dotenv()

from src.n8nprototype.backend.src.file_io import read_file, write_workflow_json
from src.n8nprototype.backend.src.extract_from_and_set_workflow import set_prompt_from_basic
from src.n8nprototype.backend.src.get_set_n8n_workflow import (
    get_workflow_by_id, 
    strip_elements_for_put, 
    update_workflow_by_id,
    activate_workflow
)

# Get API key from environment variables
LOCALHOST_N8N_API_KEY = os.getenv('LOCALHOST_N8N_API_KEY')
if not LOCALHOST_N8N_API_KEY:
    print("WARNING: LOCALHOST_N8N_API_KEY not found in environment variables. Please set it in your .env file.")

# Workflow ID to update
WORKFLOW_ID = "uRpoEeLfCk4P9hoG"  # This is the workflow ID provided by the user
MARKDOWN_PATH = "../../workflows/SelectWorkflowExperiment/select-workflow-prompt.md"
BACKUP_PATH = "../../workflows/SelectWorkflowExperiment/backup"


class TestIterativePromptWithBackup(unittest.TestCase):
    
    def test_update_from_backup_minimal_strip(self):
        """
        Test to update a workflow from a backup JSON file with a new prompt,
        using a minimal stripping approach to avoid corrupting the workflow.
        """
        # Check if backup file exists
        backup_file = Path(BACKUP_PATH) / f"workflow_{WORKFLOW_ID}_backup.json"
        self.assertTrue(backup_file.exists(), f"Backup file not found: {backup_file}")
        
        # Load the backup workflow
        with open(backup_file, 'r') as f:
            workflow = json.load(f)
        
        # Read the markdown file content
        markdown_content = read_file(MARKDOWN_PATH)
        self.assertIsNotNone(markdown_content, "Failed to read markdown file")
        
        # Create a new workflow object with only the allowed properties
        # Based on the n8n API documentation and error messages
        allowed_keys = ["name", "nodes", "connections", "settings", "staticData"]
        workflow_for_update = {k: workflow[k] for k in allowed_keys if k in workflow}
        
        # Clean nodes: remove properties that are managed by n8n
        if "nodes" in workflow_for_update:
            for node in workflow_for_update["nodes"]:
                # Remove node ID as it's managed by n8n
                if "id" in node:
                    node.pop("id", None)
                
                # Remove webhookId for webhook nodes
                if node.get("type") == "n8n-nodes-base.webhook" and "webhookId" in node:
                    node.pop("webhookId", None)
        
        # Update the prompt text in the workflow using the set_prompt_from_basic function
        updated = set_prompt_from_basic(workflow_for_update, markdown_content)
        self.assertTrue(updated, "Failed to update the Basic LLM Chain node with new prompt text")
        print("Updated Basic LLM Chain node with new prompt text")
        
        # Debug: Print the updated workflow JSON structure (not the full content)
        print("Workflow update structure:")
        print(f"Keys in workflow_for_update: {list(workflow_for_update.keys())}")
        if "nodes" in workflow_for_update:
            print(f"Number of nodes: {len(workflow_for_update['nodes'])}")
            print(f"Node types: {[node.get('type', 'unknown') for node in workflow_for_update['nodes']]}")
        
        # Update the workflow in n8n
        updated_workflow = update_workflow_by_id(WORKFLOW_ID, workflow_for_update, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(updated_workflow, "Failed to update workflow")
        
        # Activate the workflow
        activation_result = activate_workflow(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(activation_result, "Failed to activate workflow")
        
        print("\n=== Workflow Update Summary ===")
        print(f"Workflow ID: {WORKFLOW_ID}")
        print(f"Updated from backup: {backup_file}")
        print(f"Updated node: Basic LLM Chain")
        print(f"Updated with markdown content from: {MARKDOWN_PATH}")
        print("The workflow has been successfully updated and activated.")
        print("Please check the n8n interface to ensure it's working correctly.")

