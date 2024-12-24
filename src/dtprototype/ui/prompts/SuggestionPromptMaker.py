# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import os
from .PromptMaker import PromptMaker

# Subclass with one specific signature
class SuggestionPromptMaker(PromptMaker):

    def get_sample_issue(self):
        return super().load_markdown_file("response_sample.md")
    
    
    prompt = """<prompt>You are a manager working on the long-range planning of your organization.
Your task is to provide a structured, concise response in Markdown format based on the input question or context.</prompt>
<rules>
Follow these rules:
- Use Markdown syntax:
- Headings: `#`, `##` for sections.
- Lists: Use `-` for bullet points and `1.` for numbered lists.
- Separate sections with `---`.
- Ensure semantic relevance:
- Address the specific question or scenario provided.
- Maintain concise, domain-specific content.
- Structure the response as follows:
    - Title
    - Key Considerations (SAFE framework or equivalent if applicable)
    - Recommendations
    - Conclusion

Use the following example as a structural and stylistic guide:
</rules>"""
    
    
    def assemble_prompt_parts(self, question: str, users_input: str, example_markdown) -> str:
        return f"{self.prompt}\n<question>{question} {users_input}</question>\n<example><question>Check that you have formulated the issue correctly as follows: Manufacturing NH₃ is based on the Haber-Bosch process is good.</response><response>{example_markdown}</response>\n</example>"
    
    
    def make_prompt(self, users_input) -> str:
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
        question = "Check that you have formulated the issue correctly as follows:"
        example_markdown = self.get_sample_issue()
        return self.assemble_prompt_parts(question=question, users_input=users_input, example_markdown=example_markdown)
