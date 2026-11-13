'use strict';

const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;

const CORRIDA = {
  tempo: 15,
  distancia: 9400,
  velocidade: 720,
  lateral: 380,
  faixas: 4,
  doces: 4,
  boost: 1.6,
  duracaoBoost: 1.3,
  freio: 0.6,
  acelera: 1.15,
  batida: 0.35,
  recuperacao: 1.1,
};

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
};

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  potesAbertos: false,
  emulsaoPronta: false,
  tentativas: 0,
};

function carregarEstado() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)); } catch (e) { return null; }
}

let estado = Object.assign({}, PADRAO, carregarEstado() || {});

function salvar() {
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado)); } catch (e) {}
}

salvar();

const $ = (seletor) => document.querySelector(seletor);
const overlay = $('#modal-overlay');
const tela = $('#pista');
const ctx = tela.getContext('2d');
const LARGURA = tela.width;
const ALTURA = tela.height;
const TOPO = 70;
const FAIXA_H = 115;
const CARRO_X = 190;
const CARRO = { w: 92, h: 44 };
const TIPOS = {
  carro: { w: 92, h: 44, vel: 80, nome: 'um carro' },
  cone: { w: 36, h: 40, vel: 0, nome: 'um cone' },
  barril: { w: 48, h: 52, vel: 0, nome: 'um barril' },
};
const CORES_CARRO = ['#4a90d9', '#8e44ad', '#2e8b57', '#e08a1e'];
const MAPA_TECLAS = {
  ArrowUp: 'cima', w: 'cima', W: 'cima',
  ArrowDown: 'baixo', s: 'baixo', S: 'baixo',
  ArrowLeft: 'esq', a: 'esq', A: 'esq',
  ArrowRight: 'dir', d: 'dir', D: 'dir',
};

const teclas = new Set();
let fase = 'espera';
let corrida = null;
let travado = false;
let aoFechar = null;
let ultimoQuadro = 0;
let animacao = 0;

const centroFaixa = (indice) => TOPO + FAIXA_H * (indice + 0.5);
const fala = (texto) => { $('#mensagem').textContent = texto; };
const danielaAberta = () => Boolean($('#daniela-dlg')?.open);

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
  const fn = aoFechar;
  aoFechar = null;
  fn?.();
}

$('#modal-fechar').addEventListener('click', fecharModal);
overlay.addEventListener('click', (evento) => { if (evento.target === overlay) fecharModal(); });
$('#modal-corpo').addEventListener('click', ({ target }) => {
  if (target.dataset.acao === 'tentar') fecharModal();
});

function renderInventario() {
  $('#inventory-bar').innerHTML = Array.from({ length: 8 }, (_, i) => {
    const item = ITENS[estado.inventario[i]];
    return item
      ? `<div class="slot cheio" title="${item.nome}" role="img" aria-label="${item.nome}">${item.icone}</div>`
      : '<div class="slot"></div>';
  }).join('');
}

const gerarPista = () => {
  const itens = [];
  const inicio = 900;
  const passo = 420;
  const segmentos = Math.floor((CORRIDA.distancia - inicio - 300) / passo);
  const comDoce = new Set();
  while (comDoce.size < CORRIDA.doces) comDoce.add(1 + Math.floor(Math.random() * (segmentos - 2)));

  for (let s = 0; s < segmentos; s++) {
    const x0 = inicio + s * passo;
    const faixas = [...Array(CORRIDA.faixas).keys()].sort(() => Math.random() - 0.5);
    const [livre, ...resto] = faixas;
    resto.slice(0, 1 + Math.floor(Math.random() * 2)).forEach((faixa) => {
      const tipo = ['carro', 'carro', 'cone', 'barril'][Math.floor(Math.random() * 4)];
      const cor = CORES_CARRO[Math.floor(Math.random() * CORES_CARRO.length)];
      itens.push({ tipo, faixa, x: x0 + Math.random() * 140, cor, ...TIPOS[tipo] });
    });
    if (comDoce.has(s)) {
      itens.push({ tipo: 'doce', faixa: livre, x: x0 + 260, w: 38, h: 38, vel: 0, cor: ['#ff5fa2', '#4cc9f0'][s % 2] });
    }
  }
  return itens;
};

const prepararCorrida = () => {
  corrida = {
    x: 0,
    y: centroFaixa(1),
    decorrido: 0,
    batidas: 0,
    doces: 0,
    boost: 0,
    penalidade: 0,
    invul: 0,
    tremor: 0,
    itens: gerarPista(),
  };
  desenhar();
};

const velocidadeAtual = () => {
  const c = corrida;
  let v = CORRIDA.velocidade;
  if (teclas.has('esq')) v *= CORRIDA.freio;
  if (teclas.has('dir')) v *= CORRIDA.acelera;
  if (c.boost > 0) v *= CORRIDA.boost;
  if (c.penalidade > 0) v *= CORRIDA.batida + (1 - CORRIDA.batida) * (1 - c.penalidade / CORRIDA.recuperacao);
  return v;
};

const bate = (item) => {
  const meioW = ((CARRO.w + item.w) / 2) * 0.85;
  const meioH = ((CARRO.h + item.h) / 2) * 0.85;
  return Math.abs(corrida.x - item.x) < meioW && Math.abs(corrida.y - centroFaixa(item.faixa)) < meioH;
};

const colisoes = () => {
  const c = corrida;
  c.itens = c.itens.filter((item) => {
    if (!bate(item)) return true;
    if (item.tipo === 'doce') {
      c.doces++;
      c.boost += CORRIDA.duracaoBoost;
      fala('Doce! O carro ganhou velocidade.');
      return false;
    }
    if (c.invul > 0) return true;
    c.batidas++;
    c.penalidade = CORRIDA.recuperacao;
    c.invul = 1;
    c.tremor = 0.25;
    fala(`Batida! Você bateu em ${item.nome}.`);
    return false;
  });
};

const atualizar = (dt) => {
  const c = corrida;
  c.decorrido += dt;
  c.boost = Math.max(0, c.boost - dt);
  c.penalidade = Math.max(0, c.penalidade - dt);
  c.invul = Math.max(0, c.invul - dt);
  c.tremor = Math.max(0, c.tremor - dt);

  const direcao = (teclas.has('baixo') ? 1 : 0) - (teclas.has('cima') ? 1 : 0);
  c.y = Math.min(centroFaixa(CORRIDA.faixas - 1), Math.max(centroFaixa(0), c.y + direcao * CORRIDA.lateral * dt));
  c.x += velocidadeAtual() * dt;
  c.itens.forEach((item) => { item.x += item.vel * dt; });

  colisoes();
  if (c.x >= CORRIDA.distancia) terminar(true);
  else if (c.decorrido >= CORRIDA.tempo) terminar(false);
};

const desenharCarro = (x, y, cor, jogador = false) => {
  ctx.fillStyle = '#111';
  [[-36, -28], [16, -28], [-36, 20], [16, 20]].forEach(([dx, dy]) => ctx.fillRect(x + dx, y + dy, 22, 8));
  ctx.fillStyle = cor;
  ctx.fillRect(x - 46, y - 22, 92, 44);
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.fillRect(x - 46, y - 22, 92, 8);
  ctx.fillStyle = '#9fd3f0';
  ctx.fillRect(x + 4, y - 16, 22, 32);
  ctx.fillStyle = '#1a110d';
  ctx.fillRect(x - 30, y - 14, 30, 28);
  ctx.fillStyle = '#fff3a0';
  ctx.fillRect(x + 42, y - 18, 6, 10);
  ctx.fillRect(x + 42, y + 8, 6, 10);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x - 48, y - 18, 4, 10);
  ctx.fillRect(x - 48, y + 8, 4, 10);
  if (jogador) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 15, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 24, y - 6, 18, 12);
  }
};

const desenhar = () => {
  const c = corrida;
  if (!c) return;
  const dx = CARRO_X - c.x;
  const alturaPista = CORRIDA.faixas * FAIXA_H;

  ctx.save();
  if (c.tremor > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);

  ctx.fillStyle = '#2e5a3a';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.fillStyle = '#3b3b46';
  ctx.fillRect(0, TOPO, LARGURA, alturaPista);
  ctx.fillStyle = '#E6B800';
  ctx.fillRect(0, TOPO - 6, LARGURA, 6);
  ctx.fillRect(0, TOPO + alturaPista, LARGURA, 6);

  ctx.fillStyle = '#d9d9d9';
  for (let i = 1; i < CORRIDA.faixas; i++) {
    for (let x = -(c.x % 110); x < LARGURA; x += 110) ctx.fillRect(x, TOPO + i * FAIXA_H - 3, 60, 6);
  }

  const chegada = CORRIDA.distancia + dx;
  if (chegada < LARGURA + 50) {
    for (let linha = 0; linha * 23 < alturaPista; linha++) {
      for (let col = 0; col < 2; col++) {
        ctx.fillStyle = (linha + col) % 2 ? '#fff' : '#111';
        ctx.fillRect(chegada + col * 23, TOPO + linha * 23, 23, Math.min(23, alturaPista - linha * 23));
      }
    }
    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(chegada + 60, TOPO - 40, LARGURA, alturaPista + 80);
    ctx.fillStyle = '#FDF6E2';
    ctx.fillRect(chegada + 74, TOPO - 26, LARGURA, alturaPista + 52);
    ctx.fillStyle = '#2C221E';
    ctx.font = "20px 'Press Start 2P', monospace";
    ctx.fillText('BANCADA', chegada + 100, TOPO + alturaPista / 2 + 8);
    ['#D9534F', '#E6B800', '#4cc9f0'].forEach((cor, i) => {
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.arc(chegada + 130 + i * 70, TOPO + 60, 22, 0, Math.PI * 2);
      ctx.arc(chegada + 130 + i * 70, TOPO + alturaPista - 60, 22, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  c.itens.forEach((item) => {
    const sx = item.x + dx;
    if (sx < -120 || sx > LARGURA + 120) return;
    const sy = centroFaixa(item.faixa);
    if (item.tipo === 'carro') desenharCarro(sx, sy, item.cor);
    if (item.tipo === 'cone') {
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 20);
      ctx.lineTo(sx + 18, sy + 20);
      ctx.lineTo(sx - 18, sy + 20);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - 9, sy, 18, 6);
    }
    if (item.tipo === 'barril') {
      ctx.fillStyle = '#7a4a2b';
      ctx.fillRect(sx - 24, sy - 26, 48, 52);
      ctx.fillStyle = '#2b1a10';
      ctx.fillRect(sx - 24, sy - 14, 48, 6);
      ctx.fillRect(sx - 24, sy + 8, 48, 6);
    }
    if (item.tipo === 'doce') {
      const balanco = Math.sin(c.decorrido * 6 + item.x) * 3;
      ctx.fillStyle = item.cor;
      ctx.beginPath();
      ctx.ellipse(sx, sy + balanco, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx - 14, sy + balanco);
      ctx.lineTo(sx - 30, sy + balanco - 12);
      ctx.lineTo(sx - 30, sy + balanco + 12);
      ctx.moveTo(sx + 14, sy + balanco);
      ctx.lineTo(sx + 30, sy + balanco - 12);
      ctx.lineTo(sx + 30, sy + balanco + 12);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillRect(sx - 8, sy + balanco - 6, 8, 4);
    }
  });

  if (c.boost > 0) {
    ctx.fillStyle = '#ff9a2e';
    ctx.beginPath();
    ctx.moveTo(CARRO_X - 48, c.y - 12);
    ctx.lineTo(CARRO_X - 100, c.y);
    ctx.lineTo(CARRO_X - 48, c.y + 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 6; i++) ctx.fillRect((i * 197 + c.decorrido * 1400) % LARGURA, TOPO + 20 + ((i * 83) % (alturaPista - 40)), 90, 3);
  }

  if (!(c.invul > 0 && Math.floor(c.decorrido * 12) % 2)) desenharCarro(CARRO_X, c.y, '#D9534F', true);
  ctx.restore();

  const restante = Math.max(0, CORRIDA.tempo - c.decorrido);
  ctx.fillStyle = '#1a110d';
  ctx.fillRect(0, 0, LARGURA, TOPO - 6);
  ctx.font = "16px 'Press Start 2P', monospace";
  ctx.fillStyle = restante < 4 ? '#D9534F' : '#E6B800';
  ctx.fillText(`${restante.toFixed(1)}s`, 24, 40);
  ctx.strokeStyle = '#E6B800';
  ctx.lineWidth = 4;
  ctx.strokeRect(300, 20, 440, 24);
  ctx.fillStyle = '#4cc9f0';
  ctx.fillRect(302, 22, 436 * Math.min(1, c.x / CORRIDA.distancia), 20);
  ctx.fillStyle = '#FDF6E2';
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText(`BATIDAS ${c.batidas}   DOCES ${c.doces}`, 790, 38);
};

const quadro = (agora) => {
  if (fase !== 'correndo') return;
  const dt = Math.min(0.05, (agora - ultimoQuadro) / 1000);
  ultimoQuadro = agora;
  if (danielaAberta()) teclas.clear();
  else atualizar(dt);
  desenhar();
  if (fase === 'correndo') animacao = requestAnimationFrame(quadro);
};

const voltarParaEspera = () => {
  fase = 'espera';
  prepararCorrida();
  $('#inicio').hidden = false;
  $('#btn-comecar').focus();
};

const iniciar = () => {
  if (fase !== 'espera' || danielaAberta() || !overlay.hidden) return;
  prepararCorrida();
  estado.tentativas++;
  salvar();
  fase = 'correndo';
  $('#inicio').hidden = true;
  fala('Vai! Desvie dos carros, pegue os doces e chegue à bancada.');
  ultimoQuadro = performance.now();
  animacao = requestAnimationFrame(quadro);
};

const formatar = (segundos) => `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;

const limparProgresso = () => {
  try {
    sessionStorage.removeItem(CHAVE_ESTADO);
    Object.keys(sessionStorage).filter((chave) => chave.startsWith('daniela_')).forEach((chave) => sessionStorage.removeItem(chave));
  } catch (e) {}
};

const irParaCena6 = () => {
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  estado.chegouBancada = true;
  estado.corridaBatidas = corrida.batidas;
  estado.corridaDoces = corrida.doces;
  estado.sobrou = restante;
  salvar();

  clearInterval(relogio);
  travado = true;
  $('#daniela-ajuda')?.remove();
  fala('Você chegou à bancada!');

  const transicao = $('#transicao');
  transicao.hidden = false;
  transicao.getBoundingClientRect();
  transicao.classList.add('ativa');
  setTimeout(() => { location.href = 'cena6.html'; }, 3500);
};

const terminar = (venceu) => {
  fase = 'fim';
  teclas.clear();
  cancelAnimationFrame(animacao);
  if (venceu) {
    irParaCena6();
    return;
  }
  fala('O tempo da corrida acabou.');
  aoFechar = voltarParaEspera;
  abrirModal('NÃO DEU TEMPO!', `
    <p>Os 15 segundos acabaram antes de você chegar à bancada. Desvie mais e pegue os doces para ganhar velocidade.</p>
    <button class="btn-pixel" type="button" data-acao="tentar">TENTAR DE NOVO</button>
  `);
};

function fimDeJogo() {
  clearInterval(relogio);
  cancelAnimationFrame(animacao);
  fase = 'fim';
  travado = true;
  limparProgresso();
  $('#daniela-ajuda')?.remove();
  abrirModal('FORA DO TEMPO!', `
    <p>O concurso começou sem o seu prato. O Chef abre a porta, furioso, e você está demitido antes de servir qualquer coisa.</p>
    <a class="btn-pixel" href="../index.html">Voltar ao menu</a>
  `);
}

function tick() {
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  $('#cronometro').textContent = formatar(restante);
  $('#cronometro').classList.toggle('urgente', restante <= 60);
  if (restante <= 0) fimDeJogo();
}

const relogio = setInterval(tick, 1000);

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharModal();
  const acao = MAPA_TECLAS[evento.key];
  if (acao && fase === 'correndo') {
    teclas.add(acao);
    evento.preventDefault();
  }
});

document.addEventListener('keyup', (evento) => teclas.delete(MAPA_TECLAS[evento.key]));
window.addEventListener('blur', () => teclas.clear());
$('#btn-comecar').addEventListener('click', iniciar);

renderInventario();
prepararCorrida();
tick();
fala('Pista Principal. Falta só levar o prato até a bancada. Clique em COMEÇAR quando estiver pronto.');
$('#btn-comecar').focus();