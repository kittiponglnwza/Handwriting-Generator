import Group from "../components/Group"
import InfoBox from "../components/InfoBox"

const THAI_CONSONANTS =
  "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ".split("")
const THAI_VOWELS = [
  "ะ",
  "ั",
  "า",
  "ำ",
  "ิ",
  "ี",
  "ึ",
  "ื",
  "ุ",
  "ู",
  "เ",
  "แ",
  "โ",
  "ใ",
  "ไ",
  "ๅ",
  "ฤ",
  "ฤๅ",
  "ฦ",
  "ฦๅ",
  "็",
]
const DIGITS = "0123456789".split("")
const ENG_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const ENG_LOWER = "abcdefghijklmnopqrstuvwxyz".split("")

export default function Step1({ selected, onToggle }) {
  return (
    <div className="fade-up">
      <InfoBox color="amber">
        เลือกเฉพาะตัวอักษรที่ต้องการ — Template จะสร้างเฉพาะตัวที่เลือก
      </InfoBox>
      <Group
        label="พยัญชนะไทย"
        chars={THAI_CONSONANTS}
        selected={selected}
        onToggle={onToggle}
      />
      <Group label="สระไทย" chars={THAI_VOWELS} selected={selected} onToggle={onToggle} />
      <Group label="ตัวเลข" chars={DIGITS} selected={selected} onToggle={onToggle} />
      <Group
        label="English A–Z"
        chars={ENG_UPPER}
        selected={selected}
        onToggle={onToggle}
      />
      <Group
        label="English a–z"
        chars={ENG_LOWER}
        selected={selected}
        onToggle={onToggle}
      />
    </div>
  )
}
