export default function clampNumber(num: number, min: number, max: number): number {
  if (num < min) return min
  else if (num > max) return max
  else return num
}
