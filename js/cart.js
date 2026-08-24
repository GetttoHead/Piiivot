/**
 * PIIIVOT Interactive Slide-Over Cart & State Manager
 * Syncs cart across all pages with localStorage
 */

(function () {
  const STORAGE_KEY = 'piiivot_cart_v1';

  // Core state operations
  const CartStore = {
    getItems: function () {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error('Failed to load cart from storage', e);
        return [];
      }
    },

    saveItems: function (items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        CartUI.updateBadge();
        CartUI.render();
      } catch (e) {
        console.error('Failed to save cart', e);
      }
    },

    addItem: function (productId, size, color, quantity = 1) {
      const product = window.PIIIVOT_PRODUCTS ? window.PIIIVOT_PRODUCTS[productId] : null;
      if (!product) return;

      const items = CartStore.getItems();
      const existingIndex = items.findIndex(
        (item) => item.id === productId && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
      } else {
        items.push({
          id: productId,
          name: product.name,
          sku: product.sku,
          price: product.price,
          category: product.category,
          size: size || 'Standard',
          color: color || 'Default',
          quantity: quantity
        });
      }

      CartStore.saveItems(items);
      CartUI.showToast(`Added to bag: ${product.name} (${size || 'M'})`);
      CartUI.open();
    },

    updateQuantity: function (index, delta) {
      const items = CartStore.getItems();
      if (!items[index]) return;

      items[index].quantity += delta;
      if (items[index].quantity <= 0) {
        items.splice(index, 1);
      }
      CartStore.saveItems(items);
    },

    removeItem: function (index) {
      const items = CartStore.getItems();
      items.splice(index, 1);
      CartStore.saveItems(items);
    },

    clear: function () {
      CartStore.saveItems([]);
    },

    getCount: function () {
      return CartStore.getItems().reduce((acc, item) => acc + item.quantity, 0);
    },

    getTotal: function () {
      return CartStore.getItems().reduce((acc, item) => acc + item.price * item.quantity, 0);
    }
  };

  // UI Drawer & Modal manager
  const CartUI = {
    init: function () {
      this.injectStyles();
      this.injectMarkup();
      this.bindEvents();
      this.updateBadge();
      this.render();
    },

    injectStyles: function () {
      if (document.getElementById('piiivot-cart-styles')) return;

      const css = `
        /* PIIIVOT Slide-Over Cart Styles */
        .cart-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(8px);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s ease;
        }
        .cart-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .cart-drawer {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: 100%;
          max-width: min(440px, 100vw);
          background: var(--ink, #0a0a0a);
          color: var(--paper, #f5f4ef);
          border-left: 1px solid var(--line, #333230);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: -10px 0 35px rgba(0,0,0,0.6);
          padding-bottom: max(0px, env(safe-area-inset-bottom));
        }
        .cart-drawer.open {
          transform: translateX(0);
        }

        .cart-header {
          padding: clamp(16px, 3vw, 22px) clamp(18px, 4vw, 24px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--line, #333230);
          background: var(--ink-2, #161615);
        }
        .cart-title {
          font-family: 'Anton', sans-serif;
          font-size: clamp(18px, 2.5vw, 20px);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cart-count-pill {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          padding: 2px 7px;
          background: var(--paper, #f5f4ef);
          color: var(--ink, #0a0a0a);
          border-radius: 2px;
        }
        .cart-close-btn {
          background: none;
          border: 1px solid var(--line, #333230);
          color: var(--mid, #98958a);
          font-size: 20px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .cart-close-btn:hover {
          color: var(--paper, #f5f4ef);
          border-color: var(--paper, #f5f4ef);
        }

        .cart-shipping-meter {
          padding: 10px clamp(18px, 4vw, 24px);
          background: var(--ink-3, #1f1e1c);
          border-bottom: 1px solid var(--line, #333230);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
        }
        .meter-bar {
          height: 3px;
          background: var(--line, #333230);
          margin-top: 6px;
          position: relative;
          overflow: hidden;
        }
        .meter-fill {
          height: 100%;
          background: var(--paper, #f5f4ef);
          transition: width 0.4s ease;
        }

        .cart-body {
          flex: 1;
          overflow-y: auto;
          padding: clamp(16px, 3vw, 20px) clamp(16px, 4vw, 24px);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cart-empty-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: 100%;
          color: var(--mid, #98958a);
          gap: 14px;
          padding: 20px 0;
        }
        .cart-empty-view svg {
          width: 48px;
          height: 48px;
          stroke: var(--mid, #98958a);
        }

        .cart-item {
          display: grid;
          grid-template-columns: 68px 1fr auto;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--line, #333230);
          align-items: start;
        }
        .cart-item-visual {
          width: 68px;
          height: 68px;
          background: var(--ink-2, #161615);
          border: 1px solid var(--line, #333230);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Anton', sans-serif;
          font-size: 11px;
          color: var(--mid, #98958a);
          letter-spacing: 0.05em;
          text-align: center;
          padding: 4px;
        }
        .cart-item-info h5 {
          font-family: 'Anton', sans-serif;
          font-size: 14.5px;
          letter-spacing: 0.02em;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .cart-item-meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: var(--mid, #98958a);
          display: flex;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .cart-stepper {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--line, #333230);
          border-radius: 2px;
        }
        .cart-stepper button {
          background: none;
          border: none;
          color: var(--paper, #f5f4ef);
          width: 28px;
          height: 26px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cart-stepper button:hover {
          background: var(--ink-3, #1f1e1c);
        }
        .cart-stepper span {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          padding: 0 6px;
          min-width: 20px;
          text-align: center;
        }

        .cart-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          height: 100%;
        }
        .cart-item-price {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 600;
        }
        .cart-item-del {
          background: none;
          border: none;
          color: var(--mid, #98958a);
          font-size: 11px;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          text-transform: uppercase;
          margin-top: 14px;
          transition: color 0.2s ease;
          padding: 4px 0;
        }
        .cart-item-del:hover {
          color: #ef4444;
        }

        .cart-footer {
          padding: clamp(16px, 3vw, 20px) clamp(18px, 4vw, 24px);
          background: var(--ink-2, #161615);
          border-top: 1px solid var(--line, #333230);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cart-summary-line {
          display: flex;
          justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--mid, #98958a);
        }
        .cart-summary-line.total {
          font-size: 15px;
          color: var(--paper, #f5f4ef);
          font-weight: 600;
          border-top: 1px dashed var(--line, #333230);
          padding-top: 10px;
        }

        .cart-checkout-btn {
          width: 100%;
          background: var(--paper, #f5f4ef);
          color: var(--ink, #0a0a0a);
          border: none;
          padding: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
          border-radius: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .cart-checkout-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .cart-checkout-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none;
        }

        .cart-note {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: var(--mid, #98958a);
          text-align: center;
        }

        /* Toast notification */
        .piiivot-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: var(--paper, #f5f4ef);
          color: var(--ink, #0a0a0a);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.06em;
          padding: 12px 20px;
          border-radius: 2px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 2000;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-transform: uppercase;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 90vw;
          text-align: center;
        }
        .piiivot-toast.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }

        /* Checkout Modal */
        .checkout-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(10px);
          z-index: 1500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(12px, 3vw, 24px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.25s ease;
        }
        .checkout-modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .checkout-dialog {
          background: var(--ink-2, #161615);
          border: 1px solid var(--line, #333230);
          color: var(--paper, #f5f4ef);
          max-width: min(520px, 94vw);
          max-height: 90vh;
          overflow-y: auto;
          width: 100%;
          padding: clamp(22px, 4vw, 36px);
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        }
        .checkout-dialog h3 {
          font-family: 'Anton', sans-serif;
          font-size: clamp(22px, 3.5vw, 26px);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .checkout-dialog p {
          color: var(--mid, #98958a);
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.45;
        }
        .order-form-group {
          margin-bottom: 14px;
        }
        .order-form-group label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--mid, #98958a);
          margin-bottom: 5px;
        }
        .order-form-group input, .order-form-group textarea, .order-form-group select {
          width: 100%;
          background: var(--ink, #0a0a0a);
          border: 1px solid var(--line, #333230);
          color: var(--paper, #f5f4ef);
          padding: 11px 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 13.5px;
          border-radius: 2px;
        }
        .order-form-group input:focus, .order-form-group textarea:focus, .order-form-group select:focus {
          border-color: var(--paper, #f5f4ef);
          outline: none;
        }
      `;

      const style = document.createElement('style');
      style.id = 'piiivot-cart-styles';
      style.textContent = css;
      document.head.appendChild(style);
    },

    injectMarkup: function () {
      if (document.getElementById('piiivot-cart-container')) return;

      const container = document.createElement('div');
      container.id = 'piiivot-cart-container';
      container.innerHTML = `
        <div class="cart-overlay" id="cartOverlay"></div>
        <aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Shopping Bag">
          <div class="cart-header">
            <div class="cart-title">
              <span>Your Bag</span>
              <span class="cart-count-pill" id="cartCountPill">0</span>
            </div>
            <button class="cart-close-btn" id="cartCloseBtn" aria-label="Close Bag">×</button>
          </div>

          <div class="cart-shipping-meter">
            <div id="shippingMeterText">Free dispatch in Dhaka on orders over ৳ 2,000</div>
            <div class="meter-bar"><div class="meter-fill" id="shippingMeterFill" style="width: 0%;"></div></div>
          </div>

          <div class="cart-body" id="cartBody">
            <!-- Injected dynamically -->
          </div>

          <div class="cart-footer" id="cartFooter">
            <div class="cart-summary-line">
              <span>Subtotal</span>
              <span id="cartSubtotal">৳ 0</span>
            </div>
            <div class="cart-summary-line">
              <span>Dhaka City Courier</span>
              <span id="cartShipping">৳ 70</span>
            </div>
            <div class="cart-summary-line total">
              <span>Total Due (BDT)</span>
              <span id="cartTotalDue">৳ 70</span>
            </div>

            <button class="cart-checkout-btn" id="cartCheckoutBtn">
              <span>Proceed to Dispatch →</span>
            </button>
            <p class="cart-note">// Cash on Delivery · bKash · Nagad · Visa/Mastercard</p>
          </div>
        </aside>

        <div class="piiivot-toast" id="piiivotToast">
          <span style="font-weight:700;">✓</span>
          <span id="toastMessage">Item added to bag</span>
        </div>

        <!-- Checkout / Dispatch Quick Modal -->
        <div class="checkout-modal-overlay" id="checkoutModal">
          <div class="checkout-dialog">
            <button class="cart-close-btn" style="position:absolute; top:18px; right:18px;" id="checkoutCloseBtn">×</button>
            <p class="eyebrow" style="color:var(--mid);">First Drop Dispatch</p>
            <h3>Direct Order Placement</h3>
            <p>Complete your delivery coordinates below. Our team in Banasree/Dhaka verifies all orders via WhatsApp before dispatch.</p>
            
            <form id="directOrderForm" onsubmit="event.preventDefault(); CartUI.handleOrderSubmit(this);">
              <div class="order-form-group">
                <label>Full Name *</label>
                <input type="text" required placeholder="e.g. Tanvir Ahmed">
              </div>
              <div class="order-form-group">
                <label>WhatsApp / Phone Number *</label>
                <input type="tel" required placeholder="e.g. 017XXXXXXXX">
              </div>
              <div class="order-form-group">
                <label>Delivery Address in Bangladesh *</label>
                <textarea rows="2" required placeholder="House, Road, Sector/Area, City (e.g. Dhanmondi, Dhaka)"></textarea>
              </div>
              <div class="order-form-group">
                <label>Payment Method</label>
                <select>
                  <option value="cod">Cash on Delivery (Dhaka & Nationwide)</option>
                  <option value="bkash">bKash Merchant / Personal</option>
                  <option value="nagad">Nagad Online Transfer</option>
                  <option value="card">Card Payment on Delivery</option>
                </select>
              </div>
              <button type="submit" class="cart-checkout-btn" style="margin-top:16px;">Confirm & Place Order</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    },

    bindEvents: function () {
      const overlay = document.getElementById('cartOverlay');
      const closeBtn = document.getElementById('cartCloseBtn');
      const checkoutBtn = document.getElementById('cartCheckoutBtn');
      const checkoutModal = document.getElementById('checkoutModal');
      const checkoutCloseBtn = document.getElementById('checkoutCloseBtn');

      if (overlay) overlay.addEventListener('click', () => this.close());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          if (CartStore.getItems().length === 0) return;
          this.close();
          checkoutModal.classList.add('open');
        });
      }

      if (checkoutCloseBtn) {
        checkoutCloseBtn.addEventListener('click', () => {
          checkoutModal.classList.remove('open');
        });
      }

      // Attach to any element with [aria-label="Cart"] or .cart-trigger
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[aria-label="Cart"], .cart-trigger');
        if (trigger) {
          e.preventDefault();
          this.open();
        }
      });

      // Escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.close();
          if (checkoutModal) checkoutModal.classList.remove('open');
        }
      });
    },

    open: function () {
      const overlay = document.getElementById('cartOverlay');
      const drawer = document.getElementById('cartDrawer');
      if (overlay && drawer) {
        overlay.classList.add('open');
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    },

    close: function () {
      const overlay = document.getElementById('cartOverlay');
      const drawer = document.getElementById('cartDrawer');
      if (overlay && drawer) {
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      }
    },

    showToast: function (message) {
      const toast = document.getElementById('piiivot-toast') || document.getElementById('piiivotToast');
      const text = document.getElementById('toastMessage');
      if (toast && text) {
        text.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
        }, 2800);
      }
    },

    updateBadge: function () {
      const count = CartStore.getCount();
      document.querySelectorAll('.cart-badge').forEach((badge) => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
      const pill = document.getElementById('cartCountPill');
      if (pill) pill.textContent = count;
    },

    render: function () {
      const items = CartStore.getItems();
      const body = document.getElementById('cartBody');
      const subtotalEl = document.getElementById('cartSubtotal');
      const shippingEl = document.getElementById('cartShipping');
      const totalDueEl = document.getElementById('cartTotalDue');
      const checkoutBtn = document.getElementById('cartCheckoutBtn');
      const meterFill = document.getElementById('shippingMeterFill');
      const meterText = document.getElementById('shippingMeterText');

      if (!body) return;

      if (items.length === 0) {
        body.innerHTML = `
          <div class="cart-empty-view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 6h2l1.5 10h11L20 8H7"/>
              <circle cx="10" cy="20" r="1.4"/>
              <circle cx="17" cy="20" r="1.4"/>
            </svg>
            <div style="font-family:'Anton',sans-serif; font-size:19px; color:var(--paper);">YOUR BAG IS EMPTY</div>
            <p style="font-size:13px; max-width:240px; line-height:1.45;">Explore the combat sports and training apparel drop to gear up.</p>
            <a href="index.html#shop" onclick="window.PIIIVOT_CART.close();" class="btn-primary" style="margin-top:8px; font-size:11px; padding:10px 18px;">Browse Gear</a>
          </div>
        `;
        if (subtotalEl) subtotalEl.textContent = '৳ 0';
        if (shippingEl) shippingEl.textContent = '৳ 0';
        if (totalDueEl) totalDueEl.textContent = '৳ 0';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (meterFill) meterFill.style.width = '0%';
        if (meterText) meterText.textContent = 'Free dispatch in Dhaka on orders over ৳ 2,000';
        return;
      }

      if (checkoutBtn) checkoutBtn.disabled = false;

      let html = '';
      items.forEach((item, index) => {
        const itemTotal = (item.price * item.quantity).toLocaleString();
        html += `
          <div class="cart-item">
            <div class="cart-item-visual">
              ${item.name.substring(0, 8)}
            </div>
            <div class="cart-item-info">
              <h5>${item.name}</h5>
              <div class="cart-item-meta">
                <span>SIZE: ${item.size}</span>
                <span>COLOR: ${item.color}</span>
              </div>
              <div class="cart-stepper">
                <button onclick="window.PIIIVOT_CART.updateQuantity(${index}, -1)" aria-label="Decrease quantity">−</button>
                <span>${item.quantity}</span>
                <button onclick="window.PIIIVOT_CART.updateQuantity(${index}, 1)" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div class="cart-item-right">
              <div class="cart-item-price">৳ ${itemTotal}</div>
              <button class="cart-item-del" onclick="window.PIIIVOT_CART.removeItem(${index})" title="Remove item">Remove</button>
            </div>
          </div>
        `;
      });
      body.innerHTML = html;

      const subtotal = CartStore.getTotal();
      const freeShippingThreshold = 2000;
      const shipping = subtotal >= freeShippingThreshold ? 0 : 70;
      const total = subtotal + shipping;

      if (subtotalEl) subtotalEl.textContent = `৳ ${subtotal.toLocaleString()}`;
      if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE (Dhaka)' : `৳ ${shipping}`;
      if (totalDueEl) totalDueEl.textContent = `৳ ${total.toLocaleString()}`;

      // Update Shipping Meter
      if (meterFill && meterText) {
        if (subtotal >= freeShippingThreshold) {
          meterFill.style.width = '100%';
          meterText.innerHTML = '<strong>Unlocked!</strong> You qualify for Free Dhaka City Courier ✓';
        } else {
          const pct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
          const diff = freeShippingThreshold - subtotal;
          meterFill.style.width = `${pct}%`;
          meterText.textContent = `Add ৳ ${diff.toLocaleString()} more for Free Dhaka Courier`;
        }
      }
    },

    handleOrderSubmit: function (form) {
      const items = CartStore.getItems();
      const total = CartStore.getTotal();
      const name = form.querySelector('input[type="text"]').value;
      const phone = form.querySelector('input[type="tel"]').value;
      const address = form.querySelector('textarea').value;
      const payment = form.querySelector('select').value;
      const shipping = total >= 2000 ? 0 : 70;
      const finalTotal = total + shipping;

      // Register order with CMS
      if (window.PIIIVOT_CMS) {
        window.PIIIVOT_CMS.addOrder({
          customerName: name,
          phone: phone,
          address: address,
          payment: payment === 'cod' ? 'Cash on Delivery' : payment.toUpperCase(),
          items: items.map(i => ({ name: i.name, size: i.size, color: i.color, qty: i.quantity, price: i.price })),
          subtotal: total,
          shipping: shipping,
          total: finalTotal,
          status: 'Pending Verification'
        });
      }

      const summary = items.map((i) => `• ${i.name} (Size: ${i.size}, Color: ${i.color}) x${i.quantity} = ৳${i.price * i.quantity}`).join('\n');

      const modal = document.getElementById('checkoutModal');
      const dialog = modal.querySelector('.checkout-dialog');
      
      dialog.innerHTML = `
        <div style="text-align:center; padding: 10px 0;">
          <div style="font-size:38px; margin-bottom:12px;">🥊</div>
          <p class="eyebrow" style="color:var(--paper);">Order Registered in Dispatch Desk</p>
          <h3 style="margin-top:6px;">READY TO COMPETE, ${name.toUpperCase()}</h3>
          <p style="margin:14px 0 20px; font-size:13.5px; color:var(--mid); line-height:1.45;">
            We have registered your order for <strong>৳ ${finalTotal.toLocaleString()}</strong>.
            Our Dhaka dispatch desk is preparing your package for <strong>${address}</strong>.
          </p>
          <div style="background:var(--ink); border:1px solid var(--line); padding:14px; font-family:'IBM Plex Mono',monospace; font-size:11px; text-align:left; color:var(--paper); margin-bottom:20px; white-space:pre-line; max-height:180px; overflow-y:auto;">
<strong>ORDER SUMMARY:</strong>
${summary}
          </div>
          <button class="btn-primary" onclick="window.PIIIVOT_CART.clear(); document.getElementById('checkoutModal').classList.remove('open'); window.location.href='index.html';" style="width:100%; justify-content:center; padding:12px;">
            Return to Store
          </button>
        </div>
      `;
    }
  };

  // Expose global API
  window.PIIIVOT_CART = {
    addItem: CartStore.addItem,
    updateQuantity: CartStore.updateQuantity,
    removeItem: CartStore.removeItem,
    clear: CartStore.clear,
    open: () => CartUI.open(),
    close: () => CartUI.close(),
    showToast: (msg) => CartUI.showToast(msg),
    init: () => CartUI.init()
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CartUI.init());
  } else {
    CartUI.init();
  }
})();
