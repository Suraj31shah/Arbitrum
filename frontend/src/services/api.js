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
  getDashboardStats: (wallet) => fetch(`${API_BASE}/stats${wallet ? `?walletAddress=${wallet}` : ''}`, { credentials: 'include' }).then(handleResponse),

  // Challenges
  getChallenges: (filter = '', wallet = '') => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (wallet) params.append('wallet', wallet);
    const queryString = params.toString();
    return fetch(`${API_BASE}/challenges${queryString ? `?${queryString}` : ''}`, { credentials: 'include' }).then(handleResponse);
  },
  getChallengeById: (id) => fetch(`${API_BASE}/challenges/${id}?t=${Date.now()}`, { credentials: 'include' }).then(handleResponse),
  createChallenge: (data) => fetch(`${API_BASE}/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse),
  joinChallenge: (id) => fetch(`${API_BASE}/challenges/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  }).then(handleResponse),
  updateChallengeStatus: (id, status) => fetch(`${API_BASE}/challenges/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  }).then(handleResponse),
  updateParticipantStatus: (id, walletAddress, status) => fetch(`${API_BASE}/challenges/${id}/participant`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ walletAddress, status })
  }).then(handleResponse),

  // Proofs
  getProofsByChallenge: (challengeId, walletAddress = '') => fetch(`${API_BASE}/proofs?challengeId=${challengeId}${walletAddress ? `&walletAddress=${walletAddress}` : ''}`, { credentials: 'include' }).then(handleResponse),
  getProofById: (id) => fetch(`${API_BASE}/proofs/${id}?t=${Date.now()}`, { credentials: 'include' }).then(handleResponse),
  createProof: (formData) => fetch(`${API_BASE}/proofs`, {
    method: 'POST',
    credentials: 'include',
    body: formData // Note: no Content-Type header needed for FormData
  }).then(handleResponse),
  getIntegrationPreview: (challengeId) => fetch(`${API_BASE}/challenges/${challengeId}/integration-preview`, { credentials: 'include' }).then(handleResponse)
};
