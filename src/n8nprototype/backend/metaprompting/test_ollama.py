#!/usr/bin/env python3
"""
Simple test script to verify Ollama API integration
"""
import sys
import os
from llm_client import LLMClient

def main():
    """Test the Ollama API integration"""
    print("Testing Ollama API integration...")
    
    # Create LLM client
    client = LLMClient()
    
    # Test prompt
    prompt = "You are a helpful assistant. Answer the following question concisely."
    input_text = "Why is the sky blue?"
    model = "qwen2.5:14b"
    
    print(f"Using model: {model}")
    print(f"Prompt: {prompt}")
    print(f"Input: {input_text}")
    
    # Run the prompt
    print("\nSending request to Ollama API...")
    response = client.run_prompt(prompt, input_text, model)
    
    print("\nResponse from Ollama:")
    print("-" * 40)
    print(response)
    print("-" * 40)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
