import { supabase } from './supabase';

const PREFIX = 'inner_theater_';

// Check if user is logged in
function getUserId() {
  try {
    return supabase.auth.getSession().then(({ data }) => data.session?.user?.id || null).catch(() => null);
  } catch { return null; }
}

// -------- 本地 localStorage 兼容层 --------
const local = {
  get(key) {
    try { const raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
  },
  remove(key) { localStorage.removeItem(PREFIX + key); },
};

// -------- Supabase 数据库操作 --------
const remote = {
  async getUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch { return null; }
  },

  async getDiary(userId) {
    const { data } = await supabase
      .from('decision_diary')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    return data || [];
  },

  async addDiaryEntry(userId, entry) {
    const { data } = await supabase
      .from('decision_diary')
      .insert({
        user_id: userId,
        game: entry.game,
        question: entry.question || '',
        result: entry.result || '',
        type: entry.type || '',
      })
      .select()
      .single();
    return data;
  },
};

// -------- 统一接口 --------
export const storage = {
  get(key) { return local.get(key); },
  set(key, value) { return local.set(key, value); },
  remove(key) { local.remove(key); },

  // 决策日记：优先 Supabase，fallback localStorage
  async getDiary() {
    const userId = await remote.getUser();
    if (userId) {
      const diary = await remote.getDiary(userId);
      return diary.map(d => ({
        id: d.id,
        game: d.game,
        question: d.question,
        result: d.result,
        type: d.type,
        timestamp: d.created_at,
      }));
    }
    return local.get('diary') || [];
  },

  async addDiaryEntry(entry) {
    const userId = await remote.getUser();
    if (userId) {
      await remote.addDiaryEntry(userId, entry);
    }
    // Also save locally as fallback
    const diary = local.get('diary') || [];
    diary.unshift({ ...entry, id: Date.now().toString(36), timestamp: new Date().toISOString() });
    local.set('diary', diary.slice(0, 200));
    return diary;
  },

  // 决策博物馆（local only）
  getMuseum() { return this.get('museum') || []; },
  addMuseumItem(item) {
    const museum = this.getMuseum();
    museum.unshift({ ...item, id: Date.now().toString(36), timestamp: new Date().toISOString(), likes: 0 });
    this.set('museum', museum);
    return museum;
  },
  toggleMuseumLike(id) {
    const museum = this.getMuseum();
    const idx = museum.findIndex((item) => item.id === id);
    if (idx > -1) { museum[idx].likes = (museum[idx].likes || 0) + 1; this.set('museum', museum); }
    return museum;
  },

  // 分享链接
  createShareLink(gameType, data) {
    const code = Date.now().toString(36).toUpperCase();
    this.set(`share_${code}`, { gameType, data, timestamp: new Date().toISOString() });
    return code;
  },
  getShareData(code) { return this.get(`share_${code}`); },

  // AI 调用计数
  async getDailyUsage() {
    const userId = await remote.getUser();
    if (!userId) return -1; // not logged in
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('daily_ai_usage')
      .select('call_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();
    return data?.call_count || 0;
  },

  async incrementDailyUsage() {
    const userId = await remote.getUser();
    if (!userId) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const { data: current } = await supabase
      .from('daily_ai_usage')
      .select('id, call_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    if (current) {
      await supabase.from('daily_ai_usage').update({ call_count: current.call_count + 1 }).eq('id', current.id);
      return current.call_count + 1;
    } else {
      await supabase.from('daily_ai_usage').insert({ user_id: userId, usage_date: today, call_count: 1 });
      return 1;
    }
  },
};

export default storage;
