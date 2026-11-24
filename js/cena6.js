'use strict';

const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;

const ITENS = {
  chave: { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛' },
  mapa: { nome: 'Mapa do Restaurante', icone: '🗺️' },
  baunilha: { nome: 'Extrato de Baunilha Rara', icone: '🌿' },
  termometro: { nome: 'Termômetro Digital', icone: '🌡️' },
  yuzu: { nome: 'Fruta de Yuzu Congelada', icone: '🍋' },
  merengue: { nome: 'Merengue Assado', icone: '🍥' },
  calda: { nome: 'Calda no Ponto', icone: '🍯' },
  fragmentos: { nome: 'Fragmentos da Página', icone: '📜' },
  livro: { nome: 'Livro Restaurado', icone: '📖' },
  chavemestra: { nome: 'Chave Mestra', icone: '🗝️' },
  especiarias: { nome: 'Especiarias Raras', icone: '🧂' },
  papel_dica: { nome: 'Bilhete Enigma', icone: '📜' },
  chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑' }
};

ItensFoto.completar(ITENS);

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  tentativas: 0,
  corridaBatidas: 0,
  corridaDoces: 0
};

function carregarEstado() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)); } catch (e) { return null; }
}
let estado = Object.assign({}, PADRAO, carregarEstado() || {});
function salvar() {
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado)); } catch (e) {}
}
salvar();

const $ = (s) => document.querySelector(s);
const overlay = $('#modal-overlay');
let travado = false;
let errosMontagem = 0;
let passoAtual = 0;
let boloPronto = false;
let pecaArrastadaId = null;

const fala = (texto) => { $('#mensagem').textContent = texto; };

function abrirModal(titulo, html) {
  $('#modal-fechar').hidden = travado;
  $('#modal-titulo').textContent = titulo;
  $('#modal-corpo').innerHTML = html;
  overlay.hidden = false;
}

function fecharModal() {
  if (travado) return;
  overlay.hidden = true;
  $('#modal-corpo').innerHTML = '';
}

$('#modal-fechar').addEventListener('click', fecharModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModal(); });

function renderInventario() {
  $('#inventory-bar').innerHTML = Array.from({ length: 8 }, (_, i) => {
    const item = ITENS[estado.inventario[i]];
    return item
      ? `<div class="slot cheio" title="${item.nome}" role="img" aria-label="${item.nome}">${ItensFoto.html(estado.inventario[i], item.icone)}</div>`
      : '<div class="slot"></div>';
  }).join('');
}

const SEQUENCIA_BOLO = [
  { id: 'massa_4', label: 'Massa Base', tipo: 'massa', w: 220, h: 42, bottom: '2%', largura: '84%', z: 1, dica: '1º Passo: Arraste a massa maior (Base) até a boleira.' },
  { id: 'calda_4', label: 'Calda Base', tipo: 'calda', w: 224, h: 28, bottom: '12%', largura: '86%', z: 2, dica: '2º Passo: Arraste a calda dourada maior para a base.' },
  { id: 'massa_3', label: 'Massa 2º Andar', tipo: 'massa', w: 184, h: 38, bottom: '20%', largura: '70%', z: 3, dica: '3º Passo: Arraste a segunda maior massa.' },
  { id: 'calda_3', label: 'Calda 2º Andar', tipo: 'calda', w: 188, h: 26, bottom: '29%', largura: '72%', z: 4, dica: '4º Passo: Arraste a cobertura do 2º andar.' },
  { id: 'massa_2', label: 'Massa 3º Andar', tipo: 'massa', w: 148, h: 34, bottom: '37%', largura: '56%', z: 5, dica: '5º Passo: Arraste a massa do 3º andar.' },
  { id: 'calda_2', label: 'Calda 3º Andar', tipo: 'calda', w: 152, h: 24, bottom: '45%', largura: '58%', z: 6, dica: '6º Passo: Arraste a calda do 3º andar.' },
  { id: 'massa_1', label: 'Massa Topo', tipo: 'massa', w: 112, h: 30, bottom: '53%', largura: '42%', z: 7, dica: '7º Passo: Arraste a menor massa para o topo.' },
  { id: 'calda_1', label: 'Calda Topo', tipo: 'calda', w: 116, h: 22, bottom: '60%', largura: '44%', z: 8, dica: '8º Passo: Arraste a menor cobertura.' },
  { id: 'topo_yuzu', label: 'Yuzu Criogênico', tipo: 'topo', w: 60, h: 52, bottom: '70%', largura: '30%', z: 9, dica: 'Último Passo: Arraste o Yuzu Congelado para coroar o bolo!' }
];

function desenharPecaCanvas(peca) {
  const canvas = document.createElement('canvas');
  canvas.width = peca.w;
  canvas.height = peca.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  if (peca.tipo === 'massa') {
    const pad = 4;
    const x = pad;
    const y = pad;
    const w = peca.w - pad * 2;
    const h = peca.h - pad * 2;

    ctx.fillStyle = '#5c2812';
    ctx.fillRect(x - 2, y + 4, w + 4, h - 4);
    ctx.fillRect(x + 6, y - 2, w - 12, h + 4);

    ctx.fillStyle = '#f5d29c';
    ctx.fillRect(x, y + 4, w, h - 6);

    ctx.fillStyle = '#ffdba8';
    ctx.fillRect(x + 6, y, w - 12, 10);

    ctx.fillStyle = '#e0a96d';
    for (let px = x + 12; px < x + w - 14; px += 18) {
      ctx.fillRect(px, y + 14, 4, 4);
      ctx.fillRect(px + 8, y + 22, 4, 4);
    }
  } else if (peca.tipo === 'calda') {
    const pad = 4;
    const x = pad;
    const w = peca.w - pad * 2;

    ctx.fillStyle = '#5c2812';
    ctx.fillRect(x + 4, 2, w - 8, 12);

    ctx.fillStyle = '#ffae00';
    ctx.fillRect(x + 2, 4, w - 4, 10);

    ctx.fillStyle = '#ffe64d';
    ctx.fillRect(x + 8, 5, w - 16, 4);

    const gotas = Math.max(4, Math.floor(w / 22));
    const passo = (w - 16) / gotas;
    for (let i = 0; i <= gotas; i++) {
      const gx = Math.round(x + 6 + i * passo);
      const gh = (i % 2 === 0) ? 14 : 10;
      ctx.fillStyle = '#5c2812';
      ctx.fillRect(gx - 2, 10, 12, gh + 2);
      ctx.fillStyle = '#ffae00';
      ctx.fillRect(gx, 10, 8, gh);
      ctx.fillStyle = '#fff59e';
      ctx.fillRect(gx + 2, 11, 2, gh - 4);
    }
  } else {
    const cx = Math.floor(peca.w / 2);
    const cy = Math.floor(peca.h / 2) + 4;

    ctx.fillStyle = '#4a5568';
    ctx.fillRect(cx - 2, 2, 4, 10);

    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 19, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function embaralhar(lista) {
  return [...lista].sort(() => Math.random() - 0.5);
}

function criarElementoCamada(peca) {
  const camada = desenharPecaCanvas(peca);
  camada.className = 'camada-bolo';
  camada.style.width = peca.largura;
  camada.style.height = 'auto';
  camada.style.bottom = peca.bottom;
  camada.style.zIndex = peca.z;
  return camada;
}

function adicionarCamadaNosDoisPalcos(peca) {
  const palcoModal = $('#camadas-montadas');
  if (palcoModal) palcoModal.appendChild(criarElementoCamada(peca));

  const palcoCena = $('#preview-boleira-cena');
  if (palcoCena) palcoCena.appendChild(criarElementoCamada(peca));
}

function abrirTelaMontagem() {
  if (boloPronto) return;

  abrirModal('Montagem do Bolo na Boleira', `
    <p>Arraste os ingredientes da bandeja até a boleira na ordem certa (de baixo para cima):</p>
    <div class="mesa-montagem">
      <div class="zona-boleira" id="zona-boleira">
        <div class="dica-drop" id="dica-drop">${SEQUENCIA_BOLO[passoAtual].dica}</div>
        <div id="camadas-montadas"></div>
        <div class="boleira-desenho">
          <div class="boleira-prato"></div>
          <div class="boleira-pe"></div>
          <div class="boleira-base"></div>
        </div>
      </div>
      <div class="bandeja-ingredientes">
        <div class="lista-pecas" id="lista-pecas"></div>
      </div>
    </div>
  `);

  const palcoModal = $('#camadas-montadas');
  for (let i = 0; i < passoAtual; i++) {
    palcoModal.appendChild(criarElementoCamada(SEQUENCIA_BOLO[i]));
  }

  renderBandejaArrastavel();
  configurarDropBoleira();
}

function renderBandejaArrastavel() {
  const container = $('#lista-pecas');
  container.innerHTML = '';

  const jaColocadas = new Set(SEQUENCIA_BOLO.slice(0, passoAtual).map((p) => p.id));
  const ordemVisual = embaralhar(SEQUENCIA_BOLO);

  ordemVisual.forEach((peca) => {
    const item = document.createElement('div');
    item.className = 'peca-drag' + (jaColocadas.has(peca.id) ? ' usada' : '');
    item.draggable = !jaColocadas.has(peca.id);
    item.dataset.id = peca.id;

    const mini = desenharPecaCanvas(peca);
    item.appendChild(mini);

    const span = document.createElement('span');
    span.textContent = peca.label;
    item.appendChild(span);

    item.addEventListener('dragstart', (e) => {
      pecaArrastadaId = peca.id;
      e.dataTransfer.setData('text/plain', peca.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      pecaArrastadaId = null;
      $('#zona-boleira')?.classList.remove('drag-over');
    });

    container.appendChild(item);
  });
}

function configurarDropBoleira() {
  const zona = $('#zona-boleira');

  zona.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    zona.classList.add('drag-over');
  });

  zona.addEventListener('dragleave', () => {
    zona.classList.remove('drag-over');
  });

  zona.addEventListener('drop', (e) => {
    e.preventDefault();
    zona.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain') || pecaArrastadaId;
    if (id) processarSolturaNaBoleira(id);
  });
}

function processarSolturaNaBoleira(id) {
  if (boloPronto) return;
  const esperada = SEQUENCIA_BOLO[passoAtual];
  const zona = $('#zona-boleira');

  if (id !== esperada.id) {
    errosMontagem++;
    estado.erros = (estado.erros || 0) + 1;
    salvar();
    zona.classList.remove('erro');
    void zona.offsetWidth;
    zona.classList.add('erro');
    fala(`Ingrediente errado! ${esperada.dica}`);
    return;
  }

  const elPeca = document.querySelector(`.peca-drag[data-id="${id}"]`);
  if (elPeca) {
    elPeca.classList.add('usada');
    elPeca.draggable = false;
  }

  estado.acertos = (estado.acertos || 0) + 1;
  salvar();

  adicionarCamadaNosDoisPalcos(esperada);
  passoAtual++;

  if (passoAtual < SEQUENCIA_BOLO.length) {
    const proxima = SEQUENCIA_BOLO[passoAtual];
    $('#dica-drop').textContent = proxima.dica;
    fala(`Perfeito! ${esperada.label} apareceu na boleira.`);
  } else {
    $('#dica-drop').textContent = 'Bolo completo!';
    setTimeout(() => {
      fecharModal();
      irParaCena6Parte2();
    }, 700);
  }
}

$('#no-boleira').addEventListener('click', abrirTelaMontagem);

function irParaCena6Parte2() {
  boloPronto = true;
  const cena = $('#cena');
  cena.classList.add('transicao-flash');

  $('#no-boleira').remove();
  $('#preview-boleira-cena').remove();
  $('#img-cenario').src = '../img/Bolo brilhante no pedestal da cozinha.png';
  $('#img-cenario').alt = 'Bancada dos jurados com o bolo brilhante pronto no pedestal';
  $('#titulo-fase').textContent = '6 · Avaliação dos Jurados';
  $('#hud-avaliacao').hidden = false;

  fala('O Bolo Clandestino está brilhando na boleira! Clique em SERVIR AOS JURADOS.');
}

function calcularNotas() {
  const penalidadeErros = Math.min(2.5, errosMontagem * 0.4);
  const penalidadeBatidas = Math.min(1.5, (estado.corridaBatidas || 0) * 0.3);
  const bonusDoces = Math.min(1.0, (estado.corridaDoces || 0) * 0.25);

  const base = Math.max(6.5, Math.min(10, 9.5 - penalidadeErros - penalidadeBatidas + bonusDoces));
  const n1 = Number(Math.min(10, base + 0.3).toFixed(1));
  const n2 = Number(Math.max(6.0, base - 0.2).toFixed(1));
  const n3 = Number(Math.min(10, base + 0.1).toFixed(1));
  const media = ((n1 + n2 + n3) / 3).toFixed(1);

  return { n1, n2, n3, media };
}

function avaliarPelosJurados() {
  $('#btn-servir').hidden = true;
  clearInterval(relogio);
  travado = true;

  const { n1, n2, n3, media } = calcularNotas();
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));

  const etapas = [
    { el: '#jurado-1', notaEl: '#nota-1', nota: n1, fala: 'Jurada 1: "A textura da massa e o brilho da calda estão impecáveis!"' },
    { el: '#jurado-2', notaEl: '#nota-2', nota: n2, fala: 'Chef Central: "O choque térmico do Yuzu congelado no topo é genial!"' },
    { el: '#jurado-3', notaEl: '#nota-3', nota: n3, fala: 'Jurada 3: "Apresentação e sabor dignos de campeão!"' }
  ];

  etapas.forEach((etapa, idx) => {
    setTimeout(() => {
      document.querySelectorAll('.card-jurado').forEach((j) => j.classList.remove('avaliando'));
      $(etapa.el).classList.add('avaliando');
      const badge = $(etapa.notaEl);
      badge.textContent = etapa.nota.toFixed(1);
      badge.classList.add('revelada');
      fala(etapa.fala);
    }, (idx + 1) * 1100);
  });

  setTimeout(() => {
    limparProgresso();
    abrirModal('🏆 CAMPEÃO DA COZINHA CLANDESTINA!', `
      <p>Os jurados ficaram impressionados com o seu bolo coroado com o Yuzu Criogênico!</p>
      <div class="resumo-final">
        <p><strong>Jurada 1:</strong> ${n1.toFixed(1)} &nbsp;|&nbsp; <strong>Chef Central:</strong> ${n2.toFixed(1)} &nbsp;|&nbsp; <strong>Jurada 3:</strong> ${n3.toFixed(1)}</p>
        <p><strong>Tempo restante:</strong> ${formatar(restante)}</p>
        <p><strong>Erros na montagem:</strong> ${errosMontagem}</p>
        <p class="nota-total">MÉDIA FINAL: ${media} / 10.0</p>
      </div>
      <a class="btn-pixel" href="../index.html">JOGAR NOVAMENTE</a>
    `);
  }, 4400);
}

$('#btn-servir').addEventListener('click', avaliarPelosJurados);

const formatar = (seg) => `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;

const limparProgresso = () => {
  try {
    sessionStorage.removeItem(CHAVE_ESTADO);
    Object.keys(sessionStorage).filter((chave) => chave.startsWith('daniela_')).forEach((chave) => sessionStorage.removeItem(chave));
  } catch (e) {}
};

function fimDeJogo() {
  clearInterval(relogio);
  travado = true;
  limparProgresso();
  $('#daniela-ajuda')?.remove();
  abrirModal('FORA DO TEMPO!', `
    <p>O tempo do concurso esgotou antes que você conseguisse servir o bolo aos jurados!</p>
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