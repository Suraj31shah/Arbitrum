export const getApiUrl = () => {
  // If deployed, this will be your backend URL. If local, it defaults to localhost.
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

const API_BASE = `${getApiUrl()}/api`;

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.details || errorMessage;
    } catch (e) {
      // Ignore if not JSON
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const api = {
  // Stats
  getDashboardStats: () => fetch(`${API_BASE}/stats`, { credentials: 'include' }).then(handleResponse),

  // Challenges
  getChallenges: () => fetch(`${API_BASE}/challenges`, { credentials: 'include' }).then(handleResponse),
  getChallengeById: (id) => fetch(`${API_BASE}/challenges/${id}?t=${Date.now()}`, { credentials: 'include' }).then(handleResponse),
  createChallenge: (data) => fetch(`${API_BASE}/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateChallengeStatus: (id, status) => fetch(`${API_BASE}/challenges/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  }).then(handleResponse),

  // Proofs
  getProofsByChallenge: (challengeId) => fetch(`${API_BASE}/proofs?challengeId=${challengeId}`, { credentials: 'include' }).then(handleResponse),
  getProofById: (id) => fetch(`${API_BASE}/proofs/${id}?t=${Date.now()}`, { credentials: 'include' }).then(handleResponse),
  createProof: (formData) => fetch(`${API_BASE}/proofs`, {
    method: 'POST',
    credentials: 'include',
    body: formData // Note: no Content-Type header needed for FormData
  }).then(handleResponse)
};
