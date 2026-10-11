# Asset manifest

The site ships with **no stock or invented imagery**. Every image a visitor sees comes from the
owner's uploads in the Studio (stored in object storage) or from the decorative SVGs below.

## Built-in (code) assets

| Asset            | File                                    | Dimensions           | Alt text                                                    | Use                                   |
| ---------------- | --------------------------------------- | -------------------- | ----------------------------------------------------------- | ------------------------------------- |
| Umbrella mark    | `components/brand.tsx` (`UmbrellaMark`) | 32×32 viewBox        | Decorative (`aria-hidden`)                                  | Wordmark, footer, accents             |
| Favicon          | `app/icon.svg`                          | 32×32                | n/a                                                         | Browser tab                           |
| Pencil underline | `ScribbleUnderline`                     | 240×20 viewBox       | Decorative                                                  | Hero emphasis, About                  |
| Looping arrow    | `ScribbleArrow`                         | 120×80 viewBox       | Decorative                                                  | Hero collage, Instagram, contact, 404 |
| Sparkle          | `ScribbleSpark`                         | 40×40 viewBox        | Decorative                                                  | Pull quote, empty states, poem pages  |
| Washi tape       | `Tape`                                  | 90×28 viewBox        | Decorative                                                  | Pinning posters                       |
| Social card      | `app/opengraph-image.tsx`               | 1200×630 (generated) | "December Scribbles: life is nothing without inspirations." | Default Open Graph image              |

## Owner-supplied assets (to be provided)

Put originals in `brand-assets/`, then upload the ones to publish through **Studio → Media**.
The upload pipeline validates them, resizes to ≤2400px plus a 640px thumbnail, converts to WebP
and strips metadata.

| Needed                                             | Suggested size                  | Where it appears                            | Alt text guidance                                    |
| -------------------------------------------------- | ------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| Illustrated posters / doodles                      | ≥1080px, 4:5 or 1:1 (as posted) | Gallery, home collage, sketchbook, lightbox | Describe the drawing **and any words written on it** |
| About image (portrait, desk, or a favourite piece) | ≥1200px, 4:5                    | About page, home About section              | Who or what is shown                                 |
| Optional writing covers                            | ≥1600px, 3:2 or 4:5             | Writing lead story, piece header            | What the image shows                                 |
| Logo / profile picture (if one exists)             | SVG or ≥512px                   | To replace the provisional umbrella mark    | n/a                                                  |

## Temporary content during development

`npm run preview:load -w @ds/api` loads **labelled sample content** ("Sample:" titles, `sample-`
slugs, generated posters stamped "SAMPLE ARTWORK") into the **development** database so layouts
can be reviewed at realistic volume. `npm run preview:remove -w @ds/api` deletes exactly those rows
and images. Samples were removed before handover and must never be loaded in production.
