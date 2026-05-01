/**
 * VerifySkeletons.jsx
 *
 * Beautiful skeleton loading components for the Verify Glyphs step.
 * Features:
 *   - Shimmer animation (CSS-based, GPU-accelerated via transform)
 *   - Dark mode support via CSS custom properties / Tailwind dark:
 *   - Three distinct skeleton shapes: toolbar, sidebar, glyph grid
 *   - Accessible: aria-busy + aria-label on containers
 */

import React from 'react'

// ── Shared shimmer element ─────────────────────────────────────────────────────

const shimmerStyle = {
  position:        'relative',
  overflow:        'hidden',
  background:      'var(--sk-base, #e5e7eb)',
  borderRadius:    4,
}

const shimmerBeforeStyle = {
  content:    '""',
  position:   'absolute',
  inset:      0,
  background: 'linear-gradient(90deg, transparent 0%, var(--sk-shine, rgba(255,255,255,0.6)) 50%, transparent 100%)',
  animation:  'skShimmer 1.4s ease-in-out infinite',
}

function Bone({ w = '100%', h = 16, r = 4, style = {}, className = '' }) {
  return (
    <div
      className={`sk-bone ${className}`}
      style={{
        width: w, height: h, borderRadius: r,
        background: 'var(--sk-base, #e5e7eb)',
        ...style,
      }}
    />
  )
}

// ── Global animation styles ────────────────────────────────────────────────────

export function SkeletonStyles() {
  return (
    <style>{`
      :root {
        --sk-base:  #e5e7eb;
        --sk-shine: rgba(255,255,255,0.65);
        --sk-muted: #d1d5db;
      }
      .dark {
        --sk-base:  #2a2a2a;
        --sk-shine: rgba(255,255,255,0.06);
        --sk-muted: #3a3a3a;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --sk-base:  #2a2a2a;
          --sk-shine: rgba(255,255,255,0.06);
          --sk-muted: #3a3a3a;
        }
      }
      @keyframes skShimmer {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(100%);  }
      }
      .sk-bone {
        position: relative;
        overflow: hidden;
      }
      .sk-bone::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          var(--sk-shine) 50%,
          transparent 100%
        );
        animation: skShimmer 1.4s ease-in-out infinite;
      }
      /* Staggered delays for natural feel */
      .sk-bone:nth-child(2)::after  { animation-delay: 0.07s; }
      .sk-bone:nth-child(3)::after  { animation-delay: 0.14s; }
      .sk-bone:nth-child(4)::after  { animation-delay: 0.21s; }
      .sk-bone:nth-child(5)::after  { animation-delay: 0.28s; }
      .sk-bone:nth-child(6)::after  { animation-delay: 0.35s; }
      .sk-bone:nth-child(odd)::after { animation-delay: 0.1s; }
    `}</style>
  )
}

// ── Toolbar skeleton ───────────────────────────────────────────────────────────

export function ToolbarSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading toolbar"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            12,
        padding:        '12px 20px',
        borderBottom:   '1px solid var(--sk-muted, #e5e7eb)',
        background:     '#fff',
      }}
    >
      {/* Search bar */}
      <Bone w={220} h={32} r={8} />

      {/* Filter pills */}
      <Bone w={64}  h={28} r={20} />
      <Bone w={64}  h={28} r={20} />
      <Bone w={64}  h={28} r={20} />
      <Bone w={64}  h={28} r={20} />

      <div style={{ flex: 1 }} />

      {/* Zoom controls */}
      <Bone w={24}  h={24} r={6} />
      <Bone w={80}  h={24} r={6} />
      <Bone w={24}  h={24} r={6} />

      {/* Compare mode toggle */}
      <Bone w={100} h={28} r={8} />
    </div>
  )
}

// ── Sidebar skeleton ───────────────────────────────────────────────────────────

export function SidebarSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading glyph details"
      style={{
        width:      280,
        minWidth:   280,
        padding:    20,
        borderLeft: '1px solid var(--sk-muted, #e5e7eb)',
        display:    'flex',
        flexDirection: 'column',
        gap:        20,
        background: '#fafafa',
      }}
    >
      {/* Preview area */}
      <Bone w="100%" h={180} r={10} />

      {/* Character header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bone w={48} h={48} r={8} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Bone w="60%"  h={16} r={4} />
          <Bone w="40%"  h={12} r={4} />
        </div>
      </div>

      {/* Status badge */}
      <Bone w={80} h={22} r={12} />

      {/* Metrics section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w="40%" h={11} r={3} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Bone w="38%" h={13} r={3} />
            <Bone w="30%" h={13} r={3} />
          </div>
        ))}
      </div>

      {/* Warnings section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Bone w="50%" h={11} r={3} />
        <Bone w="100%" h={36} r={6} />
      </div>

      {/* Note input */}
      <Bone w="100%" h={72} r={6} />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Bone w="50%" h={32} r={8} />
        <Bone w="50%" h={32} r={8} />
      </div>
    </div>
  )
}

// ── Glyph grid skeleton ────────────────────────────────────────────────────────

function GlyphCardSkeleton({ delay = 0 }) {
  return (
    <div style={{
      background:   '#fff',
      borderRadius: 10,
      padding:      12,
      display:      'flex',
      flexDirection: 'column',
      gap:          8,
      border:       '1px solid var(--sk-muted, #e5e7eb)',
    }}>
      {/* Glyph preview area */}
      <Bone
        w="100%"
        h={88}
        r={6}
        style={{ animationDelay: `${delay}ms` }}
      />
      {/* Character label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Bone w={24} h={20} r={4} />
        <Bone w={40} h={14} r={10} />
      </div>
      {/* Unicode */}
      <Bone w="70%" h={10} r={3} />
    </div>
  )
}

export function GlyphGridSkeleton({ count = 24 }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading glyphs"
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap:                 12,
        padding:             20,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <GlyphCardSkeleton key={i} delay={i * 30} />
      ))}
    </div>
  )
}

// ── Full-page skeleton (all three combined) ────────────────────────────────────

export function VerifyGlyphsSkeleton() {
  return (
    <>
      <SkeletonStyles />
      <div
        style={{
          display:        'flex',
          flexDirection:  'column',
          height:         '100%',
          overflow:       'hidden',
        }}
      >
        <ToolbarSkeleton />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <GlyphGridSkeleton count={32} />
          </div>
          <SidebarSkeleton />
        </div>
      </div>
    </>
  )
}