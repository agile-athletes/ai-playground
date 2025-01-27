# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import json
import os

from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletionMessage

load_dotenv()
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

model = "gpt-4o-mini"


def query_openai(messages: json):
    chat_completion = client.chat.completions.create(
        messages=messages,
        model=model,
    )
    return chat_completion.choices[0]


def add_completion(messages: json, completion: ChatCompletionMessage):
    messages.append({
        "role": "assistant",
        "content": completion.message.content
    })
    return messages


def strip_json_from_llm(json_data: str) -> str:
    # Remove ```json and ``` markers
    clean_json = json_data.strip("```json").strip("```").strip()
    return clean_json
