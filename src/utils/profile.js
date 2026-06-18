import { supabase } from './supabase';

// ====== 头像预设 ======
export const MALE_AVATARS = [
  { id: 'm1', emoji: '🧔‍♂️', bg: ['#8B4513', '#A0522D'], label: '稳重' },
  { id: 'm2', emoji: '👨‍💻', bg: ['#2563EB', '#3B82F6'], label: '科技' },
  { id: 'm3', emoji: '🧑‍🔬', bg: ['#0D9488', '#14B8A6'], label: '探索' },
  { id: 'm4', emoji: '🧑‍🎨', bg: ['#7C3AED', '#A855F7'], label: '艺术' },
  { id: 'm5', emoji: '🧑‍🚀', bg: ['#1E3A5F', '#2563EB'], label: '冒险' },
  { id: 'm6', emoji: '👨‍🎤', bg: ['#DC2626', '#EF4444'], label: '摇滚' },
  { id: 'm7', emoji: '🧑‍🏫', bg: ['#059669', '#10B981'], label: '睿智' },
  { id: 'm8', emoji: '🧑‍⚖️', bg: ['#1E293B', '#475569'], label: '公正' },
];

export const FEMALE_AVATARS = [
  { id: 'f1', emoji: '👩‍💻', bg: ['#DB2777', '#EC4899'], label: '聪慧' },
  { id: 'f2', emoji: '👩‍🔬', bg: ['#E11D48', '#F43F5E'], label: '热情' },
  { id: 'f3', emoji: '👩‍🎨', bg: ['#9333EA', '#C084FC'], label: '创意' },
  { id: 'f4', emoji: '👩‍🚀', bg: ['#0891B2', '#22D3EE'], label: '梦想' },
  { id: 'f5', emoji: '👩‍🎤', bg: ['#BE185D', '#F472B6'], label: '自由' },
  { id: 'f6', emoji: '👩‍🏫', bg: ['#059669', '#34D399'], label: '知性' },
  { id: 'f7', emoji: '👩‍⚖️', bg: ['#B45309', '#F59E0B'], label: '坚毅' },
  { id: 'f8', emoji: '👸', bg: ['#9D174D', '#F43F5E'], label: '优雅' },
];

export const DEFAULT_AVATAR = { id: 'default', emoji: '🎭', bg: ['#6B7280', '#9CA3AF'], label: '默认' };

export function getAvatarConfig(avatarId, gender) {
  if (!avatarId) return DEFAULT_AVATAR;
  const list = gender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;
  return list.find(a => a.id === avatarId) || DEFAULT_AVATAR;
}

export function getAvatarConfigById(avatarId) {
  if (!avatarId || avatarId === 'default') return DEFAULT_AVATAR;
  const all = [...MALE_AVATARS, ...FEMALE_AVATARS];
  return all.find(a => a.id === avatarId) || DEFAULT_AVATAR;
}

// ====== 头像渲染组件 props ======
export function avatarStyle(avatarId, gender, size = 40) {
  const cfg = getAvatarConfig(avatarId, gender);
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${cfg.bg[0]}, ${cfg.bg[1]})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.5,
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    userSelect: 'none',
  };
}

// ====== Profile API ======
export async function getProfile(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function upsertProfile(userId, { nickname, gender, avatar }) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      nickname: (nickname || '').slice(0, 10),
      gender: gender || '',
      avatar: avatar || '',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 邮箱脱敏：中间三位显示为 ***
export function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [name, domain] = email.split('@');
  if (name.length <= 3) return `${name[0]}***@${domain}`;
  const visible = name.length > 6 ? 3 : 2;
  return `${name.slice(0, visible)}***${name.slice(-1)}@${domain}`;
}

// 生成默认访客名
export function defaultDisplayName(email) {
  if (!email) return '访客';
  return maskEmail(email);
}
