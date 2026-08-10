/* ==========================================================================
   Scroll Motion Engine — samsunwebtasarim.com
   Advanced 3D Creative Motion Engine (No-Framework Vanilla JS)
   Features:
   1) Magnet physics hover effect (.btn-magnet)
   2) Dual-row scroll-driven Marquee showcase (.marquee-row)
   3) Character-by-character scroll text reveal (.char-reveal-paragraph)
   4) Sticky Stacking Project Cards scaling (.sticky-project-card)
   5) Staggered reveal & depth parallax IntersectionObserver
   ========================================================================== */

(function () {
  'use strict';

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ScrollMotion = {
    _parallaxItems: [],
    _marqueeRows: [],
    _charRevealParagraphs: [],
    _stickyCards: [],
    _magnetButtons: [],
    _ticking: false,

    init() {
      if (REDUCED_MOTION) {
        this._killAnimations();
        return;
      }

      this._setupReveal();
      this._setupParallax();
      this._setupMagnet();
      this._setupMarquee();
      this._setupCharReveal();
      this._setupStickyCards();
      this._bindEvents();

      // Initial pass
      this._updateScrollState();
    },

    _killAnimations() {
      document.querySelectorAll('[data-scroll]').forEach((el) => {
        el.classList.add('is-visible');
        el.style.transition = 'none';
      });
      document.querySelectorAll('.char-span').forEach((el) => {
        el.classList.add('is-lit');
      });
    },

    /* ==========================================================================
       1. STAGGERED REVEAL & PARALLAX
       ========================================================================== */
    _setupReveal() {
      document.querySelectorAll('[data-scroll-group]').forEach((group) => {
        const staggerMs = parseInt(group.dataset.scrollStagger || '80', 10);
        Array.from(group.children).forEach((child, i) => {
          child.style.setProperty('--scroll-delay', `${i * staggerMs}ms`);
          if (!child.hasAttribute('data-scroll')) {
            child.setAttribute('data-scroll', 'fade-up');
          }
        });
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target;
            const repeats = el.dataset.scrollOnce === 'false';
            if (entry.isIntersecting) {
              const delay = el.dataset.scrollDelay || el.style.getPropertyValue('--scroll-delay') || '0ms';
              el.style.transitionDelay = delay;
              el.classList.add('is-visible');
              if (!repeats) observer.unobserve(el);
            } else if (repeats) {
              el.classList.remove('is-visible');
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
      );

      document.querySelectorAll('[data-scroll]').forEach((el) => observer.observe(el));
    },

    _setupParallax() {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target;
            const existing = this._parallaxItems.find((p) => p.el === el);
            if (entry.isIntersecting && !existing) {
              this._parallaxItems.push({ el, speed: parseFloat(el.dataset.parallax) || 0.2 });
            } else if (!entry.isIntersecting && existing) {
              this._parallaxItems = this._parallaxItems.filter((p) => p.el !== el);
            }
          });
        },
        { rootMargin: '20% 0px 20% 0px' }
      );
      document.querySelectorAll('[data-parallax]').forEach((el) => io.observe(el));
    },

    /* ==========================================================================
       2. MAGNET HOVER ENGINE (.btn-magnet)
       ========================================================================== */
    _setupMagnet() {
      document.querySelectorAll('.btn-magnet').forEach((btn) => {
        const strength = parseFloat(btn.dataset.magnetStrength || '2.5');
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const deltaX = (e.clientX - centerX) / strength;
          const deltaY = (e.clientY - centerY) / strength;
          btn.style.transform = `translate3d(${deltaX.toFixed(2)}px, ${deltaY.toFixed(2)}px, 0px)`;
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translate3d(0px, 0px, 0px)';
        });
      });
    },

    /* ==========================================================================
       3. DUAL MARQUEE SCROLL ENGINE (.marquee-row)
       ========================================================================== */
    _setupMarquee() {
      const marqueeSec = document.querySelector('.marquee-section');
      if (!marqueeSec) return;

      const row1 = marqueeSec.querySelector('.marquee-row-1');
      const row2 = marqueeSec.querySelector('.marquee-row-2');
      if (row1 || row2) {
        this._marqueeRows = { container: marqueeSec, row1, row2 };
      }
    },

    _updateMarquee() {
      if (!this._marqueeRows.container) return;

      const { container, row1, row2 } = this._marqueeRows;
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;

      if (rect.bottom > 0 && rect.top < vh) {
        const scrollOffset = (vh - rect.top) * 0.28;
        if (row1) row1.style.transform = `translate3d(${scrollOffset.toFixed(2)}px, 0, 0)`;
        if (row2) row2.style.transform = `translate3d(-${(scrollOffset + 150).toFixed(2)}px, 0, 0)`;
      }
    },

    /* ==========================================================================
       4. CHARACTER-BY-CHARACTER SCROLL REVEAL ENGINE (.char-reveal-paragraph)
       ========================================================================== */
    _setupCharReveal() {
      document.querySelectorAll('.char-reveal-paragraph').forEach((paragraph) => {
        const rawText = paragraph.textContent.trim();
        paragraph.textContent = ''; // clear

        const spans = [];
        for (let i = 0; i < rawText.length; i++) {
          const char = rawText[i];
          const span = document.createElement('span');
          span.className = 'char-span';
          span.textContent = char === ' ' ? '\u00A0' : char; // preserve spaces
          paragraph.appendChild(span);
          spans.push(span);
        }

        this._charRevealParagraphs.push({ el: paragraph, spans });
      });
    },

    _updateCharReveal() {
      const vh = window.innerHeight;

      this._charRevealParagraphs.forEach(({ el, spans }) => {
        const rect = el.getBoundingClientRect();
        // Calculate reveal progress between top entering (0.85 vh) and top reaching 0.2 vh
        const startPoint = vh * 0.85;
        const endPoint = vh * 0.2;
        const totalDist = startPoint - endPoint;
        const currentPos = startPoint - rect.top;
        const rawProgress = currentPos / totalDist;
        const progress = Math.min(1, Math.max(0, rawProgress));

        const litCount = Math.floor(progress * spans.length);
        spans.forEach((span, i) => {
          if (i <= litCount) {
            span.classList.add('is-lit');
          } else {
            span.classList.remove('is-lit');
          }
        });
      });
    },

    /* ==========================================================================
       5. STICKY STACKING CARDS ENGINE (.sticky-project-card)
       ========================================================================== */
    _setupStickyCards() {
      const cards = Array.from(document.querySelectorAll('.sticky-project-card'));
      if (!cards.length) return;

      this._stickyCards = cards.map((card, index) => ({
        el: card,
        index,
        total: cards.length
      }));
    },

    _updateStickyCards() {
      if (!this._stickyCards.length) return;

      const vh = window.innerHeight;
      const stickyThreshold = 78;

      this._stickyCards.forEach(({ el, index, total }) => {
        const rect = el.getBoundingClientRect();
        // Check if card is stuck or being scrolled over by next cards
        if (rect.top <= stickyThreshold && index < total - 1) {
          const nextCard = this._stickyCards[index + 1].el;
          const nextRect = nextCard.getBoundingClientRect();
          const overlap = stickyThreshold - nextRect.top;
          if (overlap > 0) {
            const shrinkRatio = Math.min(1, overlap / (vh * 0.6));
            const targetScale = 1 - shrinkRatio * 0.05 - (total - 1 - index) * 0.02;
            el.style.transform = `scale(${targetScale.toFixed(3)})`;
            el.style.filter = `brightness(${(1 - shrinkRatio * 0.25).toFixed(2)})`;
          } else {
            el.style.transform = 'scale(1)';
            el.style.filter = 'brightness(1)';
          }
        } else {
          el.style.transform = 'scale(1)';
          el.style.filter = 'brightness(1)';
        }
      });
    },

    /* ==========================================================================
       6. EVENT BINDING & RAF TICKING
       ========================================================================== */
    _bindEvents() {
      window.addEventListener(
        'scroll',
        () => {
          if (!this._ticking) {
            window.requestAnimationFrame(() => {
              this._updateScrollState();
              this._ticking = false;
            });
            this._ticking = true;
          }
        },
        { passive: true }
      );

      window.addEventListener('resize', () => {
        this._updateScrollState();
      });
    },

    _updateScrollState() {
      // Parallax update
      const vh = window.innerHeight;
      this._parallaxItems.forEach(({ el, speed }) => {
        const rect = el.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - vh / 2;
        const y = (centerOffset * speed * -1).toFixed(2);
        el.style.setProperty('--parallax-y', `${y}px`);
      });

      this._updateMarquee();
      this._updateCharReveal();
      this._updateStickyCards();
    }
  };

  document.addEventListener('DOMContentLoaded', () => ScrollMotion.init());
  window.ScrollMotion = ScrollMotion;
})();
