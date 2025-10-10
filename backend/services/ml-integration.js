/**
 * ML Integration Service
 * Simulates ML microservice responses when service is unavailable
 * Falls back to actual ML service when available
 */

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const USE_SIMULATION = process.env.ML_USE_SIMULATION !== 'false'; // Default to simulation
const SIMULATION_MODE = true; // For demo purposes, always simulate

/**
 * Simulated SVD-based recommendations
 * Mimics collaborative filtering behavior
 */
function simulateSVDRecommendations(userId, books, userHistory, n = 10) {
  // Extract user's preferred subjects from history
  const userSubjects = userHistory
    .map(h => h.book?.subject)
    .filter(Boolean)
    .reduce((acc, subject) => {
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {});
  
  // Score books based on collaborative filtering simulation
  const scoredBooks = books.map(book => {
    let score = 0;
    
    // Subject match score
    if (userSubjects[book.subject]) {
      score += userSubjects[book.subject] * 0.4;
    }
    
    // Popularity component (borrow count)
    score += (book.borrowCount || 0) * 0.03;
    
    // Rating component
    score += (book.rating?.average || 0) * 0.1;
    
    // Add some randomness to simulate latent factors
    score += Math.random() * 0.2;
    
    return {
      book_id: book._id.toString(),
      score: parseFloat(score.toFixed(4)),
      algorithm: 'svd'
    };
  });
  
  // Sort by score and return top N
  return scoredBooks
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * Simulated NMF-based recommendations
 * Mimics non-negative matrix factorization
 */
function simulateNMFRecommendations(userId, books, userHistory, n = 10) {
  const userSubjects = userHistory
    .map(h => h.book?.subject)
    .filter(Boolean)
    .reduce((acc, subject) => {
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {});
  
  const scoredBooks = books.map(book => {
    let score = 0;
    
    // NMF focuses on non-negative features
    // Subject alignment
    if (userSubjects[book.subject]) {
      score += Math.sqrt(userSubjects[book.subject]) * 0.5;
    }
    
    // Popularity (non-linear)
    score += Math.sqrt(book.borrowCount || 1) * 0.05;
    
    // Rating (non-linear)
    score += Math.sqrt((book.rating?.average || 0) + 1) * 0.15;
    
    // Non-negative random component
    score += Math.abs(Math.random() - 0.3) * 0.3;
    
    return {
      book_id: book._id.toString(),
      score: parseFloat(score.toFixed(4)),
      algorithm: 'nmf'
    };
  });
  
  return scoredBooks
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * Simulated TF-IDF content-based recommendations
 * Mimics text similarity analysis
 */
function simulateTFIDFRecommendations(userId, books, userHistory, n = 10) {
  if (userHistory.length === 0) {
    return [];
  }
  
  // Build user profile from history
  const userProfile = {
    subjects: {},
    authors: {},
    keywords: {}
  };
  
  userHistory.forEach(h => {
    const book = h.book;
    if (!book) return;
    
    // Subject frequency
    userProfile.subjects[book.subject] = (userProfile.subjects[book.subject] || 0) + 1;
    
    // Author frequency
    userProfile.authors[book.author] = (userProfile.authors[book.author] || 0) + 1;
    
    // Extract keywords from title
    const words = (book.title || '').toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        userProfile.keywords[word] = (userProfile.keywords[word] || 0) + 1;
      }
    });
  });
  
  // Score books based on content similarity
  const scoredBooks = books.map(book => {
    let score = 0;
    
    // Subject similarity (TF-IDF component)
    if (userProfile.subjects[book.subject]) {
      const tf = userProfile.subjects[book.subject] / userHistory.length;
      const idf = Math.log(books.length / (Object.keys(userProfile.subjects).length || 1));
      score += tf * idf * 0.4;
    }
    
    // Author match
    if (userProfile.authors[book.author]) {
      score += 0.3;
    }
    
    // Keyword overlap
    const bookWords = (book.title || '').toLowerCase().split(/\s+/);
    const matchingWords = bookWords.filter(word => userProfile.keywords[word]);
    score += matchingWords.length * 0.1;
    
    // Description similarity (simplified)
    if (book.description) {
      const descWords = book.description.toLowerCase().split(/\s+/);
      const descMatches = descWords.filter(word => userProfile.keywords[word]);
      score += descMatches.length * 0.05;
    }
    
    return {
      book_id: book._id.toString(),
      score: parseFloat(score.toFixed(4)),
      algorithm: 'tfidf'
    };
  });
  
  return scoredBooks
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * Simulated Hybrid recommendations
 * Combines SVD, NMF, and TF-IDF with weights
 */
function simulateHybridRecommendations(userId, books, userHistory, n = 10) {
  const svdRecs = simulateSVDRecommendations(userId, books, userHistory, n * 2);
  const nmfRecs = simulateNMFRecommendations(userId, books, userHistory, n * 2);
  const tfidfRecs = simulateTFIDFRecommendations(userId, books, userHistory, n * 2);
  
  // Combine scores with weights
  const weights = { svd: 0.35, nmf: 0.30, tfidf: 0.35 };
  const combinedScores = {};
  
  // Aggregate scores
  [
    { recs: svdRecs, weight: weights.svd },
    { recs: nmfRecs, weight: weights.nmf },
    { recs: tfidfRecs, weight: weights.tfidf }
  ].forEach(({ recs, weight }) => {
    recs.forEach(rec => {
      if (!combinedScores[rec.book_id]) {
        combinedScores[rec.book_id] = 0;
      }
      combinedScores[rec.book_id] += rec.score * weight;
    });
  });
  
  // Convert to array and sort
  const hybridRecs = Object.entries(combinedScores).map(([book_id, score]) => ({
    book_id,
    score: parseFloat(score.toFixed(4)),
    algorithm: 'hybrid'
  }));
  
  return hybridRecs
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * Simulate temporal trending analysis
 */
function simulateTemporalTrending(transactions, n = 10) {
  const now = Date.now();
  const itemScores = {};
  
  transactions.forEach(trans => {
    const bookId = trans.book?.toString() || trans.book?._id?.toString();
    if (!bookId) return;
    
    // Calculate time weight (exponential decay)
    const daysAgo = (now - (trans.borrowDate || trans.createdAt)) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.exp(-daysAgo / 30); // 30-day decay
    
    itemScores[bookId] = (itemScores[bookId] || 0) + timeWeight;
  });
  
  return Object.entries(itemScores)
    .map(([book_id, score]) => ({
      book_id,
      trend_score: parseFloat(score.toFixed(4))
    }))
    .sort((a, b) => b.trend_score - a.trend_score)
    .slice(0, n);
}

/**
 * Simulate NLP analysis
 */
function simulateNLPAnalysis(book) {
  const description = book.description || '';
  const title = book.title || '';
  
  // Extract themes
  const themes = [];
  const themeKeywords = {
    adventure: ['adventure', 'journey', 'quest'],
    romance: ['love', 'romance', 'relationship'],
    mystery: ['mystery', 'detective', 'crime'],
    'science_fiction': ['future', 'space', 'technology'],
    fantasy: ['magic', 'wizard', 'dragon']
  };
  
  const fullText = (title + ' ' + description).toLowerCase();
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(k => fullText.includes(k))) {
      themes.push(theme);
    }
  }
  
  // Readability score (simplified)
  const words = description.split(/\s+/).length;
  const sentences = (description.match(/[.!?]/g) || []).length || 1;
  const avgSentenceLength = words / sentences;
  const readabilityScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentenceLength));
  
  return {
    entities: {
      topics: themes,
      persons: [],
      organizations: []
    },
    themes: themes.slice(0, 3),
    readability: {
      score: parseFloat(readabilityScore.toFixed(2)),
      level: readabilityScore > 70 ? 'easy' : readabilityScore > 50 ? 'moderate' : 'difficult'
    },
    keywords: extractKeywords(fullText, 10),
    sentiment: {
      sentiment: 'neutral',
      polarity: 0.0
    }
  };
}

/**
 * Extract keywords (simplified RAKE)
 */
function extractKeywords(text, n = 10) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  const words = text.toLowerCase().split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => [word, count]);
}

/**
 * A/B test variant assignment
 */
function assignABTestVariant(userId) {
  const variants = ['svd', 'nmf', 'tfidf', 'hybrid'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

/**
 * Main ML service interface
 */
class MLService {
  /**
   * Get recommendations for a user
   */
  static async getRecommendations({ userId, books, userHistory, algorithm = 'hybrid', n = 10 }) {
    // Try real ML service first
    if (!SIMULATION_MODE) {
      try {
        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/recommendations`, {
          user_id: userId,
          n_recommendations: n,
          algorithm,
          exclude_books: userHistory.map(h => h.book?._id?.toString())
        }, { timeout: 2000 });
        
        return response.data;
      } catch (error) {
        console.log('ML service unavailable, using simulation');
      }
    }
    
    // Use simulation
    let recommendations;
    switch (algorithm) {
      case 'svd':
        recommendations = simulateSVDRecommendations(userId, books, userHistory, n);
        break;
      case 'nmf':
        recommendations = simulateNMFRecommendations(userId, books, userHistory, n);
        break;
      case 'tfidf':
        recommendations = simulateTFIDFRecommendations(userId, books, userHistory, n);
        break;
      case 'hybrid':
      default:
        recommendations = simulateHybridRecommendations(userId, books, userHistory, n);
    }
    
    const variant = assignABTestVariant(userId);
    
    return {
      recommendations,
      user_id: userId,
      algorithm,
      variant,
      simulated: true,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Analyze book with NLP
   */
  static async analyzeBook(book) {
    if (!SIMULATION_MODE) {
      try {
        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/analyze-book`, {
          book
        }, { timeout: 2000 });
        
        return response.data;
      } catch (error) {
        console.log('ML service unavailable, using simulation');
      }
    }
    
    return {
      book_id: book._id?.toString(),
      analysis: simulateNLPAnalysis(book),
      simulated: true,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get trending books
   */
  static async getTrending(transactions, n = 10) {
    if (!SIMULATION_MODE) {
      try {
        const response = await axios.get(`${ML_SERVICE_URL}/api/ml/trending?n=${n}`, {
          timeout: 2000
        });
        
        return response.data;
      } catch (error) {
        console.log('ML service unavailable, using simulation');
      }
    }
    
    return {
      trending_books: simulateTemporalTrending(transactions, n),
      algorithm: 'temporal_trending',
      simulated: true
    };
  }
}

module.exports = MLService;

