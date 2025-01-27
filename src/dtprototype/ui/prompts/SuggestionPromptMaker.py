# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

from .PromptMaker import PromptMaker


def assemble_prompt_parts(prompt: str, users_input: str) -> str:
    return prompt.replace("{text}", users_input)



class SuggestionPromptMaker(PromptMaker):
    # inspires the user by creating an example based on users_input

    def make_prompt(self, users_input) -> str:
        """
        Assembles a prompt optimized for the reasoning LLM  of openai.

        The result will be in markdown.
        Loads a Markdown sample prompt from package in the current script location.

        Used principles:
            - structured formatting
            - no chain of thought (show rather than tell)
            - semantic similarity and completion

        Args:
            users_input (str): The input of the user who tries to create an issue.

        Returns:
            str: the prompt.

        Raises:
            FileNotFoundError: If the markdown file does not exist.
        """
        prompt = super().load_markdown_file("./suggestion-prompt.md")
        return assemble_prompt_parts(prompt=prompt, users_input=users_input)
