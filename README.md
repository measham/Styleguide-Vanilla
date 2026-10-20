# Styleguide (Vanilla)

The [Mast](https://nocodesupply.co/mast) framework as a plain site — HTML,
CSS and JavaScript, nothing to install or build: its fluid design tokens,
12-column grid, light and dark themes, and every component, as a style guide
to read and a starting point to build from. Made to be opened and edited in
[Sitefold Studio](https://github.com/measham/sitefold-studio), which serves
it itself.

The same site as [Styleguide (Vue)](https://github.com/measham/styleguide-vue),
written out as the pages a browser is given.

## Run it

Open the folder in Sitefold Studio. Or serve it with anything that serves
files, from the folder:

```sh
npx serve .            # or: python3 -m http.server
```

Links are clean (`/styles`, not `/styles.html`), as GitHub Pages, Netlify and
Cloudflare Pages serve them.

## Pages

| Page | What it shows |
| --- | --- |
| `index.html` | The cover: what Mast is, and the way into the rest |
| `styles.html` | Tokens, colour, type, spacing, the grid, utilities |
| `components.html` | Every component, live: buttons, cards, accordion, modal, tabs, slider, marquee, video, forms, nav, footer |
| `basic-layouts.html` | Plain sections to start a page from |
| `inspired-layouts.html` | Fuller sections, as a real site would have them |
| `404.html` | What a missing page shows |

## How it is built

**Classes style structure.** Every page is HTML with Mast's classes:

```html
<section class="section cc-alt">
  <div class="container">
    <div class="row row-justify-center">
      <div class="col col-8">
        <div class="eyebrow cc-rule">Lorem ipsum</div>
        <h1>A simple header</h1>
        <a href="#" class="button cc-secondary">Button</a>
      </div>
    </div>
  </div>
</section>
```

**Data attributes drive behaviour.** Accordions, modals, tabs, sliders, the
marquee, inline video, the nav and the theme toggle are set up by
`js/main.js` from the markup's `data-*` attributes — on the page, and on
whatever is drawn into it later.

```
css/            Mast's CSS, in cascade layers (main.css sets the order)
  tokens.css      the theme: every editable value up top
  base.css        fonts, reset, elements
  layout.css      section, container, row / col, content wrap
  typography.css  eyebrow, paragraph sizes, rich text
  components.css  buttons, cards, forms, nav, footer, …
  styleguide.css  the style-guide pages' own chrome (styles__*)
  utilities.css   u-* utilities, which always win
js/
  main.js         sets up Mast's behaviours on the page
  mast/           accordion, modal, tabs, slider, nav, theme, video, …
  styleguide-nav.js  the style-guide pages' menu button
fonts/  images/
```

Theme it in `css/tokens.css`: colours, fonts, the fluid type scale and
spacing are all variables there.

## Credit and licences

- **Mast** is by [No-Code Supply Co.](https://nocodesupply.co/mast) (Corey
  Moen). This site is ported from Corey Moen's
  [Mast for Astro](https://github.com/CoreyMoen/mast-astro), MIT-licensed —
  its notice is in [`LICENSE.mast`](LICENSE.mast). The CSS in `css/` is
  Mast's, unchanged; the scripts are ported from it.
- **General Sans** (`fonts/`) is by Indian Type Foundry, under the
  [Fontshare](https://www.fontshare.com/fonts/general-sans) licence.
- The example images in `images/` come from Mast for Astro's demo.
