const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;
const SENHA_SEGURANCA = '10';
const SENHA_CAIXA = '6075';
const EMULSAO = { meta: 10, largura: 24, graca: 1 };

const ITENS = {
  chave:       { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Clique no painel do termostato para abri-lo.' },
  mapa:        { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha:    { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
  termometro:  { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Leve para a Confeitaria e use no frasco de calda.' },
  yuzu:        { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Leve para a Confeitaria e deixe descongelar no mármore frio.' },
  merengue:    { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
  calda:       { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' }
};

const PADRAO = {
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
  try { return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)); } catch (e) { return null; }
}
let estado = Object.assign({}, PADRAO, carregarEstado() || {});
function salvar() {
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado)); } catch (e) {}
}
salvar();

const $ = s => document.querySelector(s);
const overlay = $('#modal-overlay');
const modalTitulo = $('#modal-titulo');
const modalCorpo = $('#modal-corpo');
let travado = false;
let selecionado = null;
let aoFechar = null;

function fala(texto) { $('#mensagem').textContent = texto; }

function abrirModal(titulo, html) {
  if (aoFechar) { aoFechar(); aoFechar = null; }
  modalTitulo.textContent = titulo;
  modalCorpo.innerHTML = html;
  overlay.hidden = false;
}
function fecharModal() {
  if (travado) return;
  if (aoFechar) { aoFechar(); aoFechar = null; }
  overlay.hidden = true;
  modalCorpo.innerHTML = '';
}
$('#modal-fechar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
  if ((e.key === 'h' || e.key === 'H') && overlay.hidden) $('#cena').classList.toggle('debug');
});

function renderInventario() {
  const barra = $('#inventory-bar');
  barra.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const id = estado.inventario[i];
    if (id && ITENS[id]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot cheio' + (selecionado === id ? ' ativo' : '');
      b.title = ITENS[id].nome;
      b.setAttribute('aria-label', ITENS[id].nome);
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
  if (!estado.inventario.includes(id)) estado.inventario.push(id);
  salvar();
  renderInventario();
}
function removerItem(id) {
  estado.inventario = estado.inventario.filter(i => i !== id);
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
  $(id).addEventListener('click', () => {
    if (selecionado) {
      if (usos && usos[selecionado]) { usos[selecionado](); return; }
      fala(ITENS[selecionado].nome + ' não funciona em: ' + alvo + '. Clique no item de novo para guardá-lo.');
      return;
    }
    fn();
  });
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
  let codigo = '';
  abrirModal(titulo, `
    <p>${intro}</p>
    <div class="visor" id="visor">${'-'.repeat(tam)}</div>
    <div class="teclado">
      ${[1,2,3,4,5,6,7,8,9].map(d => `<button type="button" data-n="${d}">${d}</button>`).join('')}
      <button type="button" data-a="limpar">C</button>
      <button type="button" data-n="0">0</button>
      <button type="button" data-a="ok">OK</button>
    </div>
    ${dica ? `<p class="dica-modal">${dica}</p>` : ''}
  `);
  const visor = $('#visor');
  const atualizar = () => { visor.textContent = (codigo + '-'.repeat(tam)).slice(0, tam); };
  modalCorpo.querySelector('.teclado').addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.n !== undefined) {
      if (codigo.length < tam) { codigo += b.dataset.n; atualizar(); }
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
        setTimeout(() => { visor.classList.remove('erro'); atualizar(); }, 800);
      }
    }
  });
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
  const dados = numero === 3
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
    c => c === SENHA_SEGURANCA,
    () => {
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
    c => c === SENHA_CAIXA,
    () => {
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
  const trilho = $('#trilho');
  const zonaEl = $('#zona-em');
  const marca = $('#marca');
  const prog = $('#prog');
  const leit = $('#leitura-em');
  const msg = $('#em-msg');
  const btn = $('#comecar');
  let pos = 50, centro = 50, dentro = 0, fora = 0, raf = 0, ultimo = 0, t0 = 0;

  const desenhar = () => {
    zonaEl.style.left = (centro - EMULSAO.largura / 2) + '%';
    zonaEl.style.width = EMULSAO.largura + '%';
    marca.style.left = pos + '%';
    prog.style.width = Math.min(100, (dentro / EMULSAO.meta) * 100) + '%';
    leit.textContent = Math.min(dentro, EMULSAO.meta).toFixed(1) + ' / ' + EMULSAO.meta + ' s';
  };
  const moverPara = x => {
    const r = trilho.getBoundingClientRect();
    pos = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
  };
  trilho.addEventListener('pointermove', e => moverPara(e.clientX));
  trilho.addEventListener('pointerdown', e => moverPara(e.clientX));
  const teclas = e => {
    if (e.key === 'ArrowLeft') { pos = Math.max(0, pos - 4); e.preventDefault(); }
    if (e.key === 'ArrowRight') { pos = Math.min(100, pos + 4); e.preventDefault(); }
  };
  document.addEventListener('keydown', teclas);
  aoFechar = () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', teclas);
  };

  const quadro = agora => {
    const dt = Math.min(0.1, (agora - ultimo) / 1000);
    ultimo = agora;
    const t = (agora - t0) / 1000;
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
  };
  btn.addEventListener('click', () => {
    dentro = 0;
    fora = 0;
    btn.hidden = true;
    msg.textContent = 'Siga a zona verde com o indicador vermelho!';
    t0 = performance.now();
    ultimo = t0;
    raf = requestAnimationFrame(quadro);
  });
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
function abrirTermostato() {
  if (estado.termostatoAberto) {
    fala('O painel do termostato está aberto e vazio.');
  } else if (estado.inventario.includes('chave')) {
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
  const falta = [];
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
ligar('#no-pote3a', 'Recipiente', () => abrirRecipiente(3));
ligar('#no-pote3b', 'Recipiente', () => abrirRecipiente(3));
ligar('#no-pote11', 'Recipiente', () => abrirRecipiente(11));
ligar('#no-teclado', 'Teclado', abrirSeguranca);
ligar('#no-porta', 'Porta', abrirPorta);
ligar('#no-caixa', 'Freezer', abrirCaixa);
ligar('#no-misturador', 'Misturador', abrirMisturador);
ligar('#no-termostato', 'Termostato', abrirTermostato, { chave: usarChaveNoTermostato });

ligar('#no-armario', 'Armário', () => fala('Um armário de inox lacrado pelo gelo. Não abre.'));
ligar('#no-geladeira-esq', 'Geladeira', () => fala('Uma geladeira industrial cheia de caixas. A porta está congelada e não abre.'));
ligar('#no-geladeira-meio', 'Geladeira', () => fala('Uma geladeira de vidro com caixas de leite e manteiga. Nada de útil.'));
ligar('#no-caixas-esq', 'Caixas', () => fala('Caixas de papelão duras de tanto gelo.'));
ligar('#no-caixas-dir', 'Caixas', () => fala('Caixas congeladas no alto da prateleira. Nada de útil.'));
ligar('#no-lampada', 'Lâmpada', () => fala('A luz azulada da lâmpada deixa a sala ainda mais fria.'));
ligar('#no-gelo', 'Gelo', () => fala('Poças de gelo no chão. Melhor andar devagar.'));
ligar('#no-potes-med', 'Recipientes', () => fala('As etiquetas destes recipientes estão apagadas pelo gelo. Os legíveis estão na prateleira de cima.'));
ligar('#no-recip-baixo', 'Recipientes', () => fala('Recipientes 011 e 012, com as etiquetas cobertas de gelo. Não dá para ler.'));

function formatar(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');
  return m + ':' + s;
}
function fimDeJogo() {
  clearInterval(relogio);
  travado = true;
  try { sessionStorage.removeItem(CHAVE_ESTADO); } catch (e) {}
  abrirModal('FORA DO TEMPO!', `
    <p>O concurso começou sem você. O Chef abre a porta, furioso, e você está demitido antes de tocar na bancada.</p>
    <a class="btn-pixel" href="../index.html">Voltar ao menu</a>
  `);
}
function tick() {
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  const cron = $('#cronometro');
  cron.textContent = formatar(restante);
  cron.classList.toggle('urgente', restante <= 60);
  if (restante <= 0) fimDeJogo();
}
const relogio = setInterval(tick, 1000);

if (estado.caixaAberta) $('#no-caixa').classList.add('aberta');
if (estado.segurancaAberta) $('#no-teclado').classList.add('aberta');
renderInventario();
tick();
fala('Câmara Fria. Procure o termômetro digital e abra o freezer das frutas raras.');