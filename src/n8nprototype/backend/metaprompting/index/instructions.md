# Definition of the AI-Playground response format

The following conventions ensure that the user's application 
displays your response in a way that is humanly understandable.

## Basic Element Structure

```json
{
  "id": <a running number>,
  "parent_id": <null for the parent>,
  "name": "<free selectable name>",
  "value": "<free selectable text that shows in the App>",
  "weight": "<your estimation value 0.0-1.0>"
}
```

The weighted rating indicates the relevance or accuracy.

Elements of the Basic Element Structure can be appended to the "attentions"-Array of the response.

## Extention: Workflows Array Element:

The Basic Element Structure is extended by a complex child element in "value".

Input: 
1. URL_VALUE to be defined externally.
2. SELECTED_VALUE true or false.

```json
{
  "id": 1,
  "parent_id": null,
  "name": "<free selectable name>",
  "value": {
    "type": "workflow",
    "label": "<free selectable label that shows in the navigation panel of the App>",
    "url": "<URL_VALUE>",
    "selected": <SELECTED_VALUE>
  },
  "weight": "<your estimation value 0.0-1.0>"
}
```

## Extention: Reasoning Array Element:

The Basic Element Structure is extended by a complex child element in "value".

Input:
1. USER_QUESTION a suggested question that naturally continues the users dialog in the App as the next question

```json
{
  "id": 1,
  "parent_id": null,
  "name": "<free selectable name>",
  "value": {
    "type": "next-navigation",
    "consideration": <free selectable text that shows a running text in the App>,
    "suggested": <USER_QUESTION>
    },
  "weight": "<your estimation value 0.0-1.0>"
}
```

# General Response Format:

Your response should adhere to the following json structure:

```json
{
  "attentions": [],
  "workflows": [],
  "reasoning": []
}
```

Ensure that you respond with valid json.
Remove all whitespace chars from the response.
