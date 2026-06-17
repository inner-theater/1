import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '420px', margin: '80px auto', padding: '0 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>🎭</span>
          <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px', marginTop: '8px' }}>
            登录内心剧场
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'rgba(35,20,56,0.8)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid rgba(201,168,76,0.2)',
        }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <label style={{ color: '#e8d48b', fontSize: '13px', letterSpacing: '1px', marginBottom: '6px', display: 'block' }}>邮箱</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required
            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '16px' }} />

          <label style={{ color: '#e8d48b', fontSize: '13px', letterSpacing: '1px', marginBottom: '6px', display: 'block' }}>密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" required
            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '24px' }} />

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #c9a84c, #e8d48b)',
              color: '#1a0a2e', fontSize: '15px', fontWeight: 'bold', letterSpacing: '2px', border: 'none',
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
            {loading ? '登录中...' : '登 录'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            还没有账号？<Link to="/register" style={{ color: '#c9a84c' }}>注册</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
