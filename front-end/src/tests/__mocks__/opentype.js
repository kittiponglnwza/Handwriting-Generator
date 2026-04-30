// Mock for opentype.js — used in fontBuilder tests
const opentype = {
  Font: class {
    constructor(opts) { this.opts = opts }
    download() {}
  },
  Glyph: class {
    constructor(opts) { this.opts = opts }
  },
  Path: class {
    constructor() { this.commands = [] }
    fromSVG() { return this }
    getBoundingBox() { return { x1: 0, y1: 0, x2: 100, y2: 100 } }
  },
}
export default opentype
module.exports = opentype
