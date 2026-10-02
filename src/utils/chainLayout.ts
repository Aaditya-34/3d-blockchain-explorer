export const BLOCK_SPACING = 3.6;
export const BLOCK_HALF_WIDTH = 0.8;

export function getBlockPosition(
  index: number,
  total: number
): [number, number, number] {
  const x = (index - (total - 1) / 2) * BLOCK_SPACING;
  return [x, 0, 0];
}
