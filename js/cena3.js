var CHAVE_ESTADO = 'cozinha_estado';
var DURACAO = 15 * 60;
var SENHA_SEGURANCA = '10';
var SENHA_CAIXA = '6075';
var EMULSAO = { meta: 10, largura: 24, graca: 1 };

var ITENS = {
  fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
  chave: { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Clique no painel do termostato para abri-lo.' },
  mapa: { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha: { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
  termometro: { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Leve para a Confeitaria e use no frasco de calda.' },
  yuzu: { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Leve para a Confeitaria e deixe descongelar no mármore frio.' },
  merengue: { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
  calda: { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' }
};

var PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
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
  termostatoAberto: false,
  caixaAberta: false,
  segurancaAberta: false,
  emulsaoPronta: false
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
var selecionado = null;
var aoFechar = null;

function fala(texto) {
  $('#mensagem').textContent = texto;
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
  var novo = [];
  for (var i = 0; i < estado.inventario.length; i++) {
    if (estado.inventario[i] !== id) novo.push(estado.inventario[i]);
  }
  estado.inventario = novo;
  salvar();
  renderInventario();
}

function clicarItem(id) {
  if (id === 'mapa') {
    selecionado = null;
    renderInventario();
    abrirMapa();
    return;
  }
  if (selecionado === id) {
    selecionado = null;
    fala('Item guardado.');
  } else {
    selecionado = id;
    fala(ITENS[id].nome + ': ' + ITENS[id].desc);
  }
  renderInventario();
}

function ligar(id, alvo, fn, usos) {
  var el = $(id);
  if (!el) return;
  el.onclick = function () {
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

function abrirMapa() {
  abrirModal('Mapa do Restaurante', `
    <div class="mapa">
      <div class="sala">1 · Despensa</div>
      <div class="sala">2 · Confeitaria e Fornos</div>
      <div class="sala atual">3 · Câmara Fria<br>(você está aqui)</div>
      <div class="sala">4 · Escritório do Chef</div>
      <div class="sala">5 · Pista Principal</div>
    </div>
    <p class="dica-modal">A porta de metal do freezer leva ao Escritório do Chef.</p>
  `);
}

function painelNumerico(titulo, intro, tam, completo, checar, sucesso, dica) {
  var codigo = '';
  var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  var botoesNum = '';
  for (var i = 0; i < nums.length; i++) {
    botoesNum += `<button type="button" data-n="${nums[i]}">${nums[i]}</button>`;
  }

  abrirModal(titulo, `
    <p>${intro}</p>
    <div class="visor" id="visor">${'-'.repeat(tam)}</div>
    <div class="teclado">
      ${botoesNum}
      <button type="button" data-a="limpar">C</button>
      <button type="button" data-n="0">0</button>
      <button type="button" data-a="ok">OK</button>
    </div>
    ${dica ? `<p class="dica-modal">${dica}</p>` : ''}
  `);

  var visor = $('#visor');
  function atualizar() {
    visor.textContent = (codigo + '-'.repeat(tam)).slice(0, tam);
  }

  modalCorpo.querySelector('.teclado').onclick = function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.n !== undefined) {
      if (codigo.length < tam) {
        codigo += b.dataset.n;
        atualizar();
      }
    } else if (b.dataset.a === 'limpar') {
      codigo = '';
      atualizar();
    } else if (b.dataset.a === 'ok') {
      if (completo ? codigo.length !== tam : codigo.length === 0) return;
      if (checar(codigo)) {
        sucesso();
      } else {
        estado.erros++;
        salvar();
        codigo = '';
        visor.classList.add('erro');
        visor.textContent = 'ERRO';
        setTimeout(function () {
          visor.classList.remove('erro');
          atualizar();
        }, 800);
      }
    }
  };
}

function abrirPoster() {
  abrirModal('Enigma das densidades', `
    <div class="papel">
      <p><strong>ENIGMA DAS DENSIDADES · Freezer</strong></p>
      <p>Massa (g) = Volume (mL) × Densidade (g/cm³).<br>Lembre: 1 cm³ = 1 mL.</p>
      <p><strong>Trava do freezer de frutas:</strong> massa do Recipiente #3 e massa do Recipiente #11, em gramas, nessa ordem, com 2 dígitos cada.</p>
      <p><strong>Bloqueio de segurança da porta:</strong> o freezer de conservação marca <strong>14 °F</strong>. Digite em °C, sem o sinal de menos.</p>
      <p>°C = (°F − 32) ÷ 1,8</p>
    </div>
  `);
}

function abrirRecipiente(numero) {
  var dados = numero === 3
    ? { conteudo: 'Calda de yuzu', dens: '1,2', vol: '50' }
    : { conteudo: 'Gelificante', dens: '1,5', vol: '50' };
  abrirModal('Recipiente #' + numero, `
    <div class="papel">
      <p><strong>RECIPIENTE #${numero}</strong></p>
      <p>Conteúdo: ${dados.conteudo}<br>Densidade: ${dados.dens} g/cm³<br>Volume: ${dados.vol} mL</p>
    </div>
    <p class="dica-modal">Massa = volume × densidade.</p>
  `);
}

function abrirSeguranca() {
  if (estado.segurancaAberta) {
    fala('O bloqueio de segurança já está liberado. A luz do teclado está verde.');
    return;
  }
  painelNumerico(
    'Bloqueio de segurança',
    'Digite a temperatura do freezer em °C (o visor mostra 14 °F).',
    3, false,
    function (c) {
      return c === SENHA_SEGURANCA;
    },
    function () {
      estado.segurancaAberta = true;
      estado.acertos++;
      salvar();
      $('#no-teclado').classList.add('aberta');
      fecharModal();
      fala('Bip! A luz do teclado ficou verde. A porta do freezer está liberada.');
    },
    'Dica: o cartaz da parede explica como converter °F em °C.'
  );
}

function abrirCaixa() {
  if (estado.caixaAberta) {
    fala('O freezer de frutas está vazio. Você já pegou o yuzu.');
    return;
  }
  painelNumerico(
    'Freezer de frutas raras',
    'Trava de balança de precisão. Digite 4 dígitos: a massa (g) do Recipiente #3 e a do Recipiente #11.',
    4, true,
    function (c) {
      return c === SENHA_CAIXA;
    },
    function () {
      estado.caixaAberta = true;
      estado.acertos++;
      salvar();
      addItem('yuzu');
      $('#no-caixa').classList.add('aberta');
      fecharModal();
      fala('Clique! O freezer abriu e você pegou a Fruta de Yuzu Congelada. Ela precisa descongelar na Confeitaria.');
    },
    'Dica: leia as etiquetas dos recipientes e use a fórmula do cartaz.'
  );
}

function abrirMisturador() {
  if (estado.emulsaoPronta) {
    fala('O creme já está em emulsão perfeita, guardado para o prato final.');
    return;
  }
  selecionado = null;
  renderInventario();
  abrirModal('Misturador de emulsão', `
    <p>Mantenha o indicador dentro da zona verde por <strong>${EMULSAO.meta} segundos</strong> sem deixar o creme cortar.</p>
    <div class="trilho" id="trilho">
      <div class="zona-em" id="zona-em"></div>
      <div class="marca" id="marca"></div>
    </div>
    <div class="progresso"><div class="progresso-barra" id="prog"></div></div>
    <div class="leitura" id="leitura-em">0.0 / ${EMULSAO.meta} s</div>
    <button type="button" class="btn-pixel" id="comecar">COMEÇAR</button>
    <p class="dica-modal" id="em-msg">Mova o mouse (ou o dedo) sobre a barra. Também funciona com as setas ← e →.</p>
  `);
  var trilho = $('#trilho');
  var zonaEl = $('#zona-em');
  var marca = $('#marca');
  var prog = $('#prog');
  var leit = $('#leitura-em');
  var msg = $('#em-msg');
  var btn = $('#comecar');
  var pos = 50, centro = 50, dentro = 0, fora = 0, raf = 0, ultimo = 0, t0 = 0;

  function desenhar() {
    zonaEl.style.left = (centro - EMULSAO.largura / 2) + '%';
    zonaEl.style.width = EMULSAO.largura + '%';
    marca.style.left = pos + '%';
    prog.style.width = Math.min(100, (dentro / EMULSAO.meta) * 100) + '%';
    leit.textContent = Math.min(dentro, EMULSAO.meta).toFixed(1) + ' / ' + EMULSAO.meta + ' s';
  }

  function moverPara(x) {
    var r = trilho.getBoundingClientRect();
    pos = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
  }

  trilho.onpointermove = function (e) {
    moverPara(e.clientX);
  };
  trilho.onpointerdown = function (e) {
    moverPara(e.clientX);
  };

  var prevKey = document.onkeydown;
  document.onkeydown = function (e) {
    if (prevKey) prevKey(e);
    if (e.key === 'ArrowLeft') {
      pos = Math.max(0, pos - 4);
      e.preventDefault();
    }
    if (e.key === 'ArrowRight') {
      pos = Math.min(100, pos + 4);
      e.preventDefault();
    }
  };
  aoFechar = function () {
    cancelAnimationFrame(raf);
    document.onkeydown = prevKey;
  };

  function quadro(agora) {
    var dt = Math.min(0.1, (agora - ultimo) / 1000);
    ultimo = agora;
    var t = (agora - t0) / 1000;
    centro = 50 + 30 * Math.sin(t * 0.8) + 8 * Math.sin(t * 2.1);
    centro = Math.max(EMULSAO.largura / 2, Math.min(100 - EMULSAO.largura / 2, centro));
    if (Math.abs(pos - centro) <= EMULSAO.largura / 2) {
      dentro += dt;
      fora = 0;
    } else {
      fora += dt;
    }
    desenhar();
    if (dentro >= EMULSAO.meta) {
      estado.emulsaoPronta = true;
      estado.acertos++;
      salvar();
      fecharModal();
      fala('Perfeito! A emulsão ficou lisa e brilhante, sem cortar. O creme está pronto para o prato final.');
      return;
    }
    if (fora > EMULSAO.graca) {
      estado.erros++;
      salvar();
      msg.textContent = 'O creme cortou! Fique dentro da zona verde. Tente de novo.';
      btn.textContent = 'TENTAR DE NOVO';
      btn.hidden = false;
      return;
    }
    raf = requestAnimationFrame(quadro);
  }

  btn.onclick = function () {
    dentro = 0;
    fora = 0;
    btn.hidden = true;
    msg.textContent = 'Siga a zona verde com o indicador vermelho!';
    t0 = performance.now();
    ultimo = t0;
    raf = requestAnimationFrame(quadro);
  };
  desenhar();
}

function usarChaveNoTermostato() {
  if (estado.termostatoAberto) {
    fala('O painel já está aberto.');
    return;
  }
  estado.termostatoAberto = true;
  salvar();
  removerItem('chave');
  selecionado = null;
  addItem('termometro');
  renderInventario();
  fala('Você soltou os parafusos e achou um Termômetro Digital escondido atrás do painel. Leve-o para a Confeitaria.');
}

function temChave() {
  for (var i = 0; i < estado.inventario.length; i++) {
    if (estado.inventario[i] === 'chave') return true;
  }
  return false;
}

function abrirTermostato() {
  if (estado.termostatoAberto) {
    fala('O painel do termostato está aberto e vazio.');
  } else if (temChave()) {
    usarChaveNoTermostato();
  } else {
    fala('Um painel de termostato preso por parafusos. Falta uma ferramenta para abrir. A chave de fenda está na Despensa.');
  }
}

function abrirPorta() {
  if (!estado.segurancaAberta) {
    abrirSeguranca();
    return;
  }
  var falta = [];
  if (!estado.caldaPronta) falta.push('a calda no ponto (use o termômetro no frasco da Confeitaria)');
  if (!estado.yuzuUsado) falta.push('o yuzu descongelando no mármore da Confeitaria');
  if (falta.length) {
    abrirModal('Porta do freezer', `
      <div class="papel">
        <p>Um bilhete do Chef está preso na porta:</p>
        <p>"Só passa quem já preparou tudo na Confeitaria."</p>
        <p>Ainda falta: ${falta.join(' e ')}.</p>
      </div>
      <a class="btn-pixel" href="cena2.html">← Voltar à Confeitaria</a>
    `);
    return;
  }
  abrirModal('Escritório do Chef', `
    <p>A porta do freezer se abre e um corredor leva ao Escritório do Chef Executivo.</p>
    <a class="btn-pixel" href="cena4.html">Entrar →</a>
  `);
}

ligar('#no-poster', 'Cartaz', abrirPoster);
ligar('#no-pote3a', 'Recipiente', function () { abrirRecipiente(3); });
ligar('#no-pote3b', 'Recipiente', function () { abrirRecipiente(3); });
ligar('#no-pote11', 'Recipiente', function () { abrirRecipiente(11); });
ligar('#no-teclado', 'Teclado', abrirSeguranca);
ligar('#no-porta', 'Porta', abrirPorta);
ligar('#no-caixa', 'Freezer', abrirCaixa);
ligar('#no-misturador', 'Misturador', abrirMisturador);
ligar('#no-termostato', 'Termostato', abrirTermostato, { chave: usarChaveNoTermostato });

ligar('#no-armario', 'Armário', function () { fala('Um armário de inox lacrado pelo gelo. Não abre.'); });
ligar('#no-geladeira-esq', 'Geladeira', function () { fala('Uma geladeira industrial cheia de caixas. A porta está congelada e não abre.'); });
ligar('#no-geladeira-meio', 'Geladeira', function () { fala('Uma geladeira de vidro com caixas de leite e manteiga. Nada de útil.'); });
ligar('#no-caixas-esq', 'Caixas', function () { fala('Caixas de papelão duras de tanto gelo.'); });
ligar('#no-caixas-dir', 'Caixas', function () { fala('Caixas congeladas no alto da prateleira. Nada de útil.'); });
ligar('#no-lampada', 'Lâmpada', function () { fala('A luz azulada da lâmpada deixa a sala ainda mais fria.'); });
ligar('#no-gelo', 'Gelo', function () { fala('Uma placa de gelo escorregadia no piso.'); });

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
  cron.textContent = formatar(restante);
  cron.classList.toggle('urgente', restante <= 60);
  if (restante <= 0) fimDeJogo();
}

var relogio = setInterval(tick, 1000);

if (estado.caixaAberta) $('#no-caixa').classList.add('aberta');
if (estado.segurancaAberta) $('#no-teclado').classList.add('aberta');
renderInventario();
tick();
fala('Câmara Fria. O ar está congelante.');