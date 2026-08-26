/**
 * PIIIVOT Global Search Engine & Overlay Component
 * Instant multi-attribute search across products, categories, collections & tags
 */

(function () {
  const SearchUI = {
    isOpen: false,

    init: function () {
      this.injectStyles();
      this.injectMarkup();
      this.bindEvents();
    },

    injectStyles: function () {
      if (document.getElementById('pvt-search-styles')) return;
      const style = document.createElement('style');
      style.id = 'pvt-search-styles';
      style.textContent = `
        .pvt-search-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 10, 10, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: opacity .25s ease, visibility .25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(20px, 6vh, 60px) 20px 40px;
          overflow-y: auto;
        }
        .pvt-search-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .pvt-search-container {
          width: 100%;
          max-width: 760px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .pvt-search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(245, 244, 239, 0.15);
          padding-bottom: 16px;
        }
        .pvt-search-title {
          font-family: 'Anton', sans-serif;
          font-size: 20px;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #f5f4ef;
        }
        .pvt-search-close {
          background: none;
          border: 1px solid rgba(245, 244, 239, 0.2);
          color: #f5f4ef;
          width: 36px;
          height: 36px;
          border-radius: 2px;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .2s ease;
        }
        .pvt-search-close:hover {
          background: #f5f4ef;
          color: #0a0a0a;
          border-color: #f5f4ef;
        }
        .pvt-search-input-wrap {
          position: relative;
          width: 100%;
        }
        .pvt-search-input {
          width: 100%;
          background: #161615;
          border: 1px solid rgba(245, 244, 239, 0.2);
          border-radius: 2px;
          padding: 18px 20px 18px 52px;
          color: #f5f4ef;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 16px;
          letter-spacing: .04em;
          outline: none;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .pvt-search-input:focus {
          border-color: #f5f4ef;
          box-shadow: 0 0 0 2px rgba(245, 244, 239, 0.15);
        }
        .pvt-search-input-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #98958a;
          pointer-events: none;
        }
        .pvt-search-chips {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pvt-search-chip-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          color: #98958a;
          letter-spacing: .1em;
        }
        .pvt-search-chip {
          background: rgba(245, 244, 239, 0.06);
          border: 1px solid rgba(245, 244, 239, 0.14);
          color: #f5f4ef;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: all .2s ease;
          text-decoration: none;
        }
        .pvt-search-chip:hover {
          background: #f5f4ef;
          color: #0a0a0a;
          border-color: #f5f4ef;
        }
        .pvt-search-results {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          margin-top: 8px;
        }
        .pvt-search-card {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          align-items: center;
          gap: 18px;
          background: #161615;
          border: 1px solid rgba(245, 244, 239, 0.1);
          border-radius: 2px;
          padding: 12px 18px;
          text-decoration: none;
          color: #f5f4ef;
          transition: all .2s ease;
        }
        .pvt-search-card:hover {
          background: #1f1e1c;
          border-color: rgba(245, 244, 239, 0.3);
          transform: translateY(-2px);
        }
        .pvt-search-visual {
          width: 80px;
          height: 64px;
          background: #252422;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          font-family: 'Anton', sans-serif;
          font-size: 14px;
          letter-spacing: .05em;
          color: rgba(245, 244, 239, 0.6);
        }
        .pvt-search-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pvt-search-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #98958a;
        }
        .pvt-search-name {
          font-family: 'Anton', sans-serif;
          font-size: 17px;
          letter-spacing: .02em;
          text-transform: uppercase;
          color: #f5f4ef;
        }
        .pvt-search-desc {
          font-size: 12px;
          color: #98958a;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pvt-search-action {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .pvt-search-price {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          color: #f5f4ef;
        }
        .pvt-search-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #22c55e;
        }
        .pvt-search-empty {
          background: #161615;
          border: 1px dashed rgba(245, 244, 239, 0.18);
          border-radius: 4px;
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .pvt-search-empty h3 {
          font-family: 'Anton', sans-serif;
          font-size: 24px;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: #f5f4ef;
        }
        .pvt-search-empty p {
          color: #98958a;
          font-size: 14px;
          max-width: 360px;
        }
        .pvt-search-empty-btn {
          margin-top: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: .08em;
          text-transform: uppercase;
          background: #f5f4ef;
          color: #0a0a0a;
          padding: 10px 20px;
          border-radius: 2px;
          text-decoration: none;
          font-weight: 600;
          transition: all .2s ease;
        }
        .pvt-search-empty-btn:hover {
          background: #22c55e;
          color: #0a0a0a;
        }
        @media(max-width: 600px) {
          .pvt-search-card {
            grid-template-columns: 60px 1fr;
            gap: 12px;
          }
          .pvt-search-action {
            grid-column: 1 / -1;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid rgba(245, 244, 239, 0.08);
            padding-top: 8px;
            margin-top: 4px;
          }
        }
      `;
      document.head.appendChild(style);
    },

    injectMarkup: function () {
      if (document.getElementById('pvtSearchOverlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'pvtSearchOverlay';
      overlay.className = 'pvt-search-overlay';
      overlay.innerHTML = `
        <div class="pvt-search-container">
          <div class="pvt-search-header">
            <div class="pvt-search-title">PIIIVOT // Search Catalog</div>
            <button class="pvt-search-close" id="pvtSearchClose" aria-label="Close search">×</button>
          </div>
          
          <div class="pvt-search-input-wrap">
            <svg class="pvt-search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="search" 
              class="pvt-search-input" 
              id="pvtSearchInput" 
              placeholder="Search gear, shorts, wraps, tees, collections..." 
              autocomplete="off"
              spellcheck="false"
            />
          </div>

          <div class="pvt-search-chips">
            <span class="pvt-search-chip-label">Quick Links:</span>
            <a href="shop.html?cat=combat" class="pvt-search-chip">Combat</a>
            <a href="shop.html?cat=training" class="pvt-search-chip">Training</a>
            <a href="shop.html?cat=apparel" class="pvt-search-chip">Apparel</a>
            <a href="shop.html?collection=drop-01" class="pvt-search-chip">Drop 01</a>
            <a href="shop.html" class="pvt-search-chip">All Gear →</a>
          </div>

          <div class="pvt-search-results" id="pvtSearchResults">
            <!-- Dynamic search results render here -->
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    },

    bindEvents: function () {
      const self = this;
      const input = document.getElementById('pvtSearchInput');
      const closeBtn = document.getElementById('pvtSearchClose');
      const overlay = document.getElementById('pvtSearchOverlay');

      // Trigger buttons binding
      document.querySelectorAll('[data-search-trigger], #searchBtn, nav .icon-btn[aria-label="Search"]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          self.open();
        });
      });

      if (closeBtn) closeBtn.addEventListener('click', () => self.close());

      // Overlay background click
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) self.close();
        });
      }

      // Keyboard shortcuts (Cmd+K / Ctrl+K and Esc)
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          self.isOpen ? self.close() : self.open();
        } else if (e.key === 'Escape' && self.isOpen) {
          self.close();
        }
      });

      // Live search debouncing
      let debounceTimer;
      if (input) {
        input.addEventListener('input', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            self.executeSearch(input.value);
          }, 150);
        });
      }
    },

    open: function () {
      const overlay = document.getElementById('pvtSearchOverlay');
      const input = document.getElementById('pvtSearchInput');
      if (overlay) {
        overlay.classList.add('open');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        if (input) {
          input.value = '';
          setTimeout(() => input.focus(), 100);
          this.renderSuggestions();
        }
      }
    },

    close: function () {
      const overlay = document.getElementById('pvtSearchOverlay');
      if (overlay) {
        overlay.classList.remove('open');
        this.isOpen = false;
        document.body.style.overflow = '';
      }
    },

    renderSuggestions: function () {
      const resultsContainer = document.getElementById('pvtSearchResults');
      if (!resultsContainer || !window.PIIIVOT_CATALOG) return;

      const featured = window.PIIIVOT_CATALOG.getFeatured().slice(0, 3);
      resultsContainer.innerHTML = `
        <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#98958a; letter-spacing:.1em; text-transform:uppercase; margin-bottom:4px;">
          Featured Gear Drops
        </div>
        ${featured.map(p => this.renderCard(p)).join('')}
      `;
    },

    executeSearch: function (query) {
      const resultsContainer = document.getElementById('pvtSearchResults');
      if (!resultsContainer || !window.PIIIVOT_CATALOG) return;

      if (!query || !query.trim()) {
        this.renderSuggestions();
        return;
      }

      const results = window.PIIIVOT_CATALOG.search(query);

      if (results.length === 0) {
        resultsContainer.innerHTML = `
          <div class="pvt-search-empty">
            <h3>No Gear Found</h3>
            <p>No matches for "${query}". Check spelling or explore our complete first drop lineup.</p>
            <a href="shop.html" class="pvt-search-empty-btn">View All Gear →</a>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#98958a; letter-spacing:.1em; text-transform:uppercase; margin-bottom:4px;">
          Found ${results.length} item${results.length > 1 ? 's' : ''} matching "${query}"
        </div>
        ${results.map(p => this.renderCard(p)).join('')}
      `;
    },

    renderCard: function (p) {
      const cleanVisual = p.name.replace(/ PIIIVOT/gi, '').substring(0, 10).toUpperCase();
      return `
        <a href="product.html?id=${p.id}" class="pvt-search-card">
          <div class="pvt-search-visual">${cleanVisual}</div>
          <div class="pvt-search-info">
            <span class="pvt-search-tag">${p.categoryLabel} // ${p.badge || 'PRO'}</span>
            <div class="pvt-search-name">${p.name}</div>
            <div class="pvt-search-desc">${p.shortDesc}</div>
          </div>
          <div class="pvt-search-action">
            <span class="pvt-search-price">${p.priceFormatted}</span>
            <span class="pvt-search-btn">Inspect Gear →</span>
          </div>
        </a>
      `;
    }
  };

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SearchUI.init());
  } else {
    SearchUI.init();
  }

  // Export
  window.PIIIVOT_SEARCH = SearchUI;
})();
