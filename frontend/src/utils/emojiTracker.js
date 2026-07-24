const STORAGE_KEY = 'chatme_emoji_usage_v1';

const DEFAULT_MOST_USED = ['❤️', '😂', '👍', '🔥', '😍', '😊', '🙌', '🎉'];

export const trackEmojiUsage = (emoji) => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const usage = rawData ? JSON.parse(rawData) : {};
    usage[emoji] = (usage[emoji] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch (err) {
    console.error('Error saving emoji usage:', err);
  }
};

export const getMostUsedEmojis = (limit = 10) => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return DEFAULT_MOST_USED;

    const usage = JSON.parse(rawData);
    const sorted = Object.keys(usage).sort((a, b) => usage[b] - usage[a]);

    if (sorted.length === 0) return DEFAULT_MOST_USED;

    // Combine custom used emojis with default fallbacks to ensure full list
    const combined = Array.from(new Set([...sorted, ...DEFAULT_MOST_USED]));
    return combined.slice(0, limit);
  } catch (err) {
    return DEFAULT_MOST_USED;
  }
};
