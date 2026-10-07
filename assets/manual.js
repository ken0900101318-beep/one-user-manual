// ONE 桌遊說明手冊 — 目錄、搜尋、主題、燈箱
(function () {
  const main = document.querySelector('.main');
  const nav = document.querySelector('.sidebar nav');
  const chapters = Array.from(document.querySelectorAll('section.chapter[id]'));

  // 側邊目錄：依 data-group 分組
  let lastGroup = null;
  chapters.forEach((sec) => {
    const group = sec.dataset.group;
    if (group && group !== lastGroup) {
      const g = document.createElement('div');
      g.className = 'group';
      g.textContent = group;
      nav.appendChild(g);
      lastGroup = group;
    }
    const h2 = sec.querySelector('h2');
    const a = document.createElement('a');
    a.href = '#' + sec.id;
    const num = h2.querySelector('.num');
    const title = h2.querySelector('.t') || h2;
    if (num) {
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = num.textContent;
      a.appendChild(n);
    }
    a.appendChild(document.createTextNode(title.textContent.trim()));
    if (sec.dataset.new) {
      const d = document.createElement('span');
      d.className = 'dot';
      d.title = '本次新增或改版';
      a.appendChild(d);
    }
    a.addEventListener('click', () => document.body.classList.remove('nav-open'));
    nav.appendChild(a);
  });
  const links = Array.from(nav.querySelectorAll('a'));

  // 目前章節高亮
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
        const act = nav.querySelector('a.active');
        if (act && window.innerWidth > 960) act.scrollIntoView({ block: 'nearest' });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  chapters.forEach((s) => io.observe(s));

  // 手機選單
  document.querySelector('.menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.querySelector('.backdrop').addEventListener('click', () => document.body.classList.remove('nav-open'));

  // 主題切換（只存在本機）
  const root = document.documentElement;
  const themeBtn = document.querySelector('.theme-btn');
  try { const t = localStorage.getItem('one-manual-theme'); if (t) root.dataset.theme = t; } catch (e) {}
  themeBtn.addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('one-manual-theme', root.dataset.theme); } catch (e) {}
  });

  // 搜尋（只用 textContent 建立節點，避免 XSS）
  const input = document.getElementById('q');
  const countBox = document.querySelector('.search .count');
  const countText = countBox.querySelector('span');
  let marks = [];
  let idx = 0;
  let timer;

  function clear() {
    marks.forEach((m) => { const p = m.parentNode; if (!p) return; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); });
    marks = [];
    idx = 0;
  }
  function focusMark(i) {
    marks.forEach((m) => m.classList.remove('current'));
    const m = marks[i];
    if (!m) return;
    m.classList.add('current');
    const d = m.closest('details');
    if (d) d.open = true;
    m.scrollIntoView({ block: 'center', behavior: 'smooth' });
    countText.textContent = (i + 1) + '/' + marks.length;
  }
  function run() {
    clear();
    const q = input.value.trim().toLowerCase();
    if (q.length < 1) { countBox.style.display = 'none'; return; }
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode.closest('script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const hits = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.toLowerCase().includes(q)) hits.push(walker.currentNode);
    hits.forEach((node) => {
      const text = node.nodeValue;
      const lower = text.toLowerCase();
      const frag = document.createDocumentFragment();
      let pos = 0;
      let at;
      while ((at = lower.indexOf(q, pos)) !== -1) {
        if (at > pos) frag.appendChild(document.createTextNode(text.slice(pos, at)));
        const m = document.createElement('mark');
        m.className = 'hl';
        m.textContent = text.slice(at, at + q.length);
        frag.appendChild(m);
        marks.push(m);
        pos = at + q.length;
      }
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    });
    countBox.style.display = 'flex';
    if (marks.length) focusMark(0); else countText.textContent = '0 筆';
  }
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 250); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && marks.length) { e.preventDefault(); idx = (idx + (e.shiftKey ? -1 : 1) + marks.length) % marks.length; focusMark(idx); }
    if (e.key === 'Escape') { input.value = ''; run(); }
  });
  countBox.querySelector('.prev').addEventListener('click', () => { if (!marks.length) return; idx = (idx - 1 + marks.length) % marks.length; focusMark(idx); });
  countBox.querySelector('.next').addEventListener('click', () => { if (!marks.length) return; idx = (idx + 1) % marks.length; focusMark(idx); });
  countBox.style.display = 'none';

  // 直接帶章節網址進來時，等圖片載完再對齊一次
  addEventListener('load', () => {
    const t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) t.scrollIntoView({ block: 'start', behavior: 'instant' });
  });

  // 回到頂部
  const top = document.querySelector('.to-top');
  addEventListener('scroll', () => top.classList.toggle('show', scrollY > 600), { passive: true });
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  // 截圖燈箱
  const lb = document.querySelector('.lightbox');
  const lbImg = lb.querySelector('img');
  document.querySelectorAll('figure.shot img').forEach((img) => img.addEventListener('click', () => { lbImg.src = img.src; lbImg.alt = img.alt; lb.classList.add('open'); }));
  lb.addEventListener('click', () => lb.classList.remove('open'));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('open'); });

  // 檢核表進度（只存在本機）
  document.querySelectorAll('.checklist input[type=checkbox]').forEach((cb, i) => {
    const key = 'one-manual-check-' + location.pathname + '-' + i;
    try { cb.checked = localStorage.getItem(key) === '1'; } catch (e) {}
    cb.addEventListener('change', () => { try { localStorage.setItem(key, cb.checked ? '1' : '0'); } catch (e) {} });
  });
})();
