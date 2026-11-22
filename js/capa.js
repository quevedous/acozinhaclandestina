/* Capa do jogo (jogar.html): abas + botão JOGAR que começa uma partida nova. */
(function () {
  'use strict';

  const abas = window.HUD_ABAS || {};
  const modal = document.getElementById('modal-aba');
  const botoes = document.querySelectorAll('.aba[data-aba]');

  const marcar = (id) => botoes.forEach((b) => b.classList.toggle('ativa', b.dataset.aba === id));

  function abrir(id) {
    const aba = abas[id];
    if (!aba) return;
    document.getElementById('aba-titulo').textContent = aba.titulo;
    const corpo = document.getElementById('aba-corpo');
    corpo.innerHTML = aba.html;
    corpo.scrollTop = 0;
    modal.hidden = false;
    marcar(id);
  }

  function fechar() {
    modal.hidden = true;
    marcar(null);
  }

  botoes.forEach((b) => b.addEventListener('click', () => {
    if (!modal.hidden && b.classList.contains('ativa')) { fechar(); return; }
    abrir(b.dataset.aba);
  }));
  document.getElementById('aba-fechar').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) fechar(); });

  // JOGAR = partida nova: zera o cronômetro, o inventário e o diário
  document.getElementById('btn-jogar').addEventListener('click', () => {
    try {
      sessionStorage.removeItem('cozinha_estado');
      sessionStorage.removeItem('cozinha_hud');
    } catch (e) {}
  });
})();