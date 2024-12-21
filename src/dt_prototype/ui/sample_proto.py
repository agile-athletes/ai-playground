import gradio as gr


with gr.Blocks() as demo:
    title = gr.HTML("<H1>Long Range Planning with SOFT</H1>")
    with gr.Row():
        issue = gr.TextArea(label="Issue Editor")
        suggested = gr.TextArea(label="Proposed by AI through corrections based on the validation report")
    validator = gr.TextArea(label="Validation report on your Issue Editor text")
    with gr.Row():
        validate_button = gr.Button("Validate")
        issue_button = gr.Button("Issue yours")
        issue_correction_button = gr.Button("Issue proposed")


    @validate_button.click(inputs=issue, outputs=validator)
    def validate_issue(issue_text: str):
        return issue_text + "Valid"


    @validate_button.click(inputs=issue, outputs=suggested)
    def issue_correction(issue_text: str):
        return issue_text + "Correction"
