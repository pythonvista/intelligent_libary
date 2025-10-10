"""
Model Training Script
Trains and saves all ML models with sample data
Run this script to initialize or update the recommendation models
"""
import sys
from pymongo import MongoClient
from config import Config
from models.collaborative_filtering import SVDRecommender, NMFRecommender
from models.content_based import TFIDFRecommender
import json


def generate_sample_data():
    """Generate sample training data for demonstration"""
    # Sample transactions for collaborative filtering
    sample_transactions = [
        {'user_id': 'user1', 'book_id': 'book1', 'rating': 1.0, 'borrowDate': '2024-01-01'},
        {'user_id': 'user1', 'book_id': 'book2', 'rating': 1.0, 'borrowDate': '2024-01-05'},
        {'user_id': 'user1', 'book_id': 'book5', 'rating': 1.0, 'borrowDate': '2024-01-10'},
        {'user_id': 'user2', 'book_id': 'book2', 'rating': 1.0, 'borrowDate': '2024-01-03'},
        {'user_id': 'user2', 'book_id': 'book3', 'rating': 1.0, 'borrowDate': '2024-01-07'},
        {'user_id': 'user2', 'book_id': 'book4', 'rating': 1.0, 'borrowDate': '2024-01-12'},
        {'user_id': 'user3', 'book_id': 'book1', 'rating': 1.0, 'borrowDate': '2024-01-02'},
        {'user_id': 'user3', 'book_id': 'book3', 'rating': 1.0, 'borrowDate': '2024-01-06'},
        {'user_id': 'user3', 'book_id': 'book5', 'rating': 1.0, 'borrowDate': '2024-01-11'},
        {'user_id': 'user4', 'book_id': 'book2', 'rating': 1.0, 'borrowDate': '2024-01-04'},
        {'user_id': 'user4', 'book_id': 'book4', 'rating': 1.0, 'borrowDate': '2024-01-08'},
        {'user_id': 'user5', 'book_id': 'book1', 'rating': 1.0, 'borrowDate': '2024-01-09'},
        {'user_id': 'user5', 'book_id': 'book5', 'rating': 1.0, 'borrowDate': '2024-01-13'},
    ]
    
    # Sample books for content-based filtering
    sample_books = [
        {
            '_id': 'book1',
            'title': 'Introduction to Machine Learning',
            'author': 'Dr. AI Smith',
            'subject': 'Computer Science',
            'description': 'A comprehensive guide to machine learning algorithms and applications',
            'tags': ['ML', 'AI', 'algorithms']
        },
        {
            '_id': 'book2',
            'title': 'Deep Learning Fundamentals',
            'author': 'Neural Network',
            'subject': 'Computer Science',
            'description': 'Explore deep neural networks and modern AI techniques',
            'tags': ['deep learning', 'neural networks', 'AI']
        },
        {
            '_id': 'book3',
            'title': 'Data Science Handbook',
            'author': 'Data Expert',
            'subject': 'Data Science',
            'description': 'Complete guide to data analysis, visualization, and statistics',
            'tags': ['data science', 'statistics', 'visualization']
        },
        {
            '_id': 'book4',
            'title': 'Python Programming',
            'author': 'Code Master',
            'subject': 'Programming',
            'description': 'Learn Python programming from basics to advanced concepts',
            'tags': ['Python', 'programming', 'coding']
        },
        {
            '_id': 'book5',
            'title': 'Artificial Intelligence Ethics',
            'author': 'Ethics Professor',
            'subject': 'Computer Science',
            'description': 'Exploring ethical implications of AI and machine learning systems',
            'tags': ['AI', 'ethics', 'society']
        },
    ]
    
    return sample_transactions, sample_books


def train_from_database():
    """Train models using real database data"""
    print("Connecting to MongoDB...")
    client = MongoClient(Config.MONGODB_URI)
    db = client.get_database()
    
    # Fetch data from database
    print("Fetching books from database...")
    books = list(db.books.find())
    
    print("Fetching transactions from database...")
    transactions = list(db.transactions.find())
    
    # Convert ObjectId to string
    for t in transactions:
        t['user_id'] = str(t.get('user', ''))
        t['book_id'] = str(t.get('book', ''))
    
    for b in books:
        b['_id'] = str(b['_id'])
    
    print(f"Found {len(books)} books and {len(transactions)} transactions")
    
    return transactions, books


def train_all_models(use_database=True):
    """Train all ML models"""
    print("=" * 60)
    print("ML Model Training Pipeline")
    print("=" * 60)
    
    # Get training data
    if use_database:
        try:
            transactions, books = train_from_database()
        except Exception as e:
            print(f"Error fetching from database: {e}")
            print("Falling back to sample data...")
            transactions, books = generate_sample_data()
    else:
        transactions, books = generate_sample_data()
    
    # Ensure minimum data requirements
    if len(transactions) < 5:
        print("Warning: Not enough transactions. Adding sample data...")
        sample_trans, sample_books = generate_sample_data()
        transactions.extend(sample_trans)
        books.extend(sample_books)
    
    # Train SVD Model
    print("\n" + "=" * 60)
    print("1. Training SVD (Collaborative Filtering) Model")
    print("=" * 60)
    svd_model = SVDRecommender(
        n_components=Config.SVD_N_COMPONENTS,
        n_iter=Config.SVD_N_ITER,
        random_state=Config.SVD_RANDOM_STATE
    )
    svd_model.fit(transactions)
    svd_model.save_model(Config.MODEL_PATH)
    print("✓ SVD model trained and saved")
    
    # Train NMF Model
    print("\n" + "=" * 60)
    print("2. Training NMF (Collaborative Filtering) Model")
    print("=" * 60)
    nmf_model = NMFRecommender(
        n_components=Config.NMF_N_COMPONENTS,
        init=Config.NMF_INIT,
        max_iter=Config.NMF_MAX_ITER,
        random_state=Config.NMF_RANDOM_STATE
    )
    nmf_model.fit(transactions)
    nmf_model.save_model(Config.MODEL_PATH)
    print("✓ NMF model trained and saved")
    
    # Train TF-IDF Model
    print("\n" + "=" * 60)
    print("3. Training TF-IDF (Content-Based) Model")
    print("=" * 60)
    tfidf_model = TFIDFRecommender(
        max_features=Config.TFIDF_MAX_FEATURES,
        min_df=Config.TFIDF_MIN_DF,
        max_df=Config.TFIDF_MAX_DF,
        ngram_range=Config.TFIDF_NGRAM_RANGE
    )
    tfidf_model.fit(books)
    tfidf_model.save_model(Config.MODEL_PATH)
    print("✓ TF-IDF model trained and saved")
    
    print("\n" + "=" * 60)
    print("✓ All models trained successfully!")
    print("=" * 60)
    print(f"Models saved to: {Config.MODEL_PATH}")
    print(f"Training data: {len(books)} books, {len(transactions)} transactions")
    print("=" * 60)


if __name__ == '__main__':
    # Check if should use database or sample data
    use_db = '--sample' not in sys.argv
    
    if not use_db:
        print("Using sample data for training...")
    
    train_all_models(use_database=use_db)
    
    print("\nTraining complete! You can now start the ML service with:")
    print("  python app.py")

