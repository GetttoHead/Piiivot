# PIIIVOT — High-Performance Combat & Training Apparel

> **Engineered for high-output combat sports, MMA, Muay Thai, and athletic training.**

---

## ⚡ Features
- **Modern Tactical E-Commerce Storefront**: Fully responsive, high-aesthetic dark/light mode architecture.
- **Dynamic Product Showcase**: Interactive galleries, spec accordions, stock indicators, and instant cart integration.
- **Visual Studio CMS (Portal 2)**: Drag-and-drop live builder with 1-click section backgrounds, typography controls, freeform positioning, image uploads, and group selections.
- **Admin Control Desk (Portal 1)**: Real-time order dispatching, stock toggles (In Stock / Out of Stock), pricing updates, and priority subscriber exports.
- **Persistent Storage**: Instant state synchronization with guaranteed Save & Publish persistence.

---

## 🚀 Quick Start

### Running Locally
To launch the built-in local development server:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Then visit:
- **Live Storefront**: `http://localhost:8080/index.html`
- **Admin & Visual Studio**: `http://localhost:8080/admin.html` *(Credentials: `admin` / `piiivot2026`)*
- **Visual Builder Mode**: `http://localhost:8080/index.html?edit=true`
- **Product Page**: `http://localhost:8080/product.html?id=combat-01-shorts`

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System & Glassmorphism), Modern JavaScript ES6+
- **Typography**: Anton, IBM Plex Mono, IBM Plex Sans, Outfit, Bebas Neue
- **Server**: PowerShell HTTP/TCP daemon (`serve.ps1`)
