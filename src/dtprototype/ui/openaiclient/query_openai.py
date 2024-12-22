# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import json
import os
from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletionMessage

GPT_MODEL = 'gpt-4o-mini'
O1_MODEL = 'o1-mini'

load_dotenv()
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)


def query_openai(messages: json):
    chat_completion = client.chat.completions.create(
        messages=messages,
        model=O1_MODEL,
    )
    return chat_completion.choices[0]


def add_completion(messages: json, completion: ChatCompletionMessage):
    messages.append({
        "role": "assistant",
        "content": completion.message.content
    })
    return messages


