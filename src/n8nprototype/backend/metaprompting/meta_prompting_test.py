import json
import os
import unittest
import sys
import time
from dotenv import load_dotenv
import requests

# Add the project root to the Python path
sys.path.append('c:\\Users\\Thnk User\\WindsurfProjects\\ai-playground')

# Load environment variables
load_dotenv()

from src.n8nprototype.backend.src.file_io import read_file
from src.n8nprototype.backend.metaprompting.llm_client import LLMClient
from src.n8nprototype.backend.metaprompting.text_similarity import combined_similarity

# Default model to use if not specified
DEFAULT_PROMPT_MODEL = "deepseek-r1:32b"  # Model used to generate prompts (OpenAI)
DEFAULT_TARGET_MODEL = "qwen2.5:14b"     # Model used to run prompts (Ollama)

# Ollama server URL
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://100.118.216.99:11434')


class MetaPromptingTest(unittest.TestCase):
    """
    Test class for meta prompting functionality.
    This class implements tests according to the design.md specification.
    """
    
    def setUp(self):
        """
        Set up test environment before each test.
        """
        # Initialize the LLM client
        self.llm_client = LLMClient(DEFAULT_PROMPT_MODEL)
        
        # Store results from each test iteration
        self.prompt_results = []
        
        # Load the sample response from the JSON file
        self.sample_response_path = os.path.join(
            os.path.dirname(__file__), 
            'in', 
            'sample-response.json'
        )
        try:
            with open(self.sample_response_path, 'r') as f:
                self.sample_response = json.load(f)
                self.sample_response_str = json.dumps(self.sample_response, indent=2)
        except Exception as e:
            print(f"Error loading sample response: {e}")
            self.sample_response = {}
            self.sample_response_str = "{}"
    
    def create_qwen_prompt(self, input_text, expected_output, model=DEFAULT_PROMPT_MODEL):
        """
        Create a Qwen-Prompt using the specified model.
        
        :param input_text: Input for the Qwen-Prompt
        :param expected_output: Expected output from the Qwen-Prompt
        :param model: Model to use for generating the prompt (default: o3-mini)
        :return: Generated prompt text
        """
        # Use the LLM client to generate a prompt
        self.llm_client.model_name = model
        return self.llm_client.generate_prompt(input_text, expected_output)
    
    def run_qwen_prompt(self, prompt_text, input_text, model=DEFAULT_TARGET_MODEL):
        """
        Run the Qwen-Prompt using the provided input.
        
        :param prompt_text: The prompt text to use
        :param input_text: The input to process with the prompt
        :param model: The model to use for running the prompt (default: qwen)
        :return: Output from running the prompt
        """
        # Use the LLM client to run the prompt with Qwen on Ollama
        return self.llm_client.run_prompt(prompt_text, input_text, model)
    
    def test_meta_prompting_single_iteration(self):
        """
        Test a single iteration of meta prompting.
        """
        # Define test inputs
        input_text = "What is the capital of France?"
        expected_output = "The capital of France is Paris."
        prompt_model = DEFAULT_PROMPT_MODEL
        target_model = DEFAULT_TARGET_MODEL
        
        # Step 1: Create a Qwen-Prompt
        prompt_text = self.create_qwen_prompt(input_text, expected_output, prompt_model)
        self.assertIsNotNone(prompt_text, "Failed to create prompt")
        
        # Step 2: Run the Qwen-Prompt using the input
        actual_output = self.run_qwen_prompt(prompt_text, input_text, target_model)
        self.assertIsNotNone(actual_output, "Failed to get output from Qwen")
        
        # Step 3: Compare the outcome with the expected output
        similarity = combined_similarity(actual_output, expected_output)
        
        # Step 4: Store the prompt and similarity score
        self.prompt_results.append({
            "prompt": prompt_text,
            "similarity": similarity,
            "input": input_text,
            "expected": expected_output,
            "actual": actual_output
        })
        
        print(f"\n=== Meta Prompting Test Results ===")
        print(f"Input: {input_text}")
        print(f"Expected Output: {expected_output}")
        print(f"Actual Output: {actual_output}")
        print(f"Similarity Score: {similarity:.2f}")
        
        # Assert that the similarity is above a threshold
        self.assertGreaterEqual(similarity, 0.5, "Similarity score is too low")
    
    def test_meta_prompting_loop(self):
        """
        Test multiple iterations of meta prompting, keeping the best result.
        """
        # Define test inputs
        input_text = "As a manager of an organisation, I want to validate my issue against the rules of the SOFT framework."
        expected_output = self.sample_response_str
        prompt_model = DEFAULT_PROMPT_MODEL
        target_model = DEFAULT_TARGET_MODEL
        
        best_similarity = 0.0
        best_prompt = None
        best_output = None
        
        # Run the test 10 times as specified in the design document
        for i in range(10):
            print(f"\n=== Iteration {i+1} ===")
            
            # Step 1: Create a Qwen-Prompt
            # Each iteration might produce slightly different prompts
            prompt_text = self.create_qwen_prompt(
                input_text, 
                expected_output, 
                prompt_model
            )
            
            # Step 2: Run the Qwen-Prompt using the input
            actual_output = self.run_qwen_prompt(prompt_text, input_text, target_model)
            
            # Step 3: Compare the outcome with the expected output
            # For JSON responses, try to parse and compare as JSON first
            try:
                actual_json = json.loads(actual_output)
                actual_formatted = json.dumps(actual_json, indent=2)
                similarity = combined_similarity(actual_formatted, expected_output)
            except json.JSONDecodeError:
                # If not valid JSON, compare as strings
                similarity = combined_similarity(actual_output, expected_output)
            
            print(f"Similarity Score: {similarity:.2f}")
            
            # Store the result
            self.prompt_results.append({
                "iteration": i+1,
                "prompt": prompt_text,
                "similarity": similarity,
                "input": input_text,
                "expected": expected_output,
                "actual": actual_output
            })
            
            # Keep track of the best result
            if similarity > best_similarity:
                best_similarity = similarity
                best_prompt = prompt_text
                best_output = actual_output
        
        # Print the best result
        print(f"\n=== Best Meta Prompting Result ===")
        print(f"Best Similarity Score: {best_similarity:.2f}")
        print(f"Input: {input_text}")
        print(f"Expected Output: {expected_output}")
        print(f"Best Actual Output: {best_output}")
        
        # Save the best prompt to a file for future use
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        with open(f"best_prompt_{timestamp}.txt", "w") as f:
            f.write(best_prompt)
        
        # Save the best output to a file for comparison
        with open(f"best_output_{timestamp}.json", "w") as f:
            f.write(best_output)
        
        # Assert that the best similarity is above a threshold
        self.assertGreaterEqual(best_similarity, 0.3, "Best similarity score is too low")
    
    def test_custom_input_output(self):
        """
        Test with custom input and expected output.
        This test allows developers to define their own inputs and expected outputs.
        """
        # Define custom test inputs (these could be loaded from a file or environment variables)
        input_text = "What are the benefits of regular exercise?"
        expected_output = "Regular exercise has numerous benefits including improved cardiovascular health, increased strength and flexibility, better mental health, weight management, and reduced risk of chronic diseases."
        prompt_model = DEFAULT_PROMPT_MODEL
        target_model = DEFAULT_TARGET_MODEL
        
        best_similarity = 0.0
        best_prompt = None
        best_output = None
        
        # Run the test multiple times
        for i in range(5):  # Reduced iterations for testing purposes
            print(f"\n=== Custom Test Iteration {i+1} ===")
            
            # Create a Qwen-Prompt
            prompt_text = self.create_qwen_prompt(input_text, expected_output, prompt_model)
            
            # Run the Qwen-Prompt
            actual_output = self.run_qwen_prompt(prompt_text, input_text, target_model)
            
            # Compare the outcome with the expected output
            similarity = combined_similarity(actual_output, expected_output)
            
            print(f"Similarity Score: {similarity:.2f}")
            
            # Store the result
            self.prompt_results.append({
                "test": "custom",
                "iteration": i+1,
                "prompt": prompt_text,
                "similarity": similarity,
                "input": input_text,
                "expected": expected_output,
                "actual": actual_output
            })
            
            # Keep track of the best result
            if similarity > best_similarity:
                best_similarity = similarity
                best_prompt = prompt_text
                best_output = actual_output
        
        # Print the best result
        print(f"\n=== Best Custom Test Result ===")
        print(f"Best Similarity Score: {best_similarity:.2f}")
        print(f"Input: {input_text}")
        print(f"Expected Output: {expected_output}")
        print(f"Best Actual Output: {best_output}")
        
        # Save the results to a JSON file
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        with open(f"custom_test_results_{timestamp}.json", "w") as f:
            json.dump(self.prompt_results, f, indent=2)
        
        # Assert that the best similarity is above a threshold
        self.assertGreaterEqual(best_similarity, 0.5, "Best similarity score is too low")


if __name__ == "__main__":
    unittest.main()
