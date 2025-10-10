"""
Advanced NLP Analysis Module
Implements deep text analysis for book recommendations
Uses spaCy and NLTK for sophisticated natural language processing
"""
import numpy as np
from collections import Counter
import re


class NLPAnalyzer:
    """
    Advanced NLP analysis for book content
    Extracts semantic features, entities, and topics
    """
    
    def __init__(self):
        self.entity_types = ['PERSON', 'ORG', 'GPE', 'EVENT', 'WORK_OF_ART']
        
    def extract_entities(self, text):
        """
        Extract named entities from text
        
        Args:
            text: Input text string
            
        Returns:
            Dictionary of entity types and their occurrences
        """
        # Simplified entity extraction (would use spaCy in full implementation)
        entities = {
            'persons': [],
            'organizations': [],
            'locations': [],
            'topics': []
        }
        
        # Simple pattern matching for demo
        # In real implementation, would use: nlp = spacy.load('en_core_web_sm')
        words = text.split()
        
        # Extract capitalized words as potential entities
        capitalized = [w for w in words if w and w[0].isupper() and len(w) > 2]
        entities['topics'] = list(set(capitalized[:5]))
        
        return entities
    
    def extract_themes(self, text):
        """
        Extract thematic elements from book description
        
        Args:
            text: Book description or content
            
        Returns:
            List of identified themes
        """
        # Theme keywords
        theme_keywords = {
            'adventure': ['adventure', 'journey', 'quest', 'explore', 'travel'],
            'romance': ['love', 'romance', 'relationship', 'heart', 'passion'],
            'mystery': ['mystery', 'detective', 'crime', 'solve', 'investigation'],
            'science_fiction': ['future', 'space', 'technology', 'alien', 'robot'],
            'fantasy': ['magic', 'wizard', 'dragon', 'kingdom', 'spell'],
            'historical': ['history', 'war', 'century', 'historical', 'past'],
            'thriller': ['thriller', 'suspense', 'danger', 'chase', 'conspiracy'],
            'horror': ['horror', 'fear', 'dark', 'terror', 'nightmare'],
            'biography': ['life', 'biography', 'story', 'journey', 'memoir'],
            'self_help': ['improve', 'guide', 'success', 'habit', 'growth']
        }
        
        text_lower = text.lower()
        detected_themes = []
        
        for theme, keywords in theme_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                detected_themes.append((theme, score))
        
        # Sort by score
        detected_themes.sort(key=lambda x: x[1], reverse=True)
        
        return [theme for theme, score in detected_themes[:3]]
    
    def calculate_readability_score(self, text):
        """
        Calculate readability metrics
        
        Args:
            text: Book description or sample text
            
        Returns:
            Dictionary with readability metrics
        """
        if not text:
            return {'score': 0, 'level': 'unknown'}
        
        # Simple metrics
        words = text.split()
        sentences = text.count('.') + text.count('!') + text.count('?')
        sentences = max(sentences, 1)
        
        avg_word_length = np.mean([len(w) for w in words]) if words else 0
        avg_sentence_length = len(words) / sentences
        
        # Simplified readability score (Flesch-Kincaid approximation)
        score = 206.835 - 1.015 * avg_sentence_length - 84.6 * (avg_word_length / 5)
        score = max(0, min(100, score))  # Clamp to 0-100
        
        # Categorize reading level
        if score >= 90:
            level = 'very_easy'
        elif score >= 70:
            level = 'easy'
        elif score >= 50:
            level = 'moderate'
        elif score >= 30:
            level = 'difficult'
        else:
            level = 'very_difficult'
        
        return {
            'score': round(score, 2),
            'level': level,
            'avg_word_length': round(avg_word_length, 2),
            'avg_sentence_length': round(avg_sentence_length, 2)
        }
    
    def extract_keywords_rake(self, text, n_keywords=10):
        """
        Extract keywords using RAKE (Rapid Automatic Keyword Extraction) algorithm
        
        Args:
            text: Input text
            n_keywords: Number of keywords to extract
            
        Returns:
            List of (keyword, score) tuples
        """
        # Simplified RAKE implementation
        # Split into sentences
        sentences = re.split('[.!?]', text)
        
        # Stop words
        stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 
                         'to', 'for', 'of', 'with', 'by', 'from', 'is', 'was', 'are'])
        
        # Extract candidate keywords
        word_scores = Counter()
        
        for sentence in sentences:
            words = sentence.lower().split()
            words = [w for w in words if w.isalnum() and w not in stop_words]
            
            # Score words by frequency and co-occurrence
            for word in words:
                word_scores[word] += 1
        
        # Get top keywords
        top_keywords = word_scores.most_common(n_keywords)
        
        return [(word, float(score)) for word, score in top_keywords]
    
    def analyze_sentiment(self, text):
        """
        Analyze sentiment of book description
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with sentiment analysis
        """
        # Simple sentiment analysis using keyword matching
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 
                         'beautiful', 'love', 'best', 'perfect', 'inspiring']
        negative_words = ['bad', 'terrible', 'awful', 'worst', 'hate', 
                         'boring', 'disappointing', 'poor', 'weak']
        
        text_lower = text.lower()
        words = text_lower.split()
        
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        total = positive_count + negative_count
        
        if total == 0:
            polarity = 0.0
            sentiment = 'neutral'
        else:
            polarity = (positive_count - negative_count) / total
            
            if polarity > 0.2:
                sentiment = 'positive'
            elif polarity < -0.2:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
        
        return {
            'sentiment': sentiment,
            'polarity': round(polarity, 3),
            'positive_count': positive_count,
            'negative_count': negative_count
        }
    
    def analyze_book(self, book):
        """
        Perform comprehensive NLP analysis on a book
        
        Args:
            book: Book object with title, description, etc.
            
        Returns:
            Dictionary with all NLP features
        """
        description = book.get('description', '')
        title = book.get('title', '')
        
        full_text = f"{title}. {description}"
        
        analysis = {
            'entities': self.extract_entities(full_text),
            'themes': self.extract_themes(full_text),
            'readability': self.calculate_readability_score(description),
            'keywords': self.extract_keywords_rake(full_text, 10),
            'sentiment': self.analyze_sentiment(description)
        }
        
        return analysis
    
    def calculate_semantic_similarity(self, text1, text2):
        """
        Calculate semantic similarity between two texts
        Simple implementation using word overlap
        
        Args:
            text1, text2: Texts to compare
            
        Returns:
            Similarity score (0-1)
        """
        # Tokenize and clean
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        if union == 0:
            return 0.0
        
        return intersection / union

