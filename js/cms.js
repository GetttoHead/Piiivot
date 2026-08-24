/**
 * PIIIVOT CMS State Manager & Storefront Live Binder
 * Allows full dynamic customization of products, copy, and orders via admin.html
 */

(function () {
  const CMS_STORAGE_KEY = 'piiivot_cms_store_v1';
  const AUTH_SESSION_KEY = 'piiivot_admin_auth_v1';

  // Factory Defaults
  const DEFAULT_CONTENT = {
    hero: {
      eyebrow: "Combat Sports · Esports & Training — Dhaka, Bangladesh",
      title: "Built to\ncompete.",
      subtitle: "Performance gear for people who train, compete, and keep moving forward. Explore the first PIIIVOT drop — engineered for combat sports, athletic training, and high-output performance.",
      primaryBtnText: "Shop The First Drop →",
      primaryBtnLink: "#shop",
      secondaryBtnText: "Why PIIIVOT",
      secondaryBtnLink: "#about"
    },
    manifesto: {
      title: "Train with purpose. Move with intent.",
      para1: "PIIIVOT is built around a simple idea: your gear should support the work, not distract from it.",
      para2: "We focus on clean design, practical performance, and products we can stand behind — from the first warm-up to the final round.",
      signoff: "— PIIIVOT / Dhaka"
    },
    trust: [
      {
        num: "01",
        title: "Curated",
        desc: "We select products around real training needs rather than filling shelves with random hype pieces."
      },
      {
        num: "02",
        title: "Checked Locally",
        desc: "Every batch is inspected in Dhaka before it carries the PIIIVOT competition name."
      },
      {
        num: "03",
        title: "Built to Return",
        desc: "Engineered for repeated sessions and heavy mat sparring rounds without failing."
      }
    ],
    contact: {
      phone: "+880 1403-047993",
      whatsapp: "8801403047993",
      instagram: "@_piiivot",
      facebook: "/Piiivot",
      address: "Rampura, Banasree · Dhaka, Bangladesh"
    },
    security: {
      adminUser: "admin",
      adminPass: "piiivot2026"
    }
  };

  const CMS = {
    // ---- Storage Init & Access ----
    getData: function () {
      try {
        const raw = localStorage.getItem(CMS_STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {
        console.error("Failed to parse CMS data", e);
      }

      // Initialize with factory defaults & products from products.js
      const initial = {
        content: JSON.parse(JSON.stringify(DEFAULT_CONTENT)),
        products: window.PIIIVOT_PRODUCTS ? JSON.parse(JSON.stringify(window.PIIIVOT_PRODUCTS)) : {},
        orders: [
          {
            id: "ORD-PVT-1082",
            date: "2026-08-24 14:30",
            customerName: "Siam Chowdhury",
            phone: "+880 1711-234567",
            address: "House 14, Road 7, Banani, Dhaka",
            payment: "Cash on Delivery",
            items: [
              { name: "Combat 01 Shorts", size: "L", color: "Onyx Black", qty: 1, price: 1490 }
            ],
            total: 1560,
            status: "Confirmed"
          }
        ],
        subscribers: ["fighter.dhaka@gmail.com", "tanvir.bjj@outlook.com"]
      };

      this.saveData(initial);
      return initial;
    },

    saveData: function (data) {
      try {
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(data));
        // Sync active products to global window object if available
        if (typeof window !== 'undefined' && data.products) {
          window.PIIIVOT_PRODUCTS = data.products;
        }
      } catch (e) {
        console.error("Failed to save CMS data", e);
      }
    },

    // ---- Content Operations ----
    getContent: function () {
      return this.getData().content || DEFAULT_CONTENT;
    },

    saveContent: function (contentUpdates) {
      const data = this.getData();
      data.content = { ...data.content, ...contentUpdates };
      this.saveData(data);
      this.bindStorefront();
      return data.content;
    },

    // ---- Product Operations ----
    getProducts: function () {
      const data = this.getData();
      return data.products || {};
    },

    getProduct: function (id) {
      const products = this.getProducts();
      return products[id] || null;
    },

    saveProduct: function (product) {
      if (!product.id) {
        product.id = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      const data = this.getData();
      data.products[product.id] = product;
      this.saveData(data);
      return product;
    },

    deleteProduct: function (id) {
      const data = this.getData();
      if (data.products[id]) {
        delete data.products[id];
        this.saveData(data);
        return true;
      }
      return false;
    },

    // ---- Order Management ----
    getOrders: function () {
      return this.getData().orders || [];
    },

    addOrder: function (order) {
      const data = this.getData();
      if (!order.id) {
        order.id = 'ORD-PVT-' + Math.floor(1000 + Math.random() * 9000);
      }
      if (!order.date) {
        const d = new Date();
        order.date = d.toISOString().replace('T', ' ').substring(0, 16);
      }
      if (!order.status) {
        order.status = 'Pending Verification';
      }
      data.orders.unshift(order);
      this.saveData(data);
      return order;
    },

    updateOrderStatus: function (orderId, newStatus) {
      const data = this.getData();
      const order = data.orders.find(o => o.id === orderId);
      if (order) {
        order.status = newStatus;
        this.saveData(data);
        return true;
      }
      return false;
    },

    deleteOrder: function (orderId) {
      const data = this.getData();
      data.orders = data.orders.filter(o => o.id !== orderId);
      this.saveData(data);
    },

    // ---- Subscriber Leads ----
    getSubscribers: function () {
      return this.getData().subscribers || [];
    },

    addSubscriber: function (email) {
      if (!email) return;
      const data = this.getData();
      if (!data.subscribers) data.subscribers = [];
      if (!data.subscribers.includes(email)) {
        data.subscribers.unshift(email);
        this.saveData(data);
      }
    },

    // ---- Backup & Export / Import ----
    exportJSON: function () {
      const data = this.getData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `piiivot_store_backup_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    importJSON: function (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.content && parsed.products) {
          this.saveData(parsed);
          return { success: true };
        }
        return { success: false, error: "Invalid store schema" };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    resetToDefaults: function () {
      localStorage.removeItem(CMS_STORAGE_KEY);
      const fresh = this.getData();
      if (typeof window !== 'undefined' && window.PIIIVOT_PRODUCTS) {
        fresh.products = JSON.parse(JSON.stringify(window.PIIIVOT_PRODUCTS));
        this.saveData(fresh);
      }
      return fresh;
    },

    // ---- Authentication Gate ----
    login: function (user, pass) {
      const sec = (this.getData().content && this.getData().content.security) || DEFAULT_CONTENT.security;
      if (user === sec.adminUser && pass === sec.adminPass) {
        sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
        return true;
      }
      return false;
    },

    logout: function () {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    },

    isLoggedIn: function () {
      return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    },

    // ---- Live Storefront Binder ----
    bindStorefront: function () {
      if (typeof document === 'undefined') return;
      const content = this.getContent();

      // Hero Bindings
      if (content.hero) {
        const eyebrowEl = document.querySelector('.hero .eyebrow');
        if (eyebrowEl && content.hero.eyebrow) eyebrowEl.textContent = content.hero.eyebrow;

        const h1El = document.querySelector('.hero h1');
        if (h1El && content.hero.title) h1El.innerHTML = content.hero.title.replace(/\n/g, '<br>');

        const pEl = document.querySelector('.hero p');
        if (pEl && content.hero.subtitle) pEl.textContent = content.hero.subtitle;

        const primaryBtn = document.querySelector('.hero .btn-primary');
        if (primaryBtn && content.hero.primaryBtnText) {
          primaryBtn.textContent = content.hero.primaryBtnText;
          if (content.hero.primaryBtnLink) primaryBtn.setAttribute('href', content.hero.primaryBtnLink);
        }

        const outlineBtn = document.querySelector('.hero .btn-outline');
        if (outlineBtn && content.hero.secondaryBtnText) {
          outlineBtn.textContent = content.hero.secondaryBtnText;
          if (content.hero.secondaryBtnLink) outlineBtn.setAttribute('href', content.hero.secondaryBtnLink);
        }
      }

      // Manifesto Bindings
      if (content.manifesto) {
        const h2El = document.querySelector('.manifesto h2');
        if (h2El && content.manifesto.title) h2El.textContent = content.manifesto.title;

        const paras = document.querySelectorAll('.manifesto p');
        if (paras[0] && content.manifesto.para1) paras[0].textContent = content.manifesto.para1;
        if (paras[1] && content.manifesto.para2) paras[1].textContent = content.manifesto.para2;

        const signoff = document.querySelector('.manifesto .signoff');
        if (signoff && content.manifesto.signoff) signoff.textContent = content.manifesto.signoff;
      }

      // Trust Grid Bindings
      if (content.trust && content.trust.length) {
        const trustItems = document.querySelectorAll('.trust-item');
        content.trust.forEach((item, idx) => {
          if (trustItems[idx]) {
            const h4 = trustItems[idx].querySelector('h4');
            const p = trustItems[idx].querySelector('p');
            if (h4 && item.title) h4.textContent = item.title;
            if (p && item.desc) p.textContent = item.desc;
          }
        });
      }

      // Contact & Footer Bindings
      if (content.contact) {
        document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
          el.setAttribute('href', `https://wa.me/${content.contact.whatsapp}`);
          if (el.textContent.includes('WhatsApp')) {
            el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M20 12a8 8 0 1 1-3.8-6.8"/><path d="M20 4l-8 8"/></svg> WhatsApp — ${content.contact.phone}`;
          }
        });

        document.querySelectorAll('a[href*="instagram.com"]').forEach(el => {
          el.setAttribute('href', `https://instagram.com/${content.contact.instagram.replace('@', '')}`);
        });

        const metaAddress = document.querySelector('.footer-meta');
        if (metaAddress && content.contact.address) metaAddress.textContent = content.contact.address;
      }

      // Sync Products to Global Scope
      const liveProducts = this.getProducts();
      if (Object.keys(liveProducts).length > 0) {
        window.PIIIVOT_PRODUCTS = liveProducts;
      }
    }
  };

  // Expose globally
  window.PIIIVOT_CMS = CMS;

  // Auto-bind on storefront load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => CMS.bindStorefront());
    } else {
      CMS.bindStorefront();
    }
  }
})();
