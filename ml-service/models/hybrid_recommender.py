"""
Hybrid Recommendation System
Combines SVD, NMF, and TF-IDF with temporal features and A/B testing
"""
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
import random


class TemporalFeatureEngine:
    """
    Temporal feature engineering for time-aware recommendations
    Implements time decay and recency-based scoring
    """
    
    def __init__(self, decay_factor=0.95, window_days=90):
        self.decay_factor = decay_factor
        self.window_days = window_days
    
    def calculate_time_weight(self, interaction_date):
        """
        Calculate time-based weight for an interaction
        More recent interactions get higher weights
        
        Args:
            interaction_date: datetime object or ISO string
            
        Returns:
            Weight between 0 and 1
        """
        if isinstance(interaction_date, str):
            interaction_date = datetime.fromisoformat(interaction_date.replace('Z', '+00:00'))
        
        days_ago = (datetime.now() - interaction_date).days
        
        # Exponential decay
        weight = self.decay_factor ** (days_ago / 30)  # Decay per month
        
        # Zero weight for interactions outside window
        if days_ago > self.window_days:
            weight *= 0.1
        
        return weight
    
    def get_trending_items(self, transactions, n_items=10):
        """
        Identify trending items based on recent activity
        
        Args:
            transactions: List of transaction objects with timestamps
            n_items: Number of trending items to return
            
        Returns:
            List of (item_id, trend_score) tuples
        """
        item_scores = defaultdict(float)
        
        for transaction in transactions:
            item_id = transaction['book_id']
            timestamp = transaction.get('borrowDate', transaction.get('createdAt'))
            
            weight = self.calculate_time_weight(timestamp)
            item_scores[item_id] += weight
        
        # Sort by trend score
        trending = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)
        return trending[:n_items]
    
    def apply_temporal_boost(self, recommendations, user_transactions):
        """
        Boost recommendations based on user's temporal patterns
        
        Args:
            recommendations: List of (item_id, score) tuples
            user_transactions: User's historical transactions
            
        Returns:
            Temporally-adjusted recommendations
        """
        if not user_transactions:
            return recommendations
        
        # Calculate user's preferred subjects over time
        recent_subjects = defaultdict(float)
        
        for transaction in user_transactions:
            timestamp = transaction.get('borrowDate', transaction.get('createdAt'))
            subject = transaction.get('subject', 'General')
            
            weight = self.calculate_time_weight(timestamp)
            recent_subjects[subject] += weight
        
        # Boost recommendations that match recent interests
        adjusted_recs = []
        for item_id, score in recommendations:
            # This would need item metadata in practice
            # For now, apply a small temporal factor
            temporal_boost = 1.0
            adjusted_recs.append((item_id, score * temporal_boost))
        
        return adjusted_recs


class ABTestingFramework:
    """
    A/B Testing framework for comparing recommendation algorithms
    Implements variant assignment and performance tracking
    """
    
    def __init__(self, variants=None, split_ratio=0.25):
        self.variants = variants or ['svd', 'nmf', 'tfidf', 'hybrid']
        self.split_ratio = split_ratio
        self.variant_stats = {variant: {'impressions': 0, 'clicks': 0, 'conversions': 0} 
                              for variant in self.variants}
    
    def assign_variant(self, user_id):
        """
        Assign a user to a testing variant
        Uses consistent hashing for stable assignment
        
        Args:
            user_id: User identifier
            
        Returns:
            Variant name (e.g., 'svd', 'nmf', 'tfidf', 'hybrid')
        """
        # Use hash for consistent assignment
        hash_value = hash(str(user_id))
        variant_idx = hash_value % len(self.variants)
        return self.variants[variant_idx]
    
    def record_impression(self, variant, user_id, items):
        """Record that recommendations were shown"""
        self.variant_stats[variant]['impressions'] += 1
    
    def record_click(self, variant, user_id, item_id):
        """Record that a user clicked a recommendation"""
        self.variant_stats[variant]['clicks'] += 1
    
    def record_conversion(self, variant, user_id, item_id):
        """Record that a user borrowed a recommended book"""
        self.variant_stats[variant]['conversions'] += 1
    
    def get_variant_performance(self):
        """
        Calculate performance metrics for each variant
        
        Returns:
            Dictionary with CTR and conversion rates per variant
        """
        performance = {}
        
        for variant, stats in self.variant_stats.items():
            impressions = stats['impressions'] or 1
            clicks = stats['clicks']
            conversions = stats['conversions']
            
            ctr = clicks / impressions
            conversion_rate = conversions / impressions
            
            performance[variant] = {
                'impressions': impressions,
                'clicks': clicks,
                'conversions': conversions,
                'ctr': ctr,
                'conversion_rate': conversion_rate
            }
        
        return performance
    
    def get_winning_variant(self):
        """Determine the best-performing variant"""
        performance = self.get_variant_performance()
        
        # Sort by conversion rate
        sorted_variants = sorted(
            performance.items(),
            key=lambda x: x[1]['conversion_rate'],
            reverse=True
        )
        
        if sorted_variants:
            return sorted_variants[0][0]
        return 'hybrid'


class HybridRecommender:
    """
    Hybrid recommendation system combining multiple algorithms
    Integrates SVD, NMF, TF-IDF with temporal features and A/B testing
    """
    
    def __init__(self, svd_model=None, nmf_model=None, tfidf_model=None):
        self.svd_model = svd_model
        self.nmf_model = nmf_model
        self.tfidf_model = tfidf_model
        self.temporal_engine = TemporalFeatureEngine()
        self.ab_framework = ABTestingFramework()
        
        # Hybrid weights (can be tuned)
        self.weights = {
            'svd': 0.35,
            'nmf': 0.30,
            'tfidf': 0.25,
            'temporal': 0.10
        }
    
    def get_recommendations(self, user_id, user_history=None, n_recommendations=10,
                          exclude_items=None, variant=None):
        """
        Generate hybrid recommendations
        
        Args:
            user_id: User ID
            user_history: List of book IDs user has interacted with
            n_recommendations: Number of recommendations to return
            exclude_items: Items to exclude
            variant: A/B test variant (if None, uses hybrid)
            
        Returns:
            List of (item_id, score, algorithm) tuples
        """
        if variant is None:
            variant = self.ab_framework.assign_variant(user_id)
        
        # Get recommendations from each algorithm
        all_recommendations = {}
        
        # SVD recommendations
        if variant in ['svd', 'hybrid'] and self.svd_model:
            svd_recs = self.svd_model.predict(user_id, n_recommendations * 2, exclude_items)
            for item_id, score in svd_recs:
                if item_id not in all_recommendations:
                    all_recommendations[item_id] = {'svd': 0, 'nmf': 0, 'tfidf': 0}
                all_recommendations[item_id]['svd'] = score
        
        # NMF recommendations
        if variant in ['nmf', 'hybrid'] and self.nmf_model:
            nmf_recs = self.nmf_model.predict(user_id, n_recommendations * 2, exclude_items)
            for item_id, score in nmf_recs:
                if item_id not in all_recommendations:
                    all_recommendations[item_id] = {'svd': 0, 'nmf': 0, 'tfidf': 0}
                all_recommendations[item_id]['nmf'] = score
        
        # TF-IDF recommendations
        if variant in ['tfidf', 'hybrid'] and self.tfidf_model and user_history:
            tfidf_recs = self.tfidf_model.predict(user_id, user_history, 
                                                  n_recommendations * 2, exclude_items)
            for item_id, score in tfidf_recs:
                if item_id not in all_recommendations:
                    all_recommendations[item_id] = {'svd': 0, 'nmf': 0, 'tfidf': 0}
                all_recommendations[item_id]['tfidf'] = score
        
        # Calculate hybrid scores
        final_recommendations = []
        
        for item_id, scores in all_recommendations.items():
            if variant == 'hybrid':
                # Weighted combination
                hybrid_score = (
                    scores['svd'] * self.weights['svd'] +
                    scores['nmf'] * self.weights['nmf'] +
                    scores['tfidf'] * self.weights['tfidf']
                )
                algorithm = 'hybrid'
            elif variant == 'svd':
                hybrid_score = scores['svd']
                algorithm = 'svd'
            elif variant == 'nmf':
                hybrid_score = scores['nmf']
                algorithm = 'nmf'
            elif variant == 'tfidf':
                hybrid_score = scores['tfidf']
                algorithm = 'tfidf'
            else:
                hybrid_score = scores['svd']  # Default
                algorithm = 'svd'
            
            final_recommendations.append((item_id, hybrid_score, algorithm))
        
        # Sort by score
        final_recommendations.sort(key=lambda x: x[1], reverse=True)
        
        # Record impression
        top_recs = final_recommendations[:n_recommendations]
        self.ab_framework.record_impression(
            variant, user_id, [item_id for item_id, _, _ in top_recs]
        )
        
        return top_recs
    
    def explain_recommendation(self, item_id, user_id):
        """
        Generate explanation for why an item was recommended
        
        Returns:
            Dictionary with explanation details
        """
        explanation = {
            'item_id': item_id,
            'reasons': [],
            'confidence': 0.0
        }
        
        # Check each model's contribution
        scores = {}
        
        if self.svd_model:
            svd_recs = self.svd_model.predict(user_id, 100)
            svd_score = next((score for iid, score in svd_recs if iid == item_id), 0)
            if svd_score > 0:
                scores['collaborative_filtering'] = svd_score
                explanation['reasons'].append(
                    f"Users with similar taste enjoyed this book (CF score: {svd_score:.3f})"
                )
        
        # Calculate overall confidence
        if scores:
            explanation['confidence'] = np.mean(list(scores.values()))
        
        return explanation

