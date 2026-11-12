const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;

const VINHOS = [
  { id: 'A', nome: 'Tinto Reserva', ano: 2015, teor: 13.0 },
  { id: 'B', nome: 'Branco Seco',   ano: 2009, teor: 12.0 },
  { id: 'C', nome: 'Rosé da Casa',  ano: 2015, teor: 12.5 },
  { id: 'D', nome: 'Tinto Jovem',   ano: 2018, teor: 14.0 }
];
const ORDEM_VINHOS = ['B', 'C', 'A', 'D'];

const CENA_SVG = `
<rect x="0" y="0" width="200" height="200" fill="#f3e7c4"/>
<rect x="0" y="172" width="200" height="28" fill="#4a3428"/>
<rect x="0" y="184" width="200" height="3" fill="#2C221E"/>
<rect x="98" y="0" width="4" height="22" fill="#2C221E"/>
<rect x="88" y="22" width="24" height="12" fill="#ffe88a" stroke="#2C221E" stroke-width="3"/>
<rect x="92" y="52" width="16" height="12" fill="#e6b800" stroke="#2C221E" stroke-width="3"/>
<rect x="108" y="50" width="12" height="7" fill="#4caf50" stroke="#2C221E" stroke-width="2"/>
<rect x="94" y="64" width="12" height="16" fill="#fffbe9" stroke="#2C221E" stroke-width="3"/>
<rect x="82" y="80" width="36" height="16" fill="#fffbe9" stroke="#2C221E" stroke-width="3"/>
<rect x="70" y="96" width="60" height="18" fill="#fffbe9" stroke="#2C221E" stroke-width="3"/>
<rect x="58" y="114" width="84" height="28" fill="#fffbe9" stroke="#2C221E" stroke-width="3"/>
<rect x="61" y="131" width="78" height="8" fill="#e8c37a"/>
<rect x="44" y="142" width="112" height="8" fill="#d9534f" stroke="#2C221E" stroke-width="2"/>
<rect x="24" y="150" width="152" height="14" fill="#ffffff" stroke="#2C221E" stroke-width="3"/>
<rect x="30" y="164" width="140" height="8" fill="#cfd8dc"/>
<rect x="10" y="128" width="6" height="44" fill="#8a7a6c" stroke="#2C221E" stroke-width="2"/>
<rect x="5" y="118" width="16" height="12" fill="#cfd8dc" stroke="#2C221E" stroke-width="2"/>
<rect x="172" y="144" width="20" height="28" fill="#a23b3b" stroke="#2C221E" stroke-width="3"/>
<rect x="170" y="138" width="24" height="8" fill="#d9c8a0" stroke="#2C221E" stroke-width="2"/>
`;
const PECAS = [[0, 0], [100, 0], [0, 100], [100, 100]];
function svgPeca(x, y) {
  return '<svg viewBox="' + x + ' ' + y + ' 100 100" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' + CENA_SVG + '</svg>';
}
function svgInteiro() {
  return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' + CENA_SVG + '</svg>';
}

const ITENS = {
  chave:        { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Já serviu para abrir o termostato.' },
  mapa:         { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha:     { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
  termometro:   { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Usado para medir o ponto da calda na Confeitaria.' },
  yuzu:         { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Precisa descongelar no mármore frio da Confeitaria.' },
  merengue:     { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
  calda:        { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' },
  fragmentos:   { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de uma página arrancada. Clique no livro rasgado da estante.' },
  livro:        { nome: 'Livro Restaurado', icone: '📖', desc: 'Mostra a ordem original da receita. Clique para ler.' },
  chavemestra:  { nome: 'Chave Mestra', icone: '🗝️', desc: 'Clique no armário de especiarias ou na porta de saída.' },
  especiarias:  { nome: 'Especiarias Raras', icone: '🧂', desc: 'Servem para decorar o prato final.' }
};

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  gavetaAberta: false,
  livroRestaurado: false,
  chaveMestraPega: false,
  armarioAberto: false
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
  for (let i = 0; i < 10; i++) {
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
      <p>"Escondi a chave mestra atrás de uma página do livro de receitas. Quem restaurar o livro, acha a chave."</p>
    </div>
  `);
}

function abrirEsboco() {
  abrirModal('Desenho do livro aberto', `
    <div class="papel">
      <p>Um desenho a lápis de um livro aberto. As páginas arrancadas mostravam a sobremesa final, vista de lado:</p>
      <p>no alto, uma lâmpada; depois uma fatia de yuzu com folha de hortelã; o merengue dourado; a calda vermelha; o prato; e, embaixo, a mesa de madeira.</p>
    </div>
  `);
}

function abrirBarril() {
  abrirModal('Pistas (para o livro)', `
    <div class="papel">
      <p><strong>PISTAS PARA O LIVRO</strong></p>
      <p>Foto da página original, antes de ser rasgada:</p>
      <div class="ref">${svgInteiro()}</div>
      <p>"Quando juntar os fragmentos, as quatro peças devem formar esta imagem."</p>
    </div>
  `);
}

function abrirGaveta() {
  if (estado.gavetaAberta) {
    fala('A gaveta secreta está aberta e vazia.');
    return;
  }
  const ordem = ['D', 'A', 'B', 'C'];
  abrirModal('Gaveta secreta da mesa', `
    <p>A gaveta tem quatro encaixes de garrafa em relevo. Coloque os vinhos na ordem certa, da esquerda para a direita.</p>
    <div class="vinhos" id="vinhos"></div>
    <button type="button" class="btn-pixel" id="abrir-gaveta">ABRIR GAVETA</button>
    <p class="dica-modal" id="gaveta-msg">Use as setas para mudar a ordem. A regra do Chef está no quadro de avisos.</p>
  `);
  const cont = $('#vinhos');
  const desenhar = () => {
    cont.innerHTML = ordem.map((id, i) => {
      const v = VINHOS.find(x => x.id === id);
      return '<div class="vinho"><span class="garrafa">🍾</span>' +
        '<span class="v-nome">' + v.nome + '</span>' +
        '<span class="v-info">Safra ' + v.ano + '<br>' + v.teor.toFixed(1).replace('.', ',') + '%</span>' +
        '<span class="v-setas">' +
        '<button type="button" data-i="' + i + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Mover para a esquerda">◀</button>' +
        '<button type="button" data-i="' + i + '" data-d="1"' + (i === ordem.length - 1 ? ' disabled' : '') + ' aria-label="Mover para a direita">▶</button>' +
        '</span></div>';
    }).join('');
  };
  desenhar();
  cont.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const i = Number(b.dataset.i);
    const d = Number(b.dataset.d);
    const t = ordem[i];
    ordem[i] = ordem[i + d];
    ordem[i + d] = t;
    desenhar();
  });
  $('#abrir-gaveta').addEventListener('click', () => {
    if (ordem.join() === ORDEM_VINHOS.join()) {
      estado.gavetaAberta = true;
      estado.acertos++;
      salvar();
      addItem('fragmentos');
      fecharModal();
      fala('Clique! A gaveta abriu e dentro havia fragmentos de uma página arrancada. Leve-os ao livro rasgado da estante.');
    } else {
      estado.erros++;
      salvar();
      $('#gaveta-msg').textContent = 'A gaveta não cedeu. A ordem não está certa. Releia a regra do Chef no quadro de avisos.';
    }
  });
}

function abrirPaginaLivro(novo) {
  abrirModal('Livro restaurado', `
    <div class="papel">
      <p><strong>Receita original · Sobremesa do Chef</strong></p>
      <ol>
        <li>Derreter</li>
        <li>Emulsionar</li>
        <li>Resfriar</li>
        <li>Assar</li>
        <li>Descansar</li>
        <li>Empratar</li>
      </ol>
      <p>"Nunca inverta a ordem. Quem inverte lava louça."</p>
    </div>
    ${novo ? '<p style="margin-top:12px">Atrás da página colada você achou uma <strong>chave mestra</strong> dourada!</p>' : '<p class="dica-modal">Guarde essa ordem para a Pista Principal.</p>'}
  `);
}

function abrirQuebraCabeca() {
  selecionado = null;
  renderInventario();
  const deg = PECAS.map(() => 90 * (1 + Math.floor(Math.random() * 3)));
  let resolvido = false;
  abrirModal('Restaurar o livro', `
    <p>Clique em cada fragmento para girá-lo, até formar a imagem completa da sobremesa.</p>
    <div class="quebra" id="quebra">
      ${PECAS.map((p, i) => '<button type="button" class="peca" data-i="' + i + '" aria-label="Fragmento ' + (i + 1) + '"><span class="peca-img" id="pc' + i + '">' + svgPeca(p[0], p[1]) + '</span></button>').join('')}
    </div>
    <p class="dica-modal">O quadro de avisos e o barril têm pistas de como é a página original.</p>
  `);
  const aplicar = () => deg.forEach((d, i) => { $('#pc' + i).style.transform = 'rotate(' + d + 'deg)'; });
  aplicar();
  $('#quebra').addEventListener('click', e => {
    const b = e.target.closest('.peca');
    if (!b || resolvido) return;
    deg[Number(b.dataset.i)] += 90;
    aplicar();
    if (deg.every(d => d % 360 === 0)) {
      resolvido = true;
      setTimeout(() => {
        estado.livroRestaurado = true;
        estado.chaveMestraPega = true;
        estado.acertos++;
        salvar();
        removerItem('fragmentos');
        addItem('livro');
        addItem('chavemestra');
        abrirPaginaLivro(true);
        fala('Você restaurou o livro e achou a chave mestra escondida atrás da página!');
      }, 500);
    }
  });
}

function abrirLivro() {
  if (estado.livroRestaurado) {
    abrirPaginaLivro(false);
  } else if (estado.inventario.includes('fragmentos')) {
    abrirQuebraCabeca();
  } else {
    fala('Um livro de receitas rústico com as páginas centrais arrancadas. Faltam os fragmentos da página.');
  }
}

function usarChaveNoArmario() {
  if (estado.armarioAberto) {
    fala('O armário de especiarias já está aberto.');
    return;
  }
  estado.armarioAberto = true;
  estado.acertos++;
  salvar();
  selecionado = null;
  addItem('especiarias');
  renderInventario();
  fala('A chave mestra girou na fechadura! Dentro do armário você pegou as Especiarias Raras.');
}
function abrirArmario() {
  if (estado.armarioAberto) {
    fala('O armário de especiarias está aberto. Você já pegou as especiarias raras.');
  } else if (estado.inventario.includes('chavemestra')) {
    usarChaveNoArmario();
  } else {
    fala('O armário de especiarias está trancado com uma fechadura dourada. Só uma chave mestra abre. O quadro de avisos diz onde ela está.');
  }
}

function abrirPorta() {
  if (!estado.chaveMestraPega) {
    fala('A porta está trancada por uma fechadura antiga. Só uma chave mestra abre. O quadro de avisos diz onde ela está.');
    return;
  }
  if (!estado.armarioAberto) {
    fala('A chave mestra gira, mas há um bilhete preso na porta: "Só passa quem já abriu o armário de especiarias."');
    return;
  }
  abrirModal('Pista Principal', `
    <p>A porta se abre e você vê a cozinha principal, com luzes intensas e a bancada de empratamento. A avaliação do Chef está para começar.</p>
    <a class="btn-pixel" href="cena5.html">Entrar →</a>
  `);
}

ligar('#no-quadro', 'Quadro', abrirQuadro);
ligar('#no-notamaster', 'Bilhete', abrirNotaMaster);
ligar('#no-esboco', 'Desenho', abrirEsboco);
ligar('#no-barril', 'Barril', abrirBarril);
ligar('#no-gaveta', 'Gaveta', abrirGaveta);
ligar('#no-livro', 'Livro', abrirLivro);
ligar('#no-armario', 'Armário', abrirArmario, { chavemestra: usarChaveNoArmario });
ligar('#no-porta', 'Porta', abrirPorta, { chavemestra: abrirPorta });
ligar('#no-fechadura', 'Fechadura', abrirPorta, { chavemestra: abrirPorta });

ligar('#no-poster-esq', 'Cartaz', () => fala('Uma cópia do cartaz do enigma das densidades da Câmara Fria, toda manchada. O Chef decorou o escritório com os próprios enigmas.'));
ligar('#no-poster-centro', 'Cartaz', () => fala('Outra cópia do cartaz das densidades. Nada de novo aqui, você já resolveu esse enigma.'));
ligar('#no-estante', 'Estante', () => fala('Uma estante cheia de livros de receitas rústicos. Quase todos estão inteiros. Procure o que está com páginas arrancadas.'));
ligar('#no-mesa', 'Mesa', () => fala('Uma mesa de carvalho maciço. A gaveta do meio tem uma trava estranha, com encaixes de garrafa.'));
ligar('#no-trofeus-chapeu', 'Troféus', () => fala('Troféus de chapéu de chef dourado. "Melhor Sobremesa do Ano", três anos seguidos.'));
ligar('#no-trofeus-panela', 'Troféus', () => fala('Troféus de panela de cobre. Estão sem poeira: o Chef os limpa todo dia.'));
ligar('#no-cupula', 'Redoma', () => fala('Uma redoma de vidro com uma planta verde estranha. A plaquinha diz: "Hortelã do Chef. Não tocar."'));
ligar('#no-timer', 'Timer', () => fala('Um timer digital parado em 121. Parece uma temperatura que você já viu na Confeitaria.'));
ligar('#no-baunilha', 'Garrafa', () => fala('Uma garrafa de extrato de baunilha rara, quase vazia. Ainda bem que você já pegou a sua.'));
ligar('#no-chave-quadro', 'Chave', () => fala('Uma chave dourada presa ao quadro. Está soldada na cortiça: é só enfeite. O bilhete ao lado diz que a master key está no livro.'));
ligar('#no-bilhetes', 'Bilhetes', () => fala('Vários bilhetes iguais: "176 °F = 80 °C". O Chef cansou de ver estagiário errar essa conversão.'));

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

renderInventario();
tick();
fala('Escritório secreto do Chef. Ache a ordem original do livro de receitas e a chave mestra do armário de especiarias.');