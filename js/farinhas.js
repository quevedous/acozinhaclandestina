var CHAVE_ESTADO = 'cozinha_estado';
var DURACAO = 15 * 60;

var ITENS = {
  fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
  papel_dica: { nome: 'Bilhete Enigma', icone: '📜', desc: 'Um bilhete antigo com códigos RGB dos reagentes. Clique para ler.' }
};

var PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  papelColetado: false,
  portaAberta: false,
  frascosAtuais: ['laranja', 'azul', 'vermelho', 'verde']
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

var escopo = $('#escopo');
var overlay = $('#modal-overlay');
var modalTitulo = $('#modal-titulo');
var modalCorpo = $('#modal-corpo');
var selecionado = null;
var travado = false;
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

var tempoInicio = setInterval(function () {
  var restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  var cron = $('#cronometro');
  if (cron) {
    var m = String(Math.floor(restante / 60)).padStart(2, '0');
    var s = String(restante % 60).padStart(2, '0');
    cron.textContent = m + ':' + s;
    cron.classList.toggle('urgente', restante <= 60);
  }
  if (restante <= 0) {
    clearInterval(tempoInicio);
    travado = true;
    abrirModal('FORA DO TEMPO!', '<p>O tempo esgotou.</p><a class="btn-pixel" href="../index.html">Voltar ao menu</a>');
  }
}, 1000);

escopo.onmousemove = function (e) {
  var rect = escopo.getBoundingClientRect();
  var x = ((e.clientX - rect.left) / rect.width) * 100;
  var y = ((e.clientY - rect.top) / rect.height) * 100;
  escopo.style.setProperty('--x', x + '%');
  escopo.style.setProperty('--y', y + '%');

  var btnPapel = $('#no-papel-escondido');
  if (btnPapel && !estado.papelColetado) {
    var dx = Math.abs((e.clientX - rect.left) - (btnPapel.offsetLeft + btnPapel.offsetWidth / 2));
    var dy = Math.abs((e.clientY - rect.top) - (btnPapel.offsetTop + btnPapel.offsetHeight / 2));
    btnPapel.classList.toggle('iluminado', dx < 110 && dy < 110);
  }
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

function clicarItem(id) {
  if (id === 'papel_dica') {
    selecionado = null;
    renderInventario();
    abrirEnigmaPapel();
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

var btnPapelEscondido = $('#no-papel-escondido');
if (btnPapelEscondido) {
  btnPapelEscondido.onfocus = function () {
    var rect = escopo.getBoundingClientRect();
    var x = ((btnPapelEscondido.offsetLeft + btnPapelEscondido.offsetWidth / 2) / rect.width) * 100;
    var y = ((btnPapelEscondido.offsetTop + btnPapelEscondido.offsetHeight / 2) / rect.height) * 100;
    escopo.style.setProperty('--x', x + '%');
    escopo.style.setProperty('--y', y + '%');
    btnPapelEscondido.classList.add('iluminado');
  };
  btnPapelEscondido.onclick = function () {
    if (estado.papelColetado) return;
    estado.papelColetado = true;
    salvar();
    btnPapelEscondido.remove();
    addItem('papel_dica');
    fala('Você achou um bilhete na escuridão e o guardou no inventário!');
    abrirEnigmaPapel();
  };
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

renderInventario();
fala('Mova o cursor pela tela escura para varrer o ambiente com a lanterna e achar o papel escondido.');