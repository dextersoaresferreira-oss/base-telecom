/* Transição entre Base Telecom (claro) e Base Security (escuro).
   Ao clicar no link da outra página, uma cortina cresce a partir do clique
   (escura indo para a Security, clara voltando para a Telecom) e a página nova
   revela o conteúdo. Sem JavaScript ou com "reduzir movimento", o link funciona normal. */
(function () {
  var DARK = '#060B16', LIGHT = '#F3F6FB', KEY = 'bt-tr';
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css =
    'html[data-bt-in]::before{content:"";position:fixed;inset:0;z-index:2147483647;pointer-events:none;opacity:1;transition:opacity .7s ease .05s}' +
    'html[data-bt-in="dark"]::before{background:' + DARK + '}' +
    'html[data-bt-in="light"]::before{background:' + LIGHT + '}' +
    'html[data-bt-go]::before{opacity:0}' +
    '@keyframes btUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' +
    'html[data-bt-in] section,html[data-bt-in] footer{animation:btUp .8s cubic-bezier(.2,.7,.2,1) both}' +
    '#bt-ov{position:fixed;inset:0;z-index:2147483647;pointer-events:all;' +
    'transition:clip-path .6s cubic-bezier(.7,0,.2,1)}' +
    '#bt-ov i{position:absolute;width:0;height:0}' +
    '@media (prefers-reduced-motion:reduce){html[data-bt-in]::before{transition:none;opacity:0}html[data-bt-in] section,html[data-bt-in] footer{animation:none}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // Chegada: a cortina já cobre a tela e some revelando a página
  var arrival = null;
  try { arrival = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}
  if ((arrival === 'dark' || arrival === 'light') && !reduce) {
    doc.setAttribute('data-bt-in', arrival);
    var reveal = function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { doc.setAttribute('data-bt-go', ''); });
      });
      setTimeout(function () {
        doc.removeAttribute('data-bt-in');
        doc.removeAttribute('data-bt-go');
      }, 1400);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal);
    else reveal();
    setTimeout(function () { doc.removeAttribute('data-bt-in'); doc.removeAttribute('data-bt-go'); }, 3000);
  }

  function pageOf(path) {
    var p = path.split('/').pop();
    if (p === 'seguranca.html' || p === 'seguranca') return 'security';
    if (p === '' || p === 'index.html') return 'telecom';
    return null;
  }

  // Saída: cortina cresce a partir do clique e depois navega
  document.addEventListener('click', function (ev) {
    if (reduce || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return; }
    if (url.origin !== location.origin && location.protocol !== 'file:') return;
    var from = pageOf(location.pathname), to = pageOf(url.pathname);
    if (!from || !to || from === to) return;

    ev.preventDefault();
    var dir = to === 'security' ? 'dark' : 'light';
    var r = a.getBoundingClientRect();
    var x = ev.clientX || r.left + r.width / 2, y = ev.clientY || r.top + r.height / 2;
    var radius = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 20;

    var ov = document.createElement('div');
    ov.id = 'bt-ov';
    ov.setAttribute('aria-hidden', 'true');
    ov.style.background = dir === 'dark' ? DARK : LIGHT;
    ov.style.clipPath = 'circle(0px at ' + x + 'px ' + y + 'px)';
    document.body.appendChild(ov);
    ov.getBoundingClientRect(); // força o início da animação
    ov.style.clipPath = 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)';

    try { sessionStorage.setItem(KEY, dir); } catch (e) {}
    var go = function () { location.href = url.href; };
    var done = false;
    var once = function () { if (!done) { done = true; go(); } };
    ov.addEventListener('transitionend', once);
    setTimeout(once, 750);
  });

  // Voltar pelo navegador: tira a cortina que ficou na tela
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var ov = document.getElementById('bt-ov');
    if (ov) ov.remove();
    doc.removeAttribute('data-bt-in');
    doc.removeAttribute('data-bt-go');
  });
})();
