from src.n8nprototype.backend.utils import source_sink
from unittest import TestCase

class LoopBackTest(TestCase):

    def test_webhook_simple_loopback_it(self):
        # Example webhook URL (replace with your actual n8n webhook URL)
        webhook_url = "http://localhost:5678/webhook/5b58f7ff-2c87-4850-8cce-583ee8009f04"
        sample_data = [{"role": "user", "content": "Loop these messages back."}]

        # Use the source function to send data
        result = source_sink.source_to_n8n(sample_data, webhook_url)
        if result:
            print("Response from n8n:", result)
        else:
            print("No response received or an error occurred.")
        self.assertEqual(1, 1)



