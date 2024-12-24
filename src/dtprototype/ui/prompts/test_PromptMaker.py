# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

from unittest import TestCase

from PromptMaker import PromptMaker
from SuggestionPromptMaker import SuggestionPromptMaker


class TestPromptMaker(PromptMaker):
    def make_prompt(self, arg: str) -> str:
        return f"Test prompt: {arg}"


class TestTestPromptMaker(TestCase):

    def test_make_sample(self):
        test_prompt_maker = TestPromptMaker()
        try:
            markdown_content = test_prompt_maker.load_markdown_file(filename="response_sample.md")
            self.assertTrue(markdown_content.startswith("# Plant Process Operation"))
        except FileNotFoundError as e:
            print(e)

    def test_make_prompt(self):
        print(SuggestionPromptMaker().make_prompt("hello world"))
