var CHAVE_ESTADO = 'cozinha_estado';
var DURACAO = 15 * 60;
var ORDEM_CORRETA = ['azul', 'verde', 'laranja', 'vermelho'];

var ITENS = {
  fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
  papel_dica: { nome: 'Bilhete Enigma', icone: '📜', desc: 'Um bilhete antigo com códigos RGB dos reagentes.' },
  chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑', desc: 'Chave obtida ao resolver o enigma dos frascos na bancada. Selecione-a e use no alçapão do chão.' }
};

var PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  papelColetado: false,
  chaveColetada: false,
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

(function validarFrascos() {
  var validos = ORDEM_CORRETA.slice().sort().join();
  var atuais = Array.isArray(estado.frascosAtuais) ? estado.frascosAtuais.slice().sort().join() : '';
  if (atuais !== validos) {
    estado.frascosAtuais = PADRAO.frascosAtuais.slice();
  }
})();

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
var selecionado = null;
var indexSelecionadoFrasco = null;
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

var btnPapel = $('#no-papel');
if (btnPapel) {
  btnPapel.onclick = function () {
    if (!estado.papelColetado) {
      estado.papelColetado = true;
      salvar();
      btnPapel.remove();
      addItem('papel_dica');
      fala('Você recolheu o Bilhete Enigma e o guardou no inventário!');
    }
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

var btnFrascosBancada = $('#no-frascos-bancada');
if (btnFrascosBancada) {
  btnFrascosBancada.onclick = function () {
    if (!estado.papelColetado) {
      fala('Você não faz ideia de qual seja a ordem correta. Precisa encontrar o bilhete de dicas na despensa antes!');
      return;
    }
    abrirInterfaceFrascos();
  };
}

function abrirInterfaceFrascos() {
  var imagensFrascos = {
    azul: new URL('../img/azul.png', document.baseURI).href,
    verde: new URL('../img/verde.png', document.baseURI).href,
    laranja: new URL('../img/laranja.png', document.baseURI).href,
    vermelho: new URL('../img/vermelho.png', document.baseURI).href
  };

  var botoesFrascos = '';
  for (var i = 0; i < estado.frascosAtuais.length; i++) {
    var cor = estado.frascosAtuais[i];
    var sel = i === indexSelecionadoFrasco ? 'selecionado' : '';
    botoesFrascos += `
      <button type="button" class="slot-frasco ${sel}" data-index="${i}">
        <img src="${imagensFrascos[cor]}" alt="Frasco ${cor}" loading="eager" decoding="sync" draggable="false">
        <span>${cor.toUpperCase()}</span>
      </button>
    `;
  }

  abrirModal('Bancada de Reagentes', `
    <p>Organize os 4 frascos na ordem correta da receita (clique em um e depois em outro para trocar):</p>
    <div class="grid-frascos" id="grid-frascos">${botoesFrascos}</div>
    <p class="dica-modal" id="msg-status-frascos">Posição atual dos frascos na bancada.</p>
  `);

  var grid = $('#grid-frascos');
  if (grid) {
    grid.onclick = function (e) {
      var slot = e.target.closest('.slot-frasco');
      if (!slot) return;

      var idx = Number(slot.dataset.index);
      if (indexSelecionadoFrasco === null) {
        indexSelecionadoFrasco = idx;
        abrirInterfaceFrascos();
        return;
      }

      var temp = estado.frascosAtuais[indexSelecionadoFrasco];
      estado.frascosAtuais[indexSelecionadoFrasco] = estado.frascosAtuais[idx];
      estado.frascosAtuais[idx] = temp;
      indexSelecionadoFrasco = null;
      salvar();

      var acertou = true;
      for (var k = 0; k < ORDEM_CORRETA.length; k++) {
        if (estado.frascosAtuais[k] !== ORDEM_CORRETA[k]) {
          acertou = false;
          break;
        }
      }

      if (acertou) {
        fecharModal();
        if (!estado.chaveColetada) {
          estado.chaveColetada = true;
          salvar();
          addItem('chave_porta');
          fala('Os frascos encaixaram perfeitamente! Uma gaveta se abriu e você recebeu a Chave da Câmara Fria!');
        } else {
          fala('Os frascos estão na ordem correta.');
        }
      } else {
        abrirInterfaceFrascos();
        $('#msg-status-frascos').textContent = 'Ordem incorreta. Continue tentando!';
      }
    };
  }
}

var btnPorta = $('#no-porta');
if (btnPorta) {
  btnPorta.onclick = function () {
    if (selecionado === 'chave_porta') {
      fala('A chave não serve na porta. Talvez o alçapão no chão esteja trancado...');
      return;
    }
    window.location.href = 'cena2.html';
  };
}

var btnAlcapao = $('#no-alcapao');
if (btnAlcapao) {
  btnAlcapao.onclick = function () {
    if (selecionado === 'chave_porta') {
      fala('Você usou a chave no alçapão e ele se abriu! Descendo para a Câmara Fria...');
      setTimeout(function () {
        window.location.href = 'cena3.html';
      }, 1000);
    } else if (estado.chaveColetada) {
      fala('O alçapão está trancado. Selecione a chave no inventário e clique nele.');
    } else {
      fala('Há um alçapão no chão, mas está trancado. Você precisa de uma chave.');
    }
  };
}

function formatar(seg) {
  var m = String(Math.floor(seg / 60)).padStart(2, '0');
  var s = String(seg % 60).padStart(2, '0');
  return m + ':' + s;
}

function fimDeJogo() {
  clearInterval(relogio);
  travado = true;
  abrirModal('FORA DO TEMPO!', `
    <p>O tempo esgotou e você não conseguiu escapar.</p>
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
  if (restante <= 0) fimDeJogo();
}

var relogio = setInterval(tick, 1000);
renderInventario();
tick();