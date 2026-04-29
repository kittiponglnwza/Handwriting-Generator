// Thai character set configuration
// Unicode block: U+0E00–U+0E7F

export const THAI_UNICODE_RANGE = "U+0E00-0E7F"

export const THAI_CONSONANTS_RANGE = { start: 0x0E01, end: 0x0E2E }

export const THAI_ABOVE_VOWELS = [
  0x0E31, // mai han akat  ◌ั
  0x0E34, // sara i        ◌ิ
  0x0E35, // sara ii       ◌ี
  0x0E36, // sara ue       ◌ึ
  0x0E37, // sara uee      ◌ื
  0x0E47, // maitaikhu     ◌็
  0x0E4D, // nikhahit      ◌ํ
  0x0E4E, // yamakkan      ◌๎
]

export const THAI_BELOW_VOWELS = [
  0x0E38, // sara u        ◌ุ
  0x0E39, // sara uu       ◌ู
  0x0E3A, // phinthu       ◌ฺ
]

export const THAI_TONE_MARKS = [
  0x0E48, // mai ek        ◌่
  0x0E49, // mai tho       ◌้
  0x0E4A, // mai tri       ◌๊
  0x0E4B, // mai jattawa   ◌๋
]

export const THAI_LEADING_VOWELS = [
  0x0E40, // sara e        เ
  0x0E41, // sara ae       แ
  0x0E42, // sara o        โ
  0x0E43, // sara ai maimuan ใ
  0x0E44, // sara ai maimalai ไ
]
