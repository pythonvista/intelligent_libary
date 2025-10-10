# ML Recommendation Service

Advanced Machine Learning recommendation engine for the Intelligent Library system.

## Features

### 🤖 Machine Learning Algorithms

1. **SVD (Singular Value Decomposition)**
   - Matrix factorization for collaborative filtering
   - Discovers latent factors in user-book interactions
   - Handles sparse data efficiently

2. **NMF (Non-negative Matrix Factorization)**
   - Discovers non-negative latent features
   - Provides interpretable recommendations
   - Works well with implicit feedback

3. **TF-IDF Content-Based Filtering**
   - Analyzes book content (title, description, subject)
   - Finds similar books based on textual features
   - Solves cold-start problem for new users

4. **Hybrid Recommender**
   - Combines SVD, NMF, and TF-IDF
   - Weighted ensemble for optimal performance
   - Balances collaborative and content-based approaches

### 🔬 Advanced Features

- **NLP Analysis**: Deep text analysis with entity extraction, theme detection, sentiment analysis
- **Temporal Features**: Time-aware recommendations with recency decay
- **A/B Testing Framework**: Compare algorithm performance with statistical rigor
- **Explainability**: Generate human-readable explanations for recommendations

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

## Training Models

```bash
# Train models using database data
python train_models.py

# Train models using sample data (for testing)
python train_models.py --sample
```

## Running the Service

```bash
# Development mode
python app.py

# Production mode with Gunicorn
gunicorn app:app --bind 0.0.0.0:5001 --workers 4
```

The service will be available at `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
```

### Get Recommendations
```
POST /api/ml/recommendations
Body: {
  "user_id": "string",
  "n_recommendations": 10,
  "algorithm": "hybrid|svd|nmf|tfidf",
  "exclude_books": ["book_id1", "book_id2"]
}
```

### Analyze Book (NLP)
```
POST /api/ml/analyze-book
Body: {
  "book_id": "string"
}
```

### Get Similar Books
```
GET /api/ml/similar-books/<book_id>?n=5
```

### Get Trending Books
```
GET /api/ml/trending?n=10
```

### A/B Test Statistics
```
GET /api/ml/ab-test/stats
```

### Train Models
```
POST /api/ml/train
```

### Explain Recommendation
```
GET /api/ml/explain/<user_id>/<book_id>
```

## Model Details

### SVD Configuration
- Components: 50
- Iterations: 10
- Captures user-item interaction patterns

### NMF Configuration
- Components: 30
- Initialization: NNDSVD
- Max iterations: 200
- Discovers interpretable features

### TF-IDF Configuration
- Max features: 500
- Min document frequency: 2
- Max document frequency: 0.8
- N-gram range: (1, 2)
- Analyzes title, author, description, subject, tags

### Temporal Features
- Decay factor: 0.95
- Time window: 90 days
- Recent interactions weighted higher

### A/B Testing
- Variants: svd, nmf, tfidf, hybrid
- Metrics: CTR, conversion rate, impressions
- Automatic winner detection

## Architecture

```
ml-service/
├── models/
│   ├── collaborative_filtering.py  # SVD & NMF models
│   ├── content_based.py           # TF-IDF model
│   ├── hybrid_recommender.py      # Hybrid system
│   └── nlp_analysis.py            # NLP features
├── app.py                         # Flask API
├── config.py                      # Configuration
├── train_models.py                # Training script
└── requirements.txt               # Dependencies
```

## Performance Metrics

The system tracks:
- **Precision@K**: Accuracy of top-K recommendations
- **Recall@K**: Coverage of relevant items
- **NDCG**: Ranking quality
- **CTR**: Click-through rate
- **Conversion Rate**: Borrow rate from recommendations

## Integration with Main Backend

The main Node.js backend can call this service:

```javascript
const ML_SERVICE_URL = 'http://localhost:5001';

async function getMLRecommendations(userId) {
  const response = await fetch(`${ML_SERVICE_URL}/api/ml/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      algorithm: 'hybrid',
      n_recommendations: 10
    })
  });
  return response.json();
}
```

## Maintenance

### Retraining Models
Models should be retrained periodically (weekly/monthly) as new data accumulates:

```bash
# Automatic retraining
curl -X POST http://localhost:5001/api/ml/train

# Or via training script
python train_models.py
```

### Monitoring
- Check A/B test stats regularly: `GET /api/ml/ab-test/stats`
- Monitor recommendation diversity and coverage
- Track model performance metrics

## Research References

- **SVD**: Koren et al., "Matrix Factorization Techniques for Recommender Systems"
- **NMF**: Lee & Seung, "Algorithms for Non-negative Matrix Factorization"
- **TF-IDF**: Salton & Buckley, "Term-weighting approaches in automatic text retrieval"
- **Hybrid Systems**: Burke, "Hybrid Recommender Systems: Survey and Experiments"

## License

MIT License - Part of Intelligent Library Management System

