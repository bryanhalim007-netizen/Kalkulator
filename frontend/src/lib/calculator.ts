// Coded calculator logic for BikePOS.
//
// Letter -> digit mapping. Z is special: it repeats the previous digit
// (e.g. QZ -> 99, YZ -> 11).
//
// Price rule (millions range): the digit string is right-padded with zeros to
// 7 digits, e.g. "10" -> 1000000, "12" -> 1200000, "135" -> 1350000.

export const LETTER_TO_DIGIT: Record<string, string> = {
  P: "0",
  Y: "1",
  F: "2",
  V: "3",
  H: "4",
  K: "5",
  T: "6",
  B: "7",
  R: "8",
  Q: "9",
};

// Keypad order (Z is the "double previous digit" key).
export const KEYPAD_LETTERS = [
  "P",
  "Y",
  "F",
  "V",
  "H",
  "K",
  "T",
  "B",
  "R",
  "Q",
  "Z",
];

export function lettersToDigits(letters: string[]): string {
  let digits = "";
  for (const l of letters) {
    if (l === "Z") {
      if (digits.length > 0) digits += digits[digits.length - 1];
    } else {
      const d = LETTER_TO_DIGIT[l];
      if (d !== undefined) digits += d;
    }
  }
  return digits;
}

export function digitsToModal(digits: string): number {
  if (!digits) return 0;
  return parseInt(digits.padEnd(7, "0"), 10);
}

export function lettersToModal(letters: string[]): number {
  return digitsToModal(lettersToDigits(letters));
}
