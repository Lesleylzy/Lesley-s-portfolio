/* shared EN / 中 toggle; the choice persists across pages */
(function () {
  const btn = document.getElementById('lang');
  let lang = localStorage.getItem('lang') || 'en';

  function apply() {
    document.documentElement.lang = lang === 'zh' ? 'zh' : 'en';
    if (btn) btn.textContent = lang === 'en' ? '中' : 'EN';
    document.querySelectorAll('[data-en]').forEach(el => {
      const v = el.dataset[lang];
      if (v !== undefined) el.textContent = v;
    });
  }

  if (btn) btn.addEventListener('click', () => {
    lang = lang === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', lang);
    apply();
  });

  apply();
})();
