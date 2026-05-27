export const CATEGORIES = [
  { id: 'groceries', label: 'Groceries', emoji: '🛒', color: '#10b981' },
  { id: 'food', label: 'Food & Drink', emoji: '🍕', color: '#f59e0b' },
  { id: 'transport', label: 'Transport', emoji: '🚗', color: '#3b82f6' },
  { id: 'health', label: 'Health', emoji: '💊', color: '#ec4899' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#8b5cf6' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎮', color: '#06b6d4' },
  { id: 'bills', label: 'Bills', emoji: '🏠', color: '#64748b' },
  { id: 'fitness', label: 'Fitness', emoji: '💪', color: '#84cc16' },
  { id: 'learning', label: 'Learning', emoji: '📚', color: '#f97316' },
  { id: 'travel', label: 'Travel', emoji: '✈️', color: '#14b8a6' },
  { id: 'pets', label: 'Pets', emoji: '🐾', color: '#a78bfa' },
  { id: 'gifts', label: 'Gifts', emoji: '🎁', color: '#fb7185' },
  { id: 'other', label: 'Other', emoji: '📦', color: '#94a3b8' },
]

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
