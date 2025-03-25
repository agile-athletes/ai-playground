from src.n8nprototype.backend.utils import source_sink
from unittest import TestCase

class PromptTest(TestCase):

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
                        "url": "softvalidator",
                        "selected": False
                    },
                    "weight": "1"
                }
            ]
        }


    def test_first_post_to_select_workflow_it(self):
        # Get a token from authenticate workflow
        authenticate_url = "http://localhost:5678/webhook/authenticate"
        result = source_sink.source_to_n8n([], authenticate_url)
        token = result[0]["token"]

        # Example webhook URL (replace with your actual n8n webhook URL)
        webhook_url = "http://localhost:5678/webhook/selectworkflow"
        sample_data = [{"role": "user", "content": "I want to validate my SOFT issue."}]

        # Use the source function to send data
        result = source_sink.source_to_n8n(sample_data, webhook_url, jwt_token=token)
        # self.assertEqual(result.worflows[0].value.label, "Validate your SOFT issue")
        if result:
            print("Response from n8n:", source_sink.sink_from_n8n(result))
        else:
            print("No response received or an error occurred.")



