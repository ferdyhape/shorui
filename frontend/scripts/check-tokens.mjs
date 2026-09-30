// Fails when UI code bypasses the design tokens (src/styles/tokens.css).
// Run: npm run check:tokens  (also part of `npm run check`)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SKIP = [/styles[\\/]tokens\.css$/, /\.test\.tsx?$/, /[\\/]test[\\/]/]

const RULES = [
  [/#[0-9a-fA-F]{3,8}\b/, 'raw hex colour: use a colour token (bg-brand, text-ink, ...)'],
  [/rgba?\(/, 'raw rgb(a) colour: add a token in styles/tokens.css'],
  [
    /\btext-\[\d+(\.\d+)?(px|rem)\]/,
    'arbitrary font size: use text-micro/caption/body-sm/body/h3/h2/h1',
  ],
  [/\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/, 'Tailwind default font size: use the token type scale'],
  [/\b(bg|text|border|ring)-\[#/, 'arbitrary colour: use a colour token'],
]

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(tsx?|css)$/.test(name) && !SKIP.some((re) => re.test(path))) yield path
  }
}

let failures = 0
for (const file of files(ROOT)) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const [re, message] of RULES) {
        if (re.test(line)) {
          console.error(`${relative(ROOT, file)}:${i + 1}: ${message}\n    ${line.trim()}`)
          failures++
        }
      }
    })
}
if (failures) {
  console.error(`\n${failures} design-token violation(s)`)
  process.exit(1)
}
console.log('design tokens: ok')
