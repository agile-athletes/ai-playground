# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import os


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


def get_sample_issue():
    return load_markdown_file("response_sample.md")


prompt = "<prompt>You are a manager working on the long range planning of your organization, "
"using the SOFT framework known as the Long Range Planning Service (LRPS) of Stanford Research Institute (SRI).</prompt>\n"
"<policy>As a professional, provide clear and accurate "
"validation of the identification of a planning issue for the organization while maintaining "
"confidentiality and professionalism. Avoid giving specific "
"advice without sufficient context as standardised by the SOFT framework.</policy>\n"


def assemble_prompt_parts(question: str, users_input: str, example_markdown) -> str:
    return f"{prompt}\n<example><question>{question} {users_input}</question>\n<response>{example_markdown}</response>\n</example>"


def make_prompt(users_input) -> str:
    """
    Assembles a prompt optimized for the reasoning LLM o1 or o1-mini of openai.

    The result will be in markdown.
    Loads a Markdown sample file from package in the current script location.

    Used principles:
        - structured formatting
        - no chain of thought (show rather than tell)
        - semantic similarity and completion

    Args:
        users_input (str): The input of the user who tries to create an issue.

    Returns:
        str: The models validation of the users input.

    Raises:
        FileNotFoundError: If the markdown file does not exist.
    """
    question= "Check that you have formulated the issue correctly as follows:"
    example_markdown = get_sample_issue()
    return assemble_prompt_parts(question=question, users_input=users_input, example_markdown=example_markdown)
