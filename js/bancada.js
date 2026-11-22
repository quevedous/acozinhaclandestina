const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;

const ORDEM_CORRETA = ['azul', 'verde', 'laranja', 'vermelho'];

const ITENS = {
    fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
  papel_dica: {
    nome: 'Bilhete Enigma',
    icone: '📜',
    desc: 'Um bilhete antigo com códigos RGB dos reagentes.'
  },
  chave_porta: {
    nome: 'Chave da Câmara Fria',
    icone: '🔑',
    desc: 'Chave obtida ao resolver o enigma dos frascos na bancada. Selecione-a e use no alçapão do chão.'
  }
};

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  papelColetado: false,
  chaveColetada: false,
  frascosAtuais: ['laranja', 'azul', 'vermelho', 'verde']
};

function carregarEstado() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO));
  } catch (e) {
    return null;
  }
}

let estado = Object.assign({}, PADRAO, carregarEstado() || {});

// Garante que a ordem salva só tenha nomes válidos (azul/verde/laranja/vermelho).
// Estados antigos podiam guardar strings "rgba(...)" e impediam o enigma de fechar.
(function validarFrascos() {
  const validos = ORDEM_CORRETA.slice().sort().join();
  const atuais = Array.isArray(estado.frascosAtuais) ? estado.frascosAtuais.slice().sort().join() : '';

  if (atuais !== validos) {
    estado.frascosAtuais = PADRAO.frascosAtuais.slice();
  }
})();

function salvar() {
  try {
    sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
  } catch (e) {}
}

salvar();

const $ = s => document.querySelector(s);
const overlay = $('#modal-overlay');
const modalTitulo = $('#modal-titulo');
const modalCorpo = $('#modal-corpo');

let selecionado = null;
let indexSelecionadoFrasco = null;
let travado = false;
let aoFechar = null;

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

$('#modal-fechar').addEventListener('click', fecharModal);

overlay.addEventListener('click', e => {
  if (e.target === overlay) fecharModal();
});

function renderInventario() {
  const barra = $('#inventory-bar');
  if (!barra) return;

  barra.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    const id = estado.inventario[i];

    if (id && ITENS[id]) {
      const b = document.createElement('button');

      b.type = 'button';
      b.className = 'slot cheio' + (selecionado === id ? ' ativo' : '');
      b.title = ITENS[id].nome;
      b.textContent = ITENS[id].icone;

      b.addEventListener('click', () => clicarItem(id));

      barra.appendChild(b);
    } else {
      const d = document.createElement('div');
      d.className = 'slot';
      barra.appendChild(d);
    }
  }
}

function addItem(id) {
  if (!estado.inventario.includes(id)) {
    estado.inventario.push(id);
  }

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

const btnPapel = $('#no-papel');

if (btnPapel) {
  btnPapel.addEventListener('click', () => {
    if (!estado.papelColetado) {
      estado.papelColetado = true;
      salvar();

      btnPapel.remove();

      addItem('papel_dica');

      fala('Você recolheu o Bilhete Enigma e o guardou no inventário!');
    }

    abrirEnigmaPapel();
  });
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

const btnFrascosBancada = $('#no-frascos-bancada');

if (btnFrascosBancada) {
  btnFrascosBancada.addEventListener('click', () => {
    if (!estado.papelColetado) {
      fala('Você não faz ideia de qual seja a ordem correta. Precisa encontrar o bilhete de dicas na despensa antes!');
      return;
    }

    abrirInterfaceFrascos();
  });
}

function abrirInterfaceFrascos() {
  const imagensFrascos = {
    azul: new URL('../img/azul.png', document.baseURI).href,
    verde: new URL('../img/verde.png', document.baseURI).href,
    laranja: new URL('../img/laranja.png', document.baseURI).href,
    vermelho: new URL('../img/vermelho.png', document.baseURI).href
  };

  let htmlFrascos = `
    <p>Organize os 4 frascos na ordem correta da receita (clique em um e depois em outro para trocar):</p>
    <div class="grid-frascos" id="grid-frascos">
      ${estado.frascosAtuais.map((cor, index) => `
        <button type="button" class="slot-frasco ${index === indexSelecionadoFrasco ? 'selecionado' : ''}" data-index="${index}">
          <img src="${imagensFrascos[cor]}" alt="Frasco ${cor}" loading="eager" decoding="sync" draggable="false">
          <span>${cor.toUpperCase()}</span>
        </button>
      `).join('')}
    </div>
    <p class="dica-modal" id="msg-status-frascos">Posição atual dos frascos na bancada.</p>
  `;

  abrirModal('Bancada de Reagentes', htmlFrascos);

  const grid = $('#grid-frascos');

  if (grid) {
    grid.addEventListener('click', e => {
      const slot = e.target.closest('.slot-frasco');
      if (!slot) return;

      const idx = Number(slot.dataset.index);

      if (indexSelecionadoFrasco === null) {
        indexSelecionadoFrasco = idx;
        abrirInterfaceFrascos();
      } else {
        let temp = estado.frascosAtuais[indexSelecionadoFrasco];

        estado.frascosAtuais[indexSelecionadoFrasco] = estado.frascosAtuais[idx];
        estado.frascosAtuais[idx] = temp;

        indexSelecionadoFrasco = null;
        salvar();

        const acertou = estado.frascosAtuais.every(
          (cor, i) => cor === ORDEM_CORRETA[i]
        );

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
      }
    });
  }
}

const btnPorta = $('#no-porta');

if (btnPorta) {
  btnPorta.addEventListener('click', () => {
    if (selecionado === 'chave_porta') {
      fala('A chave não serve na porta. Talvez o alçapão no chão esteja trancado...');
      return;
    }

    window.location.href = 'cena2.html';
  });
}

const btnAlcapao = $('#no-alcapao');

if (btnAlcapao) {
  btnAlcapao.addEventListener('click', () => {
    if (selecionado === 'chave_porta') {
      fala('Você usou a chave no alçapão e ele se abriu! Descendo para a Câmara Fria...');

      setTimeout(() => {
        window.location.href = 'cena3.html';
      }, 1000);
    } else if (estado.chaveColetada) {
      fala('O alçapão está trancado. Selecione a chave no inventário e clique nele.');
    } else {
      fala('Há um alçapão no chão, mas está trancado. Você precisa de uma chave.');
    }
  });
}

function formatar(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');

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
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  const cron = $('#cronometro');

  if (cron) {
    cron.textContent = formatar(restante);
    cron.classList.toggle('urgente', restante <= 60);
  }

  if (restante <= 0) fimDeJogo();
}

const relogio = setInterval(tick, 1000);

renderInventario();
tick();