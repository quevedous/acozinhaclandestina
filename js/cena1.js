var CHAVE_ESTADO = 'cozinha_estado';
var DURACAO = 15 * 60;
var SENHA_PORTA = '6080';
var ORDEM_POTES = [1, 3, 2, 0];
var SIMBOLOS = [
  { e: '🌶️', n: 'Pimenta' },
  { e: '🌼', n: 'Baunilha' },
  { e: '⭐', n: 'Anis' },
  { e: '🪵', n: 'Canela' }
];
var ITENS = {
  fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
  chave: { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Vai servir para abrir um painel na Câmara Fria.' },
  mapa: { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha: { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' }
};

function carregarEstado() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ESTADO));
  } catch (e) {
    return null;
  }
}

var estado = carregarEstado() || {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  chavePega: false,
  mapaPego: false,
  potesAbertos: false,
  portaAberta: false
};

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

function fala(texto) {
  $('#mensagem').textContent = texto;
}

function abrirModal(titulo, html) {
  modalTitulo.textContent = titulo;
  modalCorpo.innerHTML = html;
  overlay.hidden = false;
}

function fecharModal() {
  if (travado) return;
  overlay.hidden = true;
  modalCorpo.innerHTML = '';
}

$('#modal-fechar').onclick = fecharModal;
overlay.onclick = function (e) {
  if (e.target === overlay) fecharModal();
};
document.onkeydown = function (e) {
  if (e.key === 'Escape') fecharModal();
};

function renderInventario() {
  var barra = $('#inventory-bar');
  var html = '';
  for (var i = 0; i < 6; i++) {
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

function agir(alvo, fn) {
  if (selecionado) {
    fala(ITENS[selecionado].nome + ' não funciona em: ' + alvo + '. Clique no item de novo para guardá-lo.');
    return;
  }
  fn();
}

function ligar(id, alvo, fn) {
  $(id).onclick = function () {
    agir(alvo, fn);
  };
}

function abrirMapa() {
  abrirModal('Mapa do Restaurante', `
    <div class="mapa">
      <div class="sala atual">1 · Despensa<br>(você está aqui)</div>
      <div class="sala">2 · Confeitaria e Fornos</div>
      <div class="sala">3 · Câmara Fria</div>
      <div class="sala">4 · Escritório do Chef</div>
      <div class="sala">5 · Pista Principal</div>
    </div>
    <p class="dica-modal">A saída da despensa leva à Estação de Confeitaria.</p>
  `);
}

function abrirBilhete() {
  abrirModal('Bilhete rasgado', `
    <div class="papel">
      <p>"...essas medidas misturadas me deixam louco! Para a fechadura da despensa:"</p>
      <p><strong>Parte 1:</strong> meia xícara de farinha = ___ g<br>(1 xícara de farinha = 120 g)</p>
      <p><strong>Parte 2:</strong> 176 °F = ___ °C<br>(°C = (°F − 32) ÷ 1,8)</p>
      <p>"A senha são as duas respostas juntas, nessa ordem."</p>
    </div>
  `);
}

function abrirCaixote() {
  abrirModal('Caixote de madeira', `
    <p>Entre legumes velhos, você acha um diário de capa vermelha.</p>
    <div class="papel">
      <p><strong>Diário do Chef · página 12</strong></p>
      <p>"A Pimenta é a mais forte de todas. A Baunilha é mais suave que a Canela. O Anis é mais forte que a Canela, mas perde para a Pimenta."</p>
      <p>"Nos potes trancados, a ordem é sempre do mais suave ao mais forte."</p>
    </div>
  `);
}

function abrirPotes() {
  if (estado.potesAbertos) {
    fala('Os potes já foram abertos. Só restam temperos comuns.');
    return;
  }
  var idx = [0, 0, 0, 0];
  var botoesDiscos = '';
  for (var i = 0; i < 4; i++) {
    botoesDiscos += `<button type="button" class="disco" data-i="${i}"></button>`;
  }

  abrirModal('Potes trancados', `
    <p>Quatro potes com travas de símbolos. Coloque-os na ordem certa.</p>
    <div class="discos">${botoesDiscos}</div>
    <button type="button" class="btn-pixel" id="abrir-potes">DESTRAVAR</button>
    <p class="dica-modal" id="potes-msg">Clique em cada pote para trocar o símbolo.</p>
  `);

  var discos = modalCorpo.querySelectorAll('.disco');
  function desenhar() {
    for (var j = 0; j < discos.length; j++) {
      discos[j].innerHTML = `<span class="emo">${SIMBOLOS[idx[j]].e}</span><span class="nm">${SIMBOLOS[idx[j]].n}</span>`;
    }
  }
  desenhar();

  for (var k = 0; k < discos.length; k++) {
    discos[k].onclick = function () {
      var pos = Number(this.dataset.i);
      idx[pos] = (idx[pos] + 1) % SIMBOLOS.length;
      desenhar();
    };
  }

  $('#abrir-potes').onclick = function () {
    if (idx.join() === ORDEM_POTES.join()) {
      estado.potesAbertos = true;
      estado.acertos++;
      salvar();
      addItem('baunilha');
      $('#no-potes').classList.add('coletado');
      fecharModal();
      fala('Clique! Um compartimento secreto abriu e você pegou o Extrato de Baunilha Rara.');
    } else {
      estado.erros++;
      salvar();
      $('#potes-msg').textContent = 'As travas não cederam. A ordem não está certa. Procure alguma pista.';
    }
  };
}

function abrirTeclado() {
  if (estado.portaAberta) {
    fala('A fechadura eletrônica já está destravada.');
    return;
  }
  var codigo = '';
  var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  var botoesNum = '';
  for (var i = 0; i < nums.length; i++) {
    botoesNum += `<button type="button" data-n="${nums[i]}">${nums[i]}</button>`;
  }

  abrirModal('Fechadura eletrônica', `
    <div class="visor" id="visor">----</div>
    <div class="teclado">
      ${botoesNum}
      <button type="button" data-a="limpar">C</button>
      <button type="button" data-n="0">0</button>
      <button type="button" data-a="ok">OK</button>
    </div>
    <p class="dica-modal">Digite os 4 dígitos da senha.</p>
  `);

  var visor = $('#visor');
  function atualizar() {
    visor.textContent = (codigo + '----').slice(0, 4);
  }

  modalCorpo.querySelector('.teclado').onclick = function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.n !== undefined) {
      if (codigo.length < 4) {
        codigo += b.dataset.n;
        atualizar();
      }
    } else if (b.dataset.a === 'limpar') {
      codigo = '';
      atualizar();
    } else if (b.dataset.a === 'ok' && codigo.length === 4) {
      if (codigo === SENHA_PORTA) {
        estado.portaAberta = true;
        estado.acertos++;
        salvar();
        $('#no-teclado').classList.add('aberta');
        fecharModal();
        fala(estado.mapaPego
          ? 'Bip! A luz ficou verde. A porta destravou. Agora é só sair.'
          : 'Bip! A luz ficou verde. Mas você não sabe o caminho. Falta achar o mapa do restaurante.');
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

function abrirPorta() {
  if (!estado.portaAberta) {
    abrirTeclado();
    return;
  }
  if (!estado.mapaPego) {
    fala('A porta está destravada, mas você não sabe o caminho. Falta o mapa do restaurante.');
    return;
  }
  abrirModal('Saída da despensa', `
    <p>Com o mapa em mãos, você empurra a porta e segue para a Estação de Confeitaria.</p>
    <a class="btn-pixel" href="cena2.html">Entrar →</a>
  `);
}

ligar('#no-porta', 'Porta', abrirPorta);
ligar('#no-teclado', 'Teclado', abrirTeclado);
ligar('#no-bilhete', 'Bilhete', abrirBilhete);
ligar('#no-caixote', 'Caixote', abrirCaixote);
ligar('#no-potes', 'Potes trancados', abrirPotes);

ligar('#no-mapa', 'Papel no caixote', function () {
  if (estado.mapaPego) {
    fala('Você já pegou o mapa.');
    return;
  }
  estado.mapaPego = true;
  salvar();
  addItem('mapa');
  $('#no-mapa').classList.add('coletado');
  fala('Você pegou o papel dobrado: é o mapa do restaurante! Clique nele no inventário para ver.');
});

ligar('#no-farinha', 'Sacos de farinha', function () {
  if (estado.chavePega) {
    fala('Só farinha e trigo. Não tem mais nada aqui.');
    return;
  }
  estado.chavePega = true;
  salvar();
  addItem('chave');
  $('#no-farinha').classList.add('coletado');
  fala('Você enfiou a mão no saco de farinha e sentiu algo de metal: uma chave de fenda de confeiteiro!');
});

ligar('#no-fechadura', 'Fechadura', function () {
  fala('Uma fechadura antiga, enferrujada. Não há chave por aqui, a porta usa o teclado.');
});
ligar('#no-janela', 'Janela', function () {
  fala('Uma janela com grades grossas. Lá fora é noite e não dá para passar.');
});
ligar('#no-barril', 'Barril', function () {
  fala('Um barril de metal vazio. Cheira a azeite velho.');
});
ligar('#no-potes-esq', 'Potes de tempero', function () {
  fala('Cravo, canela, pimenta... nenhum desses é baunilha. Os rótulos mais interessantes estão nos potes trancados, lá em cima.');
});

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
    <p>O concurso começou sem você. O Chef abre a porta, furioso, e você está demitido antes de tocar na bancada.</p>
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

if (estado.chavePega) $('#no-farinha').classList.add('coletado');
if (estado.mapaPego) $('#no-mapa').classList.add('coletado');
if (estado.potesAbertos) $('#no-potes').classList.add('coletado');
if (estado.portaAberta) $('#no-teclado').classList.add('aberta');
renderInventario();
tick();
fala('Você acorda trancado na despensa. Procure a senha da porta e o mapa do restaurante.');