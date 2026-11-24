(function () {
  'use strict';

  var abas = window.HUD_ABAS || {};
  var modal = document.getElementById('modal-aba');
  var botoes = document.querySelectorAll('.aba[data-aba]');

  function marcar(id) {
    for (var i = 0; i < botoes.length; i++) {
      botoes[i].classList.toggle('ativa', botoes[i].dataset.aba === id);
    }
  }

  function abrir(id) {
    var aba = abas[id];
    if (!aba) return;
    document.getElementById('aba-titulo').textContent = aba.titulo;
    var corpo = document.getElementById('aba-corpo');
    corpo.innerHTML = aba.html;
    corpo.scrollTop = 0;
    modal.hidden = false;
    marcar(id);
  }

  function fechar() {
    modal.hidden = true;
    marcar(null);
  }

  for (var i = 0; i < botoes.length; i++) {
    botoes[i].onclick = function () {
      if (!modal.hidden && this.classList.contains('ativa')) {
        fechar();
        return;
      }
      abrir(this.dataset.aba);
    };
  }

  document.getElementById('aba-fechar').onclick = fechar;
  modal.onclick = function (e) {
    if (e.target === modal) fechar();
  };
  document.onkeydown = function (e) {
    if (e.key === 'Escape' && !modal.hidden) fechar();
  };

  document.getElementById('btn-jogar').onclick = function () {
    try {
      localStorage.removeItem('cozinha_estado');
      localStorage.removeItem('cozinha_hud');
      localStorage.removeItem('daniela_intro');
      localStorage.removeItem('daniela_cena2');
      localStorage.removeItem('daniela_cena3');
      localStorage.removeItem('daniela_cena4');
    } catch (e) {}
  };
})();