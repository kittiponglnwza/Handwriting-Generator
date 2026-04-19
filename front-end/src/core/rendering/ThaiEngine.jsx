/********************************************************************
 * THAI HANDWRITING LAYOUT ENGINE v3.0 (HARDCORE EDITION)
 * - Strict Error Handling & Type Checking
 * - Orphan Diacritics Resolution (◌)
 * - Safe Math & Fallback Defaults
 * - React Performance Optimized
 ********************************************************************/

import React, { useMemo } from 'react';

const THAI = {
  LEADING: new Set(["เ", "แ", "โ", "ใ", "ไ"]),
  TOP: new Set(["ิ", "ี", "ึ", "ื", "็", "ั"]),
  BOTTOM: new Set(["ุ", "ู"]),
  TONE: new Set(["่", "้", "๊", "๋"]),
  TRAIL: new Set(["า", "ำ"]),
  MARK: new Set(["์", "ํ"]),
};

const DOTTED_CIRCLE = '\u25CC'; // ◌ ใช้สำหรับรองรับสระ/วรรณยุกต์ลอย

// Helper แบบ Defensive (รับค่าอะไรมาก็ไม่พัง)
const isThai = (ch) => typeof ch === 'string' && /[\u0E00-\u0E7F]/.test(ch);
const isLeading = (ch) => typeof ch === 'string' && THAI.LEADING.has(ch);
const isTop = (ch) => typeof ch === 'string' && THAI.TOP.has(ch);
const isBottom = (ch) => typeof ch === 'string' && THAI.BOTTOM.has(ch);
const isTone = (ch) => typeof ch === 'string' && THAI.TONE.has(ch);
const isTrail = (ch) => typeof ch === 'string' && THAI.TRAIL.has(ch);
const isMark = (ch) => typeof ch === 'string' && THAI.MARK.has(ch);

const HIGH_HEAD = new Set(["ป", "ฝ", "ฟ", "ฬ", "ญ", "ฐ", "ฎ", "ฮ"]);
const hasTallHead = (ch) => typeof ch === 'string' && HIGH_HEAD.has(ch);

/* ========================================================= */

export function splitThaiClusters(text) {
  // ดัก Error ขั้นต้น: ถ้าไม่ใช่ String หรือเป็นค่าว่าง คืนค่า Array ว่างทันที
  if (typeof text !== 'string' || !text) return [];

  const clusters = [];
  let i = 0;

  while (i < text.length) {
    let ch = text[i];

    // 1. จัดการตัวอักษรที่ไม่ใช่ภาษาไทย (Eng, ตัวเลข, ช่องว่าง, สัญลักษณ์)
    if (!isThai(ch)) {
      clusters.push({
        raw: ch, base: ch, leading: "", top: [], tone: [], bottom: [], trail: "", mark: []
      });
      i++;
      continue;
    }

    const cluster = {
      raw: "", leading: "", base: "", top: [], tone: [], bottom: [], trail: "", mark: []
    };

    // 2. จัดการสระลอย/วรรณยุกต์ลอย (พิมพ์มาเดี่ยวๆ ไม่มีพยัญชนะ)
    if (isTop(ch) || isBottom(ch) || isTone(ch) || isMark(ch) || isTrail(ch)) {
      cluster.base = DOTTED_CIRCLE; // ใส่ฐานจำลองให้
      cluster.raw += DOTTED_CIRCLE;
      // ให้มันวิ่งไปเช็คใน Loop ถัดไปแทน เพื่อแยกประเภทให้ถูกต้อง
    } else {
      // 3. Flow ปกติ
      if (isLeading(ch)) {
        cluster.leading = ch;
        cluster.raw += ch;
        i++;
        ch = text[i];
      }

      // เช็คอีกรอบเพื่อความชัวร์ว่าตัวถัดไปมีจริงและไม่ใช่สระนำซ้อนกัน
      if (ch && !isLeading(ch) && isThai(ch) && !(isTop(ch)||isBottom(ch)||isTone(ch)||isMark(ch)||isTrail(ch))) {
        cluster.base = ch;
        cluster.raw += ch;
        i++;
      } else if (ch) {
        // กรณีพิมพ์ สระหน้า + วรรณยุกต์ (เ + ้) จะอนุโลมให้ base เป็น ◌
        cluster.base = DOTTED_CIRCLE;
      } else {
        // จบข้อความพอดี
        clusters.push(cluster);
        break;
      }
    }

    // 4. กวาดตัวตามหลัง (Top, Tone, Bottom, etc.) โดยจำกัดปริมาณเพื่อป้องกัน Overflow
    while (i < text.length) {
      const next = text[i];

      if (!next || !isThai(next) || isLeading(next)) break;

      if (isTop(next) && cluster.top.length < 2) cluster.top.push(next);
      else if (isTone(next) && cluster.tone.length < 1) cluster.tone.push(next); // วรรณยุกต์ไม่ควรมีเกิน 1
      else if (isBottom(next) && cluster.bottom.length < 1) cluster.bottom.push(next);
      else if (isTrail(next) && !cluster.trail) cluster.trail = next;
      else if (isMark(next) && cluster.mark.length < 1) cluster.mark.push(next);
      else if (!isTop(next) && !isTone(next) && !isBottom(next) && !isTrail(next) && !isMark(next)) break; // เจอพยัญชนะตัวใหม่

      cluster.raw += next;
      i++;
    }

    clusters.push(cluster);
  }

  return clusters;
}

/* ========================================================= */

export function layoutThaiCluster(cluster, x = 0, y = 0, fontSize = 32) {
  if (!cluster || typeof cluster !== 'object') return []; // ดัก Cluster พัง

  const nodes = [];
  const tall = hasTallHead(cluster.base);

  try {
    if (cluster.leading) {
      nodes.push({ char: cluster.leading, x: x - fontSize * 0.38, y });
    }

    if (cluster.base) {
      nodes.push({ char: cluster.base, x, y });
    }

    if (cluster.trail) {
      nodes.push({ char: cluster.trail, x: x + fontSize * 0.42, y });
    }

    (cluster.bottom || []).forEach((c, idx) => {
      nodes.push({
        char: c,
        x: x + fontSize * 0.02,
        y: y + fontSize * (0.34 + idx * 0.10)
      });
    });

    (cluster.top || []).forEach((c, idx) => {
      nodes.push({
        char: c,
        x: x,
        y: y - fontSize * (0.68 + idx * 0.14)
      });
    });

    (cluster.tone || []).forEach((c, idx) => {
      let lift = tall ? 1.35 : 1.15;
      if (cluster.top && cluster.top.length > 0) lift += 0.28;

      nodes.push({
        char: c,
        x: x + fontSize * 0.04,
        y: y - fontSize * (lift + idx * 0.14)
      });
    });

    (cluster.mark || []).forEach((c, idx) => {
      let lift = tall ? 1.05 : 0.72;
      if (cluster.top && cluster.top.length > 0) lift += 0.28;

      nodes.push({
        char: c,
        x: x + fontSize * 0.04,
        y: y - fontSize * (lift + idx * 0.15)
      });
    });
  } catch (error) {
    console.warn("Layout error on cluster:", cluster, error);
  }

  return nodes;
}



/* ========================================================= */

export function getClusterAdvance(cluster, fontSize = 32) {
  if (!cluster) return fontSize * 0.5;
  
  // ปรับระยะเว้นวรรค (Spacebar) ให้กว้างขึ้น
  if (cluster.base === " ") return fontSize * 0.6; 
  if (cluster.base === "\n") return 0; // ไม่ต้องบวกแกน X ถ้าเป็น Enter

  // ปรับระยะอักษรปกติให้ถ่างออกอีกนิด ป้องกันการซ้อนทับ
  let width = fontSize * 1.0; 

  if (cluster.leading) width += fontSize * 0.05;
  if (cluster.trail) width += fontSize * 0.15;

  return width;
}

/* ========================================================= */

export function layoutThaiText(
  text,
  startX = 60,
  startY = 140,
  fontSize = 32,
  lineHeightMultiplier = 1.8 // รับค่าระยะบรรทัดเข้ามา
) {
  if (typeof text !== 'string') return [];

  const clusters = splitThaiClusters(text);
  
  let x = startX;
  let y = startY;
  const output = [];

  for (const c of clusters) {
    // 🔴 ดักจับการขึ้นบรรทัดใหม่ (\n)
    if (c.base === '\n') {
      x = startX; // รีเซ็ตแกน X กลับไปจุดเริ่มต้น
      y += fontSize * lineHeightMultiplier; // ดันแกน Y ลงมา 1 บรรทัด
      continue; // ข้ามไปตัวถัดไป
    }

    const nodes = layoutThaiCluster(c, x, y, fontSize);
    output.push(...nodes);
    
    // ขยับแกน X ไปทางขวา
    x += getClusterAdvance(c, fontSize);
  }

  return output;
}

/* ========================================================= */

// ใช้ React.memo เพื่อป้องกันการ Rerender ที่ไม่จำเป็น
export const ThaiPreview = React.memo(({
  text = "", 
  glyphMap = {}, 
  fontSize = 32,
  width = 1400,
  height = 600
}) => {
  
  // ใช้ useMemo คำนวณ Layout แค่ตอนที่ text หรือ fontSize เปลี่ยน
  const nodes = useMemo(() => {
    try {
      return layoutThaiText(text, 80, 160, fontSize);
    } catch (err) {
      console.error("Failed to layout text:", err);
      return [];
    }
  }, [text, fontSize]);

  if (nodes.length === 0) {
    return null; // หรือ return <svg> ว่างเปล่าเพื่อรักษา Layout ของเว็บ
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {nodes.map((n, i) => {
        const path = glyphMap?.[n.char];

        if (path) {
          return (
            <path
              key={`${n.char}-${i}`}
              d={path}
              transform={`translate(${n.x},${n.y}) scale(0.08)`}
              fill="none"
              stroke="black"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }

        return (
          <text
            key={`${n.char}-${i}`}
            x={n.x}
            y={n.y}
            fontSize={fontSize}
            fontFamily="sans-serif"
            fill="black"
          >
            {n.char}
          </text>
        );
      })}
    </svg>
  );
});

ThaiPreview.displayName = "ThaiPreview";