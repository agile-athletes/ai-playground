
# Meta Prompting in Python

Goal: Automate the creation of Prompts to be used with the model Qwen. Hereof called Qwen-Prompts. The plan is to use a smarter model like o3-mini to generate,
and update Qwen-Prompts. The runtime is in a Python unittest on a desktop. Qwen is on an Ollama-server. o3-mini is hosted by open.ai. 

Given that as of Python 3.8, unittest executes test methods in the order of their definition within a test class ...

## Test methods as Steps

### Preparation for each Test

Developer defines an input for the the n8n-Prompt (Input)
Developer creates an output to be created by the n8n-Prompt (Expected)
Developer names the target model as an input (Model)

### Test flow

1. System creates a an n8n-Prompt
2. System runs the n8n-Prompt using Input
3. System compares the outcome with Expected and qualifies the similarity with a float from 0.00 to 1.00
4. System stores the prompt and the float

### Loop

1. System executes the Test ten times keeping the best result as the outcome
