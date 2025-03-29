/**
 * If string contains mathematical operators, evaluates the expression and returns the result.
 * If not, simply parses the string as a number.
 */
export default function parseInputString(inputString: string): number | null {
  // Remove % symbol and trim whitespace
  const cleanedValue = inputString.replace('%', '').trim()

  // Check if the input contains mathematical operators
  const containsMathOperators = /[+\-*/]/.test(cleanedValue)

  if (containsMathOperators) {
    try {
      // Use Function constructor to safely evaluate the expression
      return Function('return ' + cleanedValue)()
    } catch (error) {
      return null // Expression evaluation failed
    }
  } else {
    // Parse as a simple number
    const parsedValue = parseFloat(cleanedValue)

    return isNaN(parsedValue) ? null : parsedValue
  }
}
