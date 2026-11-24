var LISTA_ITENS = [
  {
    id: 'chave',
    nome: 'Chave de Fenda de Confeiteiro',
    icone: '🪛',
    imagem: '../img/chave de fenda.png',
    local: 'Cenário 1 · Despensa (sacos de farinha)',
    uso: 'Cenário 3 · Câmara Fria (painel do termostato)',
    desc: 'Serve para soltar os parafusos do painel do termostato na Câmara Fria.'
  },
  {
    id: 'mapa',
    nome: 'Mapa do Restaurante',
    icone: '🗺️',
    imagem: '../img/MAPA.jpg',
    local: 'Cenário 1 · Despensa (caixote de madeira)',
    uso: 'Inventário (clique para consultar)',
    desc: 'Mostra a planta baixa e a ligação entre todas as salas da cozinha.'
  },
  {
    id: 'baunilha',
    nome: 'Extrato de Baunilha Rara',
    icone: '🌿',
    imagem: '../img/EXTRATO DE BAUNILHA.png',
    local: 'Cenário 1 · Despensa (potes trancados)',
    uso: 'Cenário 6 · Bancada Final',
    desc: 'Essência aromática rara necessária para atingir a nota máxima no bolo.'
  },
  {
    id: 'termometro',
    nome: 'Termômetro Digital',
    icone: '🌡️',
    imagem: '../img/TERMOMETRO.png',
    local: 'Cenário 3 · Câmara Fria (atrás do termostato)',
    uso: 'Cenário 2 · Confeitaria (frasco de calda)',
    desc: 'Mede a temperatura exata para parar a calda no ponto de bola mole (118 °C).'
  },
  {
    id: 'yuzu',
    nome: 'Fruta de Yuzu Congelada',
    icone: '🍋',
    imagem: '../img/YUZU.png',
    local: 'Cenário 3 · Câmara Fria (freezer de frutas)',
    uso: 'Cenário 2 · Confeitaria (bancada de mármore)',
    desc: 'Precisa descongelar lentamente sobre o mármore frio antes de ser usada.'
  },
  {
    id: 'merengue',
    nome: 'Merengue Assado',
    icone: '🍥',
    imagem: '../img/MERENGUE.jpg',
    local: 'Cenário 2 · Confeitaria (forno superior)',
    uso: 'Cenário 6 · Bancada Final',
    desc: 'Merengue suíço seco e dourado em dois estágios de chama.'
  },
  {
    id: 'calda',
    nome: 'Calda no Ponto',
    icone: '🍯',
    imagem: '../img/CALDA.jpg',
    local: 'Cenário 2 · Confeitaria (frasco de calda)',
    uso: 'Cenário 6 · Bancada Final',
    desc: 'Calda caramelizada parada exatamente a 118 °C.'
  },
  {
    id: 'fragmentos',
    nome: 'Fragmentos da Página',
    icone: '📜',
    imagem: '../img/PAPEL.jpg',
    local: 'Espalhados pelos Cenários 1, 2, 3 e 4',
    uso: 'Cenário 4 · Escritório do Chef (estante de livros)',
    desc: 'Quatro pedaços rasgados que restauram a receita original do Bolo Clandestino.'
  },
  {
    id: 'livro',
    nome: 'Livro Restaurado',
    icone: '📖',
    imagem: '../img/LIVRO.png',
    local: 'Cenário 4 · Escritório do Chef',
    uso: 'Cenário 6 · Bancada Final',
    desc: 'Contém a ordem exata de montagem do bolo e revela a Chave Mestra.'
  },
  {
    id: 'chavemestra',
    nome: 'Chave Mestra',
    icone: '🗝️',
    imagem: '../img/CHAVE MESTRA.jpg',
    local: 'Cenário 4 · Escritório do Chef (dentro do livro restaurado)',
    uso: 'Cenário 4 · Armário de especiarias e porta de saída',
    desc: 'Abre o armário trancado e libera o acesso à Pista Principal.'
  }
];

function obterItemPorId(id) {
  for (var i = 0; i < LISTA_ITENS.length; i++) {
    if (LISTA_ITENS[i].id === id) {
      return LISTA_ITENS[i];
    }
  }
  return null;
}

function renderizarGuiaItens(seletorContainer) {
  var container = document.querySelector(seletorContainer);
  if (!container) return;

  var html = '';
  for (var i = 0; i < LISTA_ITENS.length; i++) {
    var item = LISTA_ITENS[i];
    html += `
      <article class="item">
        <div class="icone">
          <img src="${item.imagem}" alt="${item.nome}">
        </div>
        <h3>${item.icone} ${item.nome}</h3>
        <dl>
          <dt>Onde achar</dt>
          <dd>${item.local}</dd>
          <dt>Onde usar</dt>
          <dd>${item.uso}</dd>
          <dt>Função</dt>
          <dd>${item.desc}</dd>
        </dl>
      </article>
    `;
  }
  container.innerHTML = html;
}