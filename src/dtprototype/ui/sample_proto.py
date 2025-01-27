# Copyright (c) 2024 / 2025 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import json

import gradio as gr
from openai.types.chat import ChatCompletionMessage

from .openaiclient.query_openai import query_openai, strip_json_from_llm
from .prompts.PromptMaker import load_markdown_file
from .prompts.SuggestionPromptMaker import SuggestionPromptMaker
from .prompts.json_to_markdown import JsonToMarkdownConverter

with gr.Blocks() as demo:
    title = gr.HTML("<H1>Long Range Planning with SOFT</H1>")
    with gr.Row():
        issue = gr.TextArea(label="Issue Editor", value="New artificial intelligence technology is challenging our core business of on-demand translation.")
        with gr.Column():
            gr.HTML("<label for='suggestions-md-id'>Instructions:</label>")
            suggested = gr.Markdown(elem_id="suggestions-md-id", label=None)
            suggested.value = "Read the [docs](https://github.com/agile-athletes/ai-playground) or click on the button labelled 'Validate'"
    gr.HTML("<label for='validation-md-id'>Inspiration by AI on your Issue Editor text</label>")
    validator = gr.Markdown(elem_id="validation-md-id", label=None)
    with gr.Row():
        validate_button = gr.Button("Validate")
        issue_button = gr.Button("Issue yours")
        issue_correction_button = gr.Button("Issue proposed")


    @validate_button.click(inputs=issue, outputs=validator)
    def validate_issue(issue_text: str):
        prompt_maker = SuggestionPromptMaker()
        if not issue_text or len(issue_text) <= 0:
            return load_markdown_file("sample_validation.md")
        try:
            prompt = prompt_maker.make_prompt(issue_text)
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            result: ChatCompletionMessage = query_openai(messages)
            result_as_json = json.loads(strip_json_from_llm(result.message.content))
            return JsonToMarkdownConverter(result_as_json).to_markdown().replace("USER_TEXT", f"your validated text in the Issue Editor")
        except (Exception, BaseException) as e:
            return load_markdown_file("sample_validation.md")


    @validate_button.click(inputs=issue, outputs=suggested)
    def issue_correction(issue_text: str):
        return load_markdown_file("tmp_validation.md")

    demo.css = """
    #suggestions-md-id, #validation-md-id {
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
    }
    """
