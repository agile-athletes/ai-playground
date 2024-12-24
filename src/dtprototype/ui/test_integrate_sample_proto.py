# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

from unittest import TestCase

from openai.types.chat import ChatCompletionMessage

from openaiclient.query_openai import query_openai
from prompts.SuggestionPromptMaker import SuggestionPromptMaker


class IntegrationTest(TestCase):

    prompt_maker = SuggestionPromptMaker()

    def test_issue_by_omni(self):
        prompt = self.prompt_maker.make_prompt("New artificial intelligence technology is challenging our core business of on-demand translation.")
        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]
        result: ChatCompletionMessage = query_openai(messages)
        print(result.message.content)
