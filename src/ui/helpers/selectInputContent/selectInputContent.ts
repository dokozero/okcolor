export default function selectInputContent(event: React.MouseEvent<HTMLInputElement>) {
  const eventTarget = event.target as HTMLInputElement

  eventTarget.select()

  // This is a fix as in some cases, if the user update the value of an input then click again inside it, in some cases the above select will not work. To counter this, we use this setTimeout callback.
  // Update, we deactivate it for now as updating multiple time the same input lead to error because the below select can happen while editing the input.
  // setTimeout(() => {
  //   eventTarget.select()
  // }, 10)
}
