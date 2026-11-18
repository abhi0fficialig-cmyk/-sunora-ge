# Sunora Green Energy website

Static website (HTML, CSS, JavaScript) for **Sunora Green Energy**: rooftop solar, PM Surya Ghar subsidy support, projects, videos, FAQs and contact.

## Structure

```
index.html      page markup
css/style.css   all styles
js/main.js      preloader, carousels, lightbox, forms, animations
assets/         logo, images, videos
vercel.json     Vercel settings (clean URLs, caching, security headers)
```

There is no build step. Libraries (Swiper, Lenis, Phosphor icons) load from CDNs.

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repository.
2. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
3. Click **Deploy**. Every push to `main` redeploys automatically.

## Run locally

```bash
python -m http.server 5520
```

Then open http://localhost:5520

## Things to replace

- Contact address, social links and the Google Map query in `index.html` (search for `Sunora+Green+Energy`).
- Customer names and reviews in the Testimonials section are samples.
- The state subsidy figure in "State government solar subsidy" is a sample; set it for your state.
