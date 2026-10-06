// Splits a word too long for the playback head into display-sized pieces,
// each but the last ending in a hyphen followed by a space (the reader then
// treats every piece as its own word): "disproportionately" ->
// "disprop- ortiona- tely".

// Joins a piece to the rest. A piece that already ends in a hyphen (the cut
// landed right after a hyphen in the original word) is not given a second one.
const joinPiece = (piece: string): string =>
  piece.endsWith('-') ? `${piece} ` : `${piece}- `;

export function hyphenateWord(word: string, maxDisplaySize: number): string {
  const len = word.length;

  if (len < maxDisplaySize) {
    return word;
  }

  if (len < 11) {
    return joinPiece(word.slice(0, len - 3)) + word.slice(len - 3);
  }

  return (
    joinPiece(word.slice(0, 7)) + hyphenateWord(word.slice(7), maxDisplaySize)
  );
}
