import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AvatarSelector from './AvatarSelector';

export default function OnboardingModal({ visible, onClose }) {
  const { updateProfile } = useAuth();
  const [step, setStep] = useState('gender');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setStep('gender');
      setGender('');
      setAvatar('');
      setNickname('');
    }
  }, [visible]);

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    await updateProfile({
      nickname: nickname.trim().slice(0, 5),
      gender,
      avatar,
    });
    setSaving(false);
    onClose();
  };

  const handleSkip = async () => {
    // Write empty profile so onboarding doesn't show again
    await updateProfile({ nickname: '', gender: '', avatar: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              background: 'linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 100%)',
              borderRadius: '20px', padding: '32px 24px',
              maxWidth: '420px', width: '100%',
              border: '1px solid rgba(201,168,76,0.25)',
              maxHeight: '90vh', overflow: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>🎭</span>
              <h2 style={{ fontSize: '20px', color: '#e8d48b', letterSpacing: '3px', fontFamily: 'var(--font-display)' }}>
                欢迎来到内心剧场
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '8px' }}>
                设置你的剧场身份，让朋友认出你
              </p>
            </div>

            {/* Step 1: Gender */}
            {step === 'gender' && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                  选择你的性别
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { value: 'male', label: '♂ 男生', emoji: '👨' },
                    { value: 'female', label: '♀ 女生', emoji: '👩' },
                  ].map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setGender(opt.value); setStep('avatar'); }}
                      style={{
                        flex: 1, padding: '24px 16px', borderRadius: '12px',
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: '#e8d48b', fontSize: '16px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '36px' }}>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Avatar */}
            {step === 'avatar' && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
                  选一个你喜欢的头像
                </p>
                <AvatarSelector gender={gender} selected={avatar} onSelect={setAvatar} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setStep('gender')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', cursor: 'pointer',
                    }}>
                    返回
                  </button>
                  <button onClick={() => setStep('nickname')} disabled={!avatar}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: avatar ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.05)',
                      color: avatar ? '#fff' : 'rgba(255,255,255,0.2)',
                      border: 'none', fontSize: '14px', cursor: avatar ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                    }}>
                    继续
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Nickname */}
            {step === 'nickname' && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                  设置你的昵称（最多5个汉字）
                </p>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    if (!isComposing) setNickname(e.target.value.slice(0, 5));
                    else setNickname(e.target.value);
                  }}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsComposing(false);
                    setNickname(e.target.value.slice(0, 5));
                  }}
                  placeholder="输入你的昵称"
                  maxLength={10}
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '10px',
                    border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)',
                    color: '#fff', fontSize: '18px', outline: 'none', textAlign: 'center',
                    letterSpacing: '4px',
                  }}
                />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textAlign: 'center', marginTop: '8px' }}>
                  昵称和头像会在朋友看到你的回答时显示<br />还会出现在决策日记中
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setStep('avatar')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', cursor: 'pointer',
                    }}>
                    返回
                  </button>
                  <button onClick={handleSave} disabled={!nickname.trim() || saving}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: nickname.trim() ? 'linear-gradient(135deg, #c9a84c, #e8d48b)' : 'rgba(255,255,255,0.05)',
                      color: nickname.trim() ? '#1a0a2e' : 'rgba(255,255,255,0.2)',
                      border: 'none', fontSize: '14px', cursor: nickname.trim() ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                    }}>
                    {saving ? '保存中...' : '✓ 完成'}
                  </button>
                </div>
              </div>
            )}

            {/* Skip */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={handleSkip}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.35)', fontSize: '12px',
                  cursor: 'pointer', textDecoration: 'underline',
                }}>
                以后再说
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
