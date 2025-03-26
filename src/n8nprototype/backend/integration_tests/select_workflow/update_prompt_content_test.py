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


class TestUpdatePromptContent(unittest.TestCase):
    
    def test_update_prompt_content_only(self):
        """
        Test to update only the prompt content in the workflow without modifying the structure.
        This test ensures that the workflow remains intact while updating the prompt.
        """
        # Get the current workflow
        workflow = get_workflow_by_id(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(workflow, "Failed to retrieve workflow")
        
        # Create a backup of the current workflow before making changes
        backup_dir = Path(BACKUP_PATH)
        if not backup_dir.exists():
            backup_dir.mkdir(parents=True)
        
        backup_file = backup_dir / f"workflow_{WORKFLOW_ID}_before_prompt_update.json"
        write_workflow_json(str(backup_file), workflow)
        print(f"Created backup at: {backup_file}")
        
        # Read the markdown file content
        markdown_content = read_file(MARKDOWN_PATH)
        self.assertIsNotNone(markdown_content, "Failed to read markdown file")
        
        # Create a clean copy of the workflow for updating
        workflow_for_update = strip_elements_for_put(workflow)
        
        # Update only the prompt text in the workflow
        updated = set_prompt_from_basic(workflow_for_update, markdown_content)
        self.assertTrue(updated, "Failed to update the Basic LLM Chain node with new prompt text")
        
        # Update the workflow in n8n
        updated_workflow = update_workflow_by_id(WORKFLOW_ID, workflow_for_update, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(updated_workflow, "Failed to update workflow")
        
        # Activate the workflow
        activation_result = activate_workflow(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(activation_result, "Failed to activate workflow")
        
        print("\n=== Prompt Content Update Summary ===")
        print(f"Workflow ID: {WORKFLOW_ID}")
        print(f"Updated node: Basic LLM Chain")
        print(f"Updated with markdown content from: {MARKDOWN_PATH}")
        print("The workflow has been successfully updated with new prompt content and activated.")
        print("Please test it manually in the n8n interface to ensure it's working correctly.")


if __name__ == "__main__":
    unittest.main()
