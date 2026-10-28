# Solar Engineering UG — website

Bilingual (English / Kiswahili) website for **Solar Engineering UG**, Kampala, Uganda, plus the commercial proposal at `/propuesta/`.

Static site with no build step: open `index.html` or publish to any static host (GitHub Pages, Netlify, Vercel).

- `index.html` — structure and English content (SEO: meta tags, LocalBusiness schema, hreflang)
- `styles.css` — design (black, green and yellow; Space Grotesk + Inter)
- `main.js` — GSAP + ScrollTrigger animations and Lenis smooth scroll: sun preloader with counter, masked headline reveals, rotating hero word, scroll-reactive marquee, service image preview that follows the cursor, self-drawing product illustrations, pinned horizontal project gallery, process steps, expanding CTA band, magnetic buttons, custom cursor, and a quote form that sends to WhatsApp or email
- `assets/js/i18n.js` — Kiswahili translations and the EN/SW switch (choice remembered; `?lang=sw` opens in Kiswahili)
- `assets/` — logo variants, photos (WebP), Open Graph image, self-hosted fonts and libraries
- `propuesta/index.html` — proposal (EN/SW): before/after comparison, what's included, timeline, investment calculator (website $455 + hosting $145/year or $25/month + domain $25/year) and acceptance via WhatsApp
- `robots.txt`, `sitemap.xml`

Respects `prefers-reduced-motion` and works on mobile.

## Before launch
- Replace the `#` social media links in the contact section (`index.html`, search for "Replace") with the company's real profiles.
- Swap the stock photos in the Projects gallery for real project photos.
