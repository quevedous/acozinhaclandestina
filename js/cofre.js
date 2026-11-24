var CHAVE_ESTADO = 'cozinha_estado';
var DURACAO = 15 * 60;
var SENHA_COFRE = '2628';

var PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  cofreAberto: false
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
var codigo = '';

function fala(texto) {
  var m = $('#mensagem');
  if (m) m.textContent = texto;
}

function abrirModal(titulo, html) {
  if (!overlay) return;
  modalTitulo.textContent = titulo;
  modalCorpo.innerHTML = html;
  overlay.hidden = false;
}

function fecharModal() {
  if (travado || !overlay) return;
  overlay.hidden = true;
  modalCorpo.innerHTML = '';
}

if ($('#modal-fechar')) $('#modal-fechar').onclick = fecharModal;
if (overlay) {
  overlay.onclick = function (e) {
    if (e.target === overlay) fecharModal();
  };
}
document.onkeydown = function (e) {
  if (e.key === 'Escape') fecharModal();
  if ((e.key === 'h' || e.key === 'H') && (!overlay || overlay.hidden)) {
    var c = $('#cena');
    if (c) c.classList.toggle('debug');
  }
};

function atualizarVisor() {
  var v = $('#visor');
  if (!v) return;
  var texto = '';
  for (var i = 0; i < 4; i++) {
    texto += i < codigo.length ? codigo.charAt(i) : '·';
  }
  v.textContent = texto;
  v.classList.remove('erro');
  v.classList.toggle('ok', estado.cofreAberto);
}

function tocarBip(freq, dur) {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = new Ctx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

function digitar(n) {
  if (estado.cofreAberto || codigo.length >= 4) return;
  codigo += String(n);
  tocarBip(520, 0.06);
  atualizarVisor();
}

function limpar() {
  if (estado.cofreAberto) return;
  codigo = '';
  tocarBip(320, 0.08);
  atualizarVisor();
}

function confirmar() {
  if (estado.cofreAberto || codigo.length < 4) return;
  var v = $('#visor');

  if (codigo === SENHA_COFRE) {
    estado.cofreAberto = true;
    estado.acertos++;
    salvar();
    tocarBip(780, 0.18);
    if (v) {
      v.textContent = 'ABERTO';
      v.classList.add('ok');
    }
    var p = $('#painel-cofre');
    if (p) p.classList.add('aberto');
    fala('Cofre destrancado! A porta blindada abriu.');
    setTimeout(function () {
      abrirModal('Cofre Destrancado', `
        <p>Você acertou a combinação e abriu o cofre do Chef.</p>
        <a class="btn-pixel" href="cena4.html">Prosseguir →</a>
      `);
    }, 600);
  } else {
    estado.erros++;
    salvar();
    tocarBip(180, 0.25);
    if (v) {
      v.textContent = 'ERRO';
      v.classList.add('erro');
    }
    fala('Senha incorreta. Confira as anotações e tente novamente.');
    setTimeout(function () {
      codigo = '';
      atualizarVisor();
    }, 800);
  }
}

var teclado = $('#teclado-cofre');
if (teclado) {
  teclado.onclick = function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.n !== undefined) digitar(b.dataset.n);
    else if (b.dataset.a === 'limpar') limpar();
    else if (b.dataset.a === 'ok') confirmar();
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
  if (restante <= 0) fimDeJogo();
}

var relogio = setInterval(tick, 1000);

if (estado.cofreAberto) {
  var painel = $('#painel-cofre');
  if (painel) painel.classList.add('aberto');
  var visorInicial = $('#visor');
  if (visorInicial) {
    visorInicial.textContent = 'ABERTO';
    visorInicial.classList.add('ok');
  }
}

atualizarVisor();
tick();
fala('Cofre trancado. Digite a senha de 4 dígitos para destravar.');