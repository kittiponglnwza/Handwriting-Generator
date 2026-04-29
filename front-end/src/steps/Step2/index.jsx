/**
 * Step2 — Upload & Parse (SOURCE OF TRUTH)
 * 
 * ARCHITECTURE ROLE: Core data producer.
 * 
 * Responsibilities:
 *   1. Accept PDF upload (drag-drop or file picker)
 *   2. Validate file (type + size)
 *   3. Parse EVERY page with pdfjs-dist at scale=3
 *   4. Decode QR codes per page (jsQR via CDN)
 *   5. Collect HG text anchors per page
 *   6. Detect registration dots per page
 *   7. Run glyphPipeline to extract raw glyphs per page
 *   8. Emit ONE structured parsedFile object via onParsed(parsedFile)
 * 
 * Sub-components:
 *   - PdfDropZone.jsx: File upload and drop zone UI
 */

export { default } from './PdfDropZone'
export { default as PdfDropZone } from './PdfDropZone'