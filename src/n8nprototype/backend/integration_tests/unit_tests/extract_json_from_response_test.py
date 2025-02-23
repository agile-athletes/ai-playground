import unittest

from src.n8nprototype.backend.src.extract_json_from_response import extract


class TestExtractJsonFromText(unittest.TestCase):
    def setUp(self):
        self.sample_response = {
            "text": "```json\n{\n  \"workflows\": [\n    {\n      \"id\": 1,\n      \"parent_id\": null,\n      \"name\": \"SOFT-Validator\",\n      \"value\": {\n        \"type\": \"workflow\",\n        \"label\": \"Validate your SOFT issue\",\n        \"url\": \"http://localhost:5678/webhook/7f718eed-4d7c-49eb-880c-45d93f5bdb04\",\n        \"selected\": false\n      },\n      \"weight\": \"1\"\n    }\n  ]\n}\n```"
        }
        self.expected_dict = {
            "workflows": [
                {
                    "id": 1,
                    "parent_id": None,
                    "name": "SOFT-Validator",
                    "value": {
                        "type": "workflow",
                        "label": "Validate your SOFT issue",
                        "url": "http://localhost:5678/webhook/7f718eed-4d7c-49eb-880c-45d93f5bdb04",
                        "selected": False
                    },
                    "weight": "1"
                }
            ]
        }

    def test_extract_json(self):
        result = extract(self.sample_response)
        self.assertEqual(result, self.expected_dict)

    def test_missing_json_block(self):
        response_without_json = {"text": "No JSON content here"}
        with self.assertRaises(ValueError):
            extract(response_without_json)

    def test_invalid_json(self):
        # Here the block is marked as json but contains invalid JSON.
        response_invalid_json = {"text": "```json\n{invalid json}\n```"}
        with self.assertRaises(ValueError):
            extract(response_invalid_json)

