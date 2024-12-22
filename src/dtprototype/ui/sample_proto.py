# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

import gradio as gr

from .validate_issue import load_markdown_file

with gr.Blocks() as demo:
    title = gr.HTML("<H1>Long Range Planning with SOFT</H1>")
    with gr.Row():
        issue = gr.TextArea(label="Issue Editor")
        suggested = gr.TextArea(label="Proposed by AI through corrections based on the validation report")
    validator = gr.Markdown(label="Validation report on your Issue Editor text")
    with gr.Row():
        validate_button = gr.Button("Validate")
        issue_button = gr.Button("Issue yours")
        issue_correction_button = gr.Button("Issue proposed")


    @validate_button.click(inputs=issue, outputs=validator)
    def validate_issue(issue_text: str):
        return load_markdown_file("tmp.md")
        # return "<H2>Jelle</H2>\n\n### Markdown"


    @validate_button.click(inputs=issue, outputs=suggested)
    def issue_correction(issue_text: str):
        return issue_text + "Correction"
