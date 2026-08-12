import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import CreateChallengePage from './pages/CreateChallengePage';
import ConfirmChallengePage from './pages/ConfirmChallengePage';
import ChallengeDetailPage from './pages/ChallengeDetailPage';
import SubmitProofPage from './pages/SubmitProofPage';

function App() {
  return (
    <Routes>
      {/* Landing page has no layout */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Main app pages wrapped in layout */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/challenges/new" element={<CreateChallengePage />} />
        <Route path="/challenges/new/confirm" element={<ConfirmChallengePage />} />
        <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
        <Route path="/challenges/:id/proof" element={<SubmitProofPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
