import json
import os
import unittest
import sys
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.append('c:\\Users\\Thnk User\\WindsurfProjects\\ai-playground')

# Load environment variables
load_dotenv()

from src.n8nprototype.backend.src.file_io import read_file
from src.n8nprototype.backend.src.extract_from_and_set_workflow import set_prompt_from_basic
from src.n8nprototype.backend.src.get_set_n8n_workflow import (
    get_workflow_by_id, 
    strip_elements_for_put, 
    update_workflow_by_id,
    activate_workflow,
)

# Get API key from environment variables
LOCALHOST_N8N_API_KEY = os.getenv('LOCALHOST_N8N_API_KEY')
if not LOCALHOST_N8N_API_KEY:
    print("WARNING: LOCALHOST_N8N_API_KEY not found in environment variables. Please set it in your .env file.")

# Workflow ID to update - using the ID specified by the user
WORKFLOW_ID = "uRpoEeLfCk4P9hoG"  # This is the workflow ID provided by the user
MARKDOWN_PATH = "../../workflows/SelectWorkflowExperiment/select-workflow-prompt.md"


class TestIterativePromptUpdate(unittest.TestCase):
    
    def test_update_workflow_prompt(self):
        """
        Test to update the workflow with the text from the markdown file and run a test query.
        This allows for iterative testing of prompt changes.
        """
        # Get the current workflow
        workflow = get_workflow_by_id(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(workflow, "Failed to retrieve workflow")
        
        # Read the markdown file content
        markdown_content = read_file(MARKDOWN_PATH)
        self.assertIsNotNone(markdown_content, "Failed to read markdown file")
        
        # Create a copy of the workflow that can be used for updating
        workflow_for_update = strip_elements_for_put(workflow)
        
        # Update the prompt text in the workflow using the set_prompt_from_basic function
        # This targets the node by name rather than searching for a parameter
        updated = set_prompt_from_basic(workflow_for_update, markdown_content)
        self.assertTrue(updated, "Failed to update the Basic LLM Chain node with new prompt text")
        print("Updated Basic LLM Chain node with new prompt text")
        
        # Debug: Print the updated workflow JSON
        text = json.dumps(workflow_for_update)
        print("JELLE "+text)
        
        # Update the workflow in n8n
        # The update_workflow_by_id function will handle JSON serialization
        updated_workflow = update_workflow_by_id(WORKFLOW_ID, workflow_for_update, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(updated_workflow, "Failed to update workflow")
        
        # Activate the workflow
        activation_result = activate_workflow(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(activation_result, "Failed to activate workflow")
        
        print("\n=== Workflow Update Summary ===")
        print(f"Workflow ID: {WORKFLOW_ID}")
        print(f"Updated node: Basic LLM Chain")
        print(f"Updated with markdown content from: {MARKDOWN_PATH}")
        print("The workflow has been successfully updated and activated.")
        print("Please test it manually in the n8n interface to ensure it's working correctly.")
    
    def test_update_specific_node(self):
        """
        Test to update specifically the node containing the prompt text in the workflow.
        This matches the requirement in the task description.
        """
        # Get the current workflow
        workflow = get_workflow_by_id(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(workflow, "Failed to retrieve workflow")
        
        # Read the markdown file content
        markdown_content = read_file(MARKDOWN_PATH)
        self.assertIsNotNone(markdown_content, "Failed to read markdown file")
        
        # Create a copy of the workflow that can be used for updating
        workflow_for_update = strip_elements_for_put(workflow)
        
        # Update the prompt text in the workflow using the set_prompt_from_basic function
        # This targets the node by name rather than searching for a parameter
        updated = set_prompt_from_basic(workflow_for_update, markdown_content)
        self.assertTrue(updated, "Failed to update the Basic LLM Chain node with new prompt text")
        print("Updated Basic LLM Chain node with new prompt text")
        
        # Debug: Print the updated workflow JSON
        text = json.dumps(workflow_for_update)
        print("JELLE "+text)
        
        # Update the workflow in n8n
        # The update_workflow_by_id function will handle JSON serialization
        updated_workflow = update_workflow_by_id(WORKFLOW_ID, workflow_for_update, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(updated_workflow, "Failed to update workflow")
        
        # Activate the workflow
        activation_result = activate_workflow(WORKFLOW_ID, LOCALHOST_N8N_API_KEY)
        self.assertIsNotNone(activation_result, "Failed to activate workflow")
        
        print("\n=== Workflow Update Summary ===")
        print(f"Workflow ID: {WORKFLOW_ID}")
        print(f"Updated node: Basic LLM Chain")
        print(f"Updated with markdown content from: {MARKDOWN_PATH}")
        print("The workflow has been successfully updated and activated.")
        print("Please test it manually in the n8n interface to ensure it's working correctly.")


if __name__ == "__main__":
    unittest.main()
