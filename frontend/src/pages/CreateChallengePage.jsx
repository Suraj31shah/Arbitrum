import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateChallengePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    stakeAmount: 0.01
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stakeAmount' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    if (new Date(formData.deadline) <= new Date()) {
      alert('Deadline must be in the future');
      return;
    }

    if (formData.stakeAmount <= 0) {
      alert('Stake amount must be greater than 0');
      return;
    }

    // Move to confirm step, pass data via router state
    navigate('/challenges/new/confirm', { state: { challengeData: formData } });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="mb-2">New Commitment</h1>
      <p className="text-muted mb-8">Define what you want to achieve and set the stakes.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label" htmlFor="title">Challenge Title</label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Run 5km every day for a week"
            required
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Details</label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the exact requirements for this to be considered complete..."
            required
          />
        </div>

        <div className="flex gap-4 mb-8">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="deadline">Deadline</label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              className="form-input"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="stakeAmount">Stake Amount (ETH)</label>
            <input
              type="number"
              id="stakeAmount"
              name="stakeAmount"
              className="form-input"
              value={formData.stakeAmount}
              onChange={handleChange}
              step="0.001"
              min="0.001"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full">
          Continue to Confirmation
        </button>
      </form>
    </div>
  );
};

export default CreateChallengePage;
