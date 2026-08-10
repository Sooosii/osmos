# OSMOS

An attempt to make scent readable. 52 perfumes and 136 notes; there are no
photographs anywhere — everything on screen is drawn from data.

![The scent space](docs/preview/space.png)

<sub>The door: 52 perfumes on a plane where position comes from shared notes.
Colour is the dominant family, size the third component. Drag, zoom, touch a
point.</sub>

![A perfume page](docs/preview/perfume.png)

<sub>A perfume: the evolution signature turns on its own for eight hours, drawn
on canvas from the volatility of each note. No charting library is used
anywhere in this project.</sub>

![A note page](docs/preview/note.png)

<sub>A note: volatility as a dithered field, four character axes, and the
perfumes that carry it in a rotating constellation.</sub>

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 392 pages, all static
npm test        # vitest
npm run lint
```

## Pages

The site is bilingual: English lives at the root, Turkish under `/tr`. Every
route below exists in both.

| path | what |
|---|---|
| `/` | **The scent space** — the door. 52 perfumes on a plane where position comes from shared notes. Drag, zoom, touch a point. Sliders let you search by feel instead of by name, and the query travels in the address: `?feel=0.9,,0.2` |
| `/perfume/[id]` | A perfume: house and year, a turning evolution signature, its notes, its neighbours in the space |
| `/notes` | The index of 136 materials, grouped by volatility band |
| `/note/[id]` | A note: its own measurements, and the turning constellation of perfumes that carry it |
| `/evolution`, `/space` | Verification screens — internal tools, not part of the site proper |

## The data

Three sets, all written by hand under `src/data/`:

- **`perfume-sets/`** — 52 perfumes. Each with its notes by tier (top / heart /
  base) and weight, plus house, year and perfumer.
- **`note-sets/`** — 136 notes, split across three files by volatility band.
  Each carries family weights, volatility (peak minute + half-life) and four
  character axes: temperature, texture, cleanliness, proximity.
- **`families.ts`** — 15 scent families and their colours. **Colour means
  family**, everywhere on the site; after a few pages you can read the code.

`types.ts` describes the whole schema and which display each field drives.

## Two rules the code keeps

**① The computation stays on the server.** The similarity matrix, the
projection and the note database never reach the browser; the client receives
results only — name, colour, weight, depth. `space-marks.ts` and
`note-marks.ts` are the two ends of that contract.

**② Every hand-measured number is held by a test.** Orbit geometry, dither
thresholds and label placement were tuned in a browser; if the camera angle or
the radii change, tests break. The pure modules under `src/lib/` know nothing
about React, the DOM or canvas, and each sits beside its own tests.

## Where the decisions live

Why each feature is the way it is — including the options that were rejected —
is written under `docs/superpowers/specs/`. The comments in the code do the
same job: they explain **why it is this way** and what was tried and dropped,
not what the code does.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · TypeScript ·
Vitest. Drawing is canvas and SVG; there is no charting library. The site is
generated statically and makes no outbound request at runtime.

## Configuration

One optional environment variable:

| variable | what |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute base for the sitemap, `hreflang` links and share images. Falls back to the host's own production URL, then to `http://localhost:3000`. Set it once a custom domain is in place. |

See `.env.example`.

## License

All rights reserved — see [LICENSE](LICENSE). The code is readable, but the
selection, the descriptions and the measurements are original work and are not
free to reuse. Ask if you want to.
