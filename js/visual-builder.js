/**
 * PIIIVOT Full-Site Visual Builder Engine (Guaranteed Save & Publish Engine)
 * Features:
 * - 💾 Guaranteed Save & Publish Persistence across sessions & views
 * - 🎯 Deterministic Element Indexing (Every element mapped on page load)
 * - 🛡️ Strict Separation: Floor Background Color NEVER affects Text Color
 * - 🏁 1-Click Section Floor Background Swatches (Ink Black, Charcoal, Off-White, Paper, Green)
 * - 🔤 Independent Text Color / Fill Controller
 * - 📐 Universal Section Catchability (.tape, .access, footer, header, hero, shop, trust, product)
 * - 🏷️ Interactive Section Badges & Parent Breadcrumb Selector
 * - 🔗 Multi-Element Grouping & Ungrouping (Shift + Click / Ctrl+G)
 * - 🖱️ Shift + Mouse Drag to Move Any Element or Group of Elements
 * - 🛡️ 100% Non-Destructive Undo (Ctrl+Z) & Redo (Ctrl+Y)
 */

(function () {
  const BUILDER_STORAGE_KEY = 'piiivot_visual_styles_v1';
  const CUSTOM_ELEMENTS_KEY = 'piiivot_custom_elements_v1';

  // Load Extra Google Fonts
  (function loadExtraFonts() {
    if (document.getElementById('piiivot-builder-fonts')) return;
    const link = document.createElement('link');
    link.id = 'piiivot-builder-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800&family=Oswald:wght@500;700&family=Outfit:wght@400;600;800&display=swap';
    document.head.appendChild(link);
  })();

  const Builder = {
    isEditMode: false,
    selectedElement: null,
    selectedElements: [],
    isResizing: false,
    isMoving: false,

    // Clean Snapshot History Stack
    history: [],
    historyIndex: -1,
    maxHistory: 50,

    init: function () {
      this.migrateOldStorage();
      this.cleanBleedStyles();
      this.assignElementIds();
      this.restoreCustomElements();
      this.assignElementIds();
      this.applySavedStyles();

      const params = new URLSearchParams(window.location.search);
      const isParamEdit = params.get('edit') === 'true' || params.get('customize') === 'true';
      const isAdmin = (window.PIIIVOT_CMS && window.PIIIVOT_CMS.isLoggedIn()) || 
                      sessionStorage.getItem('piiivot_admin_auth_v1') === 'true';

      if (isParamEdit || isAdmin) {
        this.enableEditMode();
      }
    },

    // Migrate / flush stale saves from old single-dash ID format to new double-dash stable format
    migrateOldStorage: function () {
      try {
        const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
        if (!raw) return;
        const styles = JSON.parse(raw);
        const ids = Object.keys(styles);
        if (ids.length === 0) return;

        // Old format IDs had single dashes: pvt-hero-h1-hero-watermark-12
        // New format IDs have double dashes: pvt--hero--h1--hero-watermark--1
        const hasOldFormat = ids.some(id => id.startsWith('pvt-') && !id.startsWith('pvt--'));
        if (hasOldFormat) {
          // Preserve only custom elements and floor backgrounds (they're keyed by their own id attr)
          // Flush everything else to avoid ID mismatches
          const cleaned = {};
          ids.forEach(id => {
            if (!id.startsWith('pvt-') || id.startsWith('pvt--') || id.startsWith('pvt-dyn-')) {
              cleaned[id] = styles[id];
            }
          });
          localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(cleaned));
        }
      } catch (e) {}
    },

    // Deterministic ID assignment — stable across reloads using tag+section+class counters
    assignElementIds: function () {
      const targetTags = 'h1, h2, h3, h4, h5, h6, p, .eyebrow, .wordmark, .btn-primary, .btn-outline, .pill, strong, .hero-watermark, .watermark, span[data-logo], .cat-panel, .product-card, .trust-item, .pvt-image-block, section, header, footer, .tape, [data-pvt-custom]';
      const elements = document.querySelectorAll(targetTags);

      // Build per-section counters so same tag in same section always gets same ID regardless of total page order
      const sectionCounters = {};

      elements.forEach((el) => {
        if (el.getAttribute('data-pvt-id')) return; // already assigned, keep it
        if (el.id) {
          el.setAttribute('data-pvt-id', el.id);
          return;
        }
        const parentSection = el.closest('section, main, header, footer') || document.body;
        const secId = parentSection.id || parentSection.className.split(' ')[0] || parentSection.tagName.toLowerCase();
        const tag = el.tagName.toLowerCase();
        const cls = (el.className || '').split(' ').filter(c => c && !c.startsWith('pvt-')).join('-') || 'el';
        const counterKey = `${secId}__${tag}__${cls}`;
        sectionCounters[counterKey] = (sectionCounters[counterKey] || 0) + 1;
        const count = sectionCounters[counterKey];
        el.setAttribute('data-pvt-id', `pvt--${secId}--${tag}--${cls}--${count}`);
      });
    },

    cleanBleedStyles: function () {
      try {
        const styles = JSON.parse(localStorage.getItem(BUILDER_STORAGE_KEY)) || {};
        let modified = false;
        Object.keys(styles).forEach(id => {
          // Remove color bleeds from section containers
          if (styles[id].color) {
            const el = document.querySelector(`[data-pvt-id="${id}"]`) || document.getElementById(id);
            if (el && ['SECTION','HEADER','FOOTER','MAIN','BODY'].includes(el.tagName)) {
              delete styles[id].color;
              modified = true;
            }
          }
          // Clean stale hero eyebrow transforms / duplicate text
          if (id.includes('hero') && (id.includes('eyebrow') || id.includes('desc') || id.includes('h1'))) {
            if (styles[id].textContent && styles[id].textContent.toUpperCase().includes('PERFORMANCE GEAR')) {
              delete styles[id].textContent;
              modified = true;
            }
          }
          // Remove any stale textContent saves — we only restore text that the user explicitly double-clicks & edits
          // textContent is saved only via saveElementContent (on blur after editing), NOT in saveAll sweep
          // So old stale saves from prior saveAll sweeps need clearing
          if (styles[id].textContent !== undefined) {
            // Only keep if it was a custom element (user added it)
            const el = document.querySelector(`[data-pvt-id="${id}"]`) || document.getElementById(id);
            if (!el || !el.getAttribute('data-pvt-custom')) {
              delete styles[id].textContent;
              modified = true;
            }
          }
        });
        if (modified) {
          localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(styles));
        }
      } catch (e) {}
    },

    enableEditMode: function () {
      this.isEditMode = true;
      this.injectStyles();
      this.injectTopBar();
      this.injectAddElementDrawer();
      this.injectSelectionBox();
      this.injectInspector();
      this.injectSectionBadges();
      this.enableInlineEditing();
      this.initDirectElementDragging();
      this.initKeyboardShortcuts();
      this.recordHistorySnapshot();
      document.body.classList.add('pvt-builder-active');

      window.addEventListener('scroll', () => this.updateSelectionBoxPosition(), { passive: true });
      window.addEventListener('resize', () => this.updateSelectionBoxPosition(), { passive: true });

      // Click outside to deselect
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.pvt-selection-box') && 
            !e.target.closest('.pvt-inspector') && 
            !e.target.closest('.pvt-topbar') && 
            !e.target.closest('.pvt-add-drawer') && 
            !e.target.closest('.pvt-sec-badge') &&
            !e.target.closest('[data-pvt-editable]')) {
          this.closeInspector();
        }
      });
    },

    injectStyles: function () {
      if (document.getElementById('piiivot-builder-styles')) return;
      const css = `
        /* Top Tactical Admin Builder Bar */
        .pvt-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100000;
          background: rgba(12, 12, 11, 0.96);
          backdrop-filter: blur(20px);
          border-bottom: 2px solid #22c55e;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.85);
          padding: 8px clamp(16px, 3vw, 32px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #f5f4ef;
          user-select: none;
        }
        body.pvt-builder-active {
          padding-top: 52px !important;
        }
        body.pvt-builder-active.pvt-moving-active,
        body.pvt-builder-active.pvt-resizing-active {
          user-select: none !important;
        }
        body.pvt-builder-active ::selection {
          background: rgba(34, 197, 94, 0.25) !important;
          color: inherit !important;
        }

        .pvt-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pvt-badge-live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid #22c55e;
          padding: 3px 8px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .pvt-pulse {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }
        .pvt-btn {
          background: #1c1b19;
          color: #f5f4ef;
          border: 1px solid #333230;
          padding: 6px 12px;
          font-family: inherit;
          font-size: 10.5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        .pvt-btn:hover {
          border-color: #f5f4ef;
          background: #2a2926;
        }
        .pvt-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          border-color: #333230;
        }
        .pvt-btn-primary {
          background: #22c55e;
          color: #0a0a0a;
          font-weight: 700;
          border-color: #22c55e;
        }
        .pvt-btn-primary:hover {
          background: #4ade80;
          transform: translateY(-1px);
        }
        .pvt-btn-add {
          background: #f5f4ef;
          color: #0a0a0a;
          font-weight: 700;
          border-color: #f5f4ef;
        }
        .pvt-btn-add:hover {
          background: #e9e7df;
          transform: translateY(-1px);
        }

        /* + Add Element Slide-Out Drawer */
        .pvt-add-drawer {
          position: fixed;
          top: 52px;
          left: 0;
          bottom: 0;
          width: 320px;
          background: #141413;
          border-right: 1px solid #333230;
          z-index: 99999;
          box-shadow: 15px 0 40px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          padding: 20px;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
          font-family: 'IBM Plex Mono', monospace;
          color: #f5f4ef;
        }
        .pvt-add-drawer.open {
          transform: translateX(0);
        }
        .pvt-drawer-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #2e2d2a;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .pvt-drawer-head h3 {
          font-family: 'Anton', sans-serif;
          font-size: 18px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .pvt-element-category {
          margin-bottom: 20px;
        }
        .pvt-cat-title {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #98958a;
          margin-bottom: 8px;
          display: block;
        }
        .pvt-item-card {
          background: #1c1b19;
          border: 1px solid #2e2d2a;
          padding: 10px 12px;
          border-radius: 2px;
          margin-bottom: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.18s ease;
        }
        .pvt-item-card:hover {
          border-color: #22c55e;
          background: #262522;
          transform: translateX(4px);
        }
        .pvt-item-card strong {
          font-size: 11.5px;
          display: block;
        }
        .pvt-item-card span {
          font-size: 9.5px;
          color: #98958a;
        }

        /* Floating Section Quick-Select Badges */
        .pvt-sec-badge {
          position: absolute;
          top: 8px;
          left: 12px;
          z-index: 1000;
          background: #0a0a0a;
          color: #4ade80;
          border: 1px solid #22c55e;
          padding: 4px 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.8);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          opacity: 0.9;
          transition: all 0.18s ease;
          user-select: none;
        }
        .pvt-sec-badge:hover {
          opacity: 1;
          background: #22c55e;
          color: #0a0a0a;
          transform: translateY(-1px);
        }

        /* Section Container Outlines in Edit Mode */
        body.pvt-builder-active section,
        body.pvt-builder-active header,
        body.pvt-builder-active footer,
        body.pvt-builder-active .tape,
        body.pvt-builder-active .cart-drawer,
        body.pvt-builder-active .checkout-modal {
          position: relative !important;
          outline: 1px dashed rgba(34, 197, 94, 0.3) !important;
          outline-offset: -1px;
        }

        /* Group Member Multi-Selection Highlighting */
        body.pvt-builder-active [data-pvt-group-selected="true"] {
          outline: 2px dashed #4ade80 !important;
          outline-offset: 2px;
        }

        /* Catchable Watermarks */
        body.pvt-builder-active .hero-watermark,
        body.pvt-builder-active .watermark,
        body.pvt-builder-active span[data-logo] {
          pointer-events: auto !important;
          cursor: grab !important;
          z-index: 10 !important;
          transition: outline 0.15s ease;
        }
        body.pvt-builder-active .hero-watermark:hover,
        body.pvt-builder-active .watermark:hover {
          outline: 1.5px dashed #22c55e !important;
        }

        /* Editable Elements & Custom Image Blocks */
        body.pvt-builder-active [data-pvt-editable] {
          cursor: pointer;
          transition: outline 0.15s ease;
        }
        body.pvt-builder-active [data-pvt-editable]:hover {
          outline: 1px dashed rgba(34, 197, 94, 0.7);
        }
        
        body.pvt-builder-active .pvt-image-block,
        body.pvt-builder-active img[data-pvt-editable] {
          cursor: grab !important;
          user-select: none;
        }

        /* Unified Selection Frame */
        .pvt-selection-box {
          position: fixed;
          pointer-events: none !important;
          z-index: 99998;
          border: 2px solid #22c55e;
          background: transparent !important;
          display: none;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.35);
        }
        .pvt-selection-box.active {
          display: block;
        }

        /* Move Bar Handle (Center Top) */
        .pvt-move-handle {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #0a0a0a;
          color: #22c55e;
          border: 1px solid #22c55e;
          padding: 4px 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: grab;
          border-radius: 2px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.8);
          pointer-events: auto !important;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          user-select: none;
        }
        .pvt-move-handle:hover {
          background: #22c55e;
          color: #0a0a0a;
        }
        .pvt-move-handle:active {
          cursor: grabbing;
        }

        /* Corner Handles */
        .pvt-corner-handle {
          position: absolute;
          width: 14px;
          height: 14px;
          background: #22c55e;
          border: 2px solid #0a0a0a;
          pointer-events: auto !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
          border-radius: 2px;
          transition: transform 0.1s ease;
        }
        .pvt-corner-handle:hover {
          transform: scale(1.25);
          background: #4ade80;
        }
        .pvt-corner-handle.handle-nw { top: -7px; left: -7px; cursor: nwse-resize; }
        .pvt-corner-handle.handle-ne { top: -7px; right: -7px; cursor: nesw-resize; }
        .pvt-corner-handle.handle-se { bottom: -7px; right: -7px; cursor: nwse-resize; }
        .pvt-corner-handle.handle-sw { bottom: -7px; left: -7px; cursor: nesw-resize; }

        /* Edge Width Handles */
        .pvt-edge-handle {
          position: absolute;
          width: 8px;
          height: 24px;
          background: #22c55e;
          border: 1px solid #0a0a0a;
          pointer-events: auto !important;
          border-radius: 2px;
          top: 50%;
          transform: translateY(-50%);
          cursor: ew-resize;
        }
        .pvt-edge-handle:hover {
          background: #4ade80;
          transform: translateY(-50%) scale(1.2);
        }
        .pvt-edge-handle.handle-w { left: -5px; }
        .pvt-edge-handle.handle-e { right: -5px; }

        /* Dynamic Tooltip */
        .pvt-resize-tooltip {
          position: absolute;
          bottom: -32px;
          right: 0;
          background: #0a0a0a;
          color: #22c55e;
          border: 1px solid #22c55e;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 2px;
          white-space: nowrap;
          pointer-events: none;
          display: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.8);
        }
        .pvt-selection-box.resizing .pvt-resize-tooltip,
        .pvt-selection-box.moving .pvt-resize-tooltip {
          display: block;
        }

        /* Non-Overlapping Draggable Inspector */
        .pvt-inspector {
          position: fixed;
          z-index: 99999;
          background: #141413;
          border: 1px solid #3d3c38;
          box-shadow: 0 15px 45px rgba(0,0,0,0.9);
          border-radius: 4px;
          padding: 14px;
          width: 320px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #f5f4ef;
          display: none;
          flex-direction: column;
          gap: 12px;
          user-select: none;
        }
        .pvt-inspector.open {
          display: flex;
        }
        .pvt-insp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #2e2d2a;
          padding-bottom: 8px;
          cursor: grab;
        }
        .pvt-insp-header:active {
          cursor: grabbing;
        }
        .pvt-insp-title {
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #22c55e;
          font-size: 10.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pvt-insp-close {
          background: none;
          border: none;
          color: #98958a;
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
        }
        .pvt-insp-close:hover { color: #f5f4ef; }

        .pvt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .pvt-row label {
          color: #98958a;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .pvt-input-select, .pvt-input-text {
          background: #0a0a0a;
          border: 1px solid #2e2d2a;
          color: #f5f4ef;
          padding: 5px 8px;
          font-family: inherit;
          font-size: 11px;
          border-radius: 2px;
          width: 100%;
        }
        .pvt-input-select:focus, .pvt-input-text:focus {
          outline: none;
          border-color: #22c55e;
        }

        .pvt-palette {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .pvt-swatch {
          width: 18px;
          height: 18px;
          border-radius: 2px;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .pvt-swatch:hover {
          transform: scale(1.2);
        }
      `;
      const style = document.createElement('style');
      style.id = 'piiivot-builder-styles';
      style.textContent = css;
      document.head.appendChild(style);
    },

    injectTopBar: function () {
      if (document.getElementById('pvtTopBar')) return;

      const bar = document.createElement('header');
      bar.id = 'pvtTopBar';
      bar.className = 'pvt-topbar';
      bar.innerHTML = `
        <div class="pvt-topbar-left">
          <button class="pvt-btn pvt-btn-add" onclick="window.PIIIVOT_BUILDER.toggleAddDrawer()" title="Add Headings, Paragraphs, Images, Buttons">
            <span>+ Add Element</span>
          </button>
          
          <!-- Undo & Redo Buttons -->
          <div style="display:flex; gap:4px; margin-left:4px;">
            <button class="pvt-btn" id="btnUndo" onclick="window.PIIIVOT_BUILDER.undo()" title="Undo (Ctrl+Z)">
              <span>↶ Undo</span>
            </button>
            <button class="pvt-btn" id="btnRedo" onclick="window.PIIIVOT_BUILDER.redo()" title="Redo (Ctrl+Y)">
              <span>↷ Redo</span>
            </button>
          </div>

          <span class="pvt-badge-live" style="margin-left:6px;">
            <span class="pvt-pulse"></span>
            <span>VISUAL STUDIO</span>
          </span>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button class="pvt-btn pvt-btn-primary" onclick="window.PIIIVOT_BUILDER.saveAll()" title="Save all custom styles, images and layout">
            <span>Save & Publish ✓</span>
          </button>
          <button class="pvt-btn" onclick="window.PIIIVOT_BUILDER.resetAll()" title="Reset to original design">
            <span>Reset</span>
          </button>
          <a href="admin.html" class="pvt-btn" style="color:#22c55e; border-color:#22c55e;" title="Return to Admin Panel">
            <span>Admin Desk ↗</span>
          </a>
        </div>
      `;
      document.body.prepend(bar);
      this.updateUndoRedoUI();
    },

    // Inject Section Badges for Direct Section Floor Selection
    injectSectionBadges: function () {
      const sectionSelectors = [
        { selector: 'header', label: 'Header Nav' },
        { selector: '.hero', label: 'Hero Section' },
        { selector: '.matchup', label: 'Matchup Showcase' },
        { selector: '.tape', label: 'Ticker Tape' },
        { selector: '.shop', label: 'Shop Lineup' },
        { selector: '.manifesto', label: 'Manifesto' },
        { selector: '.trust', label: 'Why PIIIVOT' },
        { selector: '.access', label: 'Early Access' },
        { selector: 'footer', label: 'Footer' },
        { selector: '.product-stage', label: 'Product Stage' },
        { selector: '.product-desc-section', label: 'Product Specs' },
        { selector: '.related-section', label: 'Related Drops' }
      ];

      sectionSelectors.forEach(item => {
        const el = document.querySelector(item.selector);
        if (el && !el.querySelector(':scope > .pvt-sec-badge')) {
          el.setAttribute('data-pvt-editable', 'true');
          if (!el.getAttribute('data-pvt-id')) {
            el.setAttribute('data-pvt-id', el.id || item.selector.replace(/[^a-zA-Z0-9]/g, '_'));
          }

          const badge = document.createElement('div');
          badge.className = 'pvt-sec-badge';
          badge.innerHTML = `<span>📐 ${item.label} Floor</span>`;
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            Builder.selectElement(el);
          });
          el.prepend(badge);
        }
      });
    },

    // ---- Clean State Snapshot History (Pure Non-Destructive) ----
    recordHistorySnapshot: function () {
      const currentStyles = this.getSavedStyles();
      const currentCustom = JSON.parse(localStorage.getItem(CUSTOM_ELEMENTS_KEY) || '[]');

      const snapshot = {
        styles: JSON.parse(JSON.stringify(currentStyles)),
        customElements: JSON.parse(JSON.stringify(currentCustom))
      };

      const last = this.history[this.historyIndex];
      if (last && JSON.stringify(last) === JSON.stringify(snapshot)) {
        return;
      }

      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(snapshot);
      if (this.history.length > this.maxHistory) this.history.shift();
      this.historyIndex = this.history.length - 1;
      this.updateUndoRedoUI();
    },

    undo: function () {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.restoreSnapshot(this.history[this.historyIndex]);
        if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Undo (Ctrl+Z) ↶');
        this.updateUndoRedoUI();
      }
    },

    redo: function () {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.restoreSnapshot(this.history[this.historyIndex]);
        if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Redo (Ctrl+Y) ↷');
        this.updateUndoRedoUI();
      }
    },

    restoreSnapshot: function (snapshot) {
      if (!snapshot) return;

      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(snapshot.styles || {}));
      localStorage.setItem(CUSTOM_ELEMENTS_KEY, JSON.stringify(snapshot.customElements || []));

      document.querySelectorAll('[data-pvt-id]').forEach(el => {
        const id = el.getAttribute('data-pvt-id');
        const rule = (snapshot.styles && snapshot.styles[id]) || null;
        if (!rule) {
          el.style.transform = '';
          el.style.fontSize = '';
          el.style.width = '';
          el.style.maxWidth = '';
          el.style.color = '';
          el.style.backgroundColor = '';
          el.style.removeProperty('background');
          el.style.removeProperty('background-color');
          el.style.opacity = '';
          el.style.fontFamily = '';
          el.style.textAlign = '';
          el.style.paddingTop = '';
          el.style.paddingBottom = '';
        }
      });

      this.applySavedStyles();

      document.querySelectorAll('[data-pvt-custom="true"]').forEach(el => el.remove());
      this.restoreCustomElements();
      this.assignElementIds();
      this.enableInlineEditing();
      this.injectSectionBadges();
      this.updateSelectionBoxPosition();
      this.renderInspector();
    },

    updateUndoRedoUI: function () {
      const btnUndo = document.getElementById('btnUndo');
      const btnRedo = document.getElementById('btnRedo');
      if (btnUndo) btnUndo.disabled = this.historyIndex <= 0;
      if (btnRedo) btnRedo.disabled = this.historyIndex >= this.history.length - 1;
    },

    initKeyboardShortcuts: function () {
      window.addEventListener('keydown', (e) => {
        if (!Builder.isEditMode) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            Builder.redo();
          } else {
            e.preventDefault();
            Builder.undo();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault();
          Builder.redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
          e.preventDefault();
          if (e.shiftKey) {
            Builder.ungroupSelected();
          } else {
            Builder.groupSelected();
          }
        }
      });
    },

    injectAddElementDrawer: function () {
      if (document.getElementById('pvtAddDrawer')) return;

      const drawer = document.createElement('aside');
      drawer.id = 'pvtAddDrawer';
      drawer.className = 'pvt-add-drawer';
      drawer.innerHTML = `
        <div class="pvt-drawer-head">
          <h3>+ Add Element</h3>
          <button onclick="window.PIIIVOT_BUILDER.toggleAddDrawer(false)" style="background:none; border:none; color:#98958a; font-size:18px; cursor:pointer;">×</button>
        </div>

        <!-- Media & Images -->
        <div class="pvt-element-category">
          <span class="pvt-cat-title">Media & Uploads</span>
          <div class="pvt-item-card" onclick="window.PIIIVOT_BUILDER.insertElement('image')">
            <div>
              <strong>🖼️ Image Block</strong>
              <span>Upload from PC or enter URL</span>
            </div>
            <span>+</span>
          </div>
        </div>

        <!-- Typography -->
        <div class="pvt-element-category">
          <span class="pvt-cat-title">Typography & Copy</span>
          <div class="pvt-item-card" onclick="window.PIIIVOT_BUILDER.insertElement('headline')">
            <div>
              <strong>🔤 Heavy Headline (Anton)</strong>
              <span>Main display header</span>
            </div>
            <span>+</span>
          </div>
          <div class="pvt-item-card" onclick="window.PIIIVOT_BUILDER.insertElement('paragraph')">
            <div>
              <strong>📝 Text Paragraph</strong>
              <span>Body narrative or description</span>
            </div>
            <span>+</span>
          </div>
          <div class="pvt-item-card" onclick="window.PIIIVOT_BUILDER.insertElement('badge')">
            <div>
              <strong>🏷️ Tag / Badge Pill</strong>
              <span>Specification tag or status pill</span>
            </div>
            <span>+</span>
          </div>
        </div>

        <!-- Interactive & Actions -->
        <div class="pvt-element-category">
          <span class="pvt-cat-title">Buttons & CTAs</span>
          <div class="pvt-item-card" onclick="window.PIIIVOT_BUILDER.insertElement('button')">
            <div>
              <strong>🔘 Action CTA Button</strong>
              <span>Primary solid black button</span>
            </div>
            <span>+</span>
          </div>
          <div class="pvt-item-card" onclick="window.PIIIVOT_BUILDER.insertElement('card')">
            <div>
              <strong>📦 Information Card</strong>
              <span>Bordered container box</span>
            </div>
            <span>+</span>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    },

    toggleAddDrawer: function (forceState) {
      const drawer = document.getElementById('pvtAddDrawer');
      if (!drawer) return;
      if (typeof forceState === 'boolean') {
        drawer.classList.toggle('open', forceState);
      } else {
        drawer.classList.toggle('open');
      }
    },

    insertElement: function (type) {
      this.toggleAddDrawer(false);

      const targetContainer = (this.selectedElement && this.selectedElement.parentElement) || 
                              document.querySelector('.hero-inner') || 
                              document.querySelector('.matchup-head') ||
                              document.querySelector('.wrap') ||
                              document.body;

      const newId = `pvt-dyn-${Date.now()}`;
      let newEl = null;

      if (type === 'image') {
        newEl = document.createElement('div');
        newEl.id = newId;
        newEl.setAttribute('data-pvt-custom', 'true');
        newEl.setAttribute('data-pvt-editable', 'true');
        newEl.setAttribute('data-pvt-id', newId);
        newEl.className = 'pvt-image-block';
        newEl.style.cssText = 'width:360px; max-width:100%; aspect-ratio:16/9; background:#1c1b19; border:2px dashed #22c55e; display:flex; align-items:center; justify-content:center; margin:20px 0; overflow:hidden; position:relative;';
        newEl.innerHTML = `<div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#22c55e; text-align:center; font-weight:700;">[ 📁 CLICK TO UPLOAD IMAGE FROM PC ]</div>`;
      } else if (type === 'headline') {
        newEl = document.createElement('h2');
        newEl.id = newId;
        newEl.setAttribute('data-pvt-custom', 'true');
        newEl.setAttribute('data-pvt-editable', 'true');
        newEl.setAttribute('data-pvt-id', newId);
        newEl.setAttribute('contenteditable', 'true');
        newEl.style.cssText = 'font-family:Anton,sans-serif; font-size:42px; text-transform:uppercase; margin:16px 0; line-height:1; color:#0a0a0a;';
        newEl.textContent = 'NEW HEADLINE TITLE';
      } else if (type === 'paragraph') {
        newEl = document.createElement('p');
        newEl.id = newId;
        newEl.setAttribute('data-pvt-custom', 'true');
        newEl.setAttribute('data-pvt-editable', 'true');
        newEl.setAttribute('data-pvt-id', newId);
        newEl.setAttribute('contenteditable', 'true');
        newEl.style.cssText = 'font-size:15.5px; color:#68655d; max-width:600px; margin:14px 0; line-height:1.55;';
        newEl.textContent = 'Write your custom product details, training guidelines, or brand story here. Click to edit.';
      } else if (type === 'button') {
        newEl = document.createElement('a');
        newEl.id = newId;
        newEl.setAttribute('data-pvt-custom', 'true');
        newEl.setAttribute('data-pvt-editable', 'true');
        newEl.setAttribute('data-pvt-id', newId);
        newEl.setAttribute('contenteditable', 'true');
        newEl.href = '#shop';
        newEl.className = 'btn-primary';
        newEl.style.cssText = 'margin:16px 0; display:inline-flex;';
        newEl.textContent = 'EXPLORE GEAR →';
      } else if (type === 'badge') {
        newEl = document.createElement('span');
        newEl.id = newId;
        newEl.setAttribute('data-pvt-custom', 'true');
        newEl.setAttribute('data-pvt-editable', 'true');
        newEl.setAttribute('data-pvt-id', newId);
        newEl.setAttribute('contenteditable', 'true');
        newEl.className = 'eyebrow';
        newEl.style.cssText = 'background:#0a0a0a; color:#f5f4ef; padding:5px 10px; font-weight:700; border-radius:2px; display:inline-block; margin:8px 0; font-size:10px;';
        newEl.textContent = 'SPECIAL DROP // SPEC 01';
      } else if (type === 'card') {
        newEl = document.createElement('div');
        newEl.id = newId;
        newEl.setAttribute('data-pvt-custom', 'true');
        newEl.setAttribute('data-pvt-editable', 'true');
        newEl.setAttribute('data-pvt-id', newId);
        newEl.style.cssText = 'background:#e9e7df; border:1px solid #d7d4c9; padding:20px; border-radius:2px; margin:16px 0; max-width:540px;';
        newEl.innerHTML = `
          <h4 style="font-family:Anton,sans-serif; font-size:18px; margin-bottom:6px; color:#0a0a0a;">FEATURE BOX</h4>
          <p style="font-size:13px; color:#68655d;">Detailed technical breakdown or alert note. Click to customize.</p>
        `;
      }

      if (newEl) {
        if (this.selectedElement && this.selectedElement.parentElement) {
          this.selectedElement.parentElement.insertBefore(newEl, this.selectedElement.nextSibling);
        } else {
          targetContainer.appendChild(newEl);
        }

        this.attachElementListeners(newEl);
        this.saveCustomElements();
        this.recordHistorySnapshot();
        this.selectElement(newEl);
        if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast(`Added ${type.toUpperCase()} element ✓`);
      }
    },

    deleteSelectedElement: function () {
      if (!this.selectedElement && this.selectedElements.length === 0) return;
      const count = this.selectedElements.length || 1;
      if (confirm(`Delete ${count} selected element(s) from the page?`)) {
        const toDelete = this.selectedElements.length > 0 ? [...this.selectedElements] : [this.selectedElement];
        this.closeInspector();
        toDelete.forEach(el => {
          const id = el.getAttribute('data-pvt-id');
          if (id) {
            const styles = this.getSavedStyles();
            delete styles[id];
            localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(styles));
          }
          el.remove();
        });
        this.saveCustomElements();
        this.recordHistorySnapshot();
        if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Element(s) Deleted');
      }
    },

    // ---- Grouping & Ungrouping Engine ----
    groupSelected: function () {
      if (this.selectedElements.length < 2) {
        if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Hold Shift + Click to select multiple elements first!');
        return;
      }
      const groupId = `group_${Date.now()}`;
      this.selectedElements.forEach(el => {
        el.setAttribute('data-pvt-group', groupId);
        this.saveElementStyle(el, 'data-pvt-group', groupId);
      });
      this.recordHistorySnapshot();
      this.updateSelectionBoxPosition();
      this.renderInspector();
      if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast(`Grouped ${this.selectedElements.length} Elements (Ctrl+G) ✓`);
    },

    ungroupSelected: function () {
      const toUngroup = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      toUngroup.forEach(el => {
        el.removeAttribute('data-pvt-group');
        this.saveElementStyle(el, 'data-pvt-group', '');
      });
      this.recordHistorySnapshot();
      this.renderInspector();
      if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Elements Ungrouped');
    },

    saveCustomElements: function () {
      const customElements = [];
      document.querySelectorAll('[data-pvt-custom="true"]').forEach(el => {
        const parentId = el.parentElement ? (el.parentElement.id || el.parentElement.getAttribute('data-pvt-id')) : null;
        customElements.push({
          id: el.getAttribute('data-pvt-id') || el.id,
          tag: el.tagName.toLowerCase(),
          className: el.className,
          style: el.getAttribute('style') || '',
          innerHTML: el.innerHTML,
          parentId: parentId,
          href: el.getAttribute('href') || ''
        });
      });
      localStorage.setItem(CUSTOM_ELEMENTS_KEY, JSON.stringify(customElements));
    },

    restoreCustomElements: function () {
      try {
        const saved = JSON.parse(localStorage.getItem(CUSTOM_ELEMENTS_KEY));
        if (!saved || !Array.isArray(saved)) return;

        saved.forEach(item => {
          if (document.getElementById(item.id) || document.querySelector(`[data-pvt-id="${item.id}"]`)) return;
          const el = document.createElement(item.tag);
          el.id = item.id;
          el.setAttribute('data-pvt-custom', 'true');
          el.setAttribute('data-pvt-id', item.id);
          if (item.className) el.className = item.className;
          if (item.style) el.setAttribute('style', item.style);
          if (item.innerHTML) el.innerHTML = item.innerHTML;
          if (item.href) el.setAttribute('href', item.href);

          let parent = item.parentId ? (document.getElementById(item.parentId) || document.querySelector(`[data-pvt-id="${item.parentId}"]`)) : null;
          if (!parent) parent = document.querySelector('.hero-inner') || document.querySelector('.matchup-head') || document.querySelector('.wrap') || document.body;
          parent.appendChild(el);
        });
      } catch (e) {
        console.error('Failed to restore custom elements', e);
      }
    },

    injectSelectionBox: function () {
      if (document.getElementById('pvtSelectionBox')) return;

      const box = document.createElement('div');
      box.id = 'pvtSelectionBox';
      box.className = 'pvt-selection-box';
      box.innerHTML = `
        <!-- Top Move Handle (Drag Left/Right/Up/Down) -->
        <div class="pvt-move-handle" id="pvtMoveHandle" title="Click & Drag or Hold Shift + Drag to Move">
          <span id="pvtMoveHandleLabel">✥ DRAG TO MOVE</span>
        </div>

        <!-- 4 Corner Pull Handles -->
        <div class="pvt-corner-handle handle-nw" data-handle="nw" title="Pull corner to resize"></div>
        <div class="pvt-corner-handle handle-ne" data-handle="ne" title="Pull corner to resize"></div>
        <div class="pvt-corner-handle handle-se" data-handle="se" title="Pull corner to resize"></div>
        <div class="pvt-corner-handle handle-sw" data-handle="sw" title="Pull corner to resize"></div>

        <!-- Left & Right Width Edge Handles -->
        <div class="pvt-edge-handle handle-w" data-handle="w" title="Pull edge to resize width"></div>
        <div class="pvt-edge-handle handle-e" data-handle="e" title="Pull edge to resize width"></div>

        <!-- Dynamic Live Measurement Tooltip -->
        <div class="pvt-resize-tooltip" id="pvtResizeTooltip">Size: 32px</div>
      `;
      document.body.appendChild(box);

      this.initMoveAndResizeHandlers(box);
    },

    // ---- Freeform Movement & Resize Engine ----
    initMoveAndResizeHandlers: function (box) {
      const moveHandle = box.querySelector('.pvt-move-handle');
      const cornerHandles = box.querySelectorAll('.pvt-corner-handle');
      const edgeHandles = box.querySelectorAll('.pvt-edge-handle');

      let startX = 0;
      let startY = 0;
      let startFontSize = 16;
      let startWidth = 300;
      let memberStartPositions = [];
      let activeHandle = null;

      const getTranslate = (el) => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform || style.webkitTransform;
        if (!matrix || matrix === 'none') return { x: 0, y: 0 };
        const match = matrix.match(/matrix.*\((.+)\)/);
        if (match) {
          const values = match[1].split(', ');
          return { x: parseFloat(values[4]) || 0, y: parseFloat(values[5]) || 0 };
        }
        return { x: 0, y: 0 };
      };

      // ---- MOVE DRAG HANDLER ----
      const onMoveMouseMove = (e) => {
        if (!Builder.isMoving) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        memberStartPositions.forEach(item => {
          const isOuterFloor = ['SECTION','HEADER','FOOTER'].includes(item.el.tagName) || item.el.classList.contains('tape');
          if (isOuterFloor) return;

          const newX = Math.round(item.startX + deltaX);
          const newY = Math.round(item.startY + deltaY);
          item.el.style.transform = `translate(${newX}px, ${newY}px)`;
        });

        const count = memberStartPositions.length;
        const label = count > 1 ? `Group (${count} items): X:${Math.round(deltaX)}px, Y:${Math.round(deltaY)}px` : `Position: X:${Math.round(deltaX)}px, Y:${Math.round(deltaY)}px`;
        document.getElementById('pvtResizeTooltip').textContent = label;
        Builder.updateSelectionBoxPosition();
      };

      const onMoveMouseUp = () => {
        if (Builder.isMoving) {
          Builder.isMoving = false;
          box.classList.remove('moving');
          document.body.classList.remove('pvt-moving-active');

          memberStartPositions.forEach(item => {
            const isOuterFloor = ['SECTION','HEADER','FOOTER'].includes(item.el.tagName) || item.el.classList.contains('tape');
            if (!isOuterFloor) {
              Builder.saveElementStyle(item.el, 'transform', item.el.style.transform);
            }
          });

          Builder.updateSelectionBoxPosition();
          Builder.recordHistorySnapshot();
        }
        window.removeEventListener('mousemove', onMoveMouseMove);
        window.removeEventListener('mouseup', onMoveMouseUp);
      };

      moveHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targets = Builder.selectedElements.length > 0 ? Builder.selectedElements : (Builder.selectedElement ? [Builder.selectedElement] : []);
        if (targets.length === 0) return;

        Builder.isMoving = true;
        document.body.classList.add('pvt-moving-active');
        startX = e.clientX;
        startY = e.clientY;

        memberStartPositions = targets.map(el => {
          const trans = getTranslate(el);
          return { el, startX: trans.x, startY: trans.y };
        });

        box.classList.add('moving');
        window.addEventListener('mousemove', onMoveMouseMove);
        window.addEventListener('mouseup', onMoveMouseUp);
      });

      // ---- CORNER & EDGE RESIZE HANDLER ----
      const onResizeMouseMove = (e) => {
        if (!Builder.isResizing || !Builder.selectedElement) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        if (activeHandle === 'e' || activeHandle === 'w') {
          const widthDelta = activeHandle === 'e' ? deltaX : -deltaX;
          const newWidth = Math.max(100, Math.min(1800, Math.round(startWidth + widthDelta)));
          Builder.selectedElement.style.width = `${newWidth}px`;
          Builder.selectedElement.style.maxWidth = `${newWidth}px`;
          document.getElementById('pvtResizeTooltip').textContent = `Width: ${newWidth}px`;
        } else {
          let scaleDelta = 0;
          if (activeHandle === 'se') scaleDelta = (deltaX + deltaY) / 2;
          else if (activeHandle === 'sw') scaleDelta = (-deltaX + deltaY) / 2;
          else if (activeHandle === 'ne') scaleDelta = (deltaX - deltaY) / 2;
          else if (activeHandle === 'nw') scaleDelta = (-deltaX - deltaY) / 2;

          const isWatermark = Builder.selectedElement.classList.contains('hero-watermark') || Builder.selectedElement.classList.contains('watermark');
          const isImgOrContainer = Builder.selectedElement.classList.contains('pvt-image-block') || Builder.selectedElement.tagName === 'IMG' || isWatermark;

          if (isImgOrContainer) {
            const newImgWidth = Math.max(120, Math.min(1800, Math.round(startWidth + scaleDelta * 1.2)));
            Builder.selectedElement.style.width = `${newImgWidth}px`;
            document.getElementById('pvtResizeTooltip').textContent = `Width: ${newImgWidth}px`;
          } else {
            const newFontSize = Math.max(10, Math.min(180, Math.round(startFontSize + scaleDelta * 0.4)));
            Builder.selectedElement.style.fontSize = `${newFontSize}px`;
            document.getElementById('pvtResizeTooltip').textContent = `Size: ${newFontSize}px`;
          }
        }

        Builder.updateSelectionBoxPosition();
      };

      const onResizeMouseUp = () => {
        if (Builder.isResizing && Builder.selectedElement) {
          Builder.isResizing = false;
          box.classList.remove('resizing');
          document.body.classList.remove('pvt-resizing-active');
          const computed = window.getComputedStyle(Builder.selectedElement);
          Builder.saveElementStyle(Builder.selectedElement, 'fontSize', computed.fontSize);
          if (Builder.selectedElement.style.width) {
            Builder.saveElementStyle(Builder.selectedElement, 'width', Builder.selectedElement.style.width);
            Builder.saveElementStyle(Builder.selectedElement, 'maxWidth', Builder.selectedElement.style.maxWidth);
          }
          Builder.updateSelectionBoxPosition();
          Builder.recordHistorySnapshot();
        }
        window.removeEventListener('mousemove', onResizeMouseMove);
        window.removeEventListener('mouseup', onResizeMouseUp);
      };

      [...cornerHandles, ...edgeHandles].forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!Builder.selectedElement) return;

          Builder.isResizing = true;
          document.body.classList.add('pvt-resizing-active');
          activeHandle = handle.dataset.handle;
          startX = e.clientX;
          startY = e.clientY;
          startFontSize = parseInt(window.getComputedStyle(Builder.selectedElement).fontSize, 10) || 16;
          startWidth = Builder.selectedElement.getBoundingClientRect().width;

          box.classList.add('resizing');
          window.addEventListener('mousemove', onResizeMouseMove);
          window.addEventListener('mouseup', onResizeMouseUp);
        });
      });
    },

    // ---- Direct Element Dragging with Shift + Drag Support ----
    initDirectElementDragging: function () {
      const getTranslate = (el) => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform || style.webkitTransform;
        if (!matrix || matrix === 'none') return { x: 0, y: 0 };
        const match = matrix.match(/matrix.*\((.+)\)/);
        if (match) {
          const values = match[1].split(', ');
          return { x: parseFloat(values[4]) || 0, y: parseFloat(values[5]) || 0 };
        }
        return { x: 0, y: 0 };
      };

      document.addEventListener('mousedown', (e) => {
        if (!Builder.isEditMode) return;
        if (e.target.closest('.pvt-topbar') || e.target.closest('.pvt-inspector') || e.target.closest('.pvt-selection-box') || e.target.closest('.pvt-add-drawer') || e.target.closest('.pvt-sec-badge')) return;

        const targetEditable = e.target.closest('[data-pvt-editable]');
        if (!targetEditable) return;

        const isShift = e.shiftKey;
        const isAlreadySelected = Builder.selectedElements.includes(targetEditable);

        if (isShift) {
          e.preventDefault();
          if (isAlreadySelected) {
            Builder.selectedElements = Builder.selectedElements.filter(el => el !== targetEditable);
            targetEditable.removeAttribute('data-pvt-group-selected');
            Builder.selectedElement = Builder.selectedElements[0] || null;
          } else {
            Builder.selectedElements.push(targetEditable);
            targetEditable.setAttribute('data-pvt-group-selected', 'true');
            Builder.selectedElement = targetEditable;
          }
          Builder.updateSelectionBoxPosition();
          Builder.renderInspector();
        } else if (!isAlreadySelected) {
          Builder.selectElement(targetEditable);
        }

        const targets = Builder.selectedElements.length > 0 ? Builder.selectedElements : [targetEditable];
        let startX = e.clientX;
        let startY = e.clientY;
        let hasMoved = false;

        const memberStartPositions = targets.map(el => {
          const trans = getTranslate(el);
          return { el, startX: trans.x, startY: trans.y };
        });

        const onDragMove = (me) => {
          const deltaX = me.clientX - startX;
          const deltaY = me.clientY - startY;

          if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
            hasMoved = true;
            Builder.isMoving = true;
            document.body.classList.add('pvt-moving-active');
            const box = document.getElementById('pvtSelectionBox');
            if (box) box.classList.add('moving');
          }

          if (hasMoved) {
            memberStartPositions.forEach(item => {
              const isOuterFloor = ['SECTION','HEADER','FOOTER'].includes(item.el.tagName) || item.el.classList.contains('tape');
              if (isOuterFloor) return;

              const newX = Math.round(item.startX + deltaX);
              const newY = Math.round(item.startY + deltaY);
              item.el.style.transform = `translate(${newX}px, ${newY}px)`;
            });

            const count = memberStartPositions.length;
            const tooltip = document.getElementById('pvtResizeTooltip');
            if (tooltip) {
              tooltip.textContent = count > 1 ? `Group (${count} items): X:${Math.round(deltaX)}px, Y:${Math.round(deltaY)}px` : `Position: X:${Math.round(deltaX)}px, Y:${Math.round(deltaY)}px`;
            }
            Builder.updateSelectionBoxPosition();
          }
        };

        const onDragUp = () => {
          if (hasMoved && Builder.isMoving) {
            Builder.isMoving = false;
            document.body.classList.remove('pvt-moving-active');
            const box = document.getElementById('pvtSelectionBox');
            if (box) box.classList.remove('moving');

            memberStartPositions.forEach(item => {
              const isOuterFloor = ['SECTION','HEADER','FOOTER'].includes(item.el.tagName) || item.el.classList.contains('tape');
              if (!isOuterFloor) {
                Builder.saveElementStyle(item.el, 'transform', item.el.style.transform);
              }
            });

            Builder.updateSelectionBoxPosition();
            Builder.recordHistorySnapshot();
          }
          window.removeEventListener('mousemove', onDragMove);
          window.removeEventListener('mouseup', onDragUp);
        };

        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragUp);
      });
    },

    updateSelectionBoxPosition: function () {
      const box = document.getElementById('pvtSelectionBox');
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      if (!box || targets.length === 0) {
        if (box) box.classList.remove('active');
        return;
      }

      let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;

      targets.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.left < minLeft) minLeft = rect.left;
        if (rect.top < minTop) minTop = rect.top;
        if (rect.right > maxRight) maxRight = rect.right;
        if (rect.bottom > maxBottom) maxBottom = rect.bottom;
      });

      box.style.top = `${minTop}px`;
      box.style.left = `${minLeft}px`;
      box.style.width = `${maxRight - minLeft}px`;
      box.style.height = `${maxBottom - minTop}px`;
      box.classList.add('active');

      const moveLabel = document.getElementById('pvtMoveHandleLabel');
      if (moveLabel) {
        const isOuterFloor = targets.length === 1 && (['SECTION','HEADER','FOOTER'].includes(targets[0].tagName) || targets[0].classList.contains('tape'));
        moveLabel.textContent = targets.length > 1 ? `🔗 MOVE GROUP (${targets.length})` : (isOuterFloor ? `📐 SECTION SELECTED` : `✥ DRAG TO MOVE`);
      }
    },

    // ---- Draggable Non-Overlapping Inspector ----
    injectInspector: function () {
      if (document.getElementById('pvtInspector')) return;

      const inspector = document.createElement('div');
      inspector.id = 'pvtInspector';
      inspector.className = 'pvt-inspector';
      inspector.innerHTML = `
        <div class="pvt-insp-header" id="pvtInspHeader" title="Drag to move inspector anywhere">
          <span class="pvt-insp-title" id="pvtInspTitle">
            <span>✥</span>
            <span>Inspector & Style</span>
          </span>
          <button class="pvt-insp-close" onclick="window.PIIIVOT_BUILDER.closeInspector()">×</button>
        </div>

        <!-- Breadcrumb & Parent Section Jump -->
        <div id="pvtBreadcrumbRow" style="display:flex; justify-content:space-between; align-items:center; background:#1c1b19; padding:6px 10px; border:1px solid #2e2d2a; border-radius:2px; font-size:10px;">
          <span id="pvtBreadcrumbText" style="color:#98958a;">Target: Element</span>
          <button id="pvtParentSecBtn" class="pvt-btn" style="padding:2px 6px; font-size:9.5px; color:#4ade80;" onclick="window.PIIIVOT_BUILDER.selectParentSection()">
            <span>📐 Select Floor ↗</span>
          </button>
        </div>

        <!-- 🏁 Section Floor Background Controller (Full-Width Strip) -->
        <div style="background:#1c1b19; border:1px solid #22c55e; padding:10px; border-radius:2px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label style="color:#4ade80; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;">
              🏁 Section Floor Background
            </label>
            <input type="color" id="pvtFloorColorPicker" onchange="window.PIIIVOT_BUILDER.applyFloorColor(this.value)" style="width:28px; height:22px; border:none; background:none; cursor:pointer;" title="Pick custom floor color">
          </div>
          <div class="pvt-palette">
            <div class="pvt-swatch" style="background:#0a0a0a;" title="Ink Black (#0a0a0a)" onclick="window.PIIIVOT_BUILDER.applyFloorColor('#0a0a0a')"></div>
            <div class="pvt-swatch" style="background:#141413;" title="Dark Charcoal (#141413)" onclick="window.PIIIVOT_BUILDER.applyFloorColor('#141413')"></div>
            <div class="pvt-swatch" style="background:#f5f4ef; border-color:#98958a;" title="Warm Off-White (#f5f4ef)" onclick="window.PIIIVOT_BUILDER.applyFloorColor('#f5f4ef')"></div>
            <div class="pvt-swatch" style="background:#e9e7df; border-color:#98958a;" title="Paper Surface (#e9e7df)" onclick="window.PIIIVOT_BUILDER.applyFloorColor('#e9e7df')"></div>
            <div class="pvt-swatch" style="background:#22c55e;" title="Emerald Green (#22c55e)" onclick="window.PIIIVOT_BUILDER.applyFloorColor('#22c55e')"></div>
          </div>
        </div>

        <!-- Section Spacing & Reordering Controls -->
        <div id="pvtSectionControls" style="display:none; background:#1c1b19; padding:8px 10px; border:1px solid #2e2d2a; border-radius:2px;">
          <label style="display:block; font-size:10px; color:#22c55e; text-transform:uppercase; letter-spacing:.1em; margin-bottom:6px;">
            📐 Section Floor Height / Padding
          </label>
          <div class="pvt-row" style="margin-bottom:6px;">
            <label>Padding Y</label>
            <input type="range" id="pvtSecPaddingSlider" min="0" max="180" value="60" style="width:60%; cursor:pointer;" oninput="window.PIIIVOT_BUILDER.applySectionPadding(this.value)">
            <span id="pvtSecPaddingVal" style="font-size:10px; width:30px; text-align:right;">60px</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="pvt-btn" style="flex:1; justify-content:center;" onclick="window.PIIIVOT_BUILDER.moveSectionUp()">
              <span>↑ Move Section Up</span>
            </button>
            <button class="pvt-btn" style="flex:1; justify-content:center;" onclick="window.PIIIVOT_BUILDER.moveSectionDown()">
              <span>↓ Move Section Down</span>
            </button>
          </div>
        </div>

        <!-- Multi-Select Grouping Actions -->
        <div id="pvtGroupSection" style="display:none; background:#1c1b19; padding:8px 10px; border:1px solid #22c55e; border-radius:2px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#4ade80; font-size:10px; font-weight:700;" id="pvtGroupStatusLabel">🔗 2 ELEMENTS SELECTED</span>
            <span style="color:#98958a; font-size:9px;">Shift+Click</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="pvt-btn pvt-btn-primary" style="flex:1; justify-content:center;" onclick="window.PIIIVOT_BUILDER.groupSelected()">
              <span>🔗 Group (Ctrl+G)</span>
            </button>
            <button class="pvt-btn" style="flex:1; justify-content:center;" onclick="window.PIIIVOT_BUILDER.ungroupSelected()">
              <span>🔓 Ungroup</span>
            </button>
          </div>
        </div>

        <!-- 🔤 Selected Text Element Color -->
        <div id="pvtTextColorRow">
          <div class="pvt-row">
            <label id="pvtTextColorLabel">🔤 Text Color</label>
            <div style="display:flex; align-items:center; gap:6px;">
              <input type="color" id="pvtColorPicker" onchange="window.PIIIVOT_BUILDER.applyTextColor(this.value)" style="width:32px; height:24px; border:none; background:none; cursor:pointer;">
              <button class="pvt-btn" style="padding:2px 6px; font-size:9px;" onclick="window.PIIIVOT_BUILDER.resetTextColor()" title="Reset to natural color">Reset</button>
            </div>
          </div>
          <div class="pvt-palette">
            <div class="pvt-swatch" style="background:#ffffff; border-color:#98958a;" title="Pure White" onclick="window.PIIIVOT_BUILDER.applyTextColor('#ffffff')"></div>
            <div class="pvt-swatch" style="background:#0a0a0a;" title="Ink Black" onclick="window.PIIIVOT_BUILDER.applyTextColor('#0a0a0a')"></div>
            <div class="pvt-swatch" style="background:#f5f4ef;" title="Warm Off-White" onclick="window.PIIIVOT_BUILDER.applyTextColor('#f5f4ef')"></div>
            <div class="pvt-swatch" style="background:#98958a;" title="Muted Grey" onclick="window.PIIIVOT_BUILDER.applyTextColor('#98958a')"></div>
            <div class="pvt-swatch" style="background:#22c55e;" title="Emerald Green" onclick="window.PIIIVOT_BUILDER.applyTextColor('#22c55e')"></div>
            <div class="pvt-swatch" style="background:#ef4444;" title="Red Alert" onclick="window.PIIIVOT_BUILDER.applyTextColor('#ef4444')"></div>
          </div>
        </div>

        <!-- Opacity Slider -->
        <div id="pvtOpacityRow" class="pvt-row">
          <label>Opacity</label>
          <div style="display:flex; align-items:center; gap:8px; width:65%;">
            <input type="range" id="pvtOpacitySlider" min="0" max="100" value="100" style="width:100%; cursor:pointer;" oninput="window.PIIIVOT_BUILDER.applyOpacity(this.value)">
            <span id="pvtOpacityVal" style="font-size:10px; width:34px; text-align:right;">100%</span>
          </div>
        </div>

        <!-- Image Upload Section -->
        <div id="pvtImageControlSection" style="background:#1c1b19; padding:10px; border:1px solid #2e2d2a; border-radius:2px; margin-bottom:4px;">
          <label style="display:block; font-size:10px; color:#22c55e; text-transform:uppercase; letter-spacing:.1em; margin-bottom:6px;">
            🖼️ Image & Media Upload
          </label>
          <div style="display:flex; gap:6px;">
            <label class="pvt-btn pvt-btn-primary" style="flex:1; justify-content:center; font-size:10px; cursor:pointer;">
              <span>📁 Upload from PC</span>
              <input type="file" id="pvtFileInput" accept="image/*" style="display:none;" onchange="window.PIIIVOT_BUILDER.handleFileUpload(this)">
            </label>
          </div>
          <div style="margin-top:6px;">
            <input type="text" id="pvtImageUrlInput" placeholder="or paste Image URL..." class="pvt-input-text" style="font-size:10px;" onchange="window.PIIIVOT_BUILDER.applyImageUrl(this.value)">
          </div>
        </div>

        <!-- Font Family Selector -->
        <div class="pvt-row" id="pvtFontRow">
          <label>Font</label>
          <select id="pvtFontFamily" class="pvt-input-select" onchange="window.PIIIVOT_BUILDER.applyFontFamily(this.value)">
            <option value="'Anton', sans-serif">Anton (Header)</option>
            <option value="'IBM Plex Mono', monospace">IBM Plex Mono (Tech Spec)</option>
            <option value="'IBM Plex Sans', sans-serif">IBM Plex Sans (Body)</option>
            <option value="'Bebas Neue', sans-serif">Bebas Neue (Condensed)</option>
            <option value="'Oswald', sans-serif">Oswald (Athletic)</option>
            <option value="'Outfit', sans-serif">Outfit (Modern Bold)</option>
            <option value="'Inter', sans-serif">Inter (Precision)</option>
          </select>
        </div>

        <!-- Position X & Y Controls -->
        <div>
          <div class="pvt-row">
            <label>Position (X / Horizontal)</label>
            <button class="pvt-btn" style="padding:2px 6px; font-size:9.5px;" onclick="window.PIIIVOT_BUILDER.resetPosition()">Reset</button>
          </div>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <button class="pvt-btn" style="flex:1;" onclick="window.PIIIVOT_BUILDER.nudgePosition(-20, 0)">← Left (-20px)</button>
            <button class="pvt-btn" style="flex:1;" onclick="window.PIIIVOT_BUILDER.nudgePosition(20, 0)">Right (+20px) →</button>
          </div>
        </div>

        <!-- Alignment -->
        <div class="pvt-row" id="pvtAlignRow">
          <label>Align</label>
          <div style="display:flex; gap:4px;">
            <button class="pvt-btn" style="padding:4px 8px;" onclick="window.PIIIVOT_BUILDER.applyAlign('left')">Left</button>
            <button class="pvt-btn" style="padding:4px 8px;" onclick="window.PIIIVOT_BUILDER.applyAlign('center')">Center</button>
            <button class="pvt-btn" style="padding:4px 8px;" onclick="window.PIIIVOT_BUILDER.applyAlign('right')">Right</button>
          </div>
        </div>

        <!-- Delete Element Action -->
        <div id="pvtDeleteRow" style="border-top:1px solid #2e2d2a; padding-top:10px; margin-top:4px;">
          <button class="pvt-btn" style="width:100%; justify-content:center; color:#f87171; border-color:#ef4444;" onclick="window.PIIIVOT_BUILDER.deleteSelectedElement()">
            <span>🗑️ Delete Selected</span>
          </button>
        </div>
      `;
      document.body.appendChild(inspector);
      this.initDraggableInspector(inspector);
    },

    initDraggableInspector: function (inspector) {
      const header = inspector.querySelector('#pvtInspHeader');
      let isDragging = false;
      let startX = 0, startY = 0;
      let startLeft = 0, startTop = 0;

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.pvt-insp-close')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = inspector.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        const onDragMove = (me) => {
          if (!isDragging) return;
          const newLeft = Math.max(10, Math.min(window.innerWidth - 340, startLeft + (me.clientX - startX)));
          const newTop = Math.max(50, Math.min(window.innerHeight - 100, startTop + (me.clientY - startY)));
          inspector.style.left = `${newLeft}px`;
          inspector.style.top = `${newTop}px`;
        };

        const onDragUp = () => {
          isDragging = false;
          window.removeEventListener('mousemove', onDragMove);
          window.removeEventListener('mouseup', onDragUp);
        };

        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragUp);
      });
    },

    // ---- Apply Floor Background (ZERO Text Color Bleed) ----
    applyFloorColor: function (colorVal) {
      const target = this.selectedElement || document.querySelector('.hero') || document.body;
      const section = target.closest('section, header, footer, .tape, body') || target;

      section.style.setProperty('background', colorVal, 'important');
      section.style.setProperty('background-color', colorVal, 'important');

      this.saveElementStyle(section, 'floorBackground', colorVal);
      this.recordHistorySnapshot();
      if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast(`Floor Background Set to ${colorVal} ✓`);
    },

    // ---- Apply Text Color (Only to Concrete Text Elements) ----
    applyTextColor: function (colorVal) {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      
      targets.forEach(el => {
        const isContainer = ['SECTION','HEADER','FOOTER','MAIN','BODY'].includes(el.tagName);
        if (isContainer) return;

        el.style.color = colorVal;
        const svg = el.querySelector('svg path') || el.querySelector('svg');
        if (svg) svg.style.fill = colorVal;
        this.saveElementStyle(el, 'color', colorVal);
      });

      this.recordHistorySnapshot();
    },

    resetTextColor: function () {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      targets.forEach(el => {
        el.style.color = '';
        this.saveElementStyle(el, 'color', '');
      });
      if (this.selectedElement) {
        const sec = this.selectedElement.closest('section, header, footer, .tape') || this.selectedElement;
        sec.style.color = '';
        this.saveElementStyle(sec, 'color', '');
      }
      this.recordHistorySnapshot();
      if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Text Color Reset to Default ✓');
    },

    // ---- Image Upload Handler ----
    handleFileUpload: function (input) {
      const file = input.files[0];
      if (!file || (!this.selectedElement && this.selectedElements.length === 0)) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        this.applyImageSrc(dataUrl);
      };
      reader.readAsDataURL(file);
      input.value = '';
    },

    applyImageUrl: function (url) {
      if (!url || (!this.selectedElement && this.selectedElements.length === 0)) return;
      this.applyImageSrc(url.trim());
    },

    applyImageSrc: function (src) {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : [this.selectedElement];
      targets.forEach(target => {
        if (target.tagName === 'IMG') {
          target.src = src;
          this.saveElementStyle(target, 'src', src);
        } else {
          let img = target.querySelector('img');
          if (target.classList.contains('pvt-image-block')) {
            target.innerHTML = `<img src="${src}" style="width:100%; height:100%; object-fit:cover; display:block;" alt="PIIIVOT Upload">`;
            target.style.border = '1px solid #333230';
            this.saveElementContent(target);
          } else if (img) {
            img.src = src;
            this.saveElementStyle(img, 'src', src);
          } else {
            target.style.backgroundImage = `url(${src})`;
            target.style.backgroundSize = 'cover';
            target.style.backgroundPosition = 'center';
            this.saveElementStyle(target, 'backgroundImage', `url(${src})`);
          }
        }
      });

      this.updateSelectionBoxPosition();
      this.saveCustomElements();
      this.recordHistorySnapshot();
      if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Image Updated Successfully ✓');
    },

    // ---- Precision Inline Element Selection ----
    enableInlineEditing: function () {
      const targetTags = 'h1, h2, h3, h4, h5, h6, p, .eyebrow, .wordmark, .btn-primary, .btn-outline, .pill, strong, .hero-watermark, .watermark, span[data-logo], .cat-panel, .product-card, .trust-item, .pvt-image-block, section, header, footer, .tape, [data-pvt-custom]';
      const elements = document.querySelectorAll(targetTags);

      elements.forEach((el, idx) => {
        this.attachElementListeners(el, idx);
      });
    },

    attachElementListeners: function (el, idx) {
      if (el.closest('.pvt-topbar') || el.closest('.pvt-inspector') || el.closest('.pvt-selection-box') || el.closest('.pvt-add-drawer') || el.classList.contains('pvt-sec-badge')) return;
      el.setAttribute('data-pvt-editable', 'true');
      
      if (!el.getAttribute('data-pvt-id')) {
        const parentSection = el.closest('section, main, header, footer, div');
        const secId = parentSection ? (parentSection.id || parentSection.className.split(' ')[0] || 'sec') : 'body';
        const tag = el.tagName.toLowerCase();
        const cls = (el.className || '').split(' ')[0] || 'el';
        el.setAttribute('data-pvt-id', el.id || `pvt-${secId}-${tag}-${cls}-${idx || 0}`);
      }

      const isText = ['H1','H2','H3','H4','H5','H6','P','SPAN','A','STRONG'].includes(el.tagName) && 
                     !el.classList.contains('hero-watermark') && 
                     !el.classList.contains('watermark') && 
                     !el.classList.contains('pvt-image-block') &&
                     !el.classList.contains('cat-panel') &&
                     !el.classList.contains('product-card');

      if (isText && !el.getAttribute('data-logo')) {
        el.setAttribute('contenteditable', 'true');
      }

      el.addEventListener('input', () => {
        if (isText) {
          Builder.saveElementContent(el);
          clearTimeout(Builder._typingSnapshotTimer);
          Builder._typingSnapshotTimer = setTimeout(() => {
            Builder.recordHistorySnapshot();
          }, 600);
        }
      });

      el.addEventListener('blur', () => {
        if (isText) {
          Builder.saveElementContent(el);
        }
        Builder.updateSelectionBoxPosition();
        Builder.saveCustomElements();
        Builder.recordHistorySnapshot();
      });
    },

    selectParentSection: function () {
      if (!this.selectedElement) return;
      const parentSection = this.selectedElement.closest('section, header, footer, .tape, .cart-drawer, .checkout-modal');
      if (parentSection) {
        this.selectElement(parentSection);
      }
    },

    moveSectionUp: function () {
      if (!this.selectedElement) return;
      const sec = this.selectedElement.closest('section, header, footer, .tape') || this.selectedElement;
      if (sec && sec.previousElementSibling && !sec.previousElementSibling.classList.contains('pvt-topbar')) {
        sec.parentNode.insertBefore(sec, sec.previousElementSibling);
        this.updateSelectionBoxPosition();
        this.recordHistorySnapshot();
        if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Section Moved Up ↑');
      }
    },

    moveSectionDown: function () {
      if (!this.selectedElement) return;
      const sec = this.selectedElement.closest('section, header, footer, .tape') || this.selectedElement;
      if (sec && sec.nextElementSibling) {
        sec.parentNode.insertBefore(sec.nextElementSibling, sec);
        this.updateSelectionBoxPosition();
        this.recordHistorySnapshot();
        if (window.PIIIVOT_CART) window.PIIIVOT_CART.showToast('Section Moved Down ↓');
      }
    },

    applySectionPadding: function (val) {
      if (!this.selectedElement) return;
      const sec = this.selectedElement.closest('section, header, footer, .tape') || this.selectedElement;
      sec.style.paddingTop = `${val}px`;
      sec.style.paddingBottom = `${val}px`;
      document.getElementById('pvtSecPaddingVal').textContent = `${val}px`;
      this.saveElementStyle(sec, 'paddingTop', `${val}px`);
      this.saveElementStyle(sec, 'paddingBottom', `${val}px`);
      this.updateSelectionBoxPosition();
      this.recordHistorySnapshot();
    },

    // Multi-Select & Single Element Selection
    selectElement: function (el) {
      document.querySelectorAll('[data-pvt-group-selected]').forEach(elem => elem.removeAttribute('data-pvt-group-selected'));

      const groupId = el.getAttribute('data-pvt-group');
      if (groupId) {
        const members = Array.from(document.querySelectorAll(`[data-pvt-group="${groupId}"]`));
        this.selectedElements = members;
        this.selectedElement = el;
        members.forEach(m => m.setAttribute('data-pvt-group-selected', 'true'));
      } else {
        this.selectedElement = el;
        this.selectedElements = [el];
      }

      this.updateSelectionBoxPosition();
      this.renderInspector();
    },

    renderInspector: function () {
      const inspector = document.getElementById('pvtInspector');
      if (!inspector) return;

      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      if (targets.length === 0) return;

      const el = targets[0];
      const computed = window.getComputedStyle(el);

      const titleEl = document.getElementById('pvtInspTitle');
      const groupSection = document.getElementById('pvtGroupSection');
      const groupStatusLabel = document.getElementById('pvtGroupStatusLabel');
      const breadcrumbText = document.getElementById('pvtBreadcrumbText');
      const parentSecBtn = document.getElementById('pvtParentSecBtn');
      const sectionControls = document.getElementById('pvtSectionControls');
      const textColorRow = document.getElementById('pvtTextColorRow');

      const isSection = ['SECTION','HEADER','FOOTER'].includes(el.tagName) || el.classList.contains('tape') || el.classList.contains('cart-drawer');
      const parentSec = el.closest('section, header, footer, .tape, .cart-drawer');

      if (isSection) {
        titleEl.innerHTML = `<span>🏁 ${el.id || el.tagName} Floor</span>`;
        if (breadcrumbText) breadcrumbText.textContent = `Floor: ${el.id || el.tagName} (Full Section)`;
        if (parentSecBtn) parentSecBtn.style.display = 'none';
        if (sectionControls) {
          sectionControls.style.display = 'block';
          const curPad = parseInt(computed.paddingTop, 10) || 60;
          document.getElementById('pvtSecPaddingSlider').value = curPad;
          document.getElementById('pvtSecPaddingVal').textContent = `${curPad}px`;
        }
        if (textColorRow) textColorRow.style.display = 'none';
      } else {
        if (sectionControls) sectionControls.style.display = 'none';
        if (textColorRow) textColorRow.style.display = 'block';

        if (parentSecBtn) {
          parentSecBtn.style.display = parentSec ? 'inline-flex' : 'none';
          parentSecBtn.textContent = `📐 Select Floor (${parentSec ? (parentSec.id || parentSec.tagName) : ''}) ↗`;
        }
        if (breadcrumbText) breadcrumbText.textContent = `Target: <${el.tagName.toLowerCase()}>`;

        if (targets.length > 1) {
          titleEl.innerHTML = `<span>🔗 Group Selection</span>`;
        } else if (el.classList.contains('hero-watermark') || el.classList.contains('watermark')) {
          titleEl.innerHTML = `<span>🎨 Logo Watermark</span>`;
        } else if (el.classList.contains('cat-panel') || el.classList.contains('product-card')) {
          titleEl.innerHTML = `<span>📦 Component / Card</span>`;
        } else if (el.tagName.startsWith('H') || el.tagName === 'P') {
          titleEl.innerHTML = `<span>🔤 ${el.tagName} Text Block</span>`;
        } else {
          titleEl.innerHTML = `<span>✥ Inspector & Style</span>`;
        }
      }

      if (groupSection) {
        if (targets.length > 1) {
          groupSection.style.display = 'block';
          if (groupStatusLabel) groupStatusLabel.textContent = `🔗 ${targets.length} ELEMENTS SELECTED`;
        } else {
          const hasGroup = el.getAttribute('data-pvt-group');
          groupSection.style.display = hasGroup ? 'block' : 'none';
          if (hasGroup && groupStatusLabel) groupStatusLabel.textContent = `🔗 LOCKED GROUP`;
        }
      }

      const curOpacity = Math.round((parseFloat(computed.opacity) || 1) * 100);
      const opacitySlider = document.getElementById('pvtOpacitySlider');
      const opacityVal = document.getElementById('pvtOpacityVal');
      if (opacitySlider) opacitySlider.value = curOpacity;
      if (opacityVal) opacityVal.textContent = `${curOpacity}%`;

      const rect = el.getBoundingClientRect();
      let top = Math.max(60, Math.min(window.innerHeight - 440, rect.top));
      let left = rect.right + 24;

      if (left + 330 > window.innerWidth) {
        left = Math.max(16, rect.left - 340);
      }
      if (left < rect.right && left + 330 > rect.left) {
        left = Math.max(16, window.innerWidth - 345);
        top = 65;
      }

      inspector.style.top = `${top}px`;
      inspector.style.left = `${left}px`;
      inspector.classList.add('open');
    },

    closeInspector: function () {
      const inspector = document.getElementById('pvtInspector');
      if (inspector) inspector.classList.remove('open');
      const box = document.getElementById('pvtSelectionBox');
      if (box) box.classList.remove('active');
      document.querySelectorAll('[data-pvt-group-selected]').forEach(elem => elem.removeAttribute('data-pvt-group-selected'));
      this.selectedElement = null;
      this.selectedElements = [];
    },

    applyOpacity: function (val) {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      const op = Number(val) / 100;
      targets.forEach(el => {
        el.style.opacity = op;
        this.saveElementStyle(el, 'opacity', op);
      });
      const opacityVal = document.getElementById('pvtOpacityVal');
      if (opacityVal) opacityVal.textContent = `${val}%`;
      this.recordHistorySnapshot();
    },

    applyFontFamily: function (fontVal) {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      targets.forEach(el => {
        el.style.fontFamily = fontVal;
        this.saveElementStyle(el, 'fontFamily', fontVal);
      });
      this.updateSelectionBoxPosition();
      this.recordHistorySnapshot();
    },

    applyAlign: function (alignVal) {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      targets.forEach(el => {
        el.style.textAlign = alignVal;
        this.saveElementStyle(el, 'textAlign', alignVal);
      });
      this.updateSelectionBoxPosition();
      this.recordHistorySnapshot();
    },

    nudgePosition: function (dx, dy) {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      targets.forEach(el => {
        const isOuterFloor = ['SECTION','HEADER','FOOTER'].includes(el.tagName) || el.classList.contains('tape');
        if (isOuterFloor) return;

        const style = window.getComputedStyle(el);
        const matrix = style.transform || style.webkitTransform;
        let curX = 0, curY = 0;
        if (matrix && matrix !== 'none') {
          const match = matrix.match(/matrix.*\((.+)\)/);
          if (match) {
            const values = match[1].split(', ');
            curX = parseFloat(values[4]) || 0;
            curY = parseFloat(values[5]) || 0;
          }
        }
        const newX = curX + dx;
        const newY = curY + dy;
        const trans = `translate(${newX}px, ${newY}px)`;
        el.style.transform = trans;
        this.saveElementStyle(el, 'transform', trans);
      });
      this.updateSelectionBoxPosition();
      this.recordHistorySnapshot();
    },

    resetPosition: function () {
      const targets = this.selectedElements.length > 0 ? this.selectedElements : (this.selectedElement ? [this.selectedElement] : []);
      targets.forEach(el => {
        el.style.transform = 'none';
        this.saveElementStyle(el, 'transform', 'none');
      });
      this.updateSelectionBoxPosition();
      this.recordHistorySnapshot();
    },

    // ---- Storage & Persistence ----
    saveElementStyle: function (el, prop, val) {
      const id = el.getAttribute('data-pvt-id') || el.id;
      if (!id) return;

      const styles = this.getSavedStyles();
      if (!styles[id]) styles[id] = {};
      if (val === '' || val === null) {
        delete styles[id][prop];
      } else {
        styles[id][prop] = val;
      }
      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(styles));
    },

    saveElementContent: function (el) {
      const id = el.getAttribute('data-pvt-id') || el.id;
      if (!id) return;

      const styles = this.getSavedStyles();
      if (!styles[id]) styles[id] = {};
      styles[id].textContent = el.textContent;
      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(styles));
    },

    getSavedStyles: function () {
      try {
        return JSON.parse(localStorage.getItem(BUILDER_STORAGE_KEY)) || {};
      } catch (e) {
        return {};
      }
    },

    applySavedStyles: function () {
      const styles = this.getSavedStyles();
      Object.entries(styles).forEach(([id, rules]) => {
        const el = document.querySelector(`[data-pvt-id="${id}"]`) || document.getElementById(id);
        if (!el) return;
        Object.entries(rules).forEach(([prop, val]) => {
          if (val === '' || val === null || val === undefined) return;
          if (prop === 'textContent') {
            // Only restore text on custom user-added elements, never on original HTML elements
            if (el.getAttribute('data-pvt-custom') === 'true' && !el.classList.contains('pvt-image-block') && el.tagName !== 'IMG') {
              el.textContent = val;
            }
          } else if (prop === 'innerHTML') {
            if (el.getAttribute('data-pvt-custom') === 'true') {
              el.innerHTML = val;
            }
          } else if (prop === 'src' && el.tagName === 'IMG') {
            el.src = val;
          } else if (prop === 'floorBackground') {
            el.style.setProperty('background', val, 'important');
            el.style.setProperty('background-color', val, 'important');
          } else if (prop === 'background') {
            el.style.setProperty('background', val, 'important');
            el.style.setProperty('background-color', val, 'important');
          } else if (prop === 'color') {
            const isContainer = ['SECTION','HEADER','FOOTER','MAIN','BODY'].includes(el.tagName);
            if (!isContainer) {
              el.style.color = val;
            }
          } else if (prop === 'data-pvt-group') {
            if (val) el.setAttribute('data-pvt-group', val);
            else el.removeAttribute('data-pvt-group');
          } else if (prop === 'backgroundImage') {
            el.style.backgroundImage = val;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
          } else if (prop === 'paddingTop' || prop === 'paddingBottom') {
            el.style[prop] = val;
          } else {
            el.style[prop] = val;
          }
        });
      });
    },

    saveAll: function () {
      // Save only explicit inline style overrides set by the builder (NOT a blind sweep of all DOM text)
      // Text content is only saved when user explicitly edits an element (via saveElementContent on blur)
      // This prevents stale/wrong text from clobbering HTML content on reload
      const allStyles = this.getSavedStyles();

      document.querySelectorAll('[data-pvt-id]').forEach(el => {
        const id = el.getAttribute('data-pvt-id');
        if (!id) return;

        if (!allStyles[id]) allStyles[id] = {};

        // Position / transform
        if (el.style.transform && el.style.transform !== 'none' && el.style.transform !== '') {
          allStyles[id].transform = el.style.transform;
        }
        // Font size
        if (el.style.fontSize) {
          allStyles[id].fontSize = el.style.fontSize;
        }
        // Width
        if (el.style.width) {
          allStyles[id].width = el.style.width;
          allStyles[id].maxWidth = el.style.maxWidth || el.style.width;
        }
        // Text color — only for non-container elements
        if (el.style.color && !['SECTION','HEADER','FOOTER','MAIN','BODY'].includes(el.tagName)) {
          allStyles[id].color = el.style.color;
        }
        // Floor background — check both inline background and stored floorBackground
        const bg = el.style.getPropertyValue('background') || el.style.backgroundColor;
        if (bg && (allStyles[id].floorBackground || ['SECTION','HEADER','FOOTER'].includes(el.tagName) || el.classList.contains('tape'))) {
          allStyles[id].floorBackground = bg;
        }
        // Opacity
        if (el.style.opacity) {
          allStyles[id].opacity = el.style.opacity;
        }
        // Font family
        if (el.style.fontFamily) {
          allStyles[id].fontFamily = el.style.fontFamily;
        }
        // Text align
        if (el.style.textAlign) {
          allStyles[id].textAlign = el.style.textAlign;
        }
        // Padding (section floors)
        if (el.style.paddingTop) allStyles[id].paddingTop = el.style.paddingTop;
        if (el.style.paddingBottom) allStyles[id].paddingBottom = el.style.paddingBottom;

        // Image src
        if (el.tagName === 'IMG' && el.src && !el.src.includes('/admin.html') && !el.src.includes('/index.html')) {
          allStyles[id].src = el.src;
        }

        // Custom added elements: save their content too
        if (el.getAttribute('data-pvt-custom') === 'true') {
          if (el.tagName === 'IMG') {
            allStyles[id].src = el.src;
          } else if (el.classList.contains('pvt-image-block')) {
            allStyles[id].innerHTML = el.innerHTML;
          } else if (['H1','H2','H3','H4','H5','H6','P','SPAN','A','STRONG'].includes(el.tagName)) {
            allStyles[id].textContent = el.textContent;
          }
        }

        // Clean up empty records
        if (Object.keys(allStyles[id]).length === 0) {
          delete allStyles[id];
        }
      });

      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(allStyles));
      this.saveCustomElements();

      if (window.PIIIVOT_CART) {
        window.PIIIVOT_CART.showToast('✅ All Changes Saved & Published!');
      } else {
        alert('All changes saved and published successfully!');
      }
    },

    resetAll: function () {
      if (confirm('Reset all positions, floor colors, uploaded images, custom elements, fonts, sizes, and colors?')) {
        localStorage.removeItem(BUILDER_STORAGE_KEY);
        localStorage.removeItem(CUSTOM_ELEMENTS_KEY);
        window.location.reload();
      }
    }
  };

  // Expose Globally
  window.PIIIVOT_BUILDER = Builder;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Builder.init());
  } else {
    Builder.init();
  }
})();
