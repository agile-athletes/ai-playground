# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

from .PromptMaker import PromptMaker

class ValidatingPromptMaker(PromptMaker):
    # validates the users input based on the suggestions as a second thought

    def make_prompt(self, users_input: str, inspiration: str) -> str:
        return "TODO Linus"
