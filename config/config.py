import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables once

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SIMPLE_GPT_MODEL = os.getenv('SIMPLE_GPT_MODEL')
BULKY_GPT_MODEL = os.getenv('BULKY_GPT_MODEL')


if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables.")
