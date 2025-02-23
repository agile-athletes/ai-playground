import os
import unittest
from dotenv import load_dotenv

from src.n8nprototype.backend.src.file_io import read_workflow_json, write_workflow_json
from src.n8nprototype.backend.src.get_set_n8n_workflow import \
    get_workflow_by_id, strip_elements_for_put, update_workflow_by_id

load_dotenv()  # Load environment variables for this test

LOCALHOST_N8N_API_KEY = os.getenv('LOCALHOST_N8N_API_KEY')


class TestExtractJsonFromText(unittest.TestCase):
    # def setUp(self):

    def test_get_workflow_json(self):
        workflow_id = "0KcOmBjoZ1mhiGXp"
        api_key = LOCALHOST_N8N_API_KEY
        workflow = get_workflow_by_id(workflow_id, api_key)
        id = workflow["id"]
        self.assertEqual(id, workflow_id)

    def test_strip_workflow_for_put(self):
        workflow = read_workflow_json("../../workflows/SelectWorkflowExperiment/SelectWorkflowExperiment_copy.json")
        id = workflow["id"]
        stripped_workflow = strip_elements_for_put(workflow)
        update_workflow_by_id(id, stripped_workflow, LOCALHOST_N8N_API_KEY)
        write_workflow_json("./json.json", stripped_workflow)

