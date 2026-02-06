# Resend Template Styles Bug — Minimal Reproduction

Resend’s dashboard strips inline styles from typography elements when
previewing or sending templates, even though the stored HTML is correct.

## The Bug

When HTML with inline styles is uploaded as a Resend template:

- **Stored HTML is correct** — fetching via `resend.templates.get()` returns
  all inline styles intact
- **Dashboard preview is broken** — inline styles on `<p>`, `<h1>`, `<a>`,
  `<hr>` are stripped and replaced with defaults
- **Dashboard "Send test email" is broken** — same missing styles
- **Direct API send works** — `resend.emails.send({ html })` with the same
  HTML renders perfectly

### What’s preserved vs. stripped

| Element type | Example | Styles preserved? |
|---|---|---|
| `<table>`, `<td>` | `background-color`, `padding`, `border` | ✅ Yes |
| `<p>` | `font-family`, `font-size`, `color`, `text-transform` | ❌ No |
| `<h1>` | `font-family`, `font-size`, `color`, `line-height` | ❌ No |
| `<a>` | `color`, `font-family` (replaced with default `#067df7`) | ❌ No |
| `<hr>` | `border-color` (replaced with default `#eaeaea`) | ❌ No |

## Reproduce

### Prerequisites

- [Bun](https://bun.sh) (or Node 22+)
- A Resend API key

### Steps

```bash
bun install

# Required: upload template and verify stored styles
RESEND_API_KEY=re_xxx bun run reproduce.ts

# Optional: also send via direct API to prove it works
RESEND_API_KEY=re_xxx TEST_EMAIL=you@example.com FROM_EMAIL=you@yourdomain.com bun run reproduce.ts
```

After running:

1. Open the **Resend dashboard** → Templates → find "Style Test (...)"
2. **Preview** the template — notice typography styles are missing
3. **Send a test email** from the dashboard — same missing styles
4. If you used `TEST_EMAIL`, check your inbox — that email has all styles correct

## Environment

- `resend`: 6.9.1
- Runtime: Bun 1.x / Node 22+
- Issue is server-side — not dependent on runtime or OS
