export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function csvHeaderTemplate(columns: string[]): string {
  const line = columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')
  return `﻿${line}\n` // BOM so Excel reads UTF-8
}
