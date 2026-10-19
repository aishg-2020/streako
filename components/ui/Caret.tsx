/** Blinking cursor shown at the end of text that is still streaming in. */
export function Caret() {
  return <span aria-hidden className="streaming-caret" />;
}
