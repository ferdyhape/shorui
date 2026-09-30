# Frontend (React + Vite + TypeScript + Tailwind v4)

React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), react-router-dom (HashRouter), lucide-react,
Vitest + Testing Library. See [../CLAUDE.md](../CLAUDE.md) for commands and cross-cutting rules.

## Branding

The sidebar footer credits the developer: "by ferdyhape" linking to https://ferdyhape.com (`lib/brand.ts`,
`components/navigation/Credit.tsx`). Keep it when touching the sidebar.

## Design system: match Kagami, tokens only

Source of truth for the look: `D:\Research\FunkyAI\kagami\web\frontend-v1` (its `src/index.css`,
`src/components/`, and the design docs in `Kagami Design Claude Design Generated/`). Our tokens are
mirrored in `src/styles/tokens.css` (Tailwind `@theme`, dark theme, motion, focus ring). When Kagami
changes tokens, re-mirror that file; do not fork values.

Rules (enforced by `npm run check:tokens`):

- Colours: only token utilities (`bg-brand`, `bg-surface-card`, `text-ink`, `text-ink-muted`,
  `border-border`, `text-drift`/`bg-drift-bg`, `bg-match-bg`, ...). No hex, no `rgb()`, no `bg-[#...]`.
- Type: only the scale (`text-micro|caption|body-sm|body|body-lg|h3|h2|h1|display`). No `text-xs/sm/lg`,
  no `text-[13px]`. Fonts: Instrument Sans (`font-sans`), JetBrains Mono (`font-mono`) for code/IDs/numbers.
- Radius/shadow/motion/heights: `rounded-xs|sm|md|lg|xl`, `shadow-xs|sm|md|lg`, `duration-120`,
  `h-[var(--control-height-md)]`, `w-[var(--sidebar-width)]`, page gutter `--page-gutter`.
- Dark mode is automatic through tokens (OS preference; `html[data-theme]` from `ThemeToggle`). Never
  write `dark:` variants or theme-specific colours. Need a new colour? Add a token to `tokens.css`
  in both light and dark blocks, then use the utility.
- Focus: buttons/links use the `focus-ring` class; inputs use the `has-[:focus]:shadow-[var(--focus-ring)]`
  pattern from `Select`.
- Status semantics: errors `drift`, success/info `match`, warnings `partial`, neutral `unknown`.

## Structure and patterns

- One folder per tool in `src/tools/<name>/`: container component (`<Name>.tsx`), a `use<Name>` hook that
  owns async work, status (busy/error/notice) and an `AbortController`; a **pure reducer** (`reducer.ts`)
  for domain state; small step components; pure helpers in `rows.ts`-style modules with unit tests.
- Shared UI in `src/components/`. Reuse `Button`, `Card`, `Select`, `Banner`, `FileDropzone`; style an
  anchor as a button with `buttonClasses()` from `core/buttonStyles.ts` (kept out of `Button.tsx` so
  fast refresh works). Add new primitives by porting the Kagami component's API, typed.
- `ToolIntro` (top of the Text Replacer page) explains the tool in plain language with a worked
  example for first-time users. Every new tool should get an equivalent intro at the top of its page.
  It is dismissible (remembered per browser via `lib/useStoredFlag`) and leaves a "What does this tool do?" button to reopen it.
- Layout: tool content is full width inside the page gutter (no `max-w-*`, no centering). Do not
  re-add a max width to `ToolPage`.
- After a template loads, focus moves to the first data cell (`focusToken` = `templateVersion`).
- Routing: `tools.ts` is the registry. Each tool gets `/#/<id>` and a sidebar item automatically; tools
  are `React.lazy` code-split. `App.tsx` renders `Shell` (Sidebar + main) and `ToolPage` (PageHeader + content).
- API: everything goes through `api/client.ts` (`postForm`, `ApiError`, `isAbortError`). Per-tool modules
  in `api/<tool>.ts` return typed data. Base URL from `VITE_API_BASE` (default `/api/v1`, proxied to the
  backend by Vite; `dev.sh` sets `BACKEND_URL`).
- Rows/lists: stable numeric ids (`newRow()`), `React.memo` row components with `useCallback` handlers so
  large tables stay fast.
- Client validation (extension, size, max rows) is a convenience; the backend is authoritative.

## Accessibility (non-negotiable)

Inputs must be keyboard reachable (file inputs use the `sr-only-focusable` class inside a `<label>`, never
`display:none`). Icon-only buttons need `aria-label`. Errors use `role="alert"`, notices `role="status"`
(`Banner`). Tables use `<th scope="col">`. Respect `prefers-reduced-motion` (tokens already zero durations).

## Tests (Vitest + Testing Library, `npm test`)

- Pure logic (reducer, mappers) gets plain unit tests. Components: mock the API module with
  `vi.mock('../../api/<tool>')` and `saveBlob`; assert on roles/labels, not class names.
- The template guide repeats `{{name}}` text; scope queries (e.g. `within(getByRole('list',
{ name: 'Detected variables' }))`) to avoid "multiple elements" errors.
- `userEvent.upload(input, file, { applyAccept: false })` to test rejected file types.
- CSS is disabled in tests (`css: false`); do not assert on styles.

## Style

Prettier (no semicolons, single quotes, width 100, trailing commas). `oxlint` must have zero warnings.
Only add comments that explain non-obvious _why_.
