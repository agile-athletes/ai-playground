# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

import gradio as gr

from .prompts.PromptMaker import load_markdown_file

with gr.Blocks() as demo:
    title = gr.HTML("<H1>Long Range Planning with SOFT</H1>")
    with gr.Row():
        issue = gr.TextArea(label="Issue Editor", value="New artificial intelligence technology is challenging our core business of on-demand translation.")
        with gr.Column():
            gr.HTML("<label for='suggestions-md-id'>Proposed by AI through corrections based on the validation report</label>")
            suggested = gr.Markdown(elem_id="suggestions-md-id", label=None)
    gr.HTML("<label for='validation-md-id'>Inspiration by AI on your Issue Editor text</label>")
    validator = gr.Markdown(elem_id="validation-md-id", label=None)
    with gr.Row():
        validate_button = gr.Button("Validate")
        issue_button = gr.Button("Issue yours")
        issue_correction_button = gr.Button("Issue proposed")


    @validate_button.click(inputs=issue, outputs=validator)
    def validate_issue(issue_text: str):
        return load_markdown_file("tmp_inspiration.md")


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
