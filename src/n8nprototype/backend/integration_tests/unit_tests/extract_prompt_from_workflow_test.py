import unittest

from src.n8nprototype.backend.src.extract_from_and_set_workflow import set_prompt_from_basic, extract_prompt_from_basic
from src.n8nprototype.backend.src.file_io import read_workflow_json


class TestExtractJsonFromText(unittest.TestCase):
    # def setUp(self):

    def test_extract_json(self):
        workflow = read_workflow_json("../../workflows/SelectWorkflowExperiment/SelectWorkflowExperiment.json")
        self.assertIsNotNone(workflow)

    def test_set_prompt_workflow(self):
        workflow = read_workflow_json("../../workflows/SelectWorkflowExperiment/SelectWorkflowExperiment.json")
        set_prompt_from_basic(workflow, "Jelle")
        workflow_prompt = extract_prompt_from_basic(workflow)
        self.assertEqual("Jelle", workflow_prompt)

