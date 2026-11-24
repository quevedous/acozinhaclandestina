(function () {
  'use strict';

  var header = document.getElementById('header-bar');
  if (!header) return;

  var CHAVE_ESTADO = 'cozinha_estado';
  var CHAVE_HUD = 'cozinha_hud';

  var ITENS = {
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
    papel_dica: { nome: 'Bilhete Enigma', icone: '📜', desc: 'Sequência: Azul → Verde → Laranja → Vermelho.' },
    chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑', desc: 'Abre a porta da despensa trancada.' }
  };

  var HUD_PADRAO = {
    dicaAtual: 'Explore o cenário e clique nos objetos para investigar.',
    diario: ['Início da prova: 15 minutos para preparar e entregar o Bolo Clandestino.']
  };

  function ler(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave));
    } catch (e) {
      return null;
    }
  }

  function lerHud() {
    return Object.assign({}, HUD_PADRAO, ler(CHAVE_HUD) || {});
  }

  function salvarHud(hud) {
    try {
      localStorage.setItem(CHAVE_HUD, JSON.stringify(hud));
    } catch (e) {}
  }

  function inventario() {
    var est = ler(CHAVE_ESTADO);
    return (est && Array.isArray(est.inventario)) ? est.inventario : [];
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  document.body.classList.add('hud');

  var cena = document.querySelector('.cena, .escopo');
  if (cena) {
    var m = String(getComputedStyle(cena).aspectRatio || '').match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if (m && Number(m[2])) {
      document.body.style.setProperty('--prop', (Number(m[1]) / Number(m[2])).toFixed(4));
    }
  }

  var links = header.querySelectorAll('a.voltar');
  var linksVoltar = '';
  for (var i = 0; i < links.length; i++) {
    links[i].classList.add('aba');
    if (i === 0) links[i].classList.add('aba-menu');
    linksVoltar += links[i].outerHTML;
  }

  var grupo = header.querySelector('.grupo-esq');
  if (grupo) grupo.remove();

  var abasTexto = window.HUD_ABAS || {};
  var nomesAbas = { 'como-jogar': 'Como jogar', 'historia': 'História', 'desenvolvedores': 'Desenvolvedores' };
  var chavesAbas = Object.keys(abasTexto);
  var botoesAbasHtml = '';
  for (var j = 0; j < chavesAbas.length; j++) {
    var idAba = chavesAbas[j];
    var rotulo = nomesAbas[idAba] || abasTexto[idAba].titulo;
    botoesAbasHtml += `<button class="aba" type="button" data-aba="${idAba}">${rotulo}</button>`;
  }

  header.insertAdjacentHTML('afterbegin', `<nav class="abas" aria-label="Menu do jogo">${linksVoltar}${botoesAbasHtml}</nav>`);
  var nav = header.querySelector('nav.abas');

  var inv = document.getElementById('inventory-bar');
  if (inv) header.appendChild(inv);

  header.insertAdjacentHTML('beforeend', `
    <div class="hud-controles" id="hud-controles">
      <button class="btn-hud" type="button" id="btn-diario">📖 Diário</button>
      <button class="btn-hud" type="button" id="btn-tela-cheia" title="Tela cheia" aria-label="Tela cheia">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      </button>
    </div>
  `);

  var controles = document.getElementById('hud-controles');
  var cron = document.getElementById('cronometro');
  if (cron) controles.appendChild(cron);

  document.body.insertAdjacentHTML('beforeend', `
    <div id="modal-diario" hidden>
      <div class="hud-janela" role="dialog" aria-modal="true" aria-labelledby="diario-titulo">
        <div class="hud-janela-topo">
          <h2 id="diario-titulo">📖 DIÁRIO DE BORDO</h2>
          <button class="hud-fechar" id="diario-fechar" type="button" aria-label="Fechar">X</button>
        </div>
        <div class="hud-janela-corpo" id="diario-corpo"></div>
      </div>
    </div>
    <div id="modal-aba" hidden>
      <div class="hud-janela" role="dialog" aria-modal="true" aria-labelledby="aba-titulo">
        <div class="hud-janela-topo">
          <h2 id="aba-titulo"></h2>
          <button class="hud-fechar" id="aba-fechar" type="button" aria-label="Fechar">X</button>
        </div>
        <div class="hud-janela-corpo conteudo-aba" id="aba-corpo"></div>
      </div>
    </div>
  `);

  var modalDiario = document.getElementById('modal-diario');
  var modalAba = document.getElementById('modal-aba');
  var botoesAba = nav.querySelectorAll('.aba[data-aba]');

  function marcarAba(id) {
    for (var k = 0; k < botoesAba.length; k++) {
      botoesAba[k].classList.toggle('ativa', botoesAba[k].dataset.aba === id);
    }
  }

  function abrirAba(id) {
    var aba = abasTexto[id];
    if (!aba) return;
    modalAba.querySelector('h2').textContent = aba.titulo;
    var corpo = modalAba.querySelector('.hud-janela-corpo');
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
    var hud = lerHud();
    var itens = inventario();
    var listaItens = '';

    if (itens.length > 0) {
      for (var i = 0; i < itens.length; i++) {
        var id = itens[i];
        var icone = ITENS[id] ? ITENS[id].icone : '📦';
        var nome = esc(ITENS[id] ? ITENS[id].nome : id);
        var desc = esc(ITENS[id] ? ITENS[id].desc : '');
        listaItens += `<li>${icone} <strong>${nome}:</strong> ${desc}</li>`;
      }
    } else {
      listaItens = '<li>Nenhum item coletado ainda.</li>';
    }

    var notas = hud.diario || [];
    var listaNotas = '';
    for (var j = notas.length - 1; j >= 0; j--) {
      listaNotas += `<li>• ${esc(notas[j])}</li>`;
    }

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

  for (var b = 0; b < botoesAba.length; b++) {
    botoesAba[b].onclick = function () {
      if (!modalAba.hidden && this.classList.contains('ativa')) {
        fecharAba();
        return;
      }
      modalDiario.hidden = true;
      abrirAba(this.dataset.aba);
    };
  }

  document.getElementById('btn-diario').onclick = function () {
    if (!modalAba.hidden) fecharAba();
    abrirDiario();
  };
  document.getElementById('diario-fechar').onclick = function () {
    modalDiario.hidden = true;
  };
  document.getElementById('aba-fechar').onclick = fecharAba;
  modalDiario.onclick = function (e) {
    if (e.target === modalDiario) modalDiario.hidden = true;
  };
  modalAba.onclick = function (e) {
    if (e.target === modalAba) fecharAba();
  };

  var prevKey = document.onkeydown;
  document.onkeydown = function (e) {
    if (prevKey) prevKey(e);
    if (e.key !== 'Escape') return;
    if (!modalAba.hidden) fecharAba();
    if (!modalDiario.hidden) modalDiario.hidden = true;
  };

  var btnTela = document.getElementById('btn-tela-cheia');
  btnTela.onclick = function () {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
  };
  document.onfullscreenchange = function () {
    btnTela.title = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
    btnTela.setAttribute('aria-label', btnTela.title);
  };

  function registrarDiario(nota) {
    if (!nota) return;
    var hud = lerHud();
    var existe = false;
    for (var i = 0; i < hud.diario.length; i++) {
      if (hud.diario[i] === nota) {
        existe = true;
        break;
      }
    }
    if (!existe) {
      hud.diario.push(nota);
      salvarHud(hud);
    }
  }

  function atualizarDica(texto) {
    if (!texto) return;
    var hud = lerHud();
    hud.dicaAtual = texto;
    salvarHud(hud);
  }

  var msg = document.getElementById('mensagem');
  var timerMsg = null;

  function mostrarMensagem() {
    if (!msg) return;
    msg.classList.add('visivel');
    clearTimeout(timerMsg);
    timerMsg = setTimeout(function () {
      msg.classList.remove('visivel');
    }, 9000);
  }

  if (msg) {
    var inicial = msg.textContent.trim();
    if (inicial) {
      atualizarDica(inicial);
      mostrarMensagem();
    }

    new MutationObserver(function () {
      var txt = msg.textContent.trim();
      if (!txt) return;
      atualizarDica(txt);
      registrarDiario(txt);
      mostrarMensagem();
    }).observe(msg, { childList: true, characterData: true, subtree: true });
  }

  var ultimoInv = inventario().slice();
  salvarHud(lerHud());

  setInterval(function () {
    var atual = inventario();
    for (var i = 0; i < atual.length; i++) {
      var id = atual[i];
      var estavaAntes = false;
      for (var j = 0; j < ultimoInv.length; j++) {
        if (ultimoInv[j] === id) {
          estavaAntes = true;
          break;
        }
      }
      if (!estavaAntes) {
        registrarDiario('Coletou: ' + (ITENS[id] ? ITENS[id].nome : id));
      }
    }
    ultimoInv = atual.slice();
  }, 300);
})();