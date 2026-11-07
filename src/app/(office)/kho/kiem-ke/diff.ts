/** Tỷ lệ lệch kiểm kê — cùng công thức với submitCount (H9: > 2% cần duyệt) */
export const TOLERANCE = 0.02;
export function diffRatio(book: number, actual: number) {
  const base = Math.abs(book);
  return base === 0 ? (actual === 0 ? 0 : 1) : (actual - book) / base;
}
