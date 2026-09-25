# MLC Architecture — site preview

Static preview of a redesigned site for MLC Architecture P.C. Six pages, plain
HTML/CSS/JS, no build step. Served by GitHub Pages from this branch's root.

Not the live site, and not indexed by search engines (`robots.txt` + meta noindex).

## Destination: WordPress on DreamHost

This preview will be migrated to a WordPress site hosted on DreamHost. Every
change should port cleanly to a WordPress theme. In practice:

- **Plain HTML, CSS and vanilla JS only.** No build step, bundler, framework
  (React, Vue, Tailwind build, etc.) or static-site generator. `css/main.css` and
  `js/main.js` should drop into a theme and load via `wp_enqueue_style` /
  `wp_enqueue_script`.
- **Keep the markup template-shaped.** The header, nav and footer are repeated
  on every page and will become `header.php` / `footer.php`. Keep them identical
  across pages. Page bodies become page templates or block content, and gallery
  projects become posts or a custom post type, so keep each repeated item
  (project card, service block) self-contained and consistently structured.
- **Relative asset paths.** Keep everything under `assets/`, `css/` and `js/` so
  paths can be swapped for `get_template_directory_uri()`. Images will likely
  move into the WordPress media library.
- **No server logic we can't run on DreamHost.** Anything dynamic, such as the
  contact form (currently a `mailto:` placeholder), will be
  handled by PHP or a WordPress plugin (e.g. Contact Form 7, WPForms). Don't add
  Node backends, serverless functions or GitHub-Pages-only features.
- **Third-party assets must be allowed in WordPress.** Self-hosted fonts (see
  `assets/fonts/`) and licensed images are fine; avoid services that need a
  build pipeline or can't be enqueued from a theme.
- **GitHub Pages-only bits get dropped at migration.** `robots.txt` and the
  `noindex` meta exist only because this is a preview; don't build around them.

If a change would be hard to reproduce in a WordPress theme, flag it before
building it.

## Header colour trial (temporary)

The client is choosing between three dark headers. Add `?header=` to any page
URL to preview one site-wide; the choice sticks while you click between pages.

- `?header=navy`: deep navy (`--deep`)
- `?header=ink`: warm charcoal (`--ink`)
- `?header=black`: near-black
- `?header=paper` or no parameter: the current paper header

Once one is picked, move its values into the `.header` defaults in
`css/main.css`, delete the trial block there, and delete `js/header-preview.js`
and its `<script>` tag on every page. None of it should reach WordPress.
