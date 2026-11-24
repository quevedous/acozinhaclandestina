'use strict';

var CHAVE_ESTADO = 'cozinha_estado';
var DURACAO = 15 * 60;
var TEMPO_ESTAGIO = 5000;

var ESTAGIOS = {
  1: { min: 18, max: 34, nome: 'secar', corNome: 'Azul-Ciano (Chama Branda)', hex: '#2563eb' },
  2: { min: 64, max: 80, nome: 'dourar', corNome: 'Âmbar Dourado (Chama Média-Alta)', hex: '#d97706' }
};

var CALDA = { min: 100, max: 140, alvo: 118, tol: 3, vel: 28 };

var ITENS = {
  fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
  chave: { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Vai servir para abrir um painel na Câmara Fria.' },
  mapa: { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha: { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
  termometro: { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Selecione e clique no frasco de calda para medir o ponto.' },
  yuzu: { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Precisa descongelar aos poucos. O mármore frio ajuda.' },
  merengue: { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
  calda: { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' },
  papel_dica: { nome: 'Papel Enigma da Despensa', icone: '📜', desc: 'Um bilhete rasgado com o enigma para abrir a porta eletrônica. Clique para decifrar.' },
  chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑', desc: 'Chave obtida na bancada de frascos.' }
};

var PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  itemSelecionado: null,
  erros: 0,
  acertos: 0,
  chavePega: false,
  mapaPego: false,
  potesAbertos: false,
  portaAberta: false,
  fornoEtapa: 0,
  assadoEm: 0,
  merengue: false,
  caldaPronta: false,
  yuzuUsado: false,
  papelColetado: false
};

function carregarEstado() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ESTADO));
  } catch (e) {
    return null;
  }
}

var estado = Object.assign({}, PADRAO, carregarEstado() || {});

function salvar() {
  try {
    localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
  } catch (e) {}
}
salvar();

function $(s) {
  return document.querySelector(s);
}

var overlay = $('#modal-overlay');
var modalTitulo = $('#modal-titulo');
var modalCorpo = $('#modal-corpo');
var travado = false;
var selecionado = estado.itemSelecionado || null;
var aoFechar = null;

function sincronizarEstado() {
  var atual = carregarEstado();
  if (atual) {
    estado = Object.assign({}, estado, atual);
    selecionado = estado.itemSelecionado || null;
  }
}

window.onmessage = function (e) {
  if (e.data && e.data.tipo === 'ITEM_SELECIONADO') {
    selecionado = e.data.id;
    estado.itemSelecionado = e.data.id;
  }
};

function fala(texto) {
  var el = $('#mensagem');
  if (el) el.textContent = texto;
}

function abrirModal(titulo, html) {
  if (aoFechar) {
    aoFechar();
    aoFechar = null;
  }
  modalTitulo.textContent = titulo;
  modalCorpo.innerHTML = html;
  overlay.hidden = false;
}

function fecharModal() {
  if (travado) return;
  if (aoFechar) {
    aoFechar();
    aoFechar = null;
  }
  overlay.hidden = true;
  modalCorpo.innerHTML = '';
}

$('#modal-fechar').onclick = fecharModal;
overlay.onclick = function (e) {
  if (e.target === overlay) fecharModal();
};
document.onkeydown = function (e) {
  if (e.key === 'Escape') fecharModal();
  if ((e.key === 'h' || e.key === 'H') && overlay.hidden) $('#cena').classList.toggle('debug');
};

function renderInventario() {
  var barra = $('#inventory-bar');
  if (!barra) return;
  var html = '';
  for (var i = 0; i < 8; i++) {
    var id = estado.inventario[i];
    var item = ITENS[id];
    if (item) {
      var ativo = selecionado === id ? ' ativo' : '';
      html += `<button type="button" class="slot cheio${ativo}" title="${item.nome}" aria-label="${item.nome}" onclick="clicarItem('${id}')">${item.icone}</button>`;
    } else {
      html += '<div class="slot"></div>';
    }
  }
  barra.innerHTML = html;
}

function addItem(id) {
  sincronizarEstado();
  var existe = false;
  for (var i = 0; i < estado.inventario.length; i++) {
    if (estado.inventario[i] === id) {
      existe = true;
      break;
    }
  }
  if (!existe) estado.inventario.push(id);
  salvar();
  renderInventario();
}

function removerItem(id) {
  sincronizarEstado();
  var novo = [];
  for (var i = 0; i < estado.inventario.length; i++) {
    if (estado.inventario[i] !== id) novo.push(estado.inventario[i]);
  }
  estado.inventario = novo;
  if (selecionado === id) {
    selecionado = null;
    estado.itemSelecionado = null;
  }
  salvar();
  renderInventario();
}

function clicarItem(id) {
  if (id === 'mapa') {
    selecionado = null;
    estado.itemSelecionado = null;
    salvar();
    renderInventario();
    abrirMapa();
    return;
  }

  if (selecionado === id) {
    selecionado = null;
    estado.itemSelecionado = null;
    fala('Item guardado.');
  } else {
    selecionado = id;
    estado.itemSelecionado = id;
    fala(ITENS[id].nome + ': ' + ITENS[id].desc);
  }

  salvar();
  renderInventario();
}

function abrirEnigmaPapel() {
  abrirModal('Bilhete Enigma · Anotações', `
    <div class="papel">
      <p><strong>Anotações encontradas na despensa:</strong></p>
      <p>Os reagentes foram identificados apenas por suas composições de cor.</p>
      <p><strong>RGB (0, 0, 255)</strong></p>
      <p><strong>RGB (0, 255, 0)</strong></p>
      <p><strong>RGB (255, 165, 0)</strong></p>
      <p><strong>RGB (255, 0, 0)</strong></p>
      <p class="dica-modal">"A ordem correta está escondida nas cores."</p>
    </div>
  `);
}

function ligar(id, alvo, fn, usos) {
  var el = $(id);
  if (el) {
    el.onclick = function () {
      sincronizarEstado();
      if (selecionado) {
        if (usos && usos[selecionado]) {
          usos[selecionado]();
          return;
        }
        fala(ITENS[selecionado].nome + ' não funciona em: ' + alvo + '. Clique no item de novo para guardá-lo.');
        return;
      }
      fn();
    };
  }
}

function abrirMapa() {
  abrirModal('Mapa do Restaurante', `
    <div class="mapa">
      <div class="sala">1 · Despensa</div>
      <div class="sala atual">2 · Confeitaria e Fornos<br>(você está aqui)</div>
      <div class="sala">3 · Câmara Fria</div>
      <div class="sala">4 · Escritório do Chef</div>
      <div class="sala">5 · Pista Principal</div>
    </div>
    <p class="dica-modal">A porta de madeira à esquerda leva à Despensa. De lá, um alçapão leva à Câmara Fria.</p>
  `);
}

function abrirReceita() {
  abrirModal('Papel de receitas', `
    <div class="papel">
      <p><strong>Merengue Suíço da Casa</strong></p>
      <p>4 claras, 220 g de açúcar e uma pitada de sal. Bater em banho-maria até firmar.</p>
      <p><strong>Estágio 1 (Secar):</strong> exige <strong>Chama Azul-Ciano</strong> (calor suave).</p>
      <p><strong>Estágio 2 (Dourar):</strong> veja a cor no Cartaz da parede.</p>
      <p>"Não olhe números! O segredo do merengue perfeito está na cor da chama do queimador."</p>
    </div>
  `);
}

function abrirPoster() {
  abrirModal('Cartaz do merengue', `
    <div class="papel">
      <p><strong>MERENGUE · Espectro de Cozimento</strong></p>
      <p>O merengue perfeito é assado em dois estágios visuais:</p>
      <p><strong>1º Secar:</strong> <span class="amostra-cor" style="background:#2563eb"></span> Azul-Ciano</p>
      <p><strong>2º Dourar:</strong> <span class="amostra-cor" style="background:#d97706"></span> Âmbar Dourado</p>
    </div>
  `);
}

function abrirTabela() {
  abrirModal('Guia de Chamas', `
    <div class="papel">
      <p><strong>Escala Cromática do Queimador</strong></p>
      <table class="tabela-conv">
        <tr><th>Cor da Chama</th><th>Intensidade</th></tr>
        <tr><td><span class="amostra-cor" style="background:#2563eb"></span>Azul-Ciano</td><td>Baixa (Secagem)</td></tr>
        <tr><td><span class="amostra-cor" style="background:#10b981"></span>Verde-Esmeralda</td><td>Morna (Fermentação)</td></tr>
        <tr><td><span class="amostra-cor" style="background:#d97706"></span>Âmbar Dourado</td><td>Média-Alta (Caramelizar)</td></tr>
        <tr><td><span class="amostra-cor" style="background:#dc2626"></span>Vermelho-Brasa</td><td>Máxima (Queima rápido)</td></tr>
      </table>
    </div>
  `);
}

function calcularCorChama(val) {
  if (val < 18) return { nome: 'Azul Profundo (Muito Frio)', hex: '#1e3a8a' };
  if (val <= 34) return { nome: 'Azul-Ciano (Chama Branda)', hex: '#2563eb' };
  if (val < 64) return { nome: 'Verde-Esmeralda (Morna)', hex: '#10b981' };
  if (val <= 80) return { nome: 'Âmbar Dourado (Média-Alta)', hex: '#d97706' };
  return { nome: 'Vermelho-Brasa (Quente Demais!)', hex: '#dc2626' };
}

function abrirPainel(n) {
  var e = ESTAGIOS[n];
  var valorAtual = 50;
  var corInicial = calcularCorChama(valorAtual);

  abrirModal('Queimador · Estágio ' + n + ' (' + e.nome + ')', `
    <div class="display-forno">
      FORNO CONFEITARIA · ESTÁGIO ${n}<br>
      Ajuste o regulador de gás até atingir a cor indicada na receita.
    </div>
    <div class="visor-chama" id="visor-chama" style="background:${corInicial.hex}">
      ${corInicial.nome}
    </div>
    <input type="range" class="slider-pixel" id="slider-chama" min="0" max="100" value="${valorAtual}">
    <button type="button" class="btn-pixel" id="confirmar-chama">ACENDER QUEIMADOR</button>
    <p class="dica-modal" id="msg-forno">Arraste o controle para mudar a cor da chama.</p>
  `);

  var slider = $('#slider-chama');
  var visor = $('#visor-chama');

  slider.oninput = function () {
    valorAtual = Number(slider.value);
    var info = calcularCorChama(valorAtual);
    visor.style.backgroundColor = info.hex;
    visor.textContent = info.nome;
  };

  $('#confirmar-chama').onclick = function () {
    if (valorAtual >= e.min && valorAtual <= e.max) {
      estado.fornoEtapa = n === 1 ? 1 : 3;
      estado.assadoEm = Date.now() + TEMPO_ESTAGIO;
      estado.acertos++;
      salvar();
      atualizarForno();
      fecharModal();
      fala(n === 1
        ? 'Chama Azul-Ciano estabilizada! O merengue começou a secar no Estágio 1.'
        : 'Chama Âmbar Dourada estabilizada! O merengue está dourando no Estágio 2.');
    } else {
      estado.erros++;
      salvar();
      $('#msg-forno').textContent = 'Essa cor de chama vai estragar o ponto! Confira a Receita e o Cartaz.';
    }
  };
}

function abrirForno() {
  sincronizarEstado();
  var et = estado.fornoEtapa;
  if (et === 0) {
    abrirPainel(1);
    return;
  }
  if (et === 2) {
    abrirPainel(2);
    return;
  }
  if (et === 1 || et === 3) {
    var s = Math.max(1, Math.ceil((estado.assadoEm - Date.now()) / 1000));
    fala('O merengue ainda está assando. Faltam cerca de ' + s + ' segundos.');
    return;
  }
  if (et === 4) {
    estado.merengue = true;
    estado.fornoEtapa = 5;
    salvar();
    addItem('merengue');
    atualizarForno();
    fala('Você tirou o merengue do forno, dourado e firme!');
    return;
  }
  fala('O forno está vazio. O merengue já está no seu inventário.');
}

function atualizarForno() {
  var f = $('#no-forno');
  if (!f) return;
  var agora = Date.now();
  if (estado.fornoEtapa === 1 && agora >= estado.assadoEm) {
    estado.fornoEtapa = 2;
    salvar();
    fala('Ding! Estágio 1 concluído. Clique no forno para ajustar a chama do Estágio 2.');
  } else if (estado.fornoEtapa === 3 && agora >= estado.assadoEm) {
    estado.fornoEtapa = 4;
    salvar();
    fala('Ding! O merengue está dourado e pronto. Clique no forno para retirá-lo.');
  }
  f.classList.toggle('ligado', estado.fornoEtapa === 1 || estado.fornoEtapa === 3);
  f.classList.toggle('pronto', estado.fornoEtapa === 2 || estado.fornoEtapa === 4);
}

function abrirCalda() {
  if (estado.caldaPronta) {
    fala('A calda já está no ponto. Guarde-a para o prato final.');
    return;
  }
  selecionado = null;
  estado.itemSelecionado = null;
  salvar();
  renderInventario();
  var span = CALDA.max - CALDA.min;
  var zonaEsq = ((CALDA.alvo - CALDA.tol - CALDA.min) / span) * 100;
  var zonaLarg = ((2 * CALDA.tol) / span) * 100;
  abrirModal('Ponto da calda', `
    <p>Pare o termômetro no <strong>Ponto de Bola Mole: ${CALDA.alvo} °C</strong>.</p>
    <div class="termo">
      <div class="zona" style="left:${zonaEsq}%;width:${zonaLarg}%"></div>
      <div class="agulha" id="agulha"></div>
    </div>
    <div class="leitura" id="leitura">${CALDA.min.toFixed(1)} °C</div>
    <button type="button" class="btn-pixel" id="parar">PARAR</button>
    <p class="dica-modal" id="calda-msg">Clique em PARAR quando a agulha estiver na faixa verde.</p>
  `);
  var agulha = $('#agulha');
  var leitura = $('#leitura');
  var temp = CALDA.min;
  var t0 = performance.now();
  var raf = 0;

  function quadro(agora) {
    var d = ((agora - t0) / 1000) * CALDA.vel;
    var m = d % (2 * span);
    temp = CALDA.min + (m <= span ? m : 2 * span - m);
    if (agulha) agulha.style.left = (((temp - CALDA.min) / span) * 100) + '%';
    if (leitura) leitura.textContent = temp.toFixed(1) + ' °C';
    raf = requestAnimationFrame(quadro);
  }
  raf = requestAnimationFrame(quadro);
  aoFechar = function () {
    cancelAnimationFrame(raf);
  };

  $('#parar').onclick = function () {
    if (Math.abs(temp - CALDA.alvo) <= CALDA.tol) {
      estado.caldaPronta = true;
      estado.acertos++;
      salvar();
      addItem('calda');
      fecharModal();
      fala('Perfeito! A calda parou em ' + temp.toFixed(1) + ' °C.');
    } else {
      estado.erros++;
      salvar();
      $('#calda-msg').textContent = temp < CALDA.alvo
        ? 'Cedo demais: a calda ainda está rala (' + temp.toFixed(1) + ' °C).'
        : 'Passou do ponto (' + temp.toFixed(1) + ' °C).';
    }
  };
}

ligar('#no-receita', 'Receita', abrirReceita);
ligar('#no-poster', 'Cartaz', abrirPoster);
ligar('#no-tabela', 'Guia de Chamas', abrirTabela);
ligar('#no-forno', 'Forno', abrirForno);

ligar('#no-potes-meio', 'Potes de farinha', function () {
  window.location.href = 'farinhas.html';
});

function irParaDespensa() {
  selecionado = null;
  estado.itemSelecionado = null;
  salvar();
  window.location.href = 'bancada.html';
}

ligar('#no-porta', 'Porta', function () {
  irParaDespensa();
}, {
  chave_porta: function () {
    fala('A chave não serve nesta porta. O acesso à Câmara Fria é pelo alçapão da despensa.');
    setTimeout(irParaDespensa, 1200);
  }
});

function temTermometro() {
  for (var i = 0; i < estado.inventario.length; i++) {
    if (estado.inventario[i] === 'termometro') return true;
  }
  return false;
}

ligar('#no-calda', 'Frasco de calda', function () {
  if (estado.caldaPronta) {
    fala('A calda já está pronta e guardada.');
  } else if (temTermometro()) {
    fala('Selecione o termômetro digital no inventário e clique no frasco.');
  } else {
    fala('Um frasco de açúcar caramelizando. Falta um termômetro para acertar o ponto.');
  }
}, { termometro: abrirCalda });

ligar('#no-marmore', 'Bancada', function () {
  fala('O mármore está gelado. Serve para descongelar coisas devagar.');
}, {
  yuzu: function () {
    removerItem('yuzu');
    estado.yuzuUsado = true;
    salvar();
    fala('Você deixou o yuzu sobre o mármore frio para descongelar.');
  }
});

function avisoForno() {
  fala('Forno vazio e desligado.');
}
ligar('#no-forno2', 'Forno', avisoForno);
ligar('#no-forno3', 'Forno', avisoForno);
ligar('#no-forno4', 'Forno', avisoForno);

ligar('#no-janela', 'Janela', function () { fala('Uma janela com grades.'); });
ligar('#no-frasco', 'Alambique', function () { fala('Um alambique de vidro com líquido borbulhando.'); });
ligar('#no-extrato', 'Extrato', function () { fala('Garrafa de extrato.'); });
ligar('#no-yuzu', 'Yuzu', function () { fala('Pote de yuzu.'); });
ligar('#no-barril', 'Barril', function () { fala('Barril vazio.'); });
ligar('#no-caixote', 'Caixote', function () { fala('Caixote com potes vazios.'); });
ligar('#no-prateleira', 'Prateleira', function () { fala('Potes de ingredientes.'); });
ligar('#no-panelas', 'Panelas', function () { fala('Panelas empilhadas.'); });
ligar('#no-bicos', 'Bicos', function () { fala('Bicos de confeitar.'); });
ligar('#no-batedeira', 'Batedeira', function () { fala('Batedeira industrial.'); });
ligar('#no-prancheta', 'Prancheta', function () { fala('Prancheta com anotações de produção.'); });

function formatar(seg) {
  var m = String(Math.floor(seg / 60)).padStart(2, '0');
  var s = String(seg % 60).padStart(2, '0');
  return m + ':' + s;
}

function fimDeJogo() {
  clearInterval(relogio);
  travado = true;
  try {
    localStorage.removeItem(CHAVE_ESTADO);
  } catch (e) {}
  abrirModal('FORA DO TEMPO!', `
    <p>O concurso começou sem você.</p>
    <a class="btn-pixel" href="../index.html">Voltar ao menu</a>
  `);
}

function tick() {
  var restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  var cron = $('#cronometro');
  if (cron) {
    cron.textContent = formatar(restante);
    cron.classList.toggle('urgente', restante <= 60);
  }
  atualizarForno();
  if (restante <= 0) fimDeJogo();
}

var relogio = setInterval(tick, 1000);

renderInventario();
tick();
fala('Estação de Confeitaria. O merengue está no forno de cima.');