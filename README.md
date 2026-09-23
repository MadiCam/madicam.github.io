# MadiCam website

The landing page for MadiCam, served by GitHub Pages at
https://madi.cam (madicam.github.io redirects there).

It's one static page with no framework and no build step. Whatever is on `main`
goes live.

```
├── index.html          the whole page, plus the inline glyph and filter defs
├── css/
│   ├── tokens.css      the app's control sizes, insets and timings
│   ├── base.css        the page's own type, colour and layout primitives
│   ├── hero.css        the frame, the glass, the control layer, the loop
│   └── sections.css    the content blocks and the footer
├── js/
│   ├── hero.js         the glass capability probe and the 15s loop
│   ├── compare.js      the before/after, by pointer and by keyboard
│   └── media.js        one video playing at a time, and never off screen
├── assets/             images, video and the App Store badge
├── privacy/index.html  the privacy policy, at /privacy
├── 404.html            what GitHub Pages serves for a missing path
├── robots.txt          open to every crawler, points at the sitemap
├── sitemap.xml         the two pages; bump <lastmod> when one changes
└── llms.txt            a plain summary of the app for language models
```

## Search and sharing

The site lives at https://madi.cam. Every page has a canonical link and Open
Graph tags with absolute URLs. The share image is `assets/img/og.jpg`, at
1200×630. `index.html` also carries JSON-LD describing the app. When a fact
changes on the page (the store URL, the price), change it in the JSON-LD and in
`llms.txt` too.

## Run it

Any static server works:

```sh
python3 -m http.server 8000
```

## The page

| Block | Job |
|---|---|
| Hero | Both pillars in two lines, plus price and trial |
| 1 Controls | Controls designed for underwater use. Five points and one recording |
| 2 Colour | One-tap colour correction, with a before/after you can drag |
| 3 The log | The dive gallery |
| 4 Who made it | The people behind the app |
| Footer | Price, trial, compatibility, requirements, privacy |

Blocks 1, 3 and 4 share one layout, `.split` in `sections.css`: a column of text
with one piece of media beside it. The media comes second in the HTML, so on a
phone it stacks under the text that introduces it. The colour block is the
exception. It's centred and full-bleed.

## The hero matches the app

The controls in the hero are the app's real layout, at the app's real sizes.
`tokens.css` holds those numbers, and the CSS takes every size from it rather
than typing raw values. If the app's controls change, update `tokens.css` to
match. A control that isn't in the app must never appear in the hero.

Like the app, the hero lays out the controls once in landscape. In portrait, the
whole panel turns 90° clockwise and each control's contents turn back upright.
That's how the hero is landscape on a desktop and portrait on a phone, from one
layout.

## The glass, and how it degrades

`hero.js` checks which features the browser supports and sets `data-glass` on
`<html>`. It never reads the user agent.

| Tier | When | What |
|---|---|---|
| `a` | `backdrop-filter: url()` supported (Chromium), fine pointer, ≥992px | Frosted glass that also bends the video behind it, through the `#glass-refract` displacement map |
| `b` | any other browser with `backdrop-filter` | Frosted only. Most visitors see this tier |
| `c` | no `backdrop-filter`, or `prefers-reduced-transparency` | Solid fills, the same look as the app's High Contrast setting |

With `prefers-reduced-motion`, the hero video stays on its poster frame, the
controls sit still and the loop doesn't run. The section text says everything
the animation shows, so these visitors miss nothing.

Every label sits on its own layer above the glass effect, with its own shadow,
never inside it. When you change the glass, check that the labels still read
over the brightest parts of the footage.

## Fonts

- Headlines use the system font stack at weight 800.
- The control labels use SF Rounded, which only Apple devices have. Windows and
  Android show the plain system font there instead.
- Inter is the fallback font, but the site doesn't host it, so non-Apple devices
  use their own system font.

## Privacy

There are no analytics or cookies, so the site needs no consent banner. Keep it
that way.
