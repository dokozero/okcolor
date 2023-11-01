export default function roundWithDecimal(value: number, numberOfDecimal = 1): number {
  const roundFormulaValue = Math.pow(10, numberOfDecimal)
  return Math.round(value * roundFormulaValue) / roundFormulaValue
}
