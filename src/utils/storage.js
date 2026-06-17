// LocalStorage 工具 - 数据持久化
const PREFIX = 'inner_theater_';

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },

  // 决策日记
  getDiary() {
    return this.get('diary') || [];
  },

  addDiaryEntry(entry) {
    const diary = this.getDiary();
    diary.unshift({
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      timestamp: new Date().toISOString(),
    });
    this.set('diary', diary);
    return diary;
  },

  // 决策博物馆
  getMuseum() {
    return this.get('museum') || [];
  },

  addMuseumItem(item) {
    const museum = this.getMuseum();
    museum.unshift({
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      timestamp: new Date().toISOString(),
      likes: 0,
    });
    this.set('museum', museum);
    return museum;
  },

  toggleMuseumLike(id) {
    const museum = this.getMuseum();
    const idx = museum.findIndex((item) => item.id === id);
    if (idx > -1) {
      museum[idx].likes = (museum[idx].likes || 0) + 1;
      this.set('museum', museum);
    }
    return museum;
  },

  // 分享链接
  createShareLink(gameType, data) {
    const code = Date.now().toString(36).toUpperCase();
    this.set(`share_${code}`, { gameType, data, timestamp: new Date().toISOString() });
    return code;
  },

  getShareData(code) {
    return this.get(`share_${code}`);
  },
};

export default storage;
