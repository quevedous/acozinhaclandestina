const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;

const ORDEM_CORRETA = ['azul', 'verde', 'laranja', 'vermelho'];

const ITENS = {
    fragmentos: { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
  papel_dica: { 
    nome: 'Bilhete Enigma', 
    icone: '📜', 
    desc: 'Um bilhete antigo com charadas sobre a cor de cada reagente. Clique para ler.' 
  }
};

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  papelColetado: false,
  portaAberta: false,
  frascosAtuais: ['laranja', 'azul', 'vermelho', 'verde']
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
const escopo = $('#escopo');
const overlay = $('#modal-overlay');
const modalTitulo = $('#modal-titulo');
const modalCorpo = $('#modal-corpo');
let selecionado = null;
let travado = false;
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

const tempoInicio = setInterval(() => {
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  const cron = $('#cronometro');
  if(cron) {
    const m = String(Math.floor(restante / 60)).padStart(2, '0');
    const s = String(restante % 60).padStart(2, '0');
    cron.textContent = m + ':' + s;
    cron.classList.toggle('urgente', restante <= 60);
  }
  if (restante <= 0) {
    clearInterval(tempoInicio);
    travado = true;
    abrirModal('FORA DO TEMPO!', `<p>O tempo esgotou.</p><a class="btn-pixel" href="../index.html">Voltar ao menu</a>`);
  }
}, 1000);

escopo.addEventListener('mousemove', e => {
  const rect = escopo.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  escopo.style.setProperty('--x', x + '%');
  escopo.style.setProperty('--y', y + '%');

  const btnPapel = $('#no-papel-escondido');
  if (btnPapel && !estado.papelColetado) {
    const distanciaX = Math.abs((e.clientX - rect.left) - (btnPapel.offsetLeft + btnPapel.offsetWidth / 2));
    const distanciaY = Math.abs((e.clientY - rect.top) - (btnPapel.offsetTop + btnPapel.offsetHeight / 2));
    if (distanciaX < 110 && distanciaY < 110) {
      btnPapel.classList.add('iluminado');
    } else {
      btnPapel.classList.remove('iluminado');
    }
  }
});

function renderInventario() {
  const barra = $('#inventory-bar');
  if(!barra) return;
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
  if (!estado.inventario.includes(id)) estado.inventario.push(id);
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

const btnPapelEscondido = $('#no-papel-escondido');
if(btnPapelEscondido) {
  btnPapelEscondido.addEventListener('click', () => {
    if (estado.papelColetado) return;
    estado.papelColetado = true;
    salvar();
    btnPapelEscondido.remove();
    addItem('papel_dica');
    fala('Você achou um bilhete na escuridão e o guardou no inventário!');
    abrirEnigmaPapel();
  });
}

function abrirEnigmaPapel() {
  abrirModal('Bilhete Enigma · Anotações', `
    <div class="papel">
      <p><strong>Anotações encontradas na despensa:</strong></p>
      <p>Os frascos estão sem rótulo. O Chef só deixou charadas, e a ordem delas é a ordem da receita:</p>
      <ol>
        <li>"Pinto o céu num dia sem nuvens e encho o mar até o fundo. Sou fria, calma e profunda. Quem sou eu?"</li>
        <li>"Estou nas folhas, na hortelã e no sinal que manda passar. Quem sou eu?"</li>
        <li>"Tenho nome de fruta e o pôr do sol me veste. Fico entre o vermelho e o amarelo. Quem sou eu?"</li>
        <li>"Sou a cor do tomate maduro, do morango e do sinal de PARE. Quem sou eu?"</li>
      </ol>
      <p class="dica-modal">"A resposta de cada charada é a cor de um frasco. Coloque-os nessa ordem, da esquerda para a direita."</p>
    </div>
  `);
}

renderInventario();
fala('Mova o cursor pela tela escura para varrer o ambiente com a lanterna e achar o papel escondido.');