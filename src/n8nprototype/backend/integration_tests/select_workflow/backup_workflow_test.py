import json
import os
import unittest
import sys
import shutil
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


class TestBackupWorkflow(unittest.TestCase):
    
    def test_backup_current_workflow(self):
        """
        Test to backup the current workflow to a JSON file.
        This allows for easy restoration if a workflow update corrupts the workflow.
        """
        # Get the current workflow
        workflow = get_workflow_by_id(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(workflow, "Failed to retrieve workflow")
        
        # Create backup directory if it doesn't exist
        backup_dir = Path(BACKUP_PATH)
        if not backup_dir.exists():
            backup_dir.mkdir(parents=True)
        
        # Save the workflow to a JSON file
        backup_file = backup_dir / f"workflow_{WORKFLOW_ID}_backup.json"
        write_workflow_json(str(backup_file), workflow)
        
        print(f"\n=== Workflow Backup Summary ===")
        print(f"Workflow ID: {WORKFLOW_ID}")
        print(f"Backup saved to: {backup_file}")
        print("You can use this backup to restore the workflow if it becomes corrupted.")
    
    def test_restore_from_backup(self):
        """
        Test to restore a workflow from a backup JSON file.
        This is useful if a workflow update corrupts the workflow.
        """
        # Check if backup file exists
        backup_file = Path(BACKUP_PATH) / f"workflow_{WORKFLOW_ID}_backup.json"
        self.assertTrue(backup_file.exists(), f"Backup file not found: {backup_file}")
        
        # Load the backup workflow
        with open(backup_file, 'r') as f:
            workflow = json.load(f)
        
        # Create a copy of the workflow that can be used for updating
        workflow_for_update = strip_elements_for_put(workflow)
        
        # Update the workflow in n8n
        updated_workflow = update_workflow_by_id(WORKFLOW_ID, workflow_for_update, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(updated_workflow, "Failed to update workflow")
        
        # Activate the workflow
        activation_result = activate_workflow(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(activation_result, "Failed to activate workflow")
        
        print("\n=== Workflow Restore Summary ===")
        print(f"Workflow ID: {WORKFLOW_ID}")
        print(f"Restored from backup: {backup_file}")
        print("The workflow has been successfully restored and activated.")
        print("Please check the n8n interface to ensure it's working correctly.")
    
    def test_update_from_backup_with_new_prompt(self):
        """
        Test to update a workflow from a backup JSON file with a new prompt.
        This combines backup restoration with prompt updating.
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
        
        # Create a copy of the workflow that can be used for updating
        workflow_for_update = strip_elements_for_put(workflow)
        
        # Update the prompt text in the workflow using the set_prompt_from_basic function
        updated = set_prompt_from_basic(workflow_for_update, markdown_content)
        self.assertTrue(updated, "Failed to update the Basic LLM Chain node with new prompt text")
        print("Updated Basic LLM Chain node with new prompt text")
        
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


if __name__ == "__main__":
    unittest.main()
