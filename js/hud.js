/* ==================================================================
   HUD DAS CENAS: barra preta do topo + Diário + abas + tela cheia.

   Como usar: no fim do <body> de cada cena (menos a cena 5), depois
   dos scripts da própria cena:

     <link rel="stylesheet" href="../css/hud.css">      (no <head>)
     <script src="../js/abas.js"></script>
     <script src="../js/hud.js"></script>

   O script reaproveita os elementos que a cena já tem (#header-bar,
   #inventory-bar, #cronometro, #mensagem), então a lógica de cada
   cena continua funcionando sem mudanças.

   Tudo fica dentro de uma função para não colidir com as constantes
   (ITENS, estado, $ ...) dos scripts das cenas.
================================================================== */
(function () {
  'use strict';

  const header = document.getElementById('header-bar');
  if (!header) return;

  const CHAVE_ESTADO = 'cozinha_estado';   // estado do jogo (as cenas escrevem)
  const CHAVE_HUD = 'cozinha_hud';         // diário e dica (só o HUD escreve)

  const ITENS = {
    chave: { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Serve para abrir painéis parafusados.' },
    mapa: { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Planta baixa da cozinha clandestina.' },
    baunilha: { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Essência aromática rara para a massa.' },
    termometro: { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Mede a temperatura exata da calda.' },
    yuzu: { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Ingrediente criogênico final do bolo.' },
    merengue: { nome: 'Merengue Assado', icone: '🍥', desc: 'Base crocante assada no ponto.' },
    calda: { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda dourada brilhante.' },
        fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
    livro: { nome: 'Livro Restaurado', icone: '📖', desc: 'Receita completa do Bolo Clandestino.' },
    chavemestra: { nome: 'Chave Mestra', icone: '🗝️', desc: 'Abre portas trancadas do salão.' },
    especiarias: { nome: 'Especiarias Raras', icone: '🧂', desc: 'Tempero especial dos jurados.' },
    papel_dica: { nome: 'Bilhete Enigma', icone: '📜', desc: 'Sequência: Azul  Verde → Laranja → Vermelho.' },
    chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑', desc: 'Abre a porta da despensa trancada.' }
  };

  if (window.ItensFoto) ItensFoto.completar(ITENS);

  const HUD_PADRAO = {
    dicaAtual: 'Explore o cenário e clique nos objetos para investigar.',
    diario: ['Início da prova: 15 minutos para preparar e entregar o Bolo Clandestino.']
  };

  /* ---------- armazenamento ---------- */
  function ler(chave) {
    try { return JSON.parse(sessionStorage.getItem(chave)); } catch (e) { return null; }
  }

  function lerHud() {
    return Object.assign({}, HUD_PADRAO, ler(CHAVE_HUD) || {});
  }

  function salvarHud(hud) {
    try { sessionStorage.setItem(CHAVE_HUD, JSON.stringify(hud)); } catch (e) {}
  }

  function inventario() {
    const est = ler(CHAVE_ESTADO);
    return (est && Array.isArray(est.inventario)) ? est.inventario : [];
  }

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function el(tag, classe, attrs) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  /* ---------- monta a barra ---------- */
  document.body.classList.add('hud');

  // proporção do cenário (1408/768, 16/9...) para caber na altura da janela
  const cena = document.querySelector('.cena, .escopo');
  if (cena) {
    const m = String(getComputedStyle(cena).aspectRatio || '').match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if (m && Number(m[2])) document.body.style.setProperty('--prop', (Number(m[1]) / Number(m[2])).toFixed(4));
  }

  const nav = el('nav', 'abas', { 'aria-label': 'Menu do jogo' });
  header.querySelectorAll('a.voltar').forEach((a, i) => {
    a.classList.add('aba');
    if (i === 0) a.classList.add('aba-menu');
    nav.appendChild(a);
  });
  const grupo = header.querySelector('.grupo-esq');
  if (grupo) grupo.remove();

  const abasTexto = window.HUD_ABAS || {};
  Object.keys(abasTexto).forEach((id) => {
    const b = el('button', 'aba', { type: 'button', 'data-aba': id });
    b.textContent = { 'como-jogar': 'Como jogar', 'historia': 'História', 'desenvolvedores': 'Desenvolvedores' }[id] || abasTexto[id].titulo;
    nav.appendChild(b);
  });
  header.insertBefore(nav, header.firstChild);

  const inv = document.getElementById('inventory-bar');
  if (inv) header.appendChild(inv);

  const controles = el('div', 'hud-controles');
  const btnDiario = el('button', 'btn-hud', { type: 'button', id: 'btn-diario' });
  btnDiario.textContent = '📖 Diário';
  const btnTela = el('button', 'btn-hud', { type: 'button', id: 'btn-tela-cheia', title: 'Tela cheia', 'aria-label': 'Tela cheia' });
  btnTela.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  controles.append(btnDiario, btnTela);
  const cron = document.getElementById('cronometro');
  if (cron) controles.appendChild(cron);
  header.appendChild(controles);

  /* ---------- janelas ---------- */
  function criarJanela(id, tituloId, fecharId) {
    const wrap = el('div', '', { id });
    wrap.hidden = true;
    wrap.innerHTML = `
      <div class="hud-janela" role="dialog" aria-modal="true" aria-labelledby="${tituloId}">
        <div class="hud-janela-topo">
          <h2 id="${tituloId}"></h2>
          <button class="hud-fechar" id="${fecharId}" type="button" aria-label="Fechar">X</button>
        </div>
        <div class="hud-janela-corpo"></div>
      </div>`;
    document.body.appendChild(wrap);
    return wrap;
  }

  const modalDiario = criarJanela('modal-diario', 'diario-titulo', 'diario-fechar');
  const modalAba = criarJanela('modal-aba', 'aba-titulo', 'aba-fechar');
  modalDiario.querySelector('h2').textContent = '📖 DIÁRIO DE BORDO';
  modalDiario.querySelector('.hud-janela-corpo').id = 'diario-corpo';
  modalAba.querySelector('.hud-janela-corpo').id = 'aba-corpo';
  modalAba.querySelector('.hud-janela-corpo').classList.add('conteudo-aba');

  const botoesAba = nav.querySelectorAll('.aba[data-aba]');
  const marcarAba = (id) => botoesAba.forEach((b) => b.classList.toggle('ativa', b.dataset.aba === id));

  function abrirAba(id) {
    const aba = abasTexto[id];
    if (!aba) return;
    modalAba.querySelector('h2').textContent = aba.titulo;
    const corpo = modalAba.querySelector('.hud-janela-corpo');
    corpo.innerHTML = aba.html;
    corpo.scrollTop = 0;
    modalAba.hidden = false;
    marcarAba(id);
  }

  function fecharAba() {
    modalAba.hidden = true;
    marcarAba(null);
  }

  function abrirDiario() {
    const hud = lerHud();
    const itens = inventario();

    const listaItens = itens.length
      ? itens.map((id) => `<li>${window.ItensFoto ? ItensFoto.html(id, ITENS[id] ? ITENS[id].icone : '📦') : (ITENS[id] ? ITENS[id].icone : '📦')} <strong>${esc(ITENS[id] ? ITENS[id].nome : id)}:</strong> ${esc(ITENS[id] ? ITENS[id].desc : '')}</li>`).join('')
      : '<li>Nenhum item coletado ainda.</li>';

    const listaNotas = (hud.diario || []).slice().reverse().map((n) => `<li>• ${esc(n)}</li>`).join('');

    document.getElementById('diario-corpo').innerHTML = `
      <div class="diario-secao">
        <h3>OBJETIVO ATUAL</h3>
        <p>${esc(hud.dicaAtual)}</p>
      </div>
      <div class="diario-secao">
        <h3>ITENS E PISTAS COLETADAS</h3>
        <ul class="diario-lista">${listaItens}</ul>
      </div>
      <div class="diario-secao">
        <h3>REGISTRO DE EVENTOS</h3>
        <ul class="diario-lista">${listaNotas}</ul>
      </div>`;
    modalDiario.hidden = false;
  }

  botoesAba.forEach((b) => {
    b.addEventListener('click', () => {
      if (!modalAba.hidden && b.classList.contains('ativa')) { fecharAba(); return; }
      modalDiario.hidden = true;
      abrirAba(b.dataset.aba);
    });
  });

  btnDiario.addEventListener('click', () => {
    if (!modalAba.hidden) fecharAba();
    abrirDiario();
  });
  document.getElementById('diario-fechar').addEventListener('click', () => { modalDiario.hidden = true; });
  document.getElementById('aba-fechar').addEventListener('click', fecharAba);
  modalDiario.addEventListener('click', (e) => { if (e.target === modalDiario) modalDiario.hidden = true; });
  modalAba.addEventListener('click', (e) => { if (e.target === modalAba) fecharAba(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modalAba.hidden) fecharAba();
    if (!modalDiario.hidden) modalDiario.hidden = true;
  });

  btnTela.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  });
  document.addEventListener('fullscreenchange', () => {
    btnTela.title = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
    btnTela.setAttribute('aria-label', btnTela.title);
  });

  /* ---------- diário e dica: acompanha a mensagem da cena ---------- */
  function registrarDiario(nota) {
    if (!nota) return;
    const hud = lerHud();
    if (!hud.diario.includes(nota)) {
      hud.diario.push(nota);
      salvarHud(hud);
    }
  }

  function atualizarDica(texto) {
    if (!texto) return;
    const hud = lerHud();
    hud.dicaAtual = texto;
    salvarHud(hud);
  }

  const msg = document.getElementById('mensagem');
  let timerMsg = null;

  function mostrarMensagem() {
    if (!msg) return;
    msg.classList.add('visivel');
    clearTimeout(timerMsg);
    timerMsg = setTimeout(() => msg.classList.remove('visivel'), 9000);
  }

  if (msg) {
    const inicial = msg.textContent.trim();
    if (inicial) { atualizarDica(inicial); mostrarMensagem(); }

    new MutationObserver(() => {
      const txt = msg.textContent.trim();
      if (!txt) return;
      atualizarDica(txt);
      registrarDiario(txt);
      mostrarMensagem();
    }).observe(msg, { childList: true, characterData: true, subtree: true });
  }

  // anota "Coletou: ..." quando um item novo entra no inventário
  let ultimoInv = inventario().slice();
  salvarHud(lerHud());   // garante que o diário exista desde a primeira cena

  setInterval(() => {
    const atual = inventario();
    atual.filter((id) => !ultimoInv.includes(id))
      .forEach((id) => registrarDiario(`Coletou: ${ITENS[id] ? ITENS[id].nome : id}`));
    ultimoInv = atual.slice();
  }, 300);
})();