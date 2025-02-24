import json
import os
import unittest
from dotenv import load_dotenv

from src.n8nprototype.backend.src.extract_from_and_set_workflow import extract_webhook_path, set_prompt_from_basic
from src.n8nprototype.backend.src.file_io import read_workflow_json, read_file
from src.n8nprototype.backend.src.get_set_n8n_workflow import \
    strip_elements_for_put, create_workflow, delete_workflow, \
    activate_workflow, query_prompt_on_n8n

load_dotenv()  # Load environment variables for this test

LOCALHOST_N8N_API_KEY = os.getenv('LOCALHOST_N8N_API_KEY')


class TestExtractJsonFromText(unittest.TestCase):
    # def setUp(self):

    def test_read_file(self):
        prompt = read_file("../../workflows/SOFT-Validator/suggestion-prompt-json.md")
        print(prompt)


    def test_first_part_create(self):
        workflow = strip_elements_for_put(read_workflow_json("../../workflows/SelectWorkflowExperiment/GeneralMusterOfBasicLLMChain.json"))
        prompt = read_file("../../workflows/SOFT-Validator/suggestion-prompt-json.md")
        set_prompt_from_basic(workflow, prompt)
        workflow["name"] = "SOFT-Validator"
        created_workflow = create_workflow(workflow, LOCALHOST_N8N_API_KEY)
        workflow_id = created_workflow["id"]
        print(f"workflow_id: {workflow_id}")
        activate_workflow(workflow_id, LOCALHOST_N8N_API_KEY)
        path = extract_webhook_path(workflow)
        workflow_url = f"http://localhost:5678/webhook/{workflow_id}/webhook/{path}"
        user_entry = [{"role": "user", "content": "New artificial intelligence technology is challenging our core business of on-demand translation."}]
        result = query_prompt_on_n8n(user_entry, workflow_url)
        print(result)


    def test_query_workflow(self):
        path = "http://localhost:5678/webhook-test/bxKkwMfFdXNReTjV/webhook/27f68323-c314-4adf-a88f-aad037af08ee"
        # path = "http://localhost:5678/webhook/bxKkwMfFdXNReTjV/webhook/27f68323-c314-4adf-a88f-aad037af08ee"
        user_entry = [{"role": "user", "content": "I want to validate my problem formulated as a SOFT issue."}]
        result = query_prompt_on_n8n(user_entry, path)
        print("JELLE")
        print(type(result))
        print(result)


    def test_delete_workflow(self):
        workflow_id = "GNBCZbrbsaObO9mB"
        delete_workflow(workflow_id, LOCALHOST_N8N_API_KEY)