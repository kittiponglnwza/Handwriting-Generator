// Font export configuration defaults
export const DEFAULT_FONT_NAME    = "MyHandwriting"
export const FONT_VERSION         = "3.1.0"
export const FONT_AUTHOR          = "Handwriting Font Generator"
export const FONT_COPYRIGHT       = `Copyright ${new Date().getFullYear()}`

export const SUPPORTED_FORMATS = ["ttf", "woff"]  // woff2 behind feature flag

export const MIME_TYPES = {
  ttf:  "font/ttf",
  woff: "font/woff",
  otf:  "font/otf",
  svg:  "image/svg+xml",
  pdf:  "application/pdf",
  png:  "image/png",
  json: "application/json",
  zip:  "application/zip",
}
