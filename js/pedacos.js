(function () {
  'use strict';

  var tag = document.currentScript;
  var TOTAL = 4;
  var LOCAIS = [
    'Despensa (cena 1)',
    'Confeitaria (cena 2)',
    'Câmara Fria (cena 3)',
    'Gaveta secreta da mesa (cena 4)'
  ];

  function temEstado() {
    return typeof estado !== 'undefined';
  }

  function lista() {
    return (temEstado() && Array.isArray(estado.pedacos)) ? estado.pedacos : [];
  }

  function tem(id) {
    var arr = lista();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === id) return true;
    }
    return false;
  }

  function quadrante(id) {
    return {
      px: (id % 2) * 100 + '%',
      py: Math.floor(id / 2) * 100 + '%'
    };
  }

  function coletar(id) {
    if (!temEstado()) return;
    addItem('fragmentos');
    if (!Array.isArray(estado.pedacos)) estado.pedacos = [];
    if (!tem(id)) estado.pedacos.push(id);
    salvar();

    var n = estado.pedacos.length;
    if (n >= TOTAL) {
      fala('Você juntou os 4 pedaços do livro! Clique no livro rasgado da estante do Escritório do Chef para montar.');
    } else {
      fala('Um pedaço de papel rasgado, de um livro de receitas! Você tem ' + n + ' de ' + TOTAL + '. Os outros estão espalhados pela cozinha.');
    }
  }

  window.Pedacos = {
    total: TOTAL,
    locais: LOCAIS,
    lista: lista,
    tem: tem,
    coletar: coletar,
    quadrante: quadrante
  };

  function iniciar() {
    if (!tag || tag.dataset.pedaco === undefined || !temEstado()) return;

    var id = Number(tag.dataset.pedaco);
    var cena = document.querySelector('.cena, .escopo');
    if (!cena || tem(id)) return;

    var q = quadrante(id);
    var x = tag.dataset.x || 50;
    var y = tag.dataset.y || 50;
    var giro = tag.dataset.giro || -8;

    cena.insertAdjacentHTML('beforeend', `
      <button type="button" id="pedaco-${id}" class="interactive-node pedaco-papel"
        data-nome="Pedaço de papel rasgado"
        aria-label="Pedaço de papel rasgado de um livro de receitas"
        style="left:${x}%;top:${y}%;--giro:${giro}deg">
        <span class="pedaco-img" style="--px:${q.px};--py:${q.py}"></span>
      </button>
    `);

    var b = document.getElementById('pedaco-' + id);
    if (!b) return;
    b.onclick = function () {
      if (typeof selecionado !== 'undefined' && selecionado && typeof ITENS !== 'undefined' && ITENS[selecionado]) {
        fala(ITENS[selecionado].nome + ' não funciona em: Pedaço de papel. Clique no item de novo para guardá-lo.');
        return;
      }
      b.remove();
      coletar(id);
    };
  }

  if (document.readyState === 'loading') {
    var prev = window.onload;
    window.onload = function (e) {
      if (prev) prev(e);
      iniciar();
    };
  } else {
    iniciar();
  }
})();