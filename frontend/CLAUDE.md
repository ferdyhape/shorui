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

## Responsive design (mobile-first, required)

Every page and component must work from **360px** wide up. Verify in the browser at 360, 768 and
1280 before calling UI work done: no horizontal page scroll (`documentElement.scrollWidth <=
innerWidth`), nothing clipped, all actions reachable.

- **Breakpoint tokens** (`--breakpoint-*` in `tokens.css`): `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
  Write mobile styles first, then add `sm:`/`md:`/`lg:`/`xl:` overrides. Never use arbitrary
  `min-[..px]:`/`max-[..px]:` or raw `@media (min-width: ..)` outside `tokens.css`
  (`check:tokens` fails on them). JS mirror: `lib/breakpoints.ts` (a test keeps it equal to the CSS);
  read it with `useMediaQuery(minWidthQuery('md'))`.
- **Layout tokens:** `--page-gutter` is 16px on phones and 28px from `md` (defined in `tokens.css`;
  use `px-[var(--page-gutter)]`, never a fixed padding). `--sidebar-width` for the sidebar.
- **Shell:** below `md` the sidebar is an off-canvas drawer opened from `MobileTopBar` (closes on
  navigate, backdrop click and Escape; `invisible` when closed so it leaves the tab order); from `md` it
  is a permanent column with a collapse rail. The desktop collapsed preference is ignored in the drawer.
- **Touch targets:** every interactive control uses `pointer-coarse:h-[var(--control-height-touch)]`
  (44px) or a comparable size; `Button`, `Select`, sidebar items and table controls already do.
- **No fixed widths that can overflow.** Prefer `min-w-0`, `flex-wrap`, `w-full sm:w-auto`. Wide
  data (tables) scrolls inside its own `overflow-auto` container, never the page. Stack multi-column
  layouts on phones (`flex-col md:flex-row`); full-width primary buttons on phones (`w-full sm:w-auto`).
- Use `h-dvh` (not `h-screen`) for full-height shells so mobile browser chrome does not clip content.
- Tests: `setViewport('mobile' | 'desktop')` from `src/test/viewport.ts` switches the `matchMedia`
  stub; CSS is not applied in jsdom, so assert on behaviour (drawer state, rendered controls).

## Structure and patterns

- One folder per tool in `src/tools/<name>/`: container component (`<Name>.tsx`), a `use<Name>` hook that
  owns async work, status (busy/error/notice) and an `AbortController`; a **pure reducer** (`reducer.ts`)
  for domain state; small step components; pure helpers in `rows.ts`-style modules with unit tests.
- Shared UI in `src/components/`. Reuse `Button`, `Card`, `Input`, `Select`, `Checkbox`, `Banner`,
  `FileDropzone`/`MultiFileDropzone`, `FileList` (a removable list of already-added files, shared by
  every multi-file tool); style an anchor as a button with `buttonClasses()` from
  `core/buttonStyles.ts` (kept out of `Button.tsx` so fast refresh works). Add new primitives by
  porting the Kagami component's API, typed.
- `Checkbox` wires its `hint` as `aria-describedby`, not inside the `<label>` - keeps the accessible
  name just the label text (`getByLabelText('Document properties')` would otherwise need the hint
  text too). Follow that pattern for any new control that has both a label and a hint.
- `components/ToolIntro.tsx` is the generic dismissible "what does this tool do" panel (title +
  prose children, remembered per browser via `lib/useStoredFlag`, leaves a reopen button) - every
  tool other than Text Replacer uses this one. Text Replacer keeps its own bespoke version (in its
  own folder) with a worked-example diagram; don't copy that one, use the generic component.
- `components/MultiFileDropzone.tsx` is `FileDropzone`'s multi-file sibling (`onFiles: (files:
File[]) => void`, `multiple` input) for tools that accept several files per request (pdf-tools,
  bulk-replace). Don't add a `multiple` prop to `FileDropzone` itself - keep the two separate.
- Not every tool needs a reducer: a single trivial piece of state (one file, a busy flag) is fine as
  plain `useState` in the `use<Name>` hook (see `docx-to-pdf/useDocxToPdf.ts`). Reach for a reducer
  once there's more than one related piece of state to keep consistent (rows, a multi-step plan).
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
