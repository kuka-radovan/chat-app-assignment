import ColorHash from 'color-hash';

// Lightness/saturation are constrained so the generated colors stay dark and
// vivid enough for white avatar text to remain legible.
const colorHash = new ColorHash({
  lightness: [0.4, 0.5],
  saturation: [0.5, 0.65],
});

const cache = new Map<string, string>();

export function avatarColor(seed: string): string {
  let color = cache.get(seed);
  if (color === undefined) {
    color = colorHash.hex(seed);
    cache.set(seed, color);
  }
  return color;
}

export function avatarInitial(nickname: string): string {
  return nickname.trim().charAt(0).toUpperCase() || '?';
}
