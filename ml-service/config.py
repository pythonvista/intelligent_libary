"""
ML Service Configuration
Advanced Machine Learning Recommendation Engine
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """ML Service configuration settings"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'ml-service-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    PORT = int(os.getenv('ML_SERVICE_PORT', 5001))
    HOST = os.getenv('ML_SERVICE_HOST', '0.0.0.0')
    
    # Database settings
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/intelligent_library')
    
    # ML Model settings
    MODEL_PATH = os.getenv('MODEL_PATH', './models/')
    DATA_PATH = os.getenv('DATA_PATH', './data/')
    
    # Recommendation settings
    N_RECOMMENDATIONS = 10
    MIN_RATING_COUNT = 5
    
    # SVD settings
    SVD_N_COMPONENTS = 50
    SVD_N_ITER = 10
    SVD_RANDOM_STATE = 42
    
    # NMF settings
    NMF_N_COMPONENTS = 30
    NMF_INIT = 'nndsvd'
    NMF_RANDOM_STATE = 42
    NMF_MAX_ITER = 200
    
    # TF-IDF settings
    TFIDF_MAX_FEATURES = 500
    TFIDF_MIN_DF = 2
    TFIDF_MAX_DF = 0.8
    TFIDF_NGRAM_RANGE = (1, 2)
    
    # NLP settings
    NLP_MODEL = 'en_core_web_sm'
    STOP_WORDS = 'english'
    
    # Temporal features
    TEMPORAL_DECAY_FACTOR = 0.95
    TEMPORAL_WINDOW_DAYS = 90
    
    # A/B Testing
    AB_TEST_VARIANTS = ['svd', 'nmf', 'tfidf', 'hybrid']
    AB_TEST_SPLIT_RATIO = 0.25  # 25% for each variant
    
    # Cache settings
    CACHE_TIMEOUT = 3600  # 1 hour
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

