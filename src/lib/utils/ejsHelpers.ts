function generateSortLink(
  prevSortQuery: Record<string, string>,
  field: string,
  isFirstQuery = true
) {
  const direction = prevSortQuery[field] === 'asc' ? '-' : ''
  const newSortQuery = `${direction}${field}`

  return `${isFirstQuery ? '?' : '&'}sort=${newSortQuery}`
}

const getIcon = (currentSort: string | undefined, field: string): string => {
  return currentSort === `-${field}` ? 'caret-down' : 'caret-up'
}

const formatDate = (timestamp: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(timestamp)
}

const mimeTypeToIcon: { [key: string]: string } = {
  // Document types
  'application/pdf': 'file-earmark-pdf', // PDF
  'application/msword': 'file-earmark-word', // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file-earmark-word', // Word
  'application/vnd.ms-excel': 'file-earmark-excel', // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file-earmark-excel', // Excel
  'application/vnd.ms-powerpoint': 'file-earmark-ppt', // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'file-earmark-ppt', // PowerPoint

  // Image types
  'image/jpeg': 'file-earmark-image', // JPEG
  'image/png': 'file-earmark-image', // PNG
  'image/gif': 'file-earmark-image', // GIF
  'image/webp': 'file-earmark-image', // WebP
  'image/svg+xml': 'file-earmark-image', // SVG
  'image/bmp': 'file-earmark-image', // BMP
  'image/tiff': 'file-earmark-image', // TIFF

  // Audio types
  'audio/mpeg': 'file-earmark-music', // MP3
  'audio/wav': 'file-earmark-music', // WAV
  'audio/ogg': 'file-earmark-music', // OGG

  // Video types
  'video/mp4': 'file-earmark-play', // MP4
  'video/x-matroska': 'file-earmark-play', // MKV
  'video/webm': 'file-earmark-play', // WebM
  'video/quicktime': 'file-earmark-play', // MOV

  // Text types
  'text/plain': 'file-earmark-text', // Plain text
  'text/html': 'file-earmark-code', // HTML
  'text/css': 'file-earmark-code', // CSS
  'text/javascript': 'file-earmark-code', // JavaScript
  'application/javascript': 'file-earmark-code', // JavaScript
  'application/json': 'file-earmark-code', // JSON
  'application/xml': 'file-earmark-code', // XML

  // Archive types
  'application/zip': 'file-earmark-zip', // ZIP
  'application/x-rar-compressed': 'file-earmark-zip', // RAR
  'application/x-7z-compressed': 'file-earmark-zip', // 7z

  // Default
  default: 'file-earmark', // Default icon for unrecognized types
}

const getMimeTypeIconLabel = (mimeType: string) =>
  mimeTypeToIcon[mimeType] || mimeTypeToIcon.default

const helpers = {
  generateSortLink,
  getIcon,
  formatDate,
  getMimeTypeIconLabel,
}

export default helpers
