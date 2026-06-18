import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AvatarSelector from './AvatarSelector';

export default function ProfileEditor({ visible, onClose }) {
  const { user, profile, updateProfile } = useAuth();
  const [gender, setGender] = useState(profile?.gender || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [saving, setSaving] = useState(false);

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 100%)',
              borderRadius: '20px', padding: '32px 24px',
              maxWidth: '420px', width: '100%',
              border: '1px solid rgba(201,168,76,0.25)',
              maxHeight: '90vh', overflow: 'auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', color: '#e8d48b', letterSpacing: '3px', fontFamily: 'var(--font-display)' }}>
                编辑个人资料
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '6px' }}>
                账号：{user?.email || ''}
              </p>
            </div>

            {/* Gender */}
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px' }}>性别</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {[
                { value: 'male', label: '♂ 男生' },
                { value: 'female', label: '♀ 女生' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setGender(opt.value); setAvatar(''); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    background: gender === opt.value ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    border: gender === opt.value ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color: gender === opt.value ? '#e8d48b' : 'rgba(255,255,255,0.5)',
                    fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Avatar */}
            {gender && (
              <>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px' }}>选择头像</p>
                <div style={{ marginBottom: '20px' }}>
                  <AvatarSelector gender={gender} selected={avatar} onSelect={setAvatar} />
                </div>
              </>
            )}

            {/* Nickname */}
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px' }}>昵称</p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 5))}
              placeholder="最多5个汉字"
              maxLength={5}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(0,0,0,0.3)',
                color: '#fff', fontSize: '16px', outline: 'none', marginBottom: '20px',
                letterSpacing: '4px', textAlign: 'center',
              }}
            />

            {/* Info */}
            <div style={{
              padding: '12px', borderRadius: '8px',
              background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)',
              marginBottom: '20px',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.6 }}>
                昵称和头像会显示在：
                <br />· 右上角的用户信息栏
                <br />· 决策日记中的记录
                <br />· 朋友灵魂拷问室的回答（朋友看到时）
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', cursor: 'pointer',
                }}>
                取消
              </button>
              <button onClick={handleSave} disabled={!nickname.trim() || saving}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: nickname.trim() ? 'linear-gradient(135deg, #c9a84c, #e8d48b)' : 'rgba(255,255,255,0.05)',
                  color: nickname.trim() ? '#1a0a2e' : 'rgba(255,255,255,0.2)',
                  border: 'none', fontSize: '14px', cursor: nickname.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                }}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
