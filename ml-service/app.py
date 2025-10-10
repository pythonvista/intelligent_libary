"""
ML Recommendation Service
Flask API for advanced machine learning recommendations
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os

from config import Config
from models.collaborative_filtering import SVDRecommender, NMFRecommender
from models.content_based import TFIDFRecommender
from models.hybrid_recommender import HybridRecommender, TemporalFeatureEngine, ABTestingFramework
from models.nlp_analysis import NLPAnalyzer

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize MongoDB connection
client = MongoClient(Config.MONGODB_URI)
db = client.get_database()

# Initialize models (will be loaded/trained on startup)
svd_model = SVDRecommender(
    n_components=Config.SVD_N_COMPONENTS,
    n_iter=Config.SVD_N_ITER,
    random_state=Config.SVD_RANDOM_STATE
)

nmf_model = NMFRecommender(
    n_components=Config.NMF_N_COMPONENTS,
    init=Config.NMF_INIT,
    max_iter=Config.NMF_MAX_ITER,
    random_state=Config.NMF_RANDOM_STATE
)

tfidf_model = TFIDFRecommender(
    max_features=Config.TFIDF_MAX_FEATURES,
    min_df=Config.TFIDF_MIN_DF,
    max_df=Config.TFIDF_MAX_DF,
    ngram_range=Config.TFIDF_NGRAM_RANGE
)

hybrid_model = HybridRecommender(svd_model, nmf_model, tfidf_model)
nlp_analyzer = NLPAnalyzer()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Recommendation Engine',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/ml/recommendations', methods=['POST'])
def get_recommendations():
    """
    Generate ML-powered recommendations
    
    Request body:
        {
            "user_id": "string",
            "n_recommendations": 10,
            "algorithm": "hybrid|svd|nmf|tfidf",
            "exclude_books": ["book_id1", "book_id2"]
        }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        n_recs = data.get('n_recommendations', 10)
        algorithm = data.get('algorithm', 'hybrid')
        exclude_books = data.get('exclude_books', [])
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get user history from database
        user_transactions = list(db.transactions.find({'user': user_id}))
        user_history = [str(t['book']) for t in user_transactions]
        
        # Generate recommendations based on algorithm
        if algorithm == 'hybrid':
            recommendations = hybrid_model.get_recommendations(
                user_id, user_history, n_recs, exclude_books
            )
            # Format: (item_id, score, algorithm)
            formatted_recs = [
                {'book_id': item_id, 'score': float(score), 'algorithm': algo}
                for item_id, score, algo in recommendations
            ]
        elif algorithm == 'svd':
            recs = svd_model.predict(user_id, n_recs, exclude_books)
            formatted_recs = [
                {'book_id': item_id, 'score': float(score), 'algorithm': 'svd'}
                for item_id, score in recs
            ]
        elif algorithm == 'nmf':
            recs = nmf_model.predict(user_id, n_recs, exclude_books)
            formatted_recs = [
                {'book_id': item_id, 'score': float(score), 'algorithm': 'nmf'}
                for item_id, score in recs
            ]
        elif algorithm == 'tfidf':
            recs = tfidf_model.predict(user_id, user_history, n_recs, exclude_books)
            formatted_recs = [
                {'book_id': item_id, 'score': float(score), 'algorithm': 'tfidf'}
                for item_id, score in recs
            ]
        else:
            return jsonify({'error': f'Unknown algorithm: {algorithm}'}), 400
        
        # Get A/B test variant info
        variant = hybrid_model.ab_framework.assign_variant(user_id)
        
        return jsonify({
            'recommendations': formatted_recs,
            'user_id': user_id,
            'algorithm': algorithm,
            'variant': variant,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/analyze-book', methods=['POST'])
def analyze_book():
    """
    Perform NLP analysis on a book
    
    Request body:
        {
            "book_id": "string" or "book": {...}
        }
    """
    try:
        data = request.get_json()
        
        # Get book from database or request
        if 'book_id' in data:
            book = db.books.find_one({'_id': data['book_id']})
        elif 'book' in data:
            book = data['book']
        else:
            return jsonify({'error': 'book_id or book is required'}), 400
        
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        # Perform NLP analysis
        analysis = nlp_analyzer.analyze_book(book)
        
        return jsonify({
            'book_id': str(book.get('_id', '')),
            'analysis': analysis,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/similar-books/<book_id>', methods=['GET'])
def get_similar_books(book_id):
    """Get similar books using TF-IDF content-based filtering"""
    try:
        n_similar = int(request.args.get('n', 5))
        
        similar_books = tfidf_model.get_similar_books(book_id, n_similar)
        
        formatted = [
            {'book_id': item_id, 'similarity_score': float(score)}
            for item_id, score in similar_books
        ]
        
        return jsonify({
            'book_id': book_id,
            'similar_books': formatted,
            'algorithm': 'tfidf_content_based'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/trending', methods=['GET'])
def get_trending_books():
    """Get trending books using temporal features"""
    try:
        n_items = int(request.args.get('n', 10))
        
        # Get recent transactions
        transactions = list(db.transactions.find().sort('createdAt', -1).limit(1000))
        
        trending = hybrid_model.temporal_engine.get_trending_items(transactions, n_items)
        
        formatted = [
            {'book_id': item_id, 'trend_score': float(score)}
            for item_id, score in trending
        ]
        
        return jsonify({
            'trending_books': formatted,
            'algorithm': 'temporal_trending'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/ab-test/stats', methods=['GET'])
def get_ab_test_stats():
    """Get A/B testing statistics"""
    try:
        performance = hybrid_model.ab_framework.get_variant_performance()
        winning_variant = hybrid_model.ab_framework.get_winning_variant()
        
        return jsonify({
            'performance': performance,
            'winning_variant': winning_variant,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/train', methods=['POST'])
def train_models():
    """
    Trigger model training
    Should be called periodically to update models with new data
    """
    try:
        # Get training data from database
        books = list(db.books.find())
        transactions = list(db.transactions.find())
        
        # Convert ObjectId to string for compatibility
        for t in transactions:
            t['user_id'] = str(t['user'])
            t['book_id'] = str(t['book'])
        
        for b in books:
            b['_id'] = str(b['_id'])
        
        # Train collaborative filtering models
        print("Training SVD model...")
        svd_model.fit(transactions)
        svd_model.save_model(Config.MODEL_PATH)
        
        print("Training NMF model...")
        nmf_model.fit(transactions)
        nmf_model.save_model(Config.MODEL_PATH)
        
        print("Training TF-IDF model...")
        tfidf_model.fit(books)
        tfidf_model.save_model(Config.MODEL_PATH)
        
        return jsonify({
            'status': 'success',
            'message': 'Models trained successfully',
            'n_books': len(books),
            'n_transactions': len(transactions),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/explain/<user_id>/<book_id>', methods=['GET'])
def explain_recommendation(user_id, book_id):
    """Explain why a book was recommended to a user"""
    try:
        explanation = hybrid_model.explain_recommendation(book_id, user_id)
        
        return jsonify({
            'user_id': user_id,
            'book_id': book_id,
            'explanation': explanation
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("ML Recommendation Service Starting...")
    print("=" * 60)
    print(f"Environment: {Config.DEBUG and 'Development' or 'Production'}")
    print(f"MongoDB URI: {Config.MONGODB_URI}")
    print(f"Listening on: {Config.HOST}:{Config.PORT}")
    print("=" * 60)
    
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )

