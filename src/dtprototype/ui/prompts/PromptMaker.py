# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import os
from abc import ABC, abstractmethod
# from typing import overload


class PromptMaker(ABC):
    @abstractmethod
    def make_prompt(self, *args, **kwargs) -> str:
        pass
        # @overload
        # def make_prompt(self, users_input: str) -> str: ...
        # def make_prompt(self, users_input: str, additional_context: str) -> str:
        #     return f"Advanced prompt: {users_input} | Context: {additional_context}"

    @staticmethod
    def load_markdown_file(filename:str) -> str:
        return load_markdown_file(filename=filename)

def load_markdown_file(filename: str) -> str:
    """
    Loads a Markdown file from the specified filename, relative to the current script location.

    Args:
        filename (str): The name of the Markdown file to load.

    Returns:
        str: The content of the Markdown file as a string.

    Raises:
        FileNotFoundError: If the file does not exist.
    """
    file_path = os.path.join(os.path.dirname(__file__), filename)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding="UTF-8") as file:
            return file.read()
    else:
        raise FileNotFoundError(f"File '{filename}' not found at '{file_path}'.")
