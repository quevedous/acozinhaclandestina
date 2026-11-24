var CHAVE_ESTADO = 'cozinha_estado';
var DURACAO = 15 * 60;
var BARRIL_PRECISA_CHAVE = true;

var VINHOS = [
  { id: 'A', nome: 'Tinto Reserva', ano: 2015, teor: 13.0 },
  { id: 'B', nome: 'Branco Seco',   ano: 2009, teor: 12.0 },
  { id: 'C', nome: 'Rosé da Casa',  ano: 2015, teor: 12.5 },
  { id: 'D', nome: 'Tinto Jovem',   ano: 2018, teor: 14.0 }
];
var ORDEM_VINHOS = ['B', 'C', 'A', 'D'];

var ITENS = {
  chave:        { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Já serviu para abrir o termostato.' },
  mapa:         { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha:     { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
  termometro:   { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Usado para medir o ponto da calda na Confeitaria.' },
  yuzu:         { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Precisa descongelar no mármore frio da Confeitaria.' },
  merengue:     { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
  calda:        { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' },
  fragmentos:   { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro rasgado da estante.' },
  livro:        { nome: 'Livro Restaurado', icone: '📖', desc: 'Mostra a ordem original da receita. Clique para ler.' },
  chavebarril:  { nome: 'Chave do Barril', icone: '🔑', desc: 'Selecione e clique no barril do canto esquerdo para abrir o cofre.' },
  chavemestra:  { nome: 'Chave Mestra', icone: '🗝️', desc: 'Selecione e clique na porta de saída para abrir.' }
};

if (typeof ItensFoto !== 'undefined') ItensFoto.completar(ITENS);

var PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  gavetaAberta: false,
  chaveBarril: false,
  barrilAberto: false,
  pedacos: [],
  livroRestaurado: false,
  chaveMestraPega: false
};

function carregarEstado() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)); } catch (e) { return null; }
}

var estado = Object.assign({}, PADRAO, carregarEstado() || {});
if (!Array.isArray(estado.pedacos)) estado.pedacos = [];

function salvar() {
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado)); } catch (e) {}
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
  for (var i = 0; i < 10; i++) {
    var id = estado.inventario[i];
    if (id && ITENS[id]) {
      var ativo = selecionado === id ? ' ativo' : '';
      html += `<button type="button" class="slot cheio${ativo}" data-item="${id}" title="${ITENS[id].nome}" aria-label="${ITENS[id].nome}">${ITENS[id].icone}</button>`;
    } else {
      html += '<div class="slot"></div>';
    }
  }
  barra.innerHTML = html;

  var botoes = barra.querySelectorAll('button.slot.cheio');
  for (var j = 0; j < botoes.length; j++) {
    var btn = botoes[j];
    var itemId = btn.dataset.item;
    if (typeof ItensFoto !== 'undefined') {
      ItensFoto.aplicar(btn, itemId, ITENS[itemId].icone);
    }
    btn.onclick = function () {
      clicarItem(this.dataset.item);
    };
  }
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
    if (estado.inventario[i] !== id) {
      novo.push(estado.inventario[i]);
    }
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
  if (id === 'livro') {
    selecionado = null;
    renderInventario();
    abrirPaginaLivro(false);
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
  $(id).onclick = function () {
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
      <div class="sala">3 · Câmara Fria</div>
      <div class="sala atual">4 · Escritório do Chef<br>(você está aqui)</div>
      <div class="sala">5 · Pista Principal</div>
    </div>
    <p class="dica-modal">A porta de madeira à direita leva à Pista Principal.</p>
  `);
}

function abrirQuadro() {
  abrirModal('Quadro de avisos', `
    <div class="papel">
      <p><strong>ERROS DE ESTAGIÁRIOS</strong></p>
      <p>1) Misturou °F com °C e queimou o merengue.<br>
         2) Rasgou a receita original e sumiu com as páginas.<br>
         3) Trocou a ordem das garrafas da adega e trancou a gaveta da minha mesa.</p>
      <p><strong>Regra da adega do Chef:</strong> da safra mais ANTIGA para a mais NOVA. Se duas forem do mesmo ano, a de MENOR teor alcoólico vem primeiro.</p>
    </div>
  `);
}

function abrirNotaMaster() {
  abrirModal('Bilhete no quadro', `
    <div class="papel">
      <p><strong>MASTER KEY ESTÁ NO LIVRO</strong></p>
      <p>"Guardei a chave mestra no armário embaixo da estante. A trava só solta para quem restaurar o livro de receitas, aquele de cima, com as páginas arrancadas."</p>
      <p>"O último pedaço do livro eu tranquei no cofre do barril. A chavinha? Na gaveta da minha mesa."</p>
    </div>
  `);
}

function abrirEsboco() {
  abrirModal('Desenho do livro', `
    <div class="papel">
      <p>Um desenho a lápis de um livro de receitas fechado: capa cor de vinho, com uma estrela dourada no meio, detalhes dourados nos cantos e uma fita vermelha marcando a página.</p>
      <p>Era assim o livro da estante antes de ser rasgado.</p>
    </div>
  `);
}

function abrirBarril() {
  if (estado.barrilAberto) {
    fala('O cofre do barril está aberto e vazio. O último pedaço do livro já é seu.');
    return;
  }
  if (BARRIL_PRECISA_CHAVE && !estado.chaveBarril) {
    fala('A tampa do barril tem uma fechadura de cofre e está trancada: falta a chave. Há uma chave pendurada no quadro de avisos.');
    return;
  }
  abrirCofreBarril();
}

function abrirCartazBarril() {
  abrirModal('Cartaz do barril', `
    <div class="papel">
      <p><strong>PISTAS PARA O LIVRO</strong></p>
      <p>Foto do livro de receitas original, antes de ser rasgado:</p>
      <div class="ref"><img src="../img/livro_quebra-cabeca.png" alt="Livro de receitas de capa vinho com uma estrela dourada e uma fita vermelha"></div>
      <p>"O Chef rasgou a capa em 4 pedaços e escondeu pela cozinha: um na despensa, um na confeitaria, um na câmara fria e o último aqui, trancado no cofre dentro do barril. Juntando os 4, as peças formam esta imagem."</p>
    </div>
    <p class="dica-modal">O cartaz é só uma pista. O cofre fica dentro do barril: clique no barril, fora do cartaz.</p>
  `);
}

function abrirCofreBarril() {
  abrirModal('Cofre dentro do barril', `
    <p>Você gira a chavinha e a tampa se abre: dentro do barril há um cofre. Siga o bilhete: gire o disco até cada número, <strong>no sentido da seta</strong>, e depois gire o timão.</p>
    <div id="cofre-area"></div>
  `);
  var cofre = Cofre.montar($('#cofre-area'), {
    aoConcluir: function () {
      estado.barrilAberto = true;
      estado.acertos++;
      salvar();
      removerItem('chavebarril');
      fecharModal();
      Pedacos.coletar(3);
      var tenho = Pedacos.lista().length;
      fala(tenho >= Pedacos.total
        ? 'O cofre abriu e dentro estava o último pedaço do livro! Agora você tem os 4: clique nos livros da estante para montar.'
        : 'O cofre abriu e dentro havia um pedaço do livro de receitas. Você tem ' + tenho + ' de ' + Pedacos.total + ': os outros estão nas cenas anteriores.');
    }
  });
  aoFechar = function () {
    cofre.destruir();
  };
}

function buscarVinho(id) {
  for (var i = 0; i < VINHOS.length; i++) {
    if (VINHOS[i].id === id) return VINHOS[i];
  }
  return null;
}

function abrirGaveta() {
  if (estado.gavetaAberta) {
    fala('A gaveta secreta está aberta e vazia. Você já pegou a chavinha do barril.');
    return;
  }
  var ordem = ['D', 'A', 'B', 'C'];
  abrirModal('Gaveta secreta da mesa', `
    <p>A gaveta tem quatro encaixes de garrafa em relevo. Coloque os vinhos na ordem certa, da esquerda para a direita.</p>
    <div class="vinhos" id="vinhos"></div>
    <button type="button" class="btn-pixel" id="abrir-gaveta">ABRIR GAVETA</button>
    <p class="dica-modal" id="gaveta-msg">Use as setas para mudar a ordem. A regra do Chef está no quadro de avisos.</p>
  `);
  var cont = $('#vinhos');
  function desenhar() {
    var html = '';
    for (var i = 0; i < ordem.length; i++) {
      var id = ordem[i];
      var v = buscarVinho(id);
      var disEsq = i === 0 ? ' disabled' : '';
      var disDir = i === ordem.length - 1 ? ' disabled' : '';
      html += `
        <div class="vinho">
          <span class="garrafa">🍾</span>
          <span class="v-nome">${v.nome}</span>
          <span class="v-info">Safra ${v.ano}<br>${v.teor.toFixed(1).replace('.', ',')}%</span>
          <span class="v-setas">
            <button type="button" data-i="${i}" data-d="-1"${disEsq} aria-label="Mover para a esquerda">◀</button>
            <button type="button" data-i="${i}" data-d="1"${disDir} aria-label="Mover para a direita">▶</button>
          </span>
        </div>
      `;
    }
    cont.innerHTML = html;
  }
  desenhar();

  cont.onclick = function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    var i = Number(b.dataset.i);
    var d = Number(b.dataset.d);
    var t = ordem[i];
    ordem[i] = ordem[i + d];
    ordem[i + d] = t;