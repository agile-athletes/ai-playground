# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

from pydantic import BaseModel


class ChatGPTQuery(BaseModel):
    title: str
    question: str
    result: str | None = None


