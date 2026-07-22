// Deterministic gradient picker from a seed string (e.g. username or user id).
// Produces consistent avatar colors without needing to fetch the user row.

const GRADIENTS: [string, string][] = [
  ['#22d3ee', '#0ea5e9'], // cyan→sky
  ['#34d399', '#10b981'], // emerald
  ['#a78bfa', '#8b5cf6'], // violet
  ['#f472b6', '#ec4899'], // pink
  ['#fbbf24', '#f59e0b'], // amber
  ['#60a5fa', '#3b82f6'], // blue
  ['#fb7185', '#f43f5e'], // rose
  ['#2dd4bf', '#14b8a6'], // teal
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function gradientFor(seed: string): { from: string; to: string } {
  const [from, to] = GRADIENTS[hashStr(seed) % GRADIENTS.length];
  return { from, to };
}

export function randomGradient(): { from: string; to: string; color: string } {
  const [from, to] = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  return { from, to, color: from };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
