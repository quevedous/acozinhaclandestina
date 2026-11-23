/* ==================================================================
   PEDAÇOS DO LIVRO DE RECEITAS

   O livro rasgado do Escritório do Chef (cena 4) só se restaura com
   4 pedaços de papel espalhados pela cozinha:

     pedaço 0  → Despensa (cena 1)
     pedaço 1  → Confeitaria (cena 2)
     pedaço 2  → Câmara Fria (cena 3)
     pedaço 3  → Cofre dentro do barril (cena 4)

   Cada pedaço é 1 quadrante (2x2) da imagem img/livro_quebra-cabeca.png.

   Como usar numa cena (depois do script da própria cena):

     <link rel="stylesheet" href="../css/pedacos.css">          (no <head>)
     <script src="../js/pedacos.js"
             data-pedaco="0" data-x="43" data-y="88"></script>  (no fim do <body>)

   data-x / data-y = posição do pedaço no cenário, em % (opcional:
   data-giro = inclinação em graus). Sem data-pedaco o script só expõe
   a API window.Pedacos (é o que a cena 4 faz).

   Os pedaços coletados ficam em estado.pedacos (ex.: [0, 2]) e o item
   "fragmentos" aparece no inventário assim que o primeiro é pego.
================================================================== */
(function () {
  'use strict';

  const tag = document.currentScript;   // só existe enquanto o script roda
  const TOTAL = 4;
  const LOCAIS = [
    'Despensa (cena 1)',
    'Confeitaria (cena 2)',
    'Câmara Fria (cena 3)',
    'Cofre do barril (cena 4)'
  ];

  // estado, salvar, addItem, fala e selecionado são das próprias cenas
  const temEstado = () => typeof estado !== 'undefined';

  function lista() {
    return (temEstado() && Array.isArray(estado.pedacos)) ? estado.pedacos : [];
  }

  function tem(id) {
    return lista().includes(id);
  }

  // posição do quadrante dentro da imagem 2x2 (usada nas variáveis --px / --py)
  function quadrante(id) {
    return { px: (id % 2) * 100 + '%', py: Math.floor(id / 2) * 100 + '%' };
  }

  function coletar(id) {
    if (!temEstado()) return;

    // 1º o item: algumas cenas (ex.: cena 2) sincronizam o estado com o
    // sessionStorage dentro do addItem e descartariam o pedaço recém-pego.
    addItem('fragmentos');

    // 2º o pedaço, já no estado atualizado, e salva de novo
    if (!Array.isArray(estado.pedacos)) estado.pedacos = [];
    if (!estado.pedacos.includes(id)) estado.pedacos.push(id);
    salvar();

    const n = estado.pedacos.length;
    fala(n >= TOTAL
      ? 'Você juntou os 4 pedaços do livro! Clique nos livros da estante do Escritório do Chef para montar.'
      : 'Um pedaço de papel rasgado, de um livro de receitas! Você tem ' + n + ' de ' + TOTAL + '. Os outros estão espalhados pela cozinha.');
  }

  window.Pedacos = { total: TOTAL, locais: LOCAIS, lista, tem, coletar, quadrante };

  /* ---------- pedaço solto no cenário (cenas 1, 2 e 3) ---------- */
  function iniciar() {
    if (!tag || tag.dataset.pedaco === undefined || !temEstado()) return;

    const id = Number(tag.dataset.pedaco);
    const cena = document.querySelector('.cena, .escopo');
    if (!cena || tem(id)) return;

    const q = quadrante(id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'interactive-node pedaco-papel';
    b.dataset.nome = 'Pedaço de papel rasgado';
    b.setAttribute('aria-label', 'Pedaço de papel rasgado de um livro de receitas');
    b.style.left = (tag.dataset.x || 50) + '%';
    b.style.top = (tag.dataset.y || 50) + '%';
    b.style.setProperty('--giro', (tag.dataset.giro || -8) + 'deg');
    b.innerHTML = '<span class="pedaco-img" style="--px:' + q.px + ';--py:' + q.py + '"></span>';

    b.addEventListener('click', () => {
      if (typeof selecionado !== 'undefined' && selecionado && typeof ITENS !== 'undefined' && ITENS[selecionado]) {
        fala(ITENS[selecionado].nome + ' não funciona em: Pedaço de papel. Clique no item de novo para guardá-lo.');
        return;
      }
      b.remove();
      coletar(id);
    });

    cena.appendChild(b);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();