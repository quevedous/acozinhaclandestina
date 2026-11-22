'use strict';

const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;

const ITENS = {
  chave: { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Serve para abrir painéis parafusados.' },
  mapa: { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Planta baixa da cozinha clandestina.' },
  baunilha: { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Essência aromática rara para a massa.' },
  termometro: { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Mede a temperatura exata da calda.' },
  yuzu: { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Ingrediente criogênico final do bolo.' },
  merengue: { nome: 'Merengue Assado', icone: '🍥', desc: 'Base crocante assada no ponto.' },
  calda: { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda dourada brilhante.' },
  fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços rasgados da receita secreta.' },
  livro: { nome: 'Livro Restaurado', icone: '📖', desc: 'Receita completa do Bolo Clandestino.' },
  chavemestra: { nome: 'Chave Mestra', icone: '🗝️', desc: 'Abre portas trancadas do salão.' },
  especiarias: { nome: 'Especiarias Raras', icone: '🧂', desc: 'Tempero especial dos jurados.' },
  papel_dica: { nome: 'Bilhete Enigma', icone: '📜', desc: 'Sequência: Azul  Verde → Laranja → Vermelho.' },
  chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑', desc: 'Abre a porta da despensa trancada.' }
};

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  itemSelecionado: null,
  dicaAtual: 'Explore o cenário e clique nos objetos para investigar.',
  diario: ['Início da prova: 15 minutos para preparar e entregar o Bolo Clandestino.'],
  erros: 0,
  acertos: 0
};
+
function carregarEstado() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)); } catch (e) { return null; }
}

let estado = Object.assign({}, PADRAO, carregarEstado() || {});

function salvar() {
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado)); } catch (e) {}
}
salvar();

const $ = (s) => document.querySelector(s);
const iframe = $('#palco-cena');

/* Grava só os campos informados, mesclando com o que as cenas já salvaram.
   Assim o HUD nunca apaga o inventário (ou qualquer outro dado) das cenas. */
function salvarCampos(campos) {
  const atual = carregarEstado() || {};
  Object.assign(atual, campos);
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(atual)); } catch (e) {}
  Object.assign(estado, campos);   // só os campos do HUD; o inventário é sincronizado pelo intervalo abaixo
}

let timerMensagem = null;
function mostrarMensagem(texto) {
  const el = $('#mensagem');
  el.textContent = texto;
  el.classList.add('visivel');
  clearTimeout(timerMensagem);
  timerMensagem = setTimeout(() => el.classList.remove('visivel'), 9000);
}

function atualizarDica(texto) {
  if (!texto) return;
  salvarCampos({ dicaAtual: texto });
  mostrarMensagem(texto);
}

function registrarDiario(anotacao) {
  if (!anotacao) return;
  const diario = (estado.diario || []).slice();
  if (!diario.includes(anotacao)) {
    diario.push(anotacao);
    salvarCampos({ diario });
  }
}

function renderInventario() {
  const barra = $('#inventory-bar');
  barra.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    const id = estado.inventario[i];
    const item = ITENS[id];

    if (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot cheio' + (estado.itemSelecionado === id ? ' ativo' : '');
      btn.title = item.nome;
      btn.textContent = item.icone;
      btn.addEventListener('click', () => {
        const atual = carregarEstado() || estado;
        const novoSel = atual.itemSelecionado === id ? null : id;
        salvarCampos({ itemSelecionado: novoSel });
        renderInventario();
        atualizarDica(
          novoSel
            ? `${item.nome}: ${item.desc}`
            : 'Item guardado no inventário.'
        );
        iframe.contentWindow?.postMessage({ tipo: 'ITEM_SELECIONADO', id: novoSel }, '*');
      });
      barra.appendChild(btn);
    } else {
      const div = document.createElement('div');
      div.className = 'slot';
      barra.appendChild(div);
    }
  }
}

function abrirDiario() {
  const listaItens = estado.inventario.length
    ? estado.inventario.map((id) => `<li>${ITENS[id]?.icone || '📦'} <strong>${ITENS[id]?.nome || id}:</strong> ${ITENS[id]?.desc || ''}</li>`).join('')
    : '<li>Nenhum item coletado ainda.</li>';

  const listaNotas = (estado.diario || [])
    .slice()
    .reverse()
    .map((nota) => `<li>• ${nota}</li>`)
    .join('');

  $('#diario-corpo').innerHTML = `
    <div class="diario-secao">
      <h3>OBJETIVO ATUAL</h3>
      <p>${estado.dicaAtual}</p>
    </div>
    <div class="diario-secao">
      <h3>ITENS E PISTAS COLETADAS</h3>
      <ul class="diario-lista">${listaItens}</ul>
    </div>
    <div class="diario-secao">
      <h3>REGISTRO DE EVENTOS</h3>
      <ul class="diario-lista">${listaNotas}</ul>
    </div>
  `;
  $('#modal-diario').hidden = false;
}

$('#btn-diario').addEventListener('click', abrirDiario);
$('#diario-fechar').addEventListener('click', () => { $('#modal-diario').hidden = true; });
$('#modal-diario').addEventListener('click', (e) => {
  if (e.target.id === 'modal-diario') $('#modal-diario').hidden = true;
});

iframe.addEventListener('load', () => {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return;

    const titulo = doc.querySelector('#header-bar .cenario')?.textContent || doc.title;
    if (titulo) $('#titulo-cenario').textContent = titulo;

    
const estiloEmbed = doc.createElement('style');

estiloEmbed.textContent = `
  #header-bar,
  #mensagem,
  #inventory-bar {
    display: none !important;
  }

  html,
  body {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    overflow: hidden !important;
  }

  body {
    display: block !important;
  }

  #game-stage {
    display: grid !important;
    place-items: center !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
  }

  .cena,
  .escopo {
    max-width: 100% !important;
    max-height: 100% !important;
    height: auto !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .cena {
    width: min(100%, calc(100vh * 1.8333)) !important;
  }

  .escopo {
    width: min(100%, calc(100vh * 1.8333)) !important;
  }
`;

doc.head.appendChild(estiloEmbed);


    const msgCena = doc.querySelector('#mensagem');
    if (msgCena) {
      if (msgCena.textContent.trim()) atualizarDica(msgCena.textContent.trim());
      new MutationObserver(() => {
        const txt = msgCena.textContent.trim();
        if (txt) {
          atualizarDica(txt);
          registrarDiario(txt);
        }
      }).observe(msgCena, { childList: true, characterData: true, subtree: true });
    }
  } catch (e) {}

  estado = Object.assign({}, PADRAO, carregarEstado() || {});
  renderInventario();
});

setInterval(() => {
  const atual = carregarEstado();
  if (!atual) return;
  const mudouInv = JSON.stringify(atual.inventario) !== JSON.stringify(estado.inventario);
  const mudouSel = atual.itemSelecionado !== estado.itemSelecionado;

  if (mudouInv || mudouSel) {
    const novos = mudouInv
      ? (atual.inventario || []).filter((id) => !(estado.inventario || []).includes(id))
      : [];
    const meuDiario = estado.diario;
    const minhaDica = estado.dicaAtual;
    // primeiro sincroniza com o que a cena salvou (o diário e a dica continuam sendo do HUD)...
    estado = Object.assign({}, estado, atual, { diario: meuDiario, dicaAtual: minhaDica });
    renderInventario();
    // ...depois anota
    novos.forEach((id) => registrarDiario(`Coletou: ${ITENS[id]?.nome || id}`));
  }

  // as cenas às vezes regravam o estado sem o diário: o HUD restaura o dele
  if (JSON.stringify(atual.diario) !== JSON.stringify(estado.diario)) {
    salvarCampos({ diario: estado.diario, dicaAtual: estado.dicaAtual });
  }
}, 300);

const formatar = (seg) => `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;

function tick() {
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  const cron = $('#cronometro');
  cron.textContent = formatar(restante);
  cron.classList.toggle('urgente', restante <= 60);

  if (restante <= 0) {
    clearInterval(relogio);
    sessionStorage.removeItem(CHAVE_ESTADO);
    $('#diario-titulo').textContent = '⏰ TEMPO ESGOTADO!';
    $('#diario-corpo').innerHTML = `
      <p>Os 15 minutos acabaram antes de você concluir o Bolo Clandestino.</p>
      <a class="btn-pixel" href="index.html">Voltar ao menu</a>
    `;
    $('#modal-diario').hidden = false;
  }
}

const relogio = setInterval(tick, 1000);
renderInventario();
tick();