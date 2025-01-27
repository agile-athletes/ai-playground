# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import json
import unittest
from unittest import TestCase

from openai.types.chat import ChatCompletionMessage

from openaiclient.query_openai import query_openai, strip_json_from_llm
from prompts.SuggestionPromptMaker import SuggestionPromptMaker
from src.dtprototype.ui.prompts.json_to_markdown import JsonToMarkdownConverter


class IntegrationTest(TestCase):

    prompt_maker = SuggestionPromptMaker()

    @unittest.skip("shows the use of the classes")
    def test_issue_by_gpt_4o_mini(self):
        prompt = self.prompt_maker.make_prompt("New artificial intelligence technology is challenging our core business of on-demand translation.")
        # print(prompt)
        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]
        result: ChatCompletionMessage = query_openai(messages)
        result_as_json = json.loads(strip_json_from_llm(result.message.content))
        print(result_as_json)
        converter = JsonToMarkdownConverter(result_as_json)
        result_as_markdown = converter.to_markdown()
        print(result_as_markdown)
