# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import unittest
from unittest import TestCase

from openai.types.chat import ChatCompletionMessage

from validate_issue import load_markdown_file, make_prompt
from openaiclient.query_openai import query_openai


class Test(TestCase):

    def test_make_sample(self):
        try:
            markdown_content = load_markdown_file("response_sample.md")
            self.assertTrue(markdown_content.startswith("Title: Plant Process Operation"))
            # print(markdown_content)
        except FileNotFoundError as e:
            print(e)


    def test_make_prompt(self):
        print(make_prompt("The users definition of an issue in her organization."))


    # @unittest.skip("sample by integration test")
    def test_issue_by_o1(self):
        prompt = make_prompt("The new artificial intelligence technology is challenging our core business of on-demand translations.")
        # print(prompt)
        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]
        # print(messages)
        result: ChatCompletionMessage = query_openai(messages)
        print(result.message)
