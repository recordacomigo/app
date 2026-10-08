/* App de atividades do kit. Um ficheiro, sem dependencias.
   O acesso vem do CAMINHO (window.CFG.acesso, ex. "fp") e soma-se ao que ja foi liberado neste
   aparelho (localStorage "lc-acesso"). f = kit, p = Plano de 90 Dias, m = Memorias da Epoca, c = Corpo Ativo,
   j = Jogos para Jogar Juntos (08/10/2026). Extra sem checkout e sem acesso nao aparece (nao se vende o que nao tem link). */
(function () {
  const CFG = window.CFG;
  const D = "../assets/dados/";
  const $ = (s, el = document) => el.querySelector(s);
  const ler = (k, v) => { try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : v; } catch (e) { return v; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const tem = new Set([...(ler("lc-acesso", [])), ...CFG.acesso.split("")]);
  gravar("lc-acesso", [...tem]);
  const feitas = ler("lc-feitas", {});
  const marcar = (id) => { feitas[id] = Date.now(); gravar("lc-feitas", feitas); };
  const cache = {};
  const dados = async (nome) => cache[nome] || (cache[nome] = await (await fetch(D + nome + ".json")).json());
  const app = $("#app");
  const cor = (c, c2) => { document.documentElement.style.setProperty("--c", c); document.documentElement.style.setProperty("--c2", c2); };
  const img = (f, t = 48) => `<img class="f3d" src="../assets/img/${f}" width="${t}" height="${t}" alt="">`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const EXTRAS = CFG.extras; // {p:{...}, m:{...}, c:{...}, j:{...}}
  const ORDEM = ["p", "m", "c", "j"].filter((k) => EXTRAS[k] && (tem.has(k) || EXTRAS[k].checkout));
  /* pacote "Dia Ativo" (Corpo Ativo + Jogos, o upsell de 27 EUR): quem nao tem nenhum dos dois ve o pacote no lugar
     dos dois avulsos; quem ja tem um ve so o que falta. Sem checkout, nao aparece (08/10/2026) */
  const PACOTE = CFG.pacote || null;
  /* oferta especial com prazo VERDADEIRO (Vini, 08/10/2026): o Dia Ativo a 27 EUR vale PACOTE.prazo_h horas a contar da
     1.a abertura do app neste aparelho. Acabado o prazo, o pacote SAI do app e ficam o Corpo Ativo e os Jogos avulsos
     (24,90 + 12,90 = 37,80). Contador que mente e pratica proibida na UE (Diretiva 2005/29/CE, anexo I, n.o 7).
     Sem localStorage (navegacao privada) o relogio recomecaria a cada visita: ai nao se mostra contador nenhum */
  let ini = ler("lc-oferta-ini", 0);
  if (!ini) { ini = Date.now(); gravar("lc-oferta-ini", ini); }
  const comPrazo = !!(PACOTE && PACOTE.prazo_h) && ler("lc-oferta-ini", 0) === ini;
  const fimOferta = comPrazo ? ini + PACOTE.prazo_h * 3600 * 1000 : Infinity;
  const pacoteVale = () => !!(PACOTE && PACOTE.checkout && PACOTE.inclui.every((k) => !tem.has(k)) && Date.now() < fimOferta);
  const faltam = () => { const s = Math.max(0, Math.floor((fimOferta - Date.now()) / 1000)); return `${Math.floor(s / 3600)}h ${String(Math.floor(s / 60) % 60).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`; };
  let relogioOferta = null;
  const ligaPrazo = () => {
    clearInterval(relogioOferta);
    if (!comPrazo || !document.querySelector(".prazo-of b")) return;
    relogioOferta = setInterval(() => {
      const els = document.querySelectorAll(".prazo-of b");
      if (!els.length) return clearInterval(relogioOferta);
      if (Date.now() >= fimOferta) { clearInterval(relogioOferta); return rota(); }
      els.forEach((e) => (e.textContent = faltam()));
    }, 1000);
  };
  const prazoHtml = () => (comPrazo ? `<div class="prazo-of">⏳ Este preço especial termina em <b>${faltam()}</b></div>` : "");
  const vitrine = () => { const r = []; for (const k of ORDEM) { if (pacoteVale() && PACOTE.inclui.includes(k)) { if (!r.includes("d")) r.push("d"); } else r.push(k); } return r.includes("d") ? ["d", ...r.filter((k) => k !== "d")] : r; };
  const X = (k) => (k === "d" ? PACOTE : EXTRAS[k]);

  /* ------------------------------------------------------------------ celebracao */
  function festa(titulo, texto, voltar) {
    const f = $(".festa");
    $("h3", f).textContent = titulo; $("p", f).textContent = texto;
    $(".f-voltar", f).setAttribute("href", voltar || "#/");
    f.classList.add("on");
    const cores = ["#7a5aa6", "#e07b24", "#2f7fb8", "#2e9460", "#cf4f78", "#c99613"];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("i"); c.className = "confete";
      c.style.left = Math.random() * 100 + "vw"; c.style.background = cores[i % cores.length];
      c.style.animationDelay = Math.random() * 0.8 + "s"; document.body.appendChild(c);
      setTimeout(() => c.remove(), 3500);
    }
  }
  $(".festa .f-outra").onclick = () => { $(".festa").classList.remove("on"); rota(); };
  document.addEventListener("click", (e) => { if (e.target.closest(".f-voltar")) $(".festa").classList.remove("on"); });

  /* ------------------------------------------------------------------ motores */
  const M = {};

  M.opcoes = (el, d, fim) => {
    let i = 0;
    el.innerHTML = `<div class="progresso">${d.itens.map(() => "<i></i>").join("")}</div><div class="cartao"><div class="frase"></div><div class="opcoes"></div><p class="msg"></p></div>`;
    const mostra = () => {
      const it = d.itens[i];
      $(".frase", el).innerHTML = it.html; $(".msg", el).textContent = "";
      const op = $(".opcoes", el); op.innerHTML = ""; op.classList.toggle("grelha-op", !!it.rotulos);
      it.opcoes.forEach((o, k) => {
        const b = document.createElement("button");
        b.innerHTML = it.rotulos ? `<b>${esc(o)}</b>${it.rotulos[k]}` : esc(o);
        b.onclick = () => {
          if (String(o) === String(it.certa)) {
            b.classList.add("certo"); el.querySelectorAll(".progresso i")[i].classList.add("on");
            if (it.depois) $(".msg", el).innerHTML = "Muito bem! A palavra é <b>" + it.depois + "</b>.";
            setTimeout(() => { i++; i < d.itens.length ? mostra() : fim(); }, it.depois ? 1300 : 750);
          } else { b.classList.remove("errado"); void b.offsetWidth; b.classList.add("errado"); $(".msg", el).textContent = "Quase! Mais uma tentativa."; }
        };
        op.appendChild(b);
      });
    };
    mostra();
  };

  M.sopa = (el, d, fim) => {
    const n = d.grid.length;
    el.innerHTML = `<div class="grelha g${n > 12 ? "g" : n > 10 ? "m" : "p"}" style="grid-template-columns:repeat(${n},minmax(0,1fr))"></div><div class="chips">${d.palavras.map((p) => `<span class="chip" data-i="${p.i}">${esc(p.nome)}</span>`).join("")}</div><p class="msg"></p>`;
    const g = $(".grelha", el), msg = $(".msg", el), bt = [];
    const tons = ["#2f7fb8", "#e07b24", "#2e9460", "#cf4f78", "#7a5aa6", "#c99613", "#178f86", "#d9573f", "#5d6d7e", "#8e44ad", "#16a085", "#b03a2e"];
    d.grid.forEach((row, r) => row.forEach((ch, c) => { const b = document.createElement("button"); b.textContent = ch; b.onclick = () => toque(r, c); g.appendChild(b); bt.push(b); }));
    let ini = null, feitas = 0; const achadas = new Set();
    function toque(r, c) {
      const cel = (a, b) => bt[a * n + b];
      if (!ini) { ini = [r, c]; cel(r, c).classList.add("ini"); msg.textContent = "Agora toque na última letra da palavra."; return; }
      const [r0, c0] = ini; cel(r0, c0).classList.remove("ini"); ini = null;
      const dr = Math.sign(r - r0), dc = Math.sign(c - c0), len = Math.max(Math.abs(r - r0), Math.abs(c - c0)) + 1;
      if (len < 2 || r - r0 !== dr * (len - 1) || c - c0 !== dc * (len - 1)) { msg.textContent = "Toque na primeira e depois na última letra da palavra."; return; }
      const cam = [...Array(len)].map((_, k) => [r0 + dr * k, c0 + dc * k]);
      const k1 = cam.map((p) => p.join(",")).join(";"), k2 = cam.slice().reverse().map((p) => p.join(",")).join(";");
      const w = d.palavras.find((p) => !achadas.has(p.i) && (p.chave === k1 || p.chave === k2));
      if (!w) { msg.textContent = "Essa não é uma das palavras. Mais uma tentativa!"; return; }
      achadas.add(w.i); feitas++;
      cam.forEach(([a, b]) => { const e = cel(a, b); e.classList.add("ok"); e.style.background = tons[(feitas - 1) % tons.length]; });
      $(`.chip[data-i="${w.i}"]`, el).classList.add("feito");
      msg.textContent = "Muito bem! Encontrou a palavra " + w.nome.toUpperCase() + ".";
      if (feitas === d.palavras.length) setTimeout(fim, 600);
    }
  };

  M.alvos = (el, d, fim) => {
    let e = 0;
    const etapa = () => {
      const et = d.etapas[e]; const total = et.alvos.length; const achou = new Set();
      el.innerHTML = `${d.etapas.length > 1 ? `<p class="passo-n">Quadro ${e + 1} de ${d.etapas.length}</p>` : ""}<div class="alvos ${et.texto ? "txt" : ""} ${et.palavras ? "pal" : ""}" style="grid-template-columns:repeat(${et.cols},minmax(0,1fr))"></div><p class="msg">${total > 1 ? "Faltam " + total + "." : ""}</p>`;
      const g = $(".alvos", el);
      et.celulas.forEach((c, k) => {
        const b = document.createElement("button"); b.innerHTML = c;
        b.onclick = () => {
          if (et.alvos.includes(k)) {
            if (achou.has(k)) return; achou.add(k); b.classList.add("ok");
            $(".msg", el).textContent = achou.size < total ? "Muito bem! Faltam " + (total - achou.size) + "." : "Muito bem!";
            if (achou.size === total) setTimeout(() => { e++; e < d.etapas.length ? etapa() : fim(); }, 700);
          } else { b.classList.remove("errado"); void b.offsetWidth; b.classList.add("errado"); }
        };
        g.appendChild(b);
      });
    };
    if (d.mostrar) {
      const m = d.mostrar;
      const itens = m.tipo === "palavras" ? `<div class="mem-pal">${m.itens.map((w) => `<span>${esc(w)}</span>`).join("")}</div>` : `<div class="mem-img">${m.itens.join("")}</div>`;
      el.innerHTML = `<div class="cartao"><p class="rot-app">1. Observar com calma</p>${itens}<button class="botao">Já memorizei</button></div>`;
      $(".botao", el).onclick = etapa;
    } else etapa();
  };

  M.pares = (el, d, fim) => {
    const cartas = [...d.cartas, ...d.cartas].map((h, k) => ({ h, k: k % d.cartas.length })).sort(() => Math.random() - 0.5);
    const cols = d.cartas.length <= 4 ? 4 : d.cartas.length <= 6 ? 4 : 4;
    el.innerHTML = `<div class="pares" style="grid-template-columns:repeat(${cols},1fr)"></div><p class="msg">Vire duas cartas de cada vez.</p>`;
    const g = $(".pares", el); let aberta = null, bloqueio = false, feitos = 0;
    cartas.forEach((c) => {
      const b = document.createElement("button"); b.className = "carta"; b.innerHTML = `<span class="fr">${c.h}</span><span class="vs">?</span>`;
      b.onclick = () => {
        if (bloqueio || b.classList.contains("virada")) return;
        b.classList.add("virada");
        if (!aberta) { aberta = { b, c }; return; }
        if (aberta.c.k === c.k) { b.classList.add("ok"); aberta.b.classList.add("ok"); aberta = null; feitos++; $(".msg", el).textContent = "Muito bem! É um par."; if (feitos === d.cartas.length) setTimeout(fim, 600); }
        else { bloqueio = true; const a = aberta; aberta = null; setTimeout(() => { a.b.classList.remove("virada"); b.classList.remove("virada"); bloqueio = false; }, 1100); }
      };
      g.appendChild(b);
    });
  };

  M.sudoku = (el, d, fim) => {
    const n = d.n, vaz = new Set(d.vazios.map(([r, c]) => r + "," + c)), val = {};
    let rows = "";
    for (let r = 0; r < n; r++) {
      rows += "<tr>";
      for (let c = 0; c < n; c++) {
        const k = [];
        if ((c + 1) % d.bc === 0 && c < n - 1) k.push("bd");
        if ((r + 1) % d.br === 0 && r < n - 1) k.push("bb");
        const v = vaz.has(r + "," + c);
        rows += `<td class="${k.join(" ")} ${v ? "vazio" : ""}" data-r="${r}" data-c="${c}">${v ? "" : d.sol[r][c]}</td>`;
      }
      rows += "</tr>";
    }
    el.innerHTML = `<table class="sud s${n}">${rows}</table><div class="teclas">${[...Array(n)].map((_, i) => `<button>${i + 1}</button>`).join("")}<button class="apaga">⌫</button></div><p class="msg">Toque num quadrado vazio e depois no número.</p>`;
    let sel = null;
    el.querySelectorAll("td.vazio").forEach((td) => (td.onclick = () => { if (sel) sel.classList.remove("sel"); sel = td; td.classList.add("sel"); }));
    el.querySelectorAll(".teclas button").forEach((b) => (b.onclick = () => {
      if (!sel) { $(".msg", el).textContent = "Primeiro, toque num quadrado vazio."; return; }
      const key = sel.dataset.r + "," + sel.dataset.c;
      if (b.classList.contains("apaga")) { sel.textContent = ""; delete val[key]; sel.classList.remove("mal"); return; }
      sel.textContent = b.textContent; val[key] = +b.textContent; sel.classList.remove("mal");
      if (Object.keys(val).length === vaz.size) {
        let certo = true;
        el.querySelectorAll("td.vazio").forEach((td) => { const ok = +td.textContent === d.sol[+td.dataset.r][+td.dataset.c]; if (!ok) { certo = false; td.classList.add("mal"); } });
        if (certo) setTimeout(fim, 500); else $(".msg", el).textContent = "Quase! Os números a vermelho precisam de ser trocados.";
      }
    }));
  };

  M.desenho = (el, d, fim) => {
    el.innerHTML = `${d.modelo ? `<p class="rot-app">Modelo</p><div class="modelo-d">${d.modelo}</div><p class="rot-app">Desenhar aqui</p>` : ""}<div class="tela"><div class="fundo">${d.fundo}</div><canvas></canvas></div><div class="duas-b"><button class="botao claro apagar">Apagar</button><button class="botao terminei">Terminei</button></div>`;
    const tela = $(".tela", el), cv = $("canvas", el), svg = $(".fundo svg", el);
    const ajusta = () => { const r = svg.getBoundingClientRect(); cv.width = r.width * 2; cv.height = r.height * 2; cv.style.width = r.width + "px"; cv.style.height = r.height + "px"; };
    setTimeout(ajusta, 50); window.addEventListener("resize", ajusta, { once: true });
    const ctx = cv.getContext("2d"); let a = false;
    const p = (ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * 2, (ev.clientY - r.top) * 2]; };
    cv.addEventListener("pointerdown", (ev) => { a = true; cv.setPointerCapture(ev.pointerId); const [x, y] = p(ev); ctx.beginPath(); ctx.moveTo(x, y); });
    cv.addEventListener("pointermove", (ev) => { if (!a) return; const [x, y] = p(ev); ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--c"); ctx.lineTo(x, y); ctx.stroke(); });
    ["pointerup", "pointercancel"].forEach((t) => cv.addEventListener(t, () => (a = false)));
    $(".apagar", el).onclick = () => ctx.clearRect(0, 0, cv.width, cv.height);
    $(".terminei", el).onclick = fim;
    tela.style.touchAction = "none";
  };

  M.pontos = (el, d, fim) => {
    const pts = d.pts;
    el.innerHTML = `<svg class="pontos-app" viewBox="0 0 500 500"><g class="linhas"></g>${pts.map(([x, y], i) => `<g class="pt" data-i="${i}"><circle cx="${x}" cy="${y}" r="26" class="hit"/><circle cx="${x}" cy="${y}" r="9" class="dot"/><text x="${x + 14}" y="${y - 14}">${i + 1}</text></g>`).join("")}</svg><p class="msg">Toque no ponto 1.</p>`;
    let prox = 0; const L = $(".linhas", el);
    const svg = $("svg", el);
    svg.addEventListener("click", (ev) => {
      const m = svg.getScreenCTM().inverse(); const q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m);
      let i = -1, melhor = 1e9;
      pts.forEach(([x, y], k) => { const dd = (x - q.x) ** 2 + (y - q.y) ** 2; if (dd < melhor) { melhor = dd; i = k; } });
      if (melhor > 60 * 60) return;
      const g = el.querySelector('.pt[data-i="' + i + '"]');
      if (i !== prox) { $(".msg", el).textContent = "Agora é o ponto " + (prox + 1) + "."; return; }
      g.classList.add("ok");
      if (i > 0) L.insertAdjacentHTML("beforeend", `<line x1="${pts[i - 1][0]}" y1="${pts[i - 1][1]}" x2="${pts[i][0]}" y2="${pts[i][1]}"/>`);
      prox++;
      if (prox === pts.length) {
        L.insertAdjacentHTML("beforeend", `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[0][0]}" y2="${pts[0][1]}"/>`);
        $(".msg", el).innerHTML = "É " + esc(d.nome) + "!"; setTimeout(fim, 900);
      } else $(".msg", el).textContent = "Muito bem! Agora o ponto " + (prox + 1) + ".";
    });
  };

  M.cartoes = (el, d, fim) => {
    let i = 0;
    el.innerHTML = `<div class="cartao conversa"><p class="rot-app"></p><p class="pergunta"></p></div><div class="duas-b"><button class="botao claro ant">‹ Anterior</button><button class="botao seg">Seguinte ›</button></div>`;
    const mostra = () => { $(".rot-app", el).textContent = "Cartão " + (i + 1) + " de " + d.cartoes.length; $(".pergunta", el).textContent = d.cartoes[i]; $(".seg", el).textContent = i === d.cartoes.length - 1 ? "Terminar" : "Seguinte ›"; };
    $(".ant", el).onclick = () => { if (i > 0) { i--; mostra(); } };
    $(".seg", el).onclick = () => { if (i < d.cartoes.length - 1) { i++; mostra(); } else fim(); };
    mostra();
  };

  /* adivinha: a resposta so aparece quando se pede (antes vinha junto e estragava o jogo) */
  M.adivinha = (el, d, fim) => {
    let i = 0;
    el.innerHTML = `<div class="cartao conversa"><p class="rot-app"></p><p class="pergunta"></p><p class="resp-a"></p></div><button class="botao claro ver">Ver a resposta</button><div class="duas-b"><button class="botao claro ant">‹ Anterior</button><button class="botao seg">Seguinte ›</button></div>`;
    const mostra = () => { const it = d.itens[i]; $(".rot-app", el).textContent = "Adivinha " + (i + 1) + " de " + d.itens.length; $(".pergunta", el).textContent = it.q; $(".resp-a", el).textContent = ""; $(".ver", el).style.visibility = "visible"; $(".seg", el).textContent = i === d.itens.length - 1 ? "Terminar" : "Seguinte ›"; };
    $(".ver", el).onclick = () => { $(".resp-a", el).textContent = d.itens[i].r; $(".ver", el).style.visibility = "hidden"; };
    $(".ant", el).onclick = () => { if (i > 0) { i--; mostra(); } };
    $(".seg", el).onclick = () => { if (i < d.itens.length - 1) { i++; mostra(); } else fim(); };
    mostra();
  };

  /* sorteador do bingo: os numeros que ja sairam ficam guardados neste aparelho ate "Novo jogo" */
  M.sorteio = (el) => {
    let saidos = ler("lc-bingo", []);
    el.innerHTML = `<div class="sorteio"><div class="bola">–</div><p class="sub-s"></p><button class="botao grande tirar">Tirar número</button><div class="saidos"></div><button class="botao claro novo">Novo jogo</button></div>`;
    const mostra = (n) => {
      $(".bola", el).textContent = n || "–";
      $(".sub-s", el).textContent = saidos.length ? saidos.length + " de 90 números já saíram" : "Toque no botão para tirar o primeiro número";
      $(".saidos", el).innerHTML = [...saidos].sort((a, b) => a - b).map((x) => `<span class="${x === n ? "ult" : ""}">${x}</span>`).join("");
      $(".tirar", el).disabled = saidos.length >= 90;
    };
    $(".tirar", el).onclick = () => {
      if (saidos.length >= 90) return;
      let n; do { n = 1 + Math.floor(Math.random() * 90); } while (saidos.includes(n));
      saidos.push(n); gravar("lc-bingo", saidos); mostra(n);
    };
    $(".novo", el).onclick = () => { if (saidos.length && !confirm("Começar um jogo novo? Os números que já saíram são apagados.")) return; saidos = []; gravar("lc-bingo", saidos); mostra(); };
    mostra(saidos[saidos.length - 1]);
  };

  M.rotina = (el, d, fim) => {
    let i = 0, rest = 0, t = null;
    el.innerHTML = `<div class="progresso">${d.passos.map(() => "<i></i>").join("")}</div><div class="cartao ex"><div class="ex-ic"></div><h3></h3><p class="dose"></p><ol class="passos-ex"></ol><p class="cuidado"></p><div class="relog">0:00</div></div><div class="duas-b"><button class="botao claro pausa">Começar</button><button class="botao seg">Seguinte ›</button></div>`;
    const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    const mostra = () => {
      const p = d.passos[i]; clearInterval(t); t = null; rest = p.segundos;
      $(".ex-ic", el).innerHTML = p.icone; $("h3", el).textContent = p.nome; $(".dose", el).textContent = p.dose;
      $(".passos-ex", el).innerHTML = p.passos.map((x) => `<li>${esc(x)}</li>`).join(""); $(".cuidado", el).textContent = p.cuidado;
      $(".relog", el).textContent = fmt(rest); $(".pausa", el).textContent = "Começar";
      $(".seg", el).textContent = i === d.passos.length - 1 ? "Terminar" : "Seguinte ›";
      el.querySelectorAll(".progresso i").forEach((x, k) => x.classList.toggle("on", k < i));
    };
    $(".pausa", el).onclick = () => {
      if (t) { clearInterval(t); t = null; $(".pausa", el).textContent = "Continuar"; return; }
      $(".pausa", el).textContent = "Pausa";
      t = setInterval(() => { rest--; $(".relog", el).textContent = fmt(Math.max(rest, 0)); if (rest <= 0) { clearInterval(t); t = null; $(".pausa", el).textContent = "Repetir"; rest = d.passos[i].segundos; $(".relog", el).textContent = "Feito!"; } }, 1000);
    };
    $(".seg", el).onclick = () => { if (i < d.passos.length - 1) { i++; mostra(); } else { clearInterval(t); fim(); } };
    mostra();
  };

  /* ------------------------------------------------------------------ paginas */
  const topo = (voltar, rotulo = "‹ Voltar") => `<div class="topo"><a class="voltar" href="${voltar}">${rotulo}</a></div>`;
  const faixa = (icone, nome) => `<div class="faixa">${icone}<h2>${esc(nome)}</h2></div>`;
  const imprimir = (texto = "Imprimir ou guardar em PDF") => `<div class="imprimir"><button class="botao claro bt-imp">🖨️  ${texto}</button><p>Sai a folha pronta a imprimir, em tamanho A4.</p></div>`;
  const barraPdf = (pdfAtiv, pdfTodo, rotTodo) => `<div class="baixar"><a class="b-pdf" href="../assets/pdf/${pdfAtiv}" download>${img("page_facing_up.png", 34)}<span>Descarregar esta atividade em PDF</span></a><div class="b-sec"><button class="bt-imp">🖨️ Imprimir</button>${pdfTodo ? `<a href="../assets/pdf/${pdfTodo}" download>${rotTodo}</a>` : ""}</div></div>`;
  const pdfTopo = (f, rot) => `<a class="pdf-destaque" href="../assets/pdf/${f}" download>${img("page_facing_up.png", 38)}<span>${rot}</span></a>`;
  const ligaImprimir = (html) => { document.querySelectorAll(".bt-imp").forEach((b) => b.onclick = () => { $("#papel").innerHTML = html.split("{{IMG}}").join("../assets/img/"); setTimeout(() => window.print(), 300); }); };

  /* o Dia Ativo e a oferta principal (Vini, 08/10/2026): cartao grande logo abaixo do topo, com a imagem das folhas,
     o preco ancorado e o botao direto ao checkout. Enquanto ele aparece, a faixa de novidade nao mostra outra coisa por cima */
  function destaque() {
    if (!pacoteVale()) return "";
    const x = PACOTE;
    return `<div class="destaque" style="--c:${x.cor};--c2:${x.cor2}"><span class="selo">OFERTA ESPECIAL</span>
      <h2>${img(x.icone, 46)}${esc(x.nome)}</h2><p>${esc(x.gancho)}</p>
      ${x.imagem ? `<a href="#/oferta/d"><img class="dt-img" src="${x.imagem}" width="1000" height="760" alt="As folhas dos jogos e dos exercícios do Dia Ativo"></a>` : ""}
      <div class="dt-pontos">${x.pontos.map((p) => `<div>${img(p[0], 36)}<span><b>${esc(p[1])}:</b> ${esc(p[2])}</span></div>`).join("")}</div>
      <div class="dt-preco">${x.ancora ? `<s>${esc(x.ancora)}</s>` : ""}<b>${esc(x.preco)}</b></div>
      ${prazoHtml()}${comPrazo && x.ancora ? `<p class="dt-depois">Depois, os dois só em separado: ${esc(x.ancora)}.</p>` : ""}
      <a class="botao grande" href="${x.checkout}">Quero o ${esc(x.nome)}</a>
      <a class="dt-mais" href="#/oferta/d">Ver tudo o que inclui ›</a></div>`;
  }

  function faixaNovidade() {
    if (pacoteVale()) return "";
    const ordem = vitrine().filter((x) => !tem.has(x));
    if (!ordem.length) return "";
    const ult = ler("lc-faixa", 0);
    if (Date.now() - ult < 24 * 3600 * 1000) return "";
    const x = X(ordem[0]);
    return `<div class="novidade"><button class="fecha" aria-label="Fechar">✕</button><span class="selo">NOVIDADE PARA SI</span><div class="nv-l">${img(x.icone, 54)}<div><b>${esc(x.nome)}</b><p>${esc(x.gancho)}</p></div></div><a class="botao" href="#/oferta/${ordem[0]}">Ver como funciona</a></div>`;
  }

  async function hub() {
    cor("#2f7fb8", "#e8f2fa");
    const cads = CFG.cadernos;
    let cards = "";
    for (const c of cads) {
      const n = Object.keys(feitas).filter((k) => k.startsWith(c.id + "-")).length;
      cards += `<a class="card" href="#/c/${c.id}" style="--c:${c.cor}">${img(c.icone, 54)}<b>${esc(c.nome)}</b><span>${n ? n + " de " + c.total + " feitas" : c.total + " atividades"}</span></a>`;
    }
    const extra = (k) => {
      const x = X(k);
      if (tem.has(k)) return `<a class="tranc livre" href="#/${x.rota}" style="--c:${x.cor}">${img(x.icone, 50)}<div><b>${esc(x.nome)}</b><small>${esc(x.descricao)}</small></div><span class="cadeado">›</span></a>`;
      return `<a class="tranc" href="#/oferta/${k}">${img(x.icone, 50)}<div><b>${esc(x.nome)}</b><small>${esc(x.descricao)}</small></div><span class="cadeado">🔒</span></a>`;
    };
    const hoje = tem.has("p") ? `<a class="hoje" href="#/plano">${img("calendar.png", 56)}<div><b>Atividade de hoje</b><small>Plano de 90 Dias: continuar onde parou</small></div></a>` : "";
    const bonus = CFG.bonus.map((b) => `<a class="pdf" href="../assets/pdf/${b.ficheiro}" download>${img(b.icone, 40)}${esc(b.nome)}</a>`).join("");
    app.innerHTML = `${faixaNovidade()}
      <div class="ola"><div class="avos">${img("old_woman.png", 92)}${img("old_man.png", 92)}</div><h1>${esc(CFG.marca)}</h1><p>Atividades para manter a mente ativa. Fazer no ecrã ou imprimir.</p></div>
      ${destaque()}
      <a class="pdf-destaque" href="#/pdfs">${img("page_facing_up.png", 38)}<span>Prefere papel? Descarregar tudo em PDF</span></a>
      ${hoje}
      <p class="secao">Os 8 cadernos</p><div class="cadernos">${cards}</div>
      <p class="secao">Para ir mais longe</p><div class="extras">${vitrine().map(extra).join("")}</div>
      <p class="secao">Bónus para descarregar</p><div class="bonus">${bonus}</div>
      <p class="rodape">Estas atividades são um passatempo para exercitar a mente. Não substituem o acompanhamento médico.</p>`;
    const f = $(".novidade .fecha"); if (f) f.onclick = () => { gravar("lc-faixa", Date.now()); $(".novidade").remove(); };
    ligaPrazo();
  }

  async function caderno(id) {
    const c = CFG.cadernos.find((x) => x.id === id); cor(c.cor, c.cor2);
    const lista = await dados(id);
    const grupo = (nv) => lista.filter((a) => a.nivel === nv).map((a) => `<a class="ativ ${feitas[a.id] ? "feita" : ""}" href="#/a/${id}/${a.n}"><span class="num-a">${a.n}</span><b>${esc(a.titulo)}</b><span class="ck">${feitas[a.id] ? "✓" : ""}</span></a>`).join("");
    app.innerHTML = `${topo("#/", "‹ Início")}${faixa(img(c.icone, 44), c.nome)}
      ${pdfTopo(id + ".pdf", "Descarregar o caderno inteiro em PDF")}
      <p class="dica">${esc(c.descricao)}</p>
      ${[1, 2, 3].map((nv) => `<p class="secao"><span class="bolas">${[1, 2, 3].map((k) => `<i class="${k <= nv ? "on" : ""}"></i>`).join("")}</span> Nível ${nv}${nv === 1 ? ": para começar" : nv === 2 ? ": um pouco mais" : ": desafio"}</p><div class="ativs">${grupo(nv)}</div>`).join("")}`;
  }

  async function atividade(id, n, voltar) {
    const c = CFG.cadernos.find((x) => x.id === id); cor(c.cor, c.cor2);
    const a = (await dados(id)).find((x) => x.n === +n);
    const seguinte = (await dados(id)).find((x) => x.n === +n + 1);
    app.innerHTML = `${topo(voltar || "#/c/" + id)}${faixa(img(c.icone, 40), c.nome)}
      <h1 class="titulo">${esc(a.titulo)}</h1>${barraPdf(a.pdf, id + ".pdf", "Caderno inteiro em PDF")}<p class="dica">${a.instr_app}</p><div class="motor"></div>${imprimir()}`;
    M[a.app.motor]($(".motor"), a.app, () => {
      marcar(a.id);
      if (voltar && voltar.startsWith("#/plano")) festa("Muito bem!", "Mais uma atividade feita.", voltar);
      else festa("Muito bem!", seguinte ? "Atividade concluída. A seguinte espera por si." : "Terminou o último nível deste caderno!", seguinte ? `#/a/${id}/${seguinte.n}` : "#/c/" + id);
    });
    $(".festa .f-voltar").textContent = voltar && voltar.startsWith("#/plano") ? "Voltar ao plano" : seguinte ? "Atividade seguinte" : "Voltar ao caderno";
    ligaImprimir(a.papel);
  }

  /* ------------------------------ Plano de 90 Dias */
  async function plano(dia) {
    if (!tem.has("p")) return oferta("p");
    const x = EXTRAS.p; cor(x.cor, x.cor2);
    const P = await dados("plano");
    const feitoDia = (d) => d.atividades.every((a) => feitas[a.id]);
    if (!dia) {
      const hoje = P.dias.find((d) => !feitoDia(d)) || P.dias[P.dias.length - 1];
      app.innerHTML = `${topo("#/", "‹ Início")}${faixa(img(x.icone, 44), x.nome)}
        ${pdfTopo(x.pdf, "Descarregar o plano em PDF")}<a class="hoje grande" href="#/plano/${hoje.dia}">${img("calendar.png", 64)}<div><b>Dia ${hoje.dia}</b><small>A atividade de hoje está pronta</small></div></a>
        <p class="secao">Os 90 dias</p><div class="dias">${P.dias.map((d) => `<a class="dia ${feitoDia(d) ? "feito" : ""} ${d.dia === hoje.dia ? "hj" : ""}" href="#/plano/${d.dia}">${d.dia}</a>`).join("")}</div>`;
      return;
    }
    const d = P.dias.find((z) => z.dia === +dia);
    const nomes = Object.fromEntries(CFG.cadernos.map((c) => [c.id, c]));
    app.innerHTML = `${topo("#/plano", "‹ Plano")}${faixa(img(x.icone, 44), "Dia " + d.dia + " de 90")}
      <p class="dica">${esc(d.nota)}</p>
      <div class="ativs">${d.atividades.map((a) => `<a class="ativ ${feitas[a.id] ? "feita" : ""}" href="#/pa/${d.dia}/${a.cad}/${a.n}">${img(nomes[a.cad].icone, 44)}<b>${esc(a.titulo)}<small>${esc(nomes[a.cad].nome)}</small></b><span class="ck">${feitas[a.id] ? "✓" : ""}</span></a>`).join("")}</div>
      ${feitoDia(d) ? `<p class="parabens">${img("trophy.png", 60)}Dia ${d.dia} concluído!</p>` : ""}
      ${+dia < 90 ? `<a class="botao claro" href="#/plano/${+dia + 1}">Ver o dia ${+dia + 1} ›</a>` : ""}`;
  }

  /* ------------------------------ Memorias da Epoca */
  async function memorias(tipo, i) {
    if (!tem.has("m")) return oferta("m");
    const x = EXTRAS.m; cor(x.cor, x.cor2);
    const Mm = await dados("memorias");
    if (!tipo) {
      const bloco = (t, arr, rot) => `<p class="secao">${rot}</p><div class="ativs">${arr.map((a, k) => `<a class="ativ ${feitas["m-" + t + "-" + k] ? "feita" : ""}" href="#/m/${t}/${k}">${img(a.icone || x.icone, 40)}<b>${esc(a.titulo)}</b><span class="ck">${feitas["m-" + t + "-" + k] ? "✓" : ""}</span></a>`).join("")}</div>`;
      app.innerHTML = `${topo("#/", "‹ Início")}${faixa(img(x.icone, 44), x.nome)}${pdfTopo(x.pdf, "Descarregar tudo em PDF")}<p class="dica">${esc(x.descricao)}. Para fazer juntos e conversar.</p>
        ${bloco("quiz", Mm.quizzes, "Lembra-se?")}${bloco("sopa", Mm.sopas, "Sopas de letras de antigamente")}${bloco("conversa", Mm.conversa, "Cartões de conversa")}`;
      return;
    }
    const arr = { quiz: Mm.quizzes, sopa: Mm.sopas, conversa: Mm.conversa }[tipo]; const a = arr[+i];
    app.innerHTML = `${topo("#/memorias")}${faixa(img(x.icone, 40), x.nome)}<h1 class="titulo">${esc(a.titulo)}</h1>${a.pdf ? barraPdf(a.pdf, x.pdf, "Tudo em PDF") : ""}<p class="dica">${a.instr_app}</p><div class="motor"></div>${a.papel ? imprimir() : ""}`;
    M[a.app.motor]($(".motor"), a.app, () => { marcar("m-" + tipo + "-" + i); festa("Muito bem!", "Que bom recordar.", "#/memorias"); });
    $(".festa .f-voltar").textContent = "Voltar às Memórias";
    if (a.papel) ligaImprimir(a.papel);
  }

  /* ------------------------------ Corpo Ativo */
  async function corpo(i) {
    if (!tem.has("c")) return oferta("c");
    const x = EXTRAS.c; cor(x.cor, x.cor2);
    const C = await dados("corpo");
    if (i === undefined) {
      app.innerHTML = `${topo("#/", "‹ Início")}${faixa(img(x.icone, 44), x.nome)}${pdfTopo(x.pdf, "Descarregar os exercícios em PDF")}<p class="aviso-s">${esc(C.aviso)}</p>
        <p class="secao">Rotinas de 10 minutos</p><div class="ativs">${C.rotinas.map((r, k) => `<a class="ativ ${feitas["c-" + k] ? "feita" : ""}" href="#/corpo/${k}">${img(r.icone, 44)}<b>${esc(r.nome)}<small>${esc(r.descricao)}</small></b><span class="ck">${feitas["c-" + k] ? "✓" : ""}</span></a>`).join("")}</div>`;
      return;
    }
    const r = C.rotinas[+i];
    app.innerHTML = `${topo("#/corpo")}${faixa(img(x.icone, 40), x.nome)}<h1 class="titulo">${esc(r.nome)}</h1>${pdfTopo(x.pdf, "Descarregar os exercícios em PDF")}<p class="dica">${esc(r.descricao)} Fazer sentado numa cadeira estável.</p><div class="motor"></div>`;
    M.rotina($(".motor"), r, () => { marcar("c-" + i); festa("Muito bem!", "Rotina concluída. O corpo agradece.", "#/corpo"); });
    $(".festa .f-voltar").textContent = "Voltar às rotinas";
  }

  /* ------------------------------ Jogos para Jogar Juntos */
  async function jogos(i) {
    if (!tem.has("j")) return oferta("j");
    const x = EXTRAS.j; cor(x.cor, x.cor2);
    const Jg = await dados("jogos");
    if (i === undefined) {
      app.innerHTML = `${topo("#/", "‹ Início")}${faixa(img(x.icone, 44), x.nome)}${pdfTopo(x.pdf, "Descarregar todos os jogos em PDF")}<p class="dica">Para jogar a dois, em família, numa visita ou no grupo. Imprimir, recortar e jogar.</p>
        <div class="ativs">${Jg.jogos.map((g, k) => `<a class="ativ" href="#/jogos/${k}">${img(g.icone, 44)}<b>${esc(g.nome)}<small>${esc(g.resumo)}</small></b><span class="ck">›</span></a>`).join("")}</div>`;
      return;
    }
    const g = Jg.jogos[+i];
    app.innerHTML = `${topo("#/jogos", "‹ Jogos")}${faixa(img(x.icone, 40), x.nome)}<h1 class="titulo">${esc(g.nome)}</h1>${pdfTopo(g.pdf, "Descarregar este jogo em PDF")}
      <p class="secao">Como jogar</p><ol class="como-j">${g.como.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>${g.app ? '<div class="motor"></div>' : ""}`;
    if (g.app) {
      M[g.app.motor]($(".motor"), g.app, () => festa("Muito bem!", "Que bom jogar juntos.", "#/jogos"));
      $(".festa .f-voltar").textContent = "Voltar aos jogos";
    }
  }

  /* ------------------------------ todos os PDF */
  function pdfs() {
    cor("#2f7fb8", "#e8f2fa");
    const item = (f, nome, ic) => `<a class="pdf" href="../assets/pdf/${f}" download>${img(ic, 40)}${esc(nome)}</a>`;
    const extra = (k) => { const x = X(k); return tem.has(k) ? item(x.pdf, x.nome, x.icone) : `<a class="pdf tr" href="#/oferta/${k}">${img(x.icone, 40)}${esc(x.nome)}<span class="cadeado">🔒</span></a>`; };
    app.innerHTML = `${topo("#/", "‹ Início")}<h1 class="titulo">Tudo em PDF</h1><p class="dica">Descarregar, guardar e imprimir as vezes que quiser.</p>
      ${item("comecar-aqui.pdf", "Guia: como usar o kit", "open_book.png")}
      <p class="secao">Os 8 cadernos</p><div class="bonus">${CFG.cadernos.map((c) => item(c.id + ".pdf", c.nome, c.icone)).join("")}</div>
      <p class="secao">Para ir mais longe</p><div class="bonus">${vitrine().map(extra).join("")}</div>
      <p class="secao">Bónus</p><div class="bonus">${CFG.bonus.map((b) => item(b.ficheiro, b.nome, b.icone)).join("")}</div>`;
  }

  /* ------------------------------ pagina de oferta (venda dentro do produto) */
  function oferta(k) {
    if (k === "d" && !pacoteVale()) return hub();
    const x = X(k); cor(x.cor, x.cor2);
    app.innerHTML = `${topo("#/", "‹ Início")}
      <div class="of-topo">${img(x.icone, 110)}<span class="selo">${k === "d" ? "OFERTA ESPECIAL" : "NOVIDADE PARA SI"}</span><h1>${esc(x.nome)}</h1><p>${esc(x.promessa)}</p></div>
      ${x.imagem ? `<img class="dt-img" src="${x.imagem}" width="1000" height="760" alt="">` : ""}
      <div class="of-lista">${x.pontos.map((p) => `<div class="of-p">${img(p[0], 46)}<div><b>${esc(p[1])}</b><p>${esc(p[2])}</p></div></div>`).join("")}</div>
      <div class="of-preco"><span>Acesso para sempre, neste mesmo sítio</span>${x.ancora ? `<s>${esc(x.ancora)}</s>` : ""}<b>${esc(x.preco)}</b>${x.ancora ? `<span>Os dois em separado custam ${esc(x.ancora)}</span>` : ""}</div>
      ${k === "d" ? prazoHtml() : ""}
      <a class="botao grande" href="${x.checkout}">Quero o ${esc(x.nome)}</a>
      <p class="rodape">Pagamento seguro pela Hotmart. Assim que o pagamento for confirmado, o acesso fica na sua área de compras da Hotmart, com o guia e o link para abrir aqui.</p>`;
    ligaPrazo();
  }

  /* ------------------------------------------------------------------ rotas */
  async function rota() {
    const h = location.hash.replace(/^#\/?/, "").split("/");
    window.scrollTo(0, 0);
    if (!h[0]) return hub();
    if (h[0] === "c") return caderno(h[1]);
    if (h[0] === "a") return atividade(h[1], h[2]);
    if (h[0] === "pa") return atividade(h[2], h[3], "#/plano/" + h[1]);
    if (h[0] === "plano") return plano(h[1]);
    if (h[0] === "memorias") return memorias();
    if (h[0] === "m") return memorias(h[1], h[2]);
    if (h[0] === "corpo") return corpo(h[1]);
    if (h[0] === "jogos") return jogos(h[1]);
    if (h[0] === "oferta") return oferta(h[1]);
    if (h[0] === "pdfs") return pdfs();
    hub();
  }
  window.addEventListener("hashchange", () => { $(".festa").classList.remove("on"); rota(); });
  rota();
})();
