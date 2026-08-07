import { useState } from 'react';

function App() {
  // Form state mapping to backend fields
  const [title, setTitle] = useState(''); // maps to Goal.title
  const [description, setDescription] = useState(''); // maps to Goal.description and Proof.description
  const [githubUrl, setGithubUrl] = useState(''); // maps to Proof.githubUrl
  const [websiteUrl, setWebsiteUrl] = useState(''); // maps to Proof.websiteUrl
  const [file, setFile] = useState(null); // maps to uploaded file (Multer "file")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // 1️⃣ Create a Goal first (backend expects title, description, stakeAmount, deadline, status)
      const goalResp = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          stakeAmount: 1, // positive number as required by goalController
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
          status: 'active'
        })
      });
      
      if (!goalResp.ok) {
        const err = await goalResp.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create goal (HTTP ${goalResp.status})`);
      }
      
      const goalData = await goalResp.json();
      const goalId = goalData._id || 'local-goal-id'; // backend goal ID or fallback string if local storage

      // 2️⃣ Submit Proof with file upload
      const formData = new FormData();
      formData.append('goalId', goalId);
      formData.append('githubUrl', githubUrl);
      formData.append('websiteUrl', websiteUrl);
      formData.append('description', description);
      formData.append('status', 'pending');
      if (file) formData.append('file', file);

      const proofResp = await fetch('/api/proofs', {
        method: 'POST',
        body: formData
      });
      
      if (!proofResp.ok) {
        const err = await proofResp.json().catch(() => ({}));
        const msg = err.details ? `${err.error} Details: ${err.details}` : (err.error || `Proof creation failed (HTTP ${proofResp.status})`);
        throw new Error(msg);
      }
      
      const proofData = await proofResp.json();
      // AI analysis is stored under proofData.aiAnalysis
      setResult(proofData.aiAnalysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>CredStreak Backend Test Page</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '0.5rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Goal Title (maps to Goal.title):
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Description (maps to Goal.description & Proof.description):
          <textarea value={description} onChange={e => setDescription(e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          GitHub URL (maps to Proof.githubUrl):
          <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Website URL (maps to Proof.websiteUrl):
          <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Upload Image (handled by Multer as file field):
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} required />
        </label>
        <button type="submit" disabled={loading} style={{ marginTop: '1rem', padding: '0.5rem' }}>
          {loading ? 'Submitting...' : 'Submit Proof'}
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>}
      {result && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h2>AI Analysis Result</h2>
          <p><strong>Confidence:</strong> {result.confidence}%</p>
          <p><strong>Completed:</strong> {result.completed ? 'Yes' : 'No'}</p>
          <p><strong>Strengths:</strong> {Array.isArray(result.strengths) ? result.strengths.join(', ') : 'None'}</p>
          <p><strong>Missing Evidence:</strong> {Array.isArray(result.missingEvidence) ? result.missingEvidence.join(', ') : 'None'}</p>
          <p><strong>Summary:</strong> {result.summary}</p>
          <p><strong>Recommendation:</strong> {result.recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default App;
