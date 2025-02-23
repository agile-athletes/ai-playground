
def extract_webhook_path(workflow_json):
    """
    Extracts the 'path' value from the node named 'Webhook' in the workflow JSON.

    :param workflow_json: A dictionary representing the workflow JSON.
    :return: The 'path' value if found, otherwise None.
    """
    nodes = workflow_json.get("nodes", [])
    for node in nodes:
        if node.get("name") == "Webhook":
            parameters = node.get("parameters", {})
            return parameters.get("path")
    return None


def extract_prompt_from_basic(workflow_json):
    """
    Extracts the 'parameters.text' value from the node with name 'Basic LLM Chain'
    within the given workflow JSON.

    :param workflow_json: A dictionary representing the workflow JSON.
    :return: The text content from the 'Basic LLM Chain' node, or None if not found.
    """
    nodes = workflow_json.get('nodes', [])
    for node in nodes:
        if node.get('name') == "Basic LLM Chain":
            parameters = node.get('parameters', {})
            return parameters.get('text')
    return None

def set_prompt_from_basic(workflow_json, new_text):
    """
    Sets the 'parameters.text' value of the node with name 'Basic LLM Chain'
    to the provided new_text.

    :param workflow_json: A dictionary representing the workflow JSON.
    :param new_text: The new text to set in the 'Basic LLM Chain' node.
    :return: True if the node was found and updated, False otherwise.
    """
    nodes = workflow_json.get('nodes', [])
    for node in nodes:
        if node.get('name') == "Basic LLM Chain":
            if 'parameters' not in node:
                node['parameters'] = {}
            node['parameters']['text'] = new_text
            return True
    return False

