const API_BASE = '/api';

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
  getDashboardStats: () => fetch(`${API_BASE}/stats`).then(handleResponse),

  // Challenges
  getChallenges: () => fetch(`${API_BASE}/challenges`).then(handleResponse),
  getChallengeById: (id) => fetch(`${API_BASE}/challenges/${id}`).then(handleResponse),
  createChallenge: (data) => fetch(`${API_BASE}/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateChallengeStatus: (id, status) => fetch(`${API_BASE}/challenges/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(handleResponse),

  // Proofs
  getProofsByChallenge: (challengeId) => fetch(`${API_BASE}/proofs?challengeId=${challengeId}`).then(handleResponse),
  getProofById: (id) => fetch(`${API_BASE}/proofs/${id}`).then(handleResponse),
  createProof: (formData) => fetch(`${API_BASE}/proofs`, {
    method: 'POST',
    body: formData // Note: no Content-Type header needed for FormData
  }).then(handleResponse)
};
