import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Game1_InstinctHand from './pages/Game1_InstinctHand';
import Game2_ParallelLetters from './pages/Game2_ParallelLetters';
import Game3_FriendRoom from './pages/Game3_FriendRoom';
import Game4_ReverseFear from './pages/Game4_ReverseFear';
import Game5_ValueAuction from './pages/Game5_ValueAuction';
import DecisionDiary from './pages/DecisionDiary';
import DecisionMuseum from './pages/DecisionMuseum';
import './styles/index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#e8d48b' }}>🎭</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/game/instinct-hand" element={<Game1_InstinctHand />} />
            <Route path="/game/parallel-letters" element={<Game2_ParallelLetters />} />
            <Route path="/game/friend-room" element={<Game3_FriendRoom />} />
            <Route path="/game/reverse-fear" element={<Game4_ReverseFear />} />
            <Route path="/game/value-auction" element={<Game5_ValueAuction />} />
            <Route path="/diary" element={
              <ProtectedRoute><DecisionDiary /></ProtectedRoute>
            } />
            <Route path="/museum" element={<DecisionMuseum />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
}
