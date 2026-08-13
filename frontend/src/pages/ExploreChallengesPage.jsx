import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowRight, Flame, Sparkles, Plus, Clock, Users, ArrowUpDown } from 'lucide-react';
import { api } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import './ExploreChallengesPage.css';

const CATEGORIES = ['All', 'Fitness', 'Coding', 'Learning', 'Health', 'Other'];

const ExploreChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, ending_soon, most_participants
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicChallenges = async () => {
      setLoading(true);
      try {
        const data = await api.getChallenges();
        if (Array.isArray(data)) {
          setChallenges(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicChallenges();
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedChallenges = useMemo(() => {
    return challenges
      .filter(c => {
        if (!c) return false;
        // Category Filter
        if (selectedCategory !== 'All' && c.category && c.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
        // Search Filter
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const titleMatch = c.title?.toLowerCase().includes(query);
          const descMatch = c.description?.toLowerCase().includes(query);
          if (!titleMatch && !descMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ending_soon') {
          return new Date(a.deadline || 0) - new Date(b.deadline || 0);
        }
        if (sortBy === 'most_participants') {
          const countA = a.participants?.length || 0;
          const countB = b.participants?.length || 0;
          return countB - countA;
        }
        // Default: Newest
        return new Date(b.createdAt || b._id || 0) - new Date(a.createdAt || a._id || 0);
      });
  }, [challenges, selectedCategory, searchQuery, sortBy]);

  if (loading) {
    return <div className="container text-center mt-8 text-muted">Loading community challenges...</div>;
  }

  if (error) {
    return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  }

  return (
    <div className="explore-challenges-page">
      {/* Community Header */}
      <div className="explore-header-card mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="explore-badge-pill mb-2">
              <Sparkles size={14} /> Public Community Feed
            </div>
            <h1 className="explore-title">Explore Challenges</h1>
            <p className="explore-subtitle">
              Discover challenges from the community. Stake, commit, and prove yourself.
            </p>
          </div>
          <Link to="/challenges/new" className="btn btn-primary">
            <Plus size={16} /> Create Challenge
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="explore-toolbar mt-6">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search challenges by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="sort-dropdown-wrapper">
            <ArrowUpDown size={16} className="sort-icon" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="ending_soon">Ending Soon</option>
              <option value="most_participants">Most Participants</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="category-pills-row mt-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex justify-between items-center mb-4">
        <span className="results-count">
          Showing <strong>{filteredAndSortedChallenges.length}</strong> {filteredAndSortedChallenges.length === 1 ? 'challenge' : 'community challenges'}
        </span>
      </div>

      {/* Challenge Grid */}
      {filteredAndSortedChallenges.length === 0 ? (
        <div className="card text-center py-12" style={{ borderStyle: 'dashed' }}>
          <Flame size={32} className="mx-auto mb-3 text-muted" />
          <h3 className="mb-2">No matching challenges found</h3>
          <p className="text-muted mb-4">Try adjusting your search query or category filters.</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} 
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="explore-challenges-grid">
          {filteredAndSortedChallenges.map(challenge => (
            <ChallengeCard key={challenge._id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreChallengesPage;
