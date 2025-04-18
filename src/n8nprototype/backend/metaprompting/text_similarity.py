from difflib import SequenceMatcher
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def simple_similarity(text1, text2):
    """
    Calculate the similarity between two texts using SequenceMatcher.
    
    :param text1: First text to compare
    :param text2: Second text to compare
    :return: Float value between 0.0 and 1.0 representing similarity
    """
    return SequenceMatcher(None, text1, text2).ratio()

def cosine_text_similarity(text1, text2):
    """
    Calculate the cosine similarity between two texts using TF-IDF.
    
    :param text1: First text to compare
    :param text2: Second text to compare
    :return: Float value between 0.0 and 1.0 representing similarity
    """
    # Create TF-IDF vectorizer
    vectorizer = TfidfVectorizer()
    
    # Fit and transform the texts
    try:
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        
        # Calculate cosine similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(similarity)
    except Exception as e:
        print(f"Error calculating cosine similarity: {e}")
        # Fallback to simple similarity
        return simple_similarity(text1, text2)

def combined_similarity(text1, text2):
    """
    Calculate a combined similarity score using multiple methods.
    
    :param text1: First text to compare
    :param text2: Second text to compare
    :return: Float value between 0.0 and 1.0 representing similarity
    """
    # Calculate similarity using different methods
    simple_sim = simple_similarity(text1, text2)
    
    try:
        cosine_sim = cosine_text_similarity(text1, text2)
        # Combine the scores (weighted average)
        return (0.4 * simple_sim) + (0.6 * cosine_sim)
    except:
        # If cosine similarity fails, return simple similarity
        return simple_sim
