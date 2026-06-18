import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ParticleBackground from './ParticleBackground';
import OnboardingModal from './OnboardingModal';
import ProfileEditor from './ProfileEditor';
import { avatarStyle, DEFAULT_AVATAR, defaultDisplayName } from '../utils/profile';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, profile, signOut, isNewUser } = useAuth();
  const isHome = location.pathname === '/';
  const hideHeader = location.pathname === '/login' || location.pathname === '/register';
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Show onboarding when new user detected
  const shouldShowOnboarding = user && isNewUser && !hideHeader;

  const displayName = profile?.nickname || defaultDisplayName(user?.email);
  const avatarCfg = profile?.avatar
    ? avatarStyle(profile.avatar, profile.gender, 36)
    : { ...avatarStyle(DEFAULT_AVATAR.id, '', 36), background: 'linear-gradient(135deg, #6B7280, #9CA3AF)' };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <ParticleBackground />

      {/* Onboarding modal */}
      <OnboardingModal
        visible={shouldShowOnboarding || showOnboarding}
        onClose={() => { setShowOnboarding(false); }}
      />

      {/* Profile editor */}
      <ProfileEditor
        visible={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
      />

      {/* Header */}
      {!hideHeader && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
            background: 'rgba(26,10,46,0.8)',
            backdropFilter: 'blur(20px)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ fontSize: '24px' }}>🎭</span>
            <div>
              <h1 style={{
                fontSize: '18px',
                fontFamily: 'var(--font-display)',
                color: '#e8d48b',
                letterSpacing: '3px',
                lineHeight: 1.2,
              }}>
                内心剧场
              </h1>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: isHome ? '#e8d48b' : 'rgba(255,255,255,0.6)', fontSize: '13px', letterSpacing: '2px' }}>
              剧场大厅
            </Link>
            <Link to="/diary" style={{ color: location.pathname === '/diary' ? '#e8d48b' : 'rgba(255,255,255,0.6)', fontSize: '13px', letterSpacing: '2px' }}>
              决策日记
            </Link>
            <Link to="/museum" style={{ color: location.pathname === '/museum' ? '#e8d48b' : 'rgba(255,255,255,0.6)', fontSize: '13px', letterSpacing: '2px' }}>
              人生博物馆
            </Link>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* User avatar + name — clickable */}
                <button
                  onClick={() => setShowProfileEditor(true)}
                  title="编辑个人资料"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.12)',
                    borderRadius: '20px', padding: '4px 12px 4px 4px', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <div style={avatarCfg}>
                    <span style={{ fontSize: '16px' }}>
                      {profile?.avatar ? '👤' : DEFAULT_AVATAR.emoji}
                    </span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', letterSpacing: '1px' }}>
                    {displayName}
                  </span>
                </button>

                {/* Logout */}
                <button onClick={signOut}
                  style={{
                    background: 'none', color: 'rgba(255,255,255,0.35)',
                    border: 'none', fontSize: '11px', cursor: 'pointer',
                  }}>
                  退出
                </button>
              </div>
            ) : (
              <Link to="/login" style={{ color: 'rgba(201,168,76,0.8)', fontSize: '13px', letterSpacing: '2px' }}>
                登录
              </Link>
            )}
          </nav>
        </motion.header>
      )}

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 77px)' }}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '32px',
        borderTop: '1px solid rgba(201,168,76,0.1)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px',
        letterSpacing: '2px',
      }}>
        <p>🎭 内心剧场 · 听见你心底的声音</p>
      </footer>
    </div>
  );
}
