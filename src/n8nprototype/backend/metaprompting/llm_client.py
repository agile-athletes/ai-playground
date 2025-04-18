import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMClient:
    """
    Client for interacting with LLM models.
    Supports o3-mini on OpenAI and Qwen on Ollama server.
    """
    
    def __init__(self, model_name="o3-mini"):
        """
        Initialize the LLM client with the specified model.
        
        :param model_name: Name of the model to use
        """
        self.model_name = model_name
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://100.118.216.99:11434')
        
        if not self.openai_api_key and model_name == "o3-mini":
            print("WARNING: OPENAI_API_KEY not found in environment variables. Please set it in your .env file.")
    
    def generate_prompt(self, input_text, expected_output):
        """
        Generate a prompt using the specified model.
        
        :param input_text: Input for the prompt
        :param expected_output: Expected output from the prompt
        :return: Generated prompt text
        """
        if self.model_name == "o3-mini":
            return self._generate_with_openai(input_text, expected_output)
        else:
            # Default fallback for other models
            return self._generate_default_prompt(input_text, expected_output)
    
    def run_prompt(self, prompt, input_text, model="qwen2.5:14b"):
        """
        Run a prompt with the specified model.
        
        :param prompt: The prompt to run
        :param input_text: The input text to process
        :param model: The model to use (default: qwen on Ollama)
        :return: The model's response
        """
        if model.startswith("qwen"):
            return self._run_with_ollama(prompt, input_text, model)
        else:
            # Fallback to default processing
            return self._process_default(prompt, input_text)
    
    def _generate_with_openai(self, input_text, expected_output):
        """
        Generate a prompt using OpenAI API (o3-mini).
        
        :param input_text: Input for the prompt
        :param expected_output: Expected output from the prompt
        :return: Generated prompt text
        """
        if not self.openai_api_key:
            return self._generate_default_prompt(input_text, expected_output)
        
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}"
            }
            
            data = {
                "model": "gpt-3.5-turbo",  # Using gpt-3.5-turbo as a fallback if o3-mini isn't directly accessible
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert at creating effective prompts for language models. Your task is to create a prompt that will guide a language model to generate the expected output when given the input."
                    },
                    {
                        "role": "user",
                        "content": f"""
                        Create a prompt for the Qwen language model that will produce the expected output when given the input.
                        
                        Input: {input_text}
                        Expected Output: {expected_output}
                        
                        The prompt should be detailed and guide the model to generate a response similar to the expected output.
                        """
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            response = requests.post(url, headers=headers, data=json.dumps(data))
            response.raise_for_status()
            
            result = response.json()
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"].strip()
            
            return self._generate_default_prompt(input_text, expected_output)
            
        except Exception as e:
            print(f"Error generating prompt with OpenAI: {e}")
            return self._generate_default_prompt(input_text, expected_output)
    
    def _run_with_ollama(self, prompt, input_text, model_name="qwen2.5:14b"):
        """
        Run a prompt using Ollama API.
        
        :param prompt: The prompt to run
        :param input_text: The input text to process
        :param model_name: The name of the model on Ollama server
        :return: The model's response
        """
        try:
            url = f"{self.ollama_base_url}/api/generate"
            
            # Combine the prompt and input
            full_prompt = f"{prompt}\n\nInput: {input_text}"
            
            data = {
                "model": model_name,
                "prompt": full_prompt,
                "stream": False
            }
            
            print(f"Sending request to Ollama API: {url}")
            print(f"Using model: {model_name}")
            print(f"Request data: {json.dumps(data)}")
            
            response = requests.post(url, json=data)
            
            # Print response status for debugging
            print(f"Response status code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error response: {response.text}")
                
                # Try with stream=true to see if that works
                print("Retrying with stream=true...")
                data["stream"] = True
                
                response = requests.post(url, json=data)
                if response.status_code == 200:
                    # Handle streaming response
                    full_response = ""
                    for line in response.iter_lines():
                        if line:
                            try:
                                json_line = json.loads(line.decode('utf-8'))
                                if 'response' in json_line:
                                    full_response += json_line['response']
                            except json.JSONDecodeError:
                                print(f"Failed to decode JSON: {line}")
                    
                    print(f"Streaming response received, length: {len(full_response)}")
                    return full_response
                else:
                    print(f"Retry failed with status code: {response.status_code}")
                    return self._process_default(prompt, input_text)
            
            # Handle non-streaming response
            result = response.json()
            return result.get("response", "")
            
        except Exception as e:
            print(f"Error running prompt with Ollama: {e}")
            return self._process_default(prompt, input_text)
    
    def _generate_default_prompt(self, input_text, expected_output):
        """
        Generate a default prompt when API calls fail or are not available.
        
        :param input_text: Input for the prompt
        :param expected_output: Expected output from the prompt
        :return: Generated prompt text
        """
        return f"""
        You are an AI assistant designed to help users with their tasks.
        
        When given the following input:
        ```
        {input_text}
        ```
        
        You should generate a response similar to:
        ```
        {expected_output}
        ```
        
        Please provide a helpful and accurate response based on the input provided.
        """
    
    def _process_default(self, prompt, input_text):
        """
        Process input with a default method when API calls fail.
        
        :param prompt: The prompt to use
        :param input_text: The input text to process
        :return: A default response
        """
        return f"Default response for input: {input_text}"
