# Webfonts

Self-hosted rather than loaded from Google's CDN: the CDN sends every
visitor's IP to Google, which needs consent under GDPR, and per-origin cache
partitioning has removed the shared-cache argument for using it.

Both families are variable fonts, so a single file per subset covers every
weight the site uses — Cinzel 400/500/600 and Montserrat 300/400. The
`unicode-range` values in `css/main.css` are Google's own, so latin-ext is
still fetched only when a glyph in its range appears.

| file | family | subset | source |
| --- | --- | --- | --- |
| `cinzel-latin.woff2` | Cinzel v26 | latin | fonts.gstatic.com |
| `cinzel-latin-ext.woff2` | Cinzel v26 | latin-ext | fonts.gstatic.com |
| `montserrat-latin.woff2` | Montserrat v31 | latin | fonts.gstatic.com |
| `montserrat-latin-ext.woff2` | Montserrat v31 | latin-ext | fonts.gstatic.com |

To refresh, request the CSS from `fonts.googleapis.com/css2` with a current
browser user-agent (an older one gets ttf/eot instead of woff2) and download
the latin and latin-ext URLs it names.

## Licensing

Both families are under the SIL Open Font License 1.1 — free to use and to
serve from our own host, commercially. The OFL requires the license text
travel with the fonts, which is what `OFL-Cinzel.txt` and
`OFL-Montserrat.txt` are doing here; both are copied verbatim from the
upstream projects. Keep them alongside the woff2 files when deploying.
