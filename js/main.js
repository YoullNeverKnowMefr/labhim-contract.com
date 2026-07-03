(function () {
  'use strict';

  // ===== Tab Stack =====
  const stackView = document.getElementById('stackView');
  const tabRail = document.getElementById('tabRail');
  const panels = stackView ? Array.from(stackView.querySelectorAll('.stack-panel')) : [];
  let activeIndex = panels.findIndex(function (p) { return p.classList.contains('is-active'); });
  if (activeIndex < 0) activeIndex = 0;
  let isAnimating = false;

  function buildTabRail() {
    if (!tabRail) return;
    tabRail.innerHTML = '';
    panels.forEach(function (panel, index) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tab-rail__item' + (index === activeIndex ? ' is-active' : '');
      item.setAttribute('aria-label', panel.getAttribute('data-tab-label') || ('Раздел ' + (index + 1)));
      item.innerHTML =
        '<span class="tab-rail__item-num">' + (index + 1) + '</span>' +
        '<span class="tab-rail__item-label">' + (panel.getAttribute('data-tab-label') || '') + '</span>';
      item.addEventListener('click', function () {
        goToTab(index);
      });
      tabRail.appendChild(item);
    });
  }

  function updateNavState() {
    document.querySelectorAll('.nav__link[href^="#"]').forEach(function (link) {
      const id = link.getAttribute('href').slice(1);
      const idx = panels.findIndex(function (p) { return p.id === id; });
      link.classList.toggle('is-active', idx === activeIndex);
    });

    if (tabRail) {
      tabRail.querySelectorAll('.tab-rail__item').forEach(function (item, i) {
        item.classList.toggle('is-active', i === activeIndex);
      });
      const activeItem = tabRail.querySelector('.tab-rail__item.is-active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    }
  }

  const tabPrev = document.getElementById('tabPrev');
  const tabNext = document.getElementById('tabNext');
  const tabPrevLabel = document.getElementById('tabPrevLabel');
  const tabNextLabel = document.getElementById('tabNextLabel');
  const tabCurrent = document.getElementById('tabCurrent');

  function updateSwitcher() {
    const current = panels[activeIndex];
    const prev = panels[activeIndex - 1];
    const next = panels[activeIndex + 1];

    if (tabCurrent && current) {
      tabCurrent.textContent = (activeIndex + 1) + ' / ' + panels.length + ' — ' + (current.getAttribute('data-tab-label') || '');
    }
    if (tabPrevLabel) {
      tabPrevLabel.textContent = prev ? (prev.getAttribute('data-tab-label') || '') : '';
    }
    if (tabNextLabel) {
      tabNextLabel.textContent = next ? (next.getAttribute('data-tab-label') || '') : '';
    }
    if (tabPrev) tabPrev.disabled = !prev;
    if (tabNext) tabNext.disabled = !next;
  }

  function applyPanelStates(direction, prevIndex) {
    panels.forEach(function (panel, index) {
      panel.classList.remove(
        'is-active',
        'is-hidden',
        'is-leaving',
        'is-entering-down',
        'is-entering-up',
        'is-leaving-down',
        'is-leaving-up'
      );

      if (index === activeIndex) {
        panel.classList.add('is-active');
        if (direction === 'down') panel.classList.add('is-entering-down');
        if (direction === 'up') panel.classList.add('is-entering-up');
      } else if (typeof prevIndex === 'number' && index === prevIndex && direction) {
        panel.classList.add('is-leaving');
        if (direction === 'down') panel.classList.add('is-leaving-up');
        if (direction === 'up') panel.classList.add('is-leaving-down');
      } else {
        panel.classList.add('is-hidden');
      }
    });

    updateNavState();
    updateSwitcher();
    updatePanelBackground();
  }

  function goToTab(index, options) {
    options = options || {};
    if (!panels.length || isAnimating || index === activeIndex) return;
    if (index < 0 || index >= panels.length) return;

    const prevIndex = activeIndex;
    const direction = index > activeIndex ? 'down' : 'up';
    isAnimating = true;
    activeIndex = index;
    applyPanelStates(direction, prevIndex);

    const activePanel = panels[activeIndex];
    if (activePanel) activePanel.scrollTop = 0;

    window.setTimeout(function () {
      panels.forEach(function (panel) {
        panel.classList.remove(
          'is-entering-down',
          'is-entering-up',
          'is-leaving-down',
          'is-leaving-up',
          'is-leaving'
        );
        if (!panel.classList.contains('is-active')) {
          panel.classList.add('is-hidden');
        }
      });
      isAnimating = false;
    }, 520);

    if (options.updateHash !== false) {
      const id = panels[activeIndex].id;
      if (id) history.replaceState(null, '', '#' + id);
    }
  }

  function goToTabById(id, options) {
    const index = panels.findIndex(function (p) { return p.id === id; });
    if (index >= 0) goToTab(index, options);
  }

  function updatePanelBackground() {
    if (!stackView || !panels[activeIndex]) return;
    const bg = panels[activeIndex].getAttribute('data-bg');
    if (bg) {
      stackView.style.setProperty('--panel-bg', "url('" + bg + "')");
    }
  }

  function initWheelNavigation() {
    if (!stackView) return;

    let wheelLocked = false;
    const WHEEL_LOCK_MS = 700;
    const SCROLL_EDGE = 12;

    stackView.addEventListener('wheel', function (e) {
      if (isAnimating || wheelLocked) return;

      const panel = panels[activeIndex];
      if (!panel) return;

      const canScroll = panel.scrollHeight > panel.clientHeight + SCROLL_EDGE;
      const atTop = panel.scrollTop <= SCROLL_EDGE;
      const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - SCROLL_EDGE;

      let goNext = false;
      let goPrev = false;

      if (e.deltaY > 0) {
        goNext = !canScroll || atBottom;
      } else if (e.deltaY < 0) {
        goPrev = !canScroll || atTop;
      }

      if (goNext && activeIndex < panels.length - 1) {
        e.preventDefault();
        wheelLocked = true;
        goToTab(activeIndex + 1);
        window.setTimeout(function () { wheelLocked = false; }, WHEEL_LOCK_MS);
      } else if (goPrev && activeIndex > 0) {
        e.preventDefault();
        wheelLocked = true;
        goToTab(activeIndex - 1);
        window.setTimeout(function () { wheelLocked = false; }, WHEEL_LOCK_MS);
      }
    }, { passive: false });
  }

  if (panels.length) {
    buildTabRail();
    applyPanelStates(null, null);
    updatePanelBackground();
    initWheelNavigation();

    if (tabPrev) {
      tabPrev.addEventListener('click', function () {
        goToTab(activeIndex - 1);
      });
    }
    if (tabNext) {
      tabNext.addEventListener('click', function () {
        goToTab(activeIndex + 1);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToTab(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToTab(activeIndex - 1);
      }
    });

    const initialHash = window.location.hash.slice(1);
    if (initialHash) goToTabById(initialHash, { updateHash: false });
  }

  // Mobile menu
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });

    nav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header shadow on scroll (active panel only)
  const header = document.getElementById('header');
  if (header && panels.length) {
    function updateHeaderShadow() {
      const activePanel = panels[activeIndex];
      const scrolled = activePanel ? activePanel.scrollTop > 10 : false;
      header.style.boxShadow = scrolled ? '0 2px 20px rgba(15,23,42,0.08)' : 'none';
    }

    panels.forEach(function (panel) {
      panel.addEventListener('scroll', updateHeaderShadow, { passive: true });
    });

    updateHeaderShadow();
  } else if (header) {
    window.addEventListener('scroll', function () {
      header.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(15,23,42,0.08)' : 'none';
    }, { passive: true });
  }

  // Phone mask
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.startsWith('8')) value = '7' + value.slice(1);
      if (value.startsWith('7') || value.length > 0) {
        if (!value.startsWith('7')) value = '7' + value;
        let formatted = '+7';
        if (value.length > 1) formatted += ' (' + value.slice(1, 4);
        if (value.length > 4) formatted += ') ' + value.slice(4, 7);
        if (value.length > 7) formatted += '-' + value.slice(7, 9);
        if (value.length > 9) formatted += '-' + value.slice(9, 11);
        e.target.value = formatted;
      }
    });
  }

  // Analytics goals (Yandex.Metrika)
  function reachGoal(goal) {
    if (typeof ym === 'function') {
      // Replace XXXXXXXX with your counter ID
      // ym(XXXXXXXX, 'reachGoal', goal);
    }
    console.log('[Analytics]', goal);
  }

  document.querySelectorAll('[data-goal]').forEach(function (el) {
    el.addEventListener('click', function () {
      reachGoal(el.getAttribute('data-goal'));
    });
  });

  // Callback button
  const callbackBtn = document.getElementById('callbackBtn');
  if (callbackBtn) {
    callbackBtn.addEventListener('click', function () {
      reachGoal('callback_click');
      goToTabById('form');
      window.setTimeout(function () {
        const phone = document.getElementById('phone');
        if (phone) phone.focus();
      }, 620);
    });
  }

  // Form submission
  const form = document.getElementById('applicationForm');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let valid = true;
      const requiredFields = form.querySelectorAll('[required]');

      requiredFields.forEach(function (field) {
        if (field.type === 'checkbox') {
          if (!field.checked) {
            valid = false;
            field.closest('.checkbox-label').style.color = '#ef4444';
          } else {
            field.closest('.checkbox-label').style.color = '';
          }
        } else if (!field.value.trim()) {
          valid = false;
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
      });

      if (!valid) return;

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      reachGoal('form_submit');

      // Integration point: send to CRM, email, Telegram bot, etc.
      // Example with fetch:
      // fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

      console.log('[Form submission]', data);

      form.hidden = true;
      if (formSuccess) formSuccess.hidden = false;

      // Optional: send notification via mailto fallback
      // window.location.href = 'mailto:info@labhim-contract.ru?subject=Заявка с сайта&body=' + encodeURIComponent(JSON.stringify(data, null, 2));
    });

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        field.classList.remove('error');
      });
    });
  }

  // Tab navigation for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId || targetId === 'privacy' || targetId === 'offer') return;

      const targetPanel = panels.find(function (p) { return p.id === targetId; });
      if (targetPanel) {
        e.preventDefault();
        goToTabById(targetId);
      }
    });
  });
})();
