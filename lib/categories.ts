import { Category } from './types';

export const CATEGORIES: { name: Category; emoji: string; color: string }[] = [
  { name: 'Memes', emoji: '😂', color: 'hsl(38 92% 50%)' },
  { name: 'Questions', emoji: '❓', color: 'hsl(199 89% 48%)' },
  { name: 'Programming', emoji: '💻', color: 'hsl(142 71% 45%)' },
  { name: 'Gaming', emoji: '🎮', color: 'hsl(280 65% 60%)' },
  { name: 'Art', emoji: '🎨', color: 'hsl(340 75% 55%)' },
  { name: 'Music', emoji: '🎵', color: 'hsl(199 89% 48%)' },
  { name: 'Stories', emoji: '📖', color: 'hsl(280 65% 60%)' },
  { name: 'Random', emoji: '🎲', color: 'hsl(0 0% 55%)' },
];

export function getCategoryMeta(name: string | null) {
  return CATEGORIES.find((c) => c.name === name) ?? { name: 'Random', emoji: '🎲', color: 'hsl(0 0% 55%)' };
}

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
