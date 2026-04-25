/**
 * Random seed generated once per browser session.
 * Shared by Step 4 (DNA display) and Step 5 (preview tokens).
 * Different every time the page loads → glyphs look naturally varied.
 */
export const DOCUMENT_SEED = `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')}`