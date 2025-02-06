import requests_mock
import json
from src.n8nprototype.backend.utils.source_sink import source_to_n8n  # Replace 'your_module' with the actual module name

def test_source_to_n8n():
    webhook_url = "http://localhost:5678/webhook-test/5b58f7ff-2c87-4850-8cce-583ee8009f04"
    payload = {"key": "value"}
    expected_response = {"success": True}

    with requests_mock.Mocker() as mock:
        mock.post(webhook_url, json=expected_response, status_code=200)

        response = source_to_n8n(payload, webhook_url)

        assert response == expected_response
        assert mock.called
        assert mock.call_count == 1

        last_request = mock.request_history[0]
        assert last_request.method == "POST"
        assert last_request.url == webhook_url
        assert json.loads(last_request.text) == payload
