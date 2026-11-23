/* ==================================================================
   TASK DO COFRE (barril da cena 4)
   Inspirada na task "Unlock Safe" da Airship, de Among Us:

     1) O bilhete mostra a combinação, um número por vez, com a seta
        do sentido em que o disco deve girar (horário ↻ / anti-horário ↺).
     2) Gire o disco até o número e solte. Se o número e o lado estiverem
        certos, ele trava e o próximo número aparece. Lado errado: o
        disco volta para o último número travado.
     3) Com os 3 números travados, o timão de 3 hastes destrava: gire-o
        no sentido horário (270°) para abrir o cofre.

   Dá para girar arrastando com o mouse/dedo, com os botões ↺ ↻ ou com
   as setas do teclado.

   Uso:
     const t = Cofre.montar(elemento, { aoConcluir: () => { ... } });
     t.destruir();   // ao fechar a janela
================================================================== */
(function () {
  'use strict';

  const GRAUS_POR_NUMERO = 36;          // 10 números no disco
  const GRAUS_BOTAO_TIMAO = 30;
  const VOLTA_TIMAO = 270;              // quanto girar o timão (horário)
  const DIRECOES = ['h', 'a', 'h'];     // h = horário, a = anti-horário
  const NOME_DIR = { h: 'horário', a: 'anti-horário' };
  const SETA_DIR = { h: '↻', a: '↺' };
  const CIRC = 2 * Math.PI * 92;        // anel de progresso do timão

  const mod = (n, m) => ((n % m) + m) % m;

  // 3 números de 1 a 9, nunca iguais ao anterior (o disco começa no 0)
  function sortear() {
    const alvos = [];
    let anterior = 0;
    for (let i = 0; i < DIRECOES.length; i++) {
      let n;
      do { n = 1 + Math.floor(Math.random() * 9); } while (n === anterior);
      alvos.push(n);
      anterior = n;
    }
    return alvos;
  }

  const BRACO = 'M91 100 L87 36 L74 22 L74 14 L126 14 L126 22 L113 36 L109 100 Z';

  function montar(container, opcoes) {
    opcoes = opcoes || {};
    const alvos = opcoes.alvos || sortear();

    let passo = 0;               // quantos números já travaram
    let fase = 'disco';          // 'disco' | 'timao' | 'aberto'
    let angDisco = 0;            // ângulo acumulado do disco
    let angRef = 0;              // ângulo do último número travado
    let angTimao = 0;            // ângulo acumulado do timão
    let giroTimao = 0;           // progresso do timão (0 a VOLTA_TIMAO)
    let timerAvaliar = null;
    let timerFim = null;

    const numeros = Array.from({ length: 10 }, (_, i) =>
      '<span class="cofre-num" data-n="' + i + '" style="--a:' + (i * GRAUS_POR_NUMERO) + 'deg">' + i + '</span>').join('');

    container.innerHTML = `
      <div class="cofre">
        <div class="cofre-bilhete" aria-live="polite">
          <span class="cofre-bilhete-titulo">COMBINAÇÃO</span>
          <div class="cofre-numeros" id="cofre-numeros"></div>
        </div>

        <div class="cofre-mesa">
          <div class="cofre-disco-area">
            <div class="cofre-disco" id="cofre-disco" tabindex="0" role="slider" aria-label="Disco do cofre" aria-valuemin="0" aria-valuemax="9" aria-valuenow="0">
              ${numeros}
              <div class="cofre-botao" id="cofre-botao"><span class="cofre-ponteiro"></span></div>
            </div>
            <div class="cofre-botoes">
              <button type="button" data-g="disco-" aria-label="Girar o disco para a esquerda (anti-horário)">↺</button>
              <button type="button" data-g="disco+" aria-label="Girar o disco para a direita (horário)">↻</button>
            </div>
          </div>

          <div class="cofre-timao-area">
            <svg class="cofre-timao trancado" id="cofre-timao" viewBox="0 0 200 200" tabindex="0" role="slider" aria-label="Timão do cofre" aria-disabled="true">
              <circle class="anel-fundo" cx="100" cy="100" r="92"/>
              <circle class="anel" id="cofre-anel" cx="100" cy="100" r="92" transform="rotate(-90 100 100)" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"/>
              <g id="cofre-giro">
                <path class="braco" d="${BRACO}"/>
                <path class="braco" d="${BRACO}" transform="rotate(120 100 100)"/>
                <path class="braco" d="${BRACO}" transform="rotate(240 100 100)"/>
                <circle class="hub" cx="100" cy="100" r="20"/>
              </g>
            </svg>
            <div class="cofre-botoes">
              <button type="button" data-g="timao-" aria-label="Girar o timão para a esquerda" disabled>↺</button>
              <button type="button" data-g="timao+" aria-label="Girar o timão para a direita (horário)" disabled>↻</button>
            </div>
          </div>
        </div>

        <p class="cofre-msg" id="cofre-msg"></p>
      </div>`;

    const q = (s) => container.querySelector(s);
    const raiz = q('.cofre');
    const disco = q('#cofre-disco');
    const botao = q('#cofre-botao');
    const timao = q('#cofre-timao');
    const giro = q('#cofre-giro');
    const anel = q('#cofre-anel');
    const msgEl = q('#cofre-msg');
    const botoesDisco = container.querySelectorAll('[data-g^="disco"]');
    const botoesTimao = container.querySelectorAll('[data-g^="timao"]');

    function msg(texto, tipo) {
      msgEl.textContent = texto;
      msgEl.className = 'cofre-msg' + (tipo ? ' ' + tipo : '');
    }

    /* ---------- desenho ---------- */
    function desenharBilhete() {
      const partes = alvos.map((n, i) => {
        const dir = DIRECOES[i];
        const seta = '<i>' + SETA_DIR[dir] + '<small>' + NOME_DIR[dir] + '</small></i>';
        if (i < passo) return '<span class="cn feito"><b>' + n + '</b>' + seta + '</span>';
        if (i === passo && fase === 'disco') return '<span class="cn atual"><b>' + n + '</b>' + seta + '</span>';
        return '<span class="cn oculto"><b>?</b><i>&nbsp;<small>&nbsp;</small></i></span>';
      });
      q('#cofre-numeros').innerHTML = partes.join('<span class="sep">–</span>');
    }

    function desenharDisco() {
      botao.style.transform = 'rotate(' + angDisco + 'deg)';
      const atual = mod(Math.round(angDisco / GRAUS_POR_NUMERO), 10);
      disco.querySelectorAll('.cofre-num').forEach((s) => s.classList.toggle('ativo', Number(s.dataset.n) === atual));
      disco.setAttribute('aria-valuenow', String(atual));
    }

    function desenharTimao() {
      giro.setAttribute('transform', 'rotate(' + angTimao + ' 100 100)');
      anel.setAttribute('stroke-dashoffset', String(CIRC * (1 - Math.min(1, giroTimao / VOLTA_TIMAO))));
    }

    function atualizarFase() {
      const discoAtivo = fase === 'disco';
      disco.classList.toggle('travado', !discoAtivo);
      botoesDisco.forEach((b) => { b.disabled = !discoAtivo; });
      const timaoAtivo = fase === 'timao';
      timao.classList.toggle('trancado', !timaoAtivo && fase !== 'aberto');
      timao.classList.toggle('livre', timaoAtivo || fase === 'aberto');
      timao.setAttribute('aria-disabled', String(!timaoAtivo));
      botoesTimao.forEach((b) => { b.disabled = !timaoAtivo; });
    }

    /* ---------- regras ---------- */
    function avaliarDisco() {
      if (fase !== 'disco') return;
      clearTimeout(timerAvaliar);

      angDisco = Math.round(angDisco / GRAUS_POR_NUMERO) * GRAUS_POR_NUMERO;
      botao.classList.add('anim');
      desenharDisco();

      const numero = mod(angDisco / GRAUS_POR_NUMERO, 10);
      const deslocamento = angDisco - angRef;
      const alvo = alvos[passo];
      const dir = DIRECOES[passo];

      if (numero !== alvo) {
        if (deslocamento !== 0) msg('Esse não é o número do bilhete. Continue girando.', 'erro');
        return;
      }

      const ladoCerto = dir === 'h' ? deslocamento > 0 : deslocamento < 0;
      if (!ladoCerto) {
        msg('Número certo, mas o lado está errado! Siga a seta do bilhete (' + NOME_DIR[dir] + ').', 'erro');
        disco.classList.remove('treme');
        void disco.offsetWidth;
        disco.classList.add('treme');
        angDisco = angRef;
        desenharDisco();
        return;
      }

      passo++;
      angRef = angDisco;
      if (passo >= alvos.length) {
        fase = 'timao';
        msg('O disco travou! Agora gire o timão no sentido horário.', 'ok');
      } else {
        msg('Clique! Número ' + passo + ' de ' + alvos.length + ' travado. Agora o próximo.', 'ok');
      }
      desenharBilhete();
      atualizarFase();
    }

    function girarDiscoBotao(delta) {
      if (fase !== 'disco') return;
      botao.classList.add('anim');
      angDisco += delta;
      desenharDisco();
      clearTimeout(timerAvaliar);
      timerAvaliar = setTimeout(avaliarDisco, 800);
    }

    function moverTimao(delta) {
      if (fase !== 'timao') return;
      angTimao += delta;
      giroTimao = Math.max(0, Math.min(VOLTA_TIMAO, giroTimao + delta));
      desenharTimao();
      if (giroTimao >= VOLTA_TIMAO) concluir();
    }

    function concluir() {
      fase = 'aberto';
      raiz.classList.add('aberto');
      atualizarFase();
      msg('CLIQUE! O cofre abriu!', 'ok');
      timerFim = setTimeout(() => { if (opcoes.aoConcluir) opcoes.aoConcluir(); }, 1000);
    }

    /* ---------- arrastar com mouse ou dedo ---------- */
    function ligarArrasto(el, aoMover, aoSoltar) {
      let ativo = false;
      let ultimo = 0;
      const angulo = (e) => {
        const r = el.getBoundingClientRect();
        return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      };
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        ativo = true;
        ultimo = angulo(e);
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        botao.classList.remove('anim');
        e.preventDefault();
      });
      el.addEventListener('pointermove', (e) => {
        if (!ativo) return;
        const a = angulo(e);
        let d = a - ultimo;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        ultimo = a;
        aoMover(d);
      });
      const fim = () => {
        if (!ativo) return;
        ativo = false;
        aoSoltar();
      };
      el.addEventListener('pointerup', fim);
      el.addEventListener('pointercancel', fim);
    }

    ligarArrasto(disco,
      (d) => {
        if (fase !== 'disco') return;
        clearTimeout(timerAvaliar);
        angDisco += d;
        desenharDisco();
      },
      avaliarDisco);

    ligarArrasto(timao, (d) => moverTimao(d), () => {});

    /* ---------- botões e teclado ---------- */
    container.querySelectorAll('[data-g]').forEach((b) => {
      b.addEventListener('click', () => {
        const g = b.dataset.g;
        if (g === 'disco+') girarDiscoBotao(GRAUS_POR_NUMERO);
        if (g === 'disco-') girarDiscoBotao(-GRAUS_POR_NUMERO);
        if (g === 'timao+') moverTimao(GRAUS_BOTAO_TIMAO);
        if (g === 'timao-') moverTimao(-GRAUS_BOTAO_TIMAO);
      });
    });

    disco.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { girarDiscoBotao(GRAUS_POR_NUMERO); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { girarDiscoBotao(-GRAUS_POR_NUMERO); e.preventDefault(); }
    });
    timao.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { moverTimao(GRAUS_BOTAO_TIMAO); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { moverTimao(-GRAUS_BOTAO_TIMAO); e.preventDefault(); }
    });

    /* ---------- início ---------- */
    desenharBilhete();
    desenharDisco();
    desenharTimao();
    atualizarFase();
    msg('Gire o disco até o número do bilhete, no sentido da seta, e solte.');

    return {
      alvos: alvos,
      destruir: function () {
        clearTimeout(timerAvaliar);
        clearTimeout(timerFim);
      }
    };
  }

  window.Cofre = { montar: montar };
})();
