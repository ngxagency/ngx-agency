# NGX Labs site v1 deploy notes

Upload the contents of `/site` as the web root of a plain static host. Do not upload `/site/_qc/`. That folder is local QC evidence (screenshots and the check script), not part of the site.

The build is a preview: every page sends `noindex, nofollow`, and `robots.txt` disallows all crawlers. There is no login.

## Do not deploy

- `_qc/`

## Placeholder slots

Gray SVG blocks stand in for assets that are not produced yet. Visible labels start with `PLACEHOLDER:`. Swap the `src`, `srcset`, `poster`, or `data-src` to the final file. Keep the width and height attributes.

| Slot | Used on | Current file | Swap to | Size |
| --- | --- | --- | --- | --- |
| Hero still (desktop, the only eager image) | Home | `assets/placeholders/hero-desktop.svg` | `assets/hero/hero-desktop.webp` | 1600 x 1000 |
| Mobile hero crop | Home, under 760px | `assets/placeholders/hero-mobile.svg` | `assets/hero/hero-mobile.webp` | 780 x 975 |
| Loop A poster | Home, Services | `assets/placeholders/loop-a-poster.svg` | `assets/loops/loop-a-poster.webp` | 1280 x 720 |
| Loop A video (8s, muted, no file yet) | Home, Services, `data-src` | (missing) | `assets/loops/loop-a.mp4` | display 16:9 |
| Loop B poster | Work, featured project | `assets/placeholders/loop-b-poster.svg` | `assets/loops/loop-b-poster.webp` | 1280 x 720 |
| Loop B video (8s, muted, no file yet) | Work, featured, `data-src` | (missing) | `assets/loops/loop-b.mp4` | display 16:9 |
| Project stills (10), also the cursor preview and the opening window for TCG Pop Toys | Work index, Home opening window | `assets/placeholders/project-<slug>.svg` | `assets/work/<slug>.webp` | 800 x 600 |

Slugs: `tcg-pop-toys`, `shipwink`, `topfoodnews`, `callwaiting-ai`, `propertyblasters`, `datait`, `turbopc`, `rydrpilot`, `tiles`, `yuna-conti`.

Logo plate: drawn in CSS (class `logo-plate` and the hero frame). There is no plate image to swap. If a plate file is produced later, the intended path is `assets/brand/logo-plate.webp`. The wordmark itself is only `assets/ngx-logo-official.png`.

Open Graph image is not linked. Intended path if one is produced: `assets/og/og-1200x630.png` (1200 x 630). Favicon currently points at the wordmark.

Empty directories `assets/hero/`, `assets/loops/`, and `assets/work/` are where the final hero, loops, and project stills go.

## Data file

`js/data.js` (`window.NGX_DATA`).

- `specialists` (23). Painted into the home support line and the stats band.
- `productsShipped` (10). Painted into the home support line, the stats band, and the Work support line. Keep this equal to `projects.length`.
- `automationsInProduction` (null). The stats band shows `automationsMark` (`--`) and `automationsNote` (`PLACEHOLDER`) until this is a number.
- `pricing.consult`, `pricing.build`, `pricing.run`.
- `socials`. Handles only. They are text, not links.
- `contact` (`hello@ngx.agency`).
- `projects`. Canonical portfolio list. The Work rows in `work/index.html` mirror this list for visitors without JavaScript.

No-JS fallbacks (update in the same change as the data file):

- Home support and stats: `23`, `10`, `--`, `PLACEHOLDER`
- Work support: `10`
- Process prices: `From $3K`, `From $8K`, `From $5K/mo`

## Tracking config

`js/tracking-config.js` (`window.NGX_TRACKING`). All IDs ship empty. `js/site.js` injects a tool only when its ID is non-empty and consent is `granted` in local storage (`ngx_consent`). A Global Privacy Control signal blocks every tool.

| Key | Tool |
| --- | --- |
| `metaPixelId` | Meta Pixel |
| `tiktokPixelId` | TikTok Pixel |
| `ga4MeasurementId` | Google Analytics 4 |
| `googleAdsId` | Google Ads conversion ID |
| `googleAdsLabel` | Google Ads conversion label |
| `clarityProjectId` | Microsoft Clarity |
| `searchConsoleVerification` | Google Search Console meta tag |

Campaign parameters are stored in session storage (`ngx_utm_payload`) and copied onto the audit payload: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `li_fat_id`, `landing_path`.

## Form endpoint

`js/form-config.js`:

- `endpoint`: `https://comms.ngx.agency/ngx-contact`
- `source`: `ngx-site-v1`

With JavaScript, the form POSTs JSON to `endpoint`. The no-JS fallback is the `action` on `#auditForm` in `free-audit/index.html`. Keep that attribute equal to `endpoint`.

JSON keys: `name`, `email`, `phone` (empty; no phone field is shown), `company`, `industry` (empty), `revenue` (empty; replaced by admin hours), `message`, `website`, `staff_size`, `role`, `admin_hours_per_week`, `source`, plus the campaign keys above.

Required: name, email, company, staff size, role, admin hours per week. Website and message are optional.

A successful response shows a reference. If the JSON body includes a short `reference` or `id`, that value is used. Otherwise the page generates `NGX-` plus 6 characters and scrambles it into place.
