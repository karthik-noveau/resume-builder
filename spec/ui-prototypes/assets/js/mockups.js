(function () {
(function () {
  var themeBtn = document.getElementById('themeToggleBtn');
  var themeLabel = document.getElementById('themeLabel');
  var isDark = false;
  themeBtn.addEventListener('click', function () {
    isDark = !isDark;
    document.querySelectorAll('.frame').forEach(function (f) {
      f.setAttribute('data-mockup-theme', isDark ? 'dark' : 'light');
    });
    themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
  });

  // Templates grid — clicking a card opens its full detail as an overlay
  // on top of the grid (the grid never disappears, so comparing options
  // stays possible after backing out of a preview). The overlay itself
  // has a switcher so you can jump straight to another template too.
  var tplCards = document.querySelectorAll('.tplGridCard');
  var tplPanels = document.querySelectorAll('.stagePanel');
  var tplModal = document.getElementById('tplModalOverlay');
  var tplCloseEls = document.querySelectorAll('[data-tpl-close]');
  var tplSwitchBtns = document.querySelectorAll('.tplSwitchBtn');

  function openTplModal(id) {
    tplPanels.forEach(function (p) { p.classList.toggle('active', p.dataset.tplPanel === id); });
    tplSwitchBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.tplSwitch === id); });
    tplModal.classList.add('open');
  }
  function closeTplModal() {
    tplModal.classList.remove('open');
  }

  tplCards.forEach(function (card) {
    card.addEventListener('click', function () { openTplModal(card.dataset.tplOpen); });
  });
  tplSwitchBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { openTplModal(btn.dataset.tplSwitch); });
  });
  tplCloseEls.forEach(function (el) { el.addEventListener('click', closeTplModal); });
  if (tplModal) tplModal.addEventListener('click', function (e) { if (e.target === tplModal) closeTplModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTplModal(); });

  // Templates grid — column-layout filter narrows which cards are visible.
  // Replaced the Fresher/Experienced facet: category is still readable on each
  // card, but column count is what actually changes how a resume parses.
  var tplCatBtns = document.querySelectorAll('.tplStudioCats .catBtn');
  tplCatBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tplCatBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.dataset.tplFilter;
      var shown = 0;
      tplCards.forEach(function (card) {
        var show = filter === 'all' || card.dataset.tplLayout === filter;
        card.style.display = show ? '' : 'none';
        if (show) shown++;
      });
      var count = document.querySelector('.tplStudioCats .resultCount');
      if (count) count.textContent = shown + (shown === 1 ? ' template' : ' templates');
    });
  });

  // Templates page action bar — nothing is selected on arrival, so the button
  // stays disabled until a card is picked.
  var actionBar = document.querySelector('.tplActionBar');
  if (actionBar) {
    var barTitle = actionBar.querySelector('.tplActionTitle');
    var barEffect = actionBar.querySelector('.tplActionEffect');
    var barBtn = actionBar.querySelector('.btn-primary');
    document.querySelectorAll('[data-tpl-select]').forEach(function (card) {
      card.addEventListener('click', function () {
        document.querySelectorAll('[data-tpl-select]').forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        barTitle.innerHTML = '<span class="tplActionName">' + card.dataset.tplSelect +
          '</span><span class="tplActionLayout">' + card.dataset.tplLayoutLabel + '</span>';
        barEffect.textContent = 'Starts a new resume';
        barBtn.removeAttribute('disabled');
      });
    });
  }

  // Template picker — select then confirm. Opened by "New Resume" on the
  // dashboard and by "Change template" in either editor.
  document.querySelectorAll('[data-picker-open]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var picker = document.getElementById(trigger.dataset.pickerOpen);
      if (picker) picker.classList.add('open');
    });
  });
  document.querySelectorAll('.pickerOverlay').forEach(function (overlay) {
    var confirmBtn = overlay.querySelector('[data-picker-confirm]');
    overlay.querySelectorAll('.pickerOption').forEach(function (opt) {
      opt.addEventListener('click', function () {
        overlay.querySelectorAll('.pickerOption').forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        if (confirmBtn) confirmBtn.removeAttribute('disabled');
      });
    });
    function closePicker() {
      overlay.classList.remove('open');
      overlay.querySelectorAll('.pickerOption').forEach(function (o) { o.classList.remove('selected'); });
      if (confirmBtn) confirmBtn.setAttribute('disabled', '');
    }
    overlay.querySelectorAll('[data-picker-close]').forEach(function (el) {
      el.addEventListener('click', closePicker);
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePicker(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePicker(); });
  });

  // Templates studio — swatch click sets the active accent within its panel
  document.querySelectorAll('.stageSwatches').forEach(function (group) {
    group.querySelectorAll('.swatch').forEach(function (sw) {
      sw.addEventListener('click', function () {
        group.querySelectorAll('.swatch').forEach(function (s) { s.classList.remove('active'); });
        sw.classList.add('active');
      });
    });
  });

  // Templates studio — font pairing click sets the active font within its panel
  document.querySelectorAll('.stageFontRow').forEach(function (group) {
    group.querySelectorAll('.stageFontBtn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('.stageFontBtn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  });

  // Full editor inspector — Content/Design tabs
  var inspectorTabs = document.querySelectorAll('.inspectorTab');
  var inspectorPanes = document.querySelectorAll('.inspectorPane');
  inspectorTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      inspectorTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var id = tab.dataset.inspectorTab;
      inspectorPanes.forEach(function (p) { p.classList.toggle('active', p.dataset.inspectorPane === id); });
    });
  });
  document.querySelectorAll('.designSwatchRow').forEach(function (group) {
    group.querySelectorAll('.designSwatch').forEach(function (sw) {
      sw.addEventListener('click', function () {
        group.querySelectorAll('.designSwatch').forEach(function (s) { s.classList.remove('active'); });
        sw.classList.add('active');
      });
    });
  });
  document.querySelectorAll('.spacingToggle').forEach(function (group) {
    group.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  });
})();
})();
