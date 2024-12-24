
from unittest import TestCase

from openai.types.chat import ChatCompletionMessage

from prompts.SuggestionPromptMaker import SuggestionPromptMaker
from openaiclient.query_openai import query_openai
class IntegrationTest(TestCase):

    def test_issue_by_omni(self):
        prompt_maker = SuggestionPromptMaker()
        prompt = prompt_maker.make_prompt("The new artificial intelligence technology is challenging our core business of on-demand translations.")
        # print(prompt)
        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]
        # print(messages)
        result: ChatCompletionMessage = query_openai(messages)
        print(result.message.content)
