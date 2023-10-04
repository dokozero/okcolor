// Thanks to https://forum.figma.com/t/write-to-clipboard-from-custom-plugin/11860/17
const unsecuredCopyToClipboard = (textToCopy: string) => {
  // Create a textarea element
  const textArea = document.createElement('textarea')
  textArea.value = textToCopy
  document.body.appendChild(textArea)

  textArea.focus()
  textArea.select()

  // Attempt to copy the text to the clipboard
  try {
    document.execCommand('copy')
  } catch (e) {
    console.log('Unable to copy content to clipboard!', e)
  }

  // Remove the textarea element from the DOM
  document.body.removeChild(textArea)
}

export default function copyToClipboard(textToCopy: string) {
  // If the context is secure and clipboard API is available, use it
  if (window.isSecureContext && typeof navigator?.clipboard?.writeText === 'function') {
    navigator.clipboard.writeText(textToCopy)
  }
  // Otherwise, use the unsecured fallback
  else {
    unsecuredCopyToClipboard(textToCopy)
  }
}
