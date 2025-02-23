import json


def read_workflow_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as file:
        return json.load(file)

def write_workflow_json(filepath, workflow_json):
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(json.dumps(workflow_json, indent=2))

