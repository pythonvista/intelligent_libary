"""
Content-Based Filtering using TF-IDF and NLP
Advanced text analysis for book recommendations
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import joblib
import os
from datetime import datetime

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
    
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)
    
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)


class TFIDFRecommender:
    """
    TF-IDF based content filtering
    Uses book descriptions, titles, authors, and subjects for recommendations
    """
    
    def __init__(self, max_features=500, min_df=2, max_df=0.8, ngram_range=(1, 2)):
        self.max_features = max_features
        self.min_df = min_df
        self.max_df = max_df
        self.ngram_range = ngram_range
        self.vectorizer = None
        self.tfidf_matrix = None
        self.book_id_map = {}
        self.book_idx_map = {}
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
    
    def preprocess_text(self, text):
        """
        Advanced text preprocessing with NLP
        
        Args:
            text: Raw text string
            
        Returns:
            Cleaned and lemmatized text
        """
        if not text:
            return ""
        
        # Lowercase
        text = text.lower()
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and lemmatize
        processed_tokens = [
            self.lemmatizer.lemmatize(token)
            for token in tokens
            if token.isalnum() and token not in self.stop_words and len(token) > 2
        ]
        
        return ' '.join(processed_tokens)
    
    def create_book_corpus(self, books):
        """
        Create text corpus from book metadata
        
        Args:
            books: List of book objects with title, author, description, subject
            
        Returns:
            List of processed text documents
        """
        corpus = []
        book_ids = []
        
        for book in books:
            # Combine all text features
            components = []
            
            # Title (weighted more heavily by repeating)
            if book.get('title'):
                components.extend([book['title']] * 3)
            
            # Author (medium weight)
            if book.get('author'):
                components.extend([book['author']] * 2)
            
            # Subject (high weight)
            if book.get('subject'):
                components.extend([book['subject']] * 3)
            
            # Description
            if book.get('description'):
                components.append(book['description'])
            
            # Tags
            if book.get('tags'):
                components.extend(book['tags'])
            
            # Combine and preprocess
            full_text = ' '.join(components)
            processed_text = self.preprocess_text(full_text)
            
            corpus.append(processed_text)
            book_ids.append(book['_id'])
        
        # Create ID mappings
        self.book_id_map = {book_id: idx for idx, book_id in enumerate(book_ids)}
        self.book_idx_map = {idx: book_id for book_id, idx in self.book_id_map.items()}
        
        return corpus
    
    def fit(self, books):
        """
        Train TF-IDF model on book corpus
        
        Args:
            books: List of book objects
        """
        print(f"Training TF-IDF model with {len(books)} books...")
        
        corpus = self.create_book_corpus(books)
        
        # Initialize TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            min_df=self.min_df,
            max_df=self.max_df,
            ngram_range=self.ngram_range,
            sublinear_tf=True,
            norm='l2'
        )
        
        # Fit and transform
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        
        print(f"TF-IDF model trained. Vocabulary size: {len(self.vectorizer.vocabulary_)}")
        print(f"Matrix shape: {self.tfidf_matrix.shape}")
        
        return self
    
    def predict(self, user_id, user_history, n_recommendations=10, exclude_items=None):
        """
        Generate content-based recommendations
        
        Args:
            user_id: User ID (not directly used in content-based)
            user_history: List of book IDs the user has interacted with
            n_recommendations: Number of recommendations
            exclude_items: Items to exclude
            
        Returns:
            List of (book_id, score) tuples
        """
        if not user_history:
            # No history - cannot make content-based recommendations
            return []
        
        # Get vectors for user's history
        history_indices = [
            self.book_id_map[book_id]
            for book_id in user_history
            if book_id in self.book_id_map
        ]
        
        if not history_indices:
            return []
        
        # Create user profile by averaging TF-IDF vectors of interacted items
        user_profile = self.tfidf_matrix[history_indices].mean(axis=0)
        
        # Calculate similarity to all books
        similarities = cosine_similarity(user_profile, self.tfidf_matrix)[0]
        
        # Create recommendations
        recommendations = []
        for idx, score in enumerate(similarities):
            book_id = self.book_idx_map[idx]
            
            # Exclude history and excluded items
            if book_id in user_history:
                continue
            if exclude_items and book_id in exclude_items:
                continue
            
            recommendations.append((book_id, float(score)))
        
        # Sort and return top N
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:n_recommendations]
    
    def get_similar_books(self, book_id, n_similar=5):
        """
        Find books similar to a given book
        
        Args:
            book_id: Book ID to find similar books for
            n_similar: Number of similar books to return
            
        Returns:
            List of (book_id, similarity_score) tuples
        """
        if book_id not in self.book_id_map:
            return []
        
        book_idx = self.book_id_map[book_id]
        book_vector = self.tfidf_matrix[book_idx]
        
        # Calculate similarities
        similarities = cosine_similarity(book_vector, self.tfidf_matrix)[0]
        
        # Get similar books (excluding the book itself)
        similar = []
        for idx, score in enumerate(similarities):
            if idx == book_idx:
                continue
            
            similar_book_id = self.book_idx_map[idx]
            similar.append((similar_book_id, float(score)))
        
        similar.sort(key=lambda x: x[1], reverse=True)
        return similar[:n_similar]
    
    def get_top_keywords(self, book_id, n_keywords=10):
        """
        Extract top keywords for a book using TF-IDF scores
        
        Args:
            book_id: Book ID
            n_keywords: Number of keywords to extract
            
        Returns:
            List of (keyword, score) tuples
        """
        if book_id not in self.book_id_map:
            return []
        
        book_idx = self.book_id_map[book_id]
        feature_names = self.vectorizer.get_feature_names_out()
        
        # Get TF-IDF scores for this book
        tfidf_scores = self.tfidf_matrix[book_idx].toarray()[0]
        
        # Get top features
        top_indices = tfidf_scores.argsort()[-n_keywords:][::-1]
        
        keywords = [
            (feature_names[idx], float(tfidf_scores[idx]))
            for idx in top_indices
            if tfidf_scores[idx] > 0
        ]
        
        return keywords
    
    def save_model(self, path):
        """Save TF-IDF model"""
        os.makedirs(path, exist_ok=True)
        
        model_data = {
            'vectorizer': self.vectorizer,
            'tfidf_matrix': self.tfidf_matrix,
            'book_id_map': self.book_id_map,
            'book_idx_map': self.book_idx_map,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, os.path.join(path, 'tfidf_model.pkl'))
        print(f"TF-IDF model saved to {path}")
    
    def load_model(self, path):
        """Load TF-IDF model"""
        model_data = joblib.load(os.path.join(path, 'tfidf_model.pkl'))
        
        self.vectorizer = model_data['vectorizer']
        self.tfidf_matrix = model_data['tfidf_matrix']
        self.book_id_map = model_data['book_id_map']
        self.book_idx_map = model_data['book_idx_map']
        
        print(f"TF-IDF model loaded from {path}")

