import json
import re

def extract(response):
    """
    Extracts the JSON content from the 'text' field of the response dict.

    The expected format in response['text'] is a markdown code block with a "json" hint,
    e.g.,

        ```json
        { ... }
        ```

    :param response: A dictionary with a key "text" containing the markdown code block.
    :return: A dictionary parsed from the JSON content.
    :raises ValueError: If the JSON content cannot be extracted.
    """
    text = response.get("text", "")
    # Regex to capture the content between ```json and ```
    pattern = r"```json\s*(\{.*?\})\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        json_str = match.group(1)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"Error parsing JSON: {e}")
    else:
        raise ValueError("No JSON block found in the 'text' field.")

