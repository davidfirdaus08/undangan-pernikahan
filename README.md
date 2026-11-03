# 💌 Undangan Pernikahan

Elegant, lightweight digital wedding invitation website built with pure HTML, CSS, and JavaScript. Designed to look good on every screen size, from desktop down to very small phones, with a simple interface that is easy to use for all ages.

## ✨ Features

- **Animated opening cover** with a personalized guest name and falling petals
- **Hand-drawn SVG ornaments** that animate as the page opens
- **Smooth scroll-reveal animations** across all sections
- **Wedding countdown timer** (days, hours, minutes, seconds)
- **Save the date**: add to Google Calendar or Apple Calendar in one tap
- **Location section** with an embedded map, an "Open in Maps" button, and a copy-address button
- **Digital envelope** with one-tap copy for bank account numbers
- **RSVP form** for attendance confirmation, guest count, and wishes
- **Downloadable invitation** in PDF or image format
- **Photo gallery** and couple profile section
- **Rich link preview** for WhatsApp and social sharing (Open Graph tags)
- **Fully responsive**, with all icons drawn in SVG (no emoji, no icon fonts)

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Scripting | Vanilla JavaScript |
| Fonts | Cormorant Garamond, Plus Jakarta Sans (Google Fonts) |
| Hosting | Cloudflare Pages |

## 📁 Project Structure

```
undangan-pernikahan/
├── index.html
└── assets/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── script.js
    └── gambar/
        ├── pengantin/     # Couple photos
        └── kenangan/      # Gallery and share-preview image
```

## 🚀 Run Locally

```bash
git clone https://github.com/davidfirdaus08/undangan-pernikahan.git
cd undangan-pernikahan
python -m http.server 8000
# open http://localhost:8000
```

No build step or dependencies required.

## 🛠️ Customization

| What | Where |
|------|-------|
| Names, date, and venue | `index.html` (cover, hero, event, and footer sections) |
| Event schedule | The "Rangkaian Acara" section and the calendar dialog links |
| Countdown target date | `assets/js/script.js` |
| Bank accounts | The "Tanda Kasih" section (`data-rek` attributes) |
| Photos | `assets/gambar/` |
| Share preview | `og:*` meta tags in `<head>` |
| Colors | CSS variables in `assets/css/style.css` |

## ☁️ Deployment

This is a static site. On **Cloudflare Pages**, connect the repository, leave the build command empty, and set the output directory to `/`.

## 👤 Author

**David Firdaus**
- GitHub: [@davidfirdaus08](https://github.com/davidfirdaus08)
- Instagram: [@davidfirdaus_08](https://instagram.com/davidfirdaus_08)
