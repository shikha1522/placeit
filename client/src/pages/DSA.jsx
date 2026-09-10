// Import required dependencies
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DSA.css';

// DSA Questions page component
const DSA = () => {
  // State for questions list
  const [questions, setQuestions] = useState([]);

  // State for pagination info
  const [pagination, setPagination] = useState({});

  // State for loading indicator
  const [loading, setLoading] = useState(true);

  // State for search input value
  const [search, setSearch] = useState('');

  // State for difficulty filter
  const [difficulty, setDifficulty] = useState('');

  // State for topic filter
  const [topic, setTopic] = useState('');

  // State for current page
  const [page, setPage] = useState(1);

  // State for user stats
  const [stats, setStats] = useState(null);

  // Navigation hook
  const navigate = useNavigate();

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Fetch questions from backend with current filters
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);

      // Build query string from active filters
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (difficulty) params.append('difficulty', difficulty);
      if (topic) params.append('topic', topic);
      params.append('page', page);

      // Call backend API
      const res = await fetch(`/api/questions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      // Update state with fetched questions
      if (data.success) {
        setQuestions(data.questions);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Fetch questions error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, topic, page, token]);

  // Fetch user stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/questions/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.byDifficulty);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  // Fetch questions whenever filters change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

  // Fetch stats once on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Handle marking question as solved
  // Handle marking question as solved/unsolved
const handleSolve = async (id) => {
  try {
    await fetch(`/api/questions/${id}/solve`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Update only this question's solved status locally, no full refetch
    setQuestions(prev =>
      prev.map(q => q.id === id ? { ...q, solved: !q.solved } : q)
    );

    // Refresh stats only (small, doesn't trigger page loading state)
    fetchStats();
  } catch (err) {
    console.error('Solve error:', err);
  }
};

  // Reset all filters to default
  const handleReset = () => {
    setSearch('');
    setDifficulty('');
    setTopic('');
    setPage(1);
  };

  // Get color class based on difficulty
  const getDifficultyColor = (diff) => {
    if (diff === 'easy') return 'diff-easy';
    if (diff === 'medium') return 'diff-medium';
    return 'diff-hard';
  };

  // Get solved count from stats for a difficulty
  const getSolvedCount = (diff) => {
    if (!stats) return { solved: 0, total: 0 };
    const found = stats.find(s => s.difficulty === diff);
    return found ? { solved: parseInt(found.solved), total: parseInt(found.total) } : { solved: 0, total: 0 };
  };

  return (
    <div className="dsa-container">

      {/* Page header */}
      <div className="dsa-header">
        <h1>DSA Questions</h1>
        <p>Practice company-tagged interview questions</p>
      </div>

      {/* Stats strip showing solved by difficulty */}
      <div className="dsa-stats">
        {['easy', 'medium', 'hard'].map(diff => {
          const { solved, total } = getSolvedCount(diff);
          return (
            <div key={diff} className={`stat-card stat-${diff}`}>
              <span className="stat-label">{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
              <span className="stat-count">{solved} / {total}</span>
            </div>
          );
        })}
      </div>

      {/* Search and filter bar */}
      <div className="dsa-filters">

        {/* Search input */}
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="dsa-search"
        />

        {/* Difficulty dropdown */}
        <select
          value={difficulty}
          onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
          className="dsa-select"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* Topic dropdown */}
        <select
          value={topic}
          onChange={(e) => { setTopic(e.target.value); setPage(1); }}
          className="dsa-select"
        >
          <option value="">All Topics</option>
          <option value="array">Array</option>
          <option value="string">String</option>
          <option value="linked list">Linked List</option>
          <option value="stack">Stack</option>
          <option value="queue">Queue</option>
          <option value="tree">Tree</option>
          <option value="graph">Graph</option>
          <option value="dynamic programming">Dynamic Programming</option>
          <option value="binary search">Binary Search</option>
          <option value="recursion">Recursion</option>
          <option value="greedy">Greedy</option>
          <option value="backtracking">Backtracking</option>
        </select>

        {/* Reset filters button */}
        <button onClick={handleReset} className="dsa-reset-btn">
          Reset
        </button>
      </div>

      {/* Questions count */}
      <div className="dsa-count">
        {!loading && (
          <span>{pagination.totalCount || 0} questions found</span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="dsa-loading">Loading questions...</div>
      )}

      {/* Questions list */}
      {!loading && (
        <div className="dsa-list">
          {questions.length === 0 ? (
            <div className="dsa-empty">No questions found</div>
          ) : (
            questions.map((q, index) => (
              <div key={q.id} className="question-card">

                {/* Question number */}
                <span className="q-number">
                  {(pagination.currentPage - 1) * 20 + index + 1}
                </span>

                {/* Question title and meta */}
                <div className="q-info">
                  <h3 className="q-title">{q.title}</h3>
                  <div className="q-meta">
                    <span className="q-topic">{q.topic}</span>
                    {q.company_name && (
                      <span className="q-company">{q.company_name}</span>
                    )}
                  </div>
                </div>

                {/* Difficulty badge */}
                <span className={`q-difficulty ${getDifficultyColor(q.difficulty)}`}>
                  {q.difficulty}
                </span>

                {/* Action buttons */}
                <div className="q-actions">

                  {/* LeetCode link */}
                  <a
                    href={q.leetcode_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="q-link-btn"
                  >
                    LC
                  </a>

                  {/* Solved toggle button */}
                  <button
                    onClick={() => handleSolve(q.id)}
                    className={`q-solve-btn ${q.solved ? 'solved' : ''}`}
                  >
                    {q.solved ? '✓' : 'Mark'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="dsa-pagination">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="page-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === pagination.totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DSA;