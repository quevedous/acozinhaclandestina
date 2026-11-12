const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;
const TEMPO_ESTAGIO = 5000;
const ESTAGIOS = {
  1: { f: '176', c: 80, nome: 'secar' },
  2: { f: '--', c: 121, nome: 'dourar' }
};
const CALDA = { min: 100, max: 140, alvo: 118, tol: 3, vel: 28 };

const ITENS = {
  chave:       { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Vai servir para abrir um painel na Câmara Fria.' },
  mapa:        { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha:    { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
  termometro:  { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Selecione e clique no frasco de calda para medir o ponto.' },
  yuzu:        { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Precisa descongelar aos poucos. O mármore frio ajuda.' },
  merengue:    { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
  calda:       { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' }
};

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  chavePega: false,
  mapaPego: false,
  potesAbertos: false,
  portaAberta: false,
  fornoEtapa: 0,
  assadoEm: 0,
  merengue: false,
  caldaPronta: false,
  yuzuUsado: false
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
  for (let i = 0; i < 8; i++) {
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
      <div class="sala atual">2 · Confeitaria e Fornos<br>(você está aqui)</div>
      <div class="sala">3 · Câmara Fria</div>
      <div class="sala">4 · Escritório do Chef</div>
      <div class="sala">5 · Pista Principal</div>
    </div>
    <p class="dica-modal">A porta de madeira à esquerda leva à Câmara Fria.</p>
  `);
}

function abrirReceita() {
  abrirModal('Papel de receitas', `
    <div class="papel">
      <p><strong>Merengue Suíço da Casa</strong></p>
      <p>4 claras, 220 g de açúcar e uma pitada de sal. Bater em banho-maria até firmar.</p>
      <p><strong>Estágio 1 (secar):</strong> forno baixo. O visor do forno já mostra a temperatura em °F.</p>
      <p><strong>Estágio 2 (dourar):</strong> a temperatura está no cartaz da parede.</p>
      <p>"Atenção, estagiário: os fornos novos só aceitam graus Celsius!"</p>
    </div>
  `);
}

function abrirPoster() {
  abrirModal('Cartaz do merengue', `
    <div class="papel">
      <p><strong>MERENGUE · Ponto e conversão</strong></p>
      <p>O merengue perfeito é assado em dois estágios.</p>
      <p><strong>1º Secar:</strong> temperatura no visor do forno.</p>
      <p><strong>2º Dourar:</strong> 250 °F.</p>
    </div>
  `);
}

function abrirTabela() {
  abrirModal('Pistas de conversão', `
    <div class="papel">
      <p><strong>Pistas de conversão de temperatura</strong></p>
      <p>F = (9/5) × C + 32</p>
      <p>Para ir de °F para °C: C = (F − 32) ÷ 1,8</p>
      <table class="tabela-conv">
        <tr><th>°F</th><th>°C</th></tr>
        <tr><td>32</td><td>0</td></tr>
        <tr><td>122</td><td>50</td></tr>
        <tr><td>212</td><td>100</td></tr>
      </table>
    </div>
  `);
}

function abrirPrancheta() {
  abrirModal('Prancheta do Chef', `
    <div class="papel">
      <p><strong>Erros de estagiários</strong></p>
      <p>1) Misturou °F com °C e queimou 3 bandejas de merengue.</p>
      <p>2) Digitou a temperatura com casas decimais e o forno travou.</p>
      <p>"Sempre arredonde para o número inteiro mais próximo antes de digitar!"</p>
    </div>
  `);
}

function abrirPainel(n) {
  const e = ESTAGIOS[n];
  let codigo = '';
  abrirModal('Painel térmico · Estágio ' + n, `
    <div class="display-forno">
      FORNOS CONFEITARIA<br>
      ESTÁGIO ${n}<br>
      TEMP °F: ${e.f} → °C: ?
    </div>
    <p>Digite a temperatura em °C (até 3 dígitos).</p>
    <div class="visor" id="visor">---</div>
    <div class="teclado">
      ${[1,2,3,4,5,6,7,8,9].map(d => `<button type="button" data-n="${d}">${d}</button>`).join('')}
      <button type="button" data-a="limpar">C</button>
      <button type="button" data-n="0">0</button>
      <button type="button" data-a="ok">OK</button>
    </div>
    ${n === 2 ? '<p class="dica-modal">O visor não mostra a temperatura em °F deste estágio. Procure no cenário.</p>' : ''}
  `);
  const visor = $('#visor');
  const atualizar = () => { visor.textContent = (codigo + '---').slice(0, 3); };
  modalCorpo.querySelector('.teclado').addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.n !== undefined) {
      if (codigo.length < 3) { codigo += b.dataset.n; atualizar(); }
    } else if (b.dataset.a === 'limpar') {
      codigo = '';
      atualizar();
    } else if (b.dataset.a === 'ok' && codigo.length > 0) {
      if (Number(codigo) === e.c) {
        estado.fornoEtapa = n === 1 ? 1 : 3;
        estado.assadoEm = Date.now() + TEMPO_ESTAGIO;
        estado.acertos++;
        salvar();
        atualizarForno();
        fecharModal();
        fala(n === 1
          ? 'Bip! O forno ajustou para ' + e.c + ' °C. Estágio 1 em andamento, o merengue está secando.'
          : 'Bip! O forno ajustou para ' + e.c + ' °C. Estágio 2 em andamento, o merengue está dourando.');
      } else {
        estado.erros++;
        salvar();
        codigo = '';
        visor.classList.add('erro');
        visor.textContent = 'ERRO';
        setTimeout(() => { visor.classList.remove('erro'); atualizar(); }, 800);
      }
    }
  });
}

function abrirForno() {
  const et = estado.fornoEtapa;
  if (et === 0) { abrirPainel(1); return; }
  if (et === 2) { abrirPainel(2); return; }
  if (et === 1 || et === 3) {
    const s = Math.max(1, Math.ceil((estado.assadoEm - Date.now()) / 1000));
    fala('O merengue ainda está no forno. Faltam cerca de ' + s + ' segundos.');
    return;
  }
  if (et === 4) {
    estado.merengue = true;
    estado.fornoEtapa = 5;
    salvar();
    addItem('merengue');
    atualizarForno();
    fala('Você tirou o merengue do forno, dourado e firme. Agora a porta da Câmara Fria vai abrir.');
    return;
  }
  fala('O forno está vazio. O merengue já está com você.');
}

function atualizarForno() {
  const f = $('#no-forno');
  const agora = Date.now();
  if (estado.fornoEtapa === 1 && agora >= estado.assadoEm) {
    estado.fornoEtapa = 2;
    salvar();
    fala('Ding! Estágio 1 concluído. O visor pede a temperatura do estágio 2. Clique no forno.');
  } else if (estado.fornoEtapa === 3 && agora >= estado.assadoEm) {
    estado.fornoEtapa = 4;
    salvar();
    fala('Ding! O merengue está dourado e pronto. Clique no forno para retirá-lo.');
  }
  f.classList.toggle('ligado', estado.fornoEtapa === 1 || estado.fornoEtapa === 3);
  f.classList.toggle('pronto', estado.fornoEtapa === 2 || estado.fornoEtapa === 4);
}

function abrirCalda() {
  if (estado.caldaPronta) {
    fala('A calda já está no ponto. Guarde-a para o prato final.');
    return;
  }
  selecionado = null;
  renderInventario();
  const span = CALDA.max - CALDA.min;
  const zonaEsq = ((CALDA.alvo - CALDA.tol - CALDA.min) / span) * 100;
  const zonaLarg = ((2 * CALDA.tol) / span) * 100;
  abrirModal('Ponto da calda', `
    <p>Pare o termômetro no <strong>Ponto de Bola Mole: ${CALDA.alvo} °C</strong>.</p>
    <div class="termo">
      <div class="zona" style="left:${zonaEsq}%;width:${zonaLarg}%"></div>
      <div class="agulha" id="agulha"></div>
    </div>
    <div class="leitura" id="leitura">${CALDA.min.toFixed(1)} °C</div>
    <button type="button" class="btn-pixel" id="parar">PARAR</button>
    <p class="dica-modal" id="calda-msg">Clique em PARAR quando a agulha estiver na faixa verde.</p>
  `);
  const agulha = $('#agulha');
  const leitura = $('#leitura');
  let temp = CALDA.min;
  const t0 = performance.now();
  let raf = 0;
  const quadro = agora => {
    const d = ((agora - t0) / 1000) * CALDA.vel;
    const m = d % (2 * span);
    temp = CALDA.min + (m <= span ? m : 2 * span - m);
    agulha.style.left = (((temp - CALDA.min) / span) * 100) + '%';
    leitura.textContent = temp.toFixed(1) + ' °C';
    raf = requestAnimationFrame(quadro);
  };
  raf = requestAnimationFrame(quadro);
  aoFechar = () => cancelAnimationFrame(raf);

  $('#parar').addEventListener('click', () => {
    if (Math.abs(temp - CALDA.alvo) <= CALDA.tol) {
      estado.caldaPronta = true;
      estado.acertos++;
      salvar();
      addItem('calda');
      fecharModal();
      fala('Perfeito! A calda parou em ' + temp.toFixed(1) + ' °C, no ponto de bola mole. Você guardou um pouco.');
    } else {
      estado.erros++;
      salvar();
      $('#calda-msg').textContent = temp < CALDA.alvo
        ? 'Cedo demais: a calda ainda está rala (' + temp.toFixed(1) + ' °C). Tente de novo.'
        : 'Passou do ponto (' + temp.toFixed(1) + ' °C). Tente de novo.';
    }
  });
}

function abrirPorta() {
  if (!estado.merengue) {
    fala('A porta da Câmara Fria está travada. Um aviso diz: "Só abre depois que o merengue sair do forno."');
    return;
  }
  abrirModal('Câmara Fria', `
    <p>Com o merengue assado em mãos, você puxa a pesada porta de madeira. Um ar gelado sai lá de dentro.</p>
    <a class="btn-pixel" href="cena3.html">Entrar →</a>
  `);
}

ligar('#no-receita', 'Receita', abrirReceita);
ligar('#no-poster', 'Cartaz', abrirPoster);
ligar('#no-tabela', 'Pistas de conversão', abrirTabela);
ligar('#no-prancheta', 'Prancheta', abrirPrancheta);
ligar('#no-forno', 'Forno', abrirForno);
ligar('#no-porta', 'Porta', abrirPorta);

ligar('#no-calda', 'Frasco de calda', () => {
  if (estado.caldaPronta) {
    fala('A calda já está pronta e guardada.');
  } else if (estado.inventario.includes('termometro')) {
    fala('Selecione o termômetro digital no inventário e clique no frasco.');
  } else {
    fala('Um frasco de açúcar caramelizando sobre um fogareiro. Falta um termômetro para acertar o ponto da calda.');
  }
}, { termometro: abrirCalda });

ligar('#no-marmore', 'Bancada', () => {
  fala('O mármore está gelado como gelo. Serve para descongelar coisas devagar.');
}, {
  yuzu: () => {
    removerItem('yuzu');
    selecionado = null;
    estado.yuzuUsado = true;
    salvar();
    renderInventario();
    fala('Você deixou o yuzu sobre o mármore frio. Vai descongelar aos poucos, sem estragar.');
  }
});

const avisoForno = () => fala('Forno vazio e desligado. O visor mostra "ESTÁGIO 1 · TEMP °F: 176 → °C: --", mas só o forno de cima está com o merengue.');
ligar('#no-forno2', 'Forno', avisoForno);
ligar('#no-forno3', 'Forno', avisoForno);
ligar('#no-forno4', 'Forno', avisoForno);

ligar('#no-janela', 'Janela', () => fala('Uma janela com grades. Lá fora é noite e a luz esverdeada ilumina os frascos.'));
ligar('#no-frasco', 'Alambique', () => fala('Um alambique de vidro com um líquido marrom borbulhando devagar. O Chef devia fazer experiências aqui.'));
ligar('#no-extrato', 'Extrato de merengue', () => fala('Uma garrafa de extrato de merengue. Só serve para aromatizar, não é o que você procura.'));
ligar('#no-yuzu', 'Pote de yuzu', () => fala('Um pote com a etiqueta "Yuzu Congelada", mas só tem gelo derretido. O estoque de verdade deve estar na Câmara Fria.'));
ligar('#no-barril', 'Barril', () => fala('Um barril de metal enferrujado. Está vazio.'));
ligar('#no-caixote', 'Caixote', () => fala('Um caixote com potes de barro vazios. Nada útil.'));
ligar('#no-potes-meio', 'Potes', () => fala('Farinha, açúcar impalpável, tempero de confeiteiro e essências. Nenhuma baunilha rara por aqui.'));
ligar('#no-prateleira', 'Prateleira', () => fala('Mais potes de ingredientes: farinha, açúcar e temperos. Nada que você precise agora.'));
ligar('#no-panelas', 'Panelas', () => fala('Panelas empilhadas, sem uso há tempos.'));
ligar('#no-bicos', 'Bicos de confeitar', () => fala('Bicos de confeitar em formato de estrela e de gota. Vão servir no empratamento, lá no final.'));
ligar('#no-batedeira', 'Batedeira', () => fala('Uma batedeira industrial. O merengue já foi batido e está numa assadeira dentro do forno de cima. Falta só assar.'));

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
  atualizarForno();
  if (restante <= 0) fimDeJogo();
}
const relogio = setInterval(tick, 1000);

renderInventario();
tick();
fala('Estação de Confeitaria. O merengue já está batido no forno de cima, mas os fornos estão apagados. Descubra as temperaturas certas.');