/* ==================================================================
   FOTOS DOS ITENS DO INVENTÁRIO

   Um lugar só para dizer qual imagem cada item usa. Item que não está
   na lista (ou cuja imagem não carrega) continua com o emoji.

   Para trocar/adicionar a foto de um item: edite FOTOS abaixo e coloque
   o arquivo na pasta img/. Cada item pode ter mais de um nome de
   arquivo; vale o primeiro que existir.

   Carregue ESTE script antes do script da cena:
     <script src="../js/itens.js"></script>
================================================================== */
(function () {
  'use strict';

  // pasta img/ calculada a partir do próprio script (js/itens.js → ../img/)
  const BASE = new URL('../img/', document.currentScript.src).href;

  const FOTOS = {
    chave:       ['chave de fenda.png'],
    mapa:        ['MAPA.jpg', 'MAPA.JPG'],
    baunilha:    ['EXTRATO DE BAUNILHA.png'],
    termometro:  ['TERMOMETRO DIGITAL.jpg', 'TERMOMETRO DIGITAL.JPG', 'TERMOMETRO.png'],
    yuzu:        ['YUZU.png'],
    merengue:    ['MERENGUE.jpg', 'MERENGUE.JPG'],
    calda:       ['CALDA.jpg', 'CALDA.JPG'],
    livro:       ['LIVRO.png'],
    chavemestra: ['CHAVE MESTRA.jpg', 'CHAVE MESTRA.JPG'],
    chavebarril: ['CHAVE BARRIL.jpg', 'CHAVE BARRIL.JPG'],
    chave_porta: ['CHAVE DESPENSA.jpg', 'CHAVE DESPENSA.JPG'],
    papel_dica:  ['PAPEL.jpg', 'PAPEL.JPG']
    // fragmentos: sem foto, usa o emoji
  };


  // Catálogo completo: toda cena chama ItensFoto.completar(ITENS) para que
  // qualquer item do inventário apareça em qualquer cena (sem sobrescrever
  // o que a cena já definiu).
  const CATALOGO = {
    fragmentos:  { nome: 'Fragmentos da Página', icone: '📜', desc: 'Pedaços de um livro de receitas rasgado. Junte os 4 e monte o livro no Escritório do Chef.' },
    chave:       { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Serve para abrir painéis parafusados.' },
    mapa:        { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
    baunilha:    { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
    termometro:  { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Selecione e clique no frasco de calda para medir o ponto.' },
    yuzu:        { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Precisa descongelar aos poucos. O mármore frio ajuda.' },
    merengue:    { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
    calda:       { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' },
    livro:       { nome: 'Livro Restaurado', icone: '📖', desc: 'Mostra a ordem original da receita. Clique para ler.' },
    chavemestra: { nome: 'Chave Mestra', icone: '🗝️', desc: 'Abre a porta de saída do Escritório do Chef.' },
    chavebarril: { nome: 'Chave do Barril', icone: '🔑', desc: 'Abre o cofre dentro do barril do Escritório do Chef.' },
    papel_dica:  { nome: 'Bilhete Enigma', icone: '📜', desc: 'Um bilhete antigo com códigos RGB dos reagentes. Clique para ler.' },
    chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑', desc: 'Obtida ao resolver o enigma dos frascos na bancada. Use no alçapão do chão.' }
  };

  function completar(itens) {
    Object.keys(CATALOGO).forEach((id) => { if (!itens[id]) itens[id] = CATALOGO[id]; });
    return itens;
  }

  const url = (arquivo) => BASE + encodeURIComponent(arquivo);

  // Troca o conteúdo de `el` pela foto do item (ou pelo emoji, se não houver).
  function aplicar(el, id, emoji) {
    const lista = FOTOS[id];
    el.textContent = '';
    if (!lista) { el.textContent = emoji || ''; return; }
    const img = document.createElement('img');
    img.className = 'foto-item';
    img.alt = '';
    img.draggable = false;
    let i = 0;
    img.addEventListener('error', () => {
      i++;
      if (i < lista.length) img.src = url(lista[i]);
      else { img.remove(); el.textContent = emoji || ''; }
    });
    img.src = url(lista[0]);
    el.appendChild(img);
  }

  // versão em texto (para montar HTML em string)
  function html(id, emoji) {
    const lista = FOTOS[id];
    if (!lista) return emoji || '';
    return '<img class="foto-item" alt="" draggable="false" src="' + url(lista[0]) + '">';
  }

  const css = document.createElement('style');
  css.textContent =
    '.slot .foto-item{display:block;width:100%;height:100%;object-fit:contain;' +
    'image-rendering:auto;pointer-events:none;user-select:none}' +
    '.slot.cheio{overflow:hidden}' +
    '.diario-lista .foto-item{width:28px;height:28px;object-fit:contain;vertical-align:middle;image-rendering:auto}';
  document.head.appendChild(css);

  window.ItensFoto = { aplicar, html, completar, catalogo: CATALOGO, fotos: FOTOS };
})();