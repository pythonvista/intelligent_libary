"""
Collaborative Filtering Models
Implements SVD and NMF for recommendation generation
"""
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD, NMF
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os
from datetime import datetime


class SVDRecommender:
    """
    Singular Value Decomposition (SVD) based collaborative filtering
    Matrix factorization technique for recommendation generation
    """
    
    def __init__(self, n_components=50, n_iter=10, random_state=42):
        self.n_components = n_components
        self.n_iter = n_iter
        self.random_state = random_state
        self.model = None
        self.user_factors = None
        self.item_factors = None
        self.user_id_map = {}
        self.item_id_map = {}
        
    def create_interaction_matrix(self, transactions):
        """
        Create user-item interaction matrix from transaction data
        
        Args:
            transactions: List of transaction objects with user_id, book_id, rating
            
        Returns:
            Sparse matrix of user-item interactions
        """
        # Create mappings
        unique_users = sorted(set(t['user_id'] for t in transactions))
        unique_items = sorted(set(t['book_id'] for t in transactions))
        
        self.user_id_map = {user_id: idx for idx, user_id in enumerate(unique_users)}
        self.item_id_map = {item_id: idx for idx, item_id in enumerate(unique_items)}
        
        # Reverse mappings
        self.user_idx_map = {idx: user_id for user_id, idx in self.user_id_map.items()}
        self.item_idx_map = {idx: item_id for item_id, idx in self.item_id_map.items()}
        
        # Create matrix
        n_users = len(unique_users)
        n_items = len(unique_items)
        
        data = []
        rows = []
        cols = []
        
        for transaction in transactions:
            user_idx = self.user_id_map[transaction['user_id']]
            item_idx = self.item_id_map[transaction['book_id']]
            
            # Use implicit feedback (1 for borrowed, could be weighted by time)
            rating = transaction.get('rating', 1.0)
            
            data.append(rating)
            rows.append(user_idx)
            cols.append(item_idx)
        
        interaction_matrix = csr_matrix((data, (rows, cols)), shape=(n_users, n_items))
        return interaction_matrix
    
    def fit(self, transactions):
        """
        Train the SVD model on transaction data
        
        Args:
            transactions: List of transaction objects
        """
        print(f"Training SVD model with {len(transactions)} transactions...")
        
        # Create interaction matrix
        interaction_matrix = self.create_interaction_matrix(transactions)
        
        # Initialize and fit SVD
        self.model = TruncatedSVD(
            n_components=min(self.n_components, min(interaction_matrix.shape) - 1),
            n_iter=self.n_iter,
            random_state=self.random_state
        )
        
        # Fit and transform user factors
        self.user_factors = self.model.fit_transform(interaction_matrix)
        
        # Get item factors
        self.item_factors = self.model.components_.T
        
        print(f"SVD model trained. Explained variance ratio: {self.model.explained_variance_ratio_.sum():.4f}")
        
        return self
    
    def predict(self, user_id, n_recommendations=10, exclude_items=None):
        """
        Generate recommendations for a user
        
        Args:
            user_id: User ID to generate recommendations for
            n_recommendations: Number of recommendations to return
            exclude_items: List of item IDs to exclude (already interacted)
            
        Returns:
            List of (item_id, score) tuples
        """
        if user_id not in self.user_id_map:
            # Cold start problem - return popular items
            return []
        
        user_idx = self.user_id_map[user_id]
        user_vector = self.user_factors[user_idx].reshape(1, -1)
        
        # Calculate similarity scores for all items
        scores = cosine_similarity(user_vector, self.item_factors)[0]
        
        # Create item-score pairs
        recommendations = []
        for item_idx, score in enumerate(scores):
            item_id = self.item_idx_map[item_idx]
            
            # Exclude already interacted items
            if exclude_items and item_id in exclude_items:
                continue
            
            recommendations.append((item_id, float(score)))
        
        # Sort by score and return top N
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:n_recommendations]
    
    def save_model(self, path):
        """Save the trained model to disk"""
        os.makedirs(path, exist_ok=True)
        
        model_data = {
            'model': self.model,
            'user_factors': self.user_factors,
            'item_factors': self.item_factors,
            'user_id_map': self.user_id_map,
            'item_id_map': self.item_id_map,
            'user_idx_map': self.user_idx_map,
            'item_idx_map': self.item_idx_map,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, os.path.join(path, 'svd_model.pkl'))
        print(f"SVD model saved to {path}")
    
    def load_model(self, path):
        """Load a trained model from disk"""
        model_data = joblib.load(os.path.join(path, 'svd_model.pkl'))
        
        self.model = model_data['model']
        self.user_factors = model_data['user_factors']
        self.item_factors = model_data['item_factors']
        self.user_id_map = model_data['user_id_map']
        self.item_id_map = model_data['item_id_map']
        self.user_idx_map = model_data['user_idx_map']
        self.item_idx_map = model_data['item_idx_map']
        
        print(f"SVD model loaded from {path} (trained at {model_data['timestamp']})")


class NMFRecommender:
    """
    Non-negative Matrix Factorization (NMF) based collaborative filtering
    Discovers latent features in user-item interactions
    """
    
    def __init__(self, n_components=30, init='nndsvd', max_iter=200, random_state=42):
        self.n_components = n_components
        self.init = init
        self.max_iter = max_iter
        self.random_state = random_state
        self.model = None
        self.user_features = None
        self.item_features = None
        self.user_id_map = {}
        self.item_id_map = {}
    
    def create_interaction_matrix(self, transactions):
        """Create user-item interaction matrix"""
        unique_users = sorted(set(t['user_id'] for t in transactions))
        unique_items = sorted(set(t['book_id'] for t in transactions))
        
        self.user_id_map = {user_id: idx for idx, user_id in enumerate(unique_users)}
        self.item_id_map = {item_id: idx for idx, item_id in enumerate(unique_items)}
        
        self.user_idx_map = {idx: user_id for user_id, idx in self.user_id_map.items()}
        self.item_idx_map = {idx: item_id for item_id, idx in self.item_id_map.items()}
        
        n_users = len(unique_users)
        n_items = len(unique_items)
        
        data = []
        rows = []
        cols = []
        
        for transaction in transactions:
            user_idx = self.user_id_map[transaction['user_id']]
            item_idx = self.item_id_map[transaction['book_id']]
            rating = transaction.get('rating', 1.0)
            
            data.append(rating)
            rows.append(user_idx)
            cols.append(item_idx)
        
        return csr_matrix((data, (rows, cols)), shape=(n_users, n_items))
    
    def fit(self, transactions):
        """Train NMF model"""
        print(f"Training NMF model with {len(transactions)} transactions...")
        
        interaction_matrix = self.create_interaction_matrix(transactions)
        
        # Convert to dense for NMF (NMF requires non-negative dense matrix)
        dense_matrix = interaction_matrix.toarray()
        
        # Initialize and fit NMF
        self.model = NMF(
            n_components=min(self.n_components, min(dense_matrix.shape) - 1),
            init=self.init,
            max_iter=self.max_iter,
            random_state=self.random_state,
            alpha_W=0.01,
            alpha_H=0.01,
            l1_ratio=0.5
        )
        
        # Fit and get user features
        self.user_features = self.model.fit_transform(dense_matrix)
        
        # Get item features
        self.item_features = self.model.components_.T
        
        print(f"NMF model trained. Reconstruction error: {self.model.reconstruction_err_:.4f}")
        
        return self
    
    def predict(self, user_id, n_recommendations=10, exclude_items=None):
        """Generate NMF-based recommendations"""
        if user_id not in self.user_id_map:
            return []
        
        user_idx = self.user_id_map[user_id]
        user_vector = self.user_features[user_idx].reshape(1, -1)
        
        # Calculate scores
        scores = cosine_similarity(user_vector, self.item_features)[0]
        
        recommendations = []
        for item_idx, score in enumerate(scores):
            item_id = self.item_idx_map[item_idx]
            
            if exclude_items and item_id in exclude_items:
                continue
            
            recommendations.append((item_id, float(score)))
        
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:n_recommendations]
    
    def save_model(self, path):
        """Save NMF model"""
        os.makedirs(path, exist_ok=True)
        
        model_data = {
            'model': self.model,
            'user_features': self.user_features,
            'item_features': self.item_features,
            'user_id_map': self.user_id_map,
            'item_id_map': self.item_id_map,
            'user_idx_map': self.user_idx_map,
            'item_idx_map': self.item_idx_map,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, os.path.join(path, 'nmf_model.pkl'))
        print(f"NMF model saved to {path}")
    
    def load_model(self, path):
        """Load NMF model"""
        model_data = joblib.load(os.path.join(path, 'nmf_model.pkl'))
        
        self.model = model_data['model']
        self.user_features = model_data['user_features']
        self.item_features = model_data['item_features']
        self.user_id_map = model_data['user_id_map']
        self.item_id_map = model_data['item_id_map']
        self.user_idx_map = model_data['user_idx_map']
        self.item_idx_map = model_data['item_idx_map']
        
        print(f"NMF model loaded from {path}")

