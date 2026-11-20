/* 1lovecraft.it — l'occhio, la neve marina e i tentacoli */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var NS = "http://www.w3.org/2000/svg";
  var mqRiduci = window.matchMedia("(prefers-reduced-motion: reduce)");
  var riduci = mqRiduci.matches;

  /* Generatore pseudo-casuale con seme: disegni sempre uguali a ogni visita */
  function casuale(seme) {
    return function () {
      seme = (seme + 0x6d2b79f5) | 0;
      var t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function crea(nome, attributi) {
    var e = document.createElementNS(NS, nome);
    for (var k in attributi) e.setAttribute(k, attributi[k]);
    return e;
  }

  var f1 = function (n) { return Math.round(n * 10) / 10; };

  /* ---------- Occhio ---------- */

  function decoraOcchio(svg) {
    var r = casuale(1931);

    // Fibre dell'iride
    var fibre = svg.querySelector("[data-fibre]");
    if (fibre) {
      for (var i = 0; i < 120; i++) {
        var a = r() * Math.PI * 2;
        var r1 = 15 + r() * 9;
        var r2 = 44 + r() * 32;
        var curva = (r() - 0.5) * 0.35;
        var am = a + curva;
        var rm = (r1 + r2) / 2;
        fibre.appendChild(crea("path", {
          d: "M" + f1(Math.cos(a) * r1) + " " + f1(Math.sin(a) * r1) +
             " Q" + f1(Math.cos(am) * rm) + " " + f1(Math.sin(am) * rm) +
             " " + f1(Math.cos(a) * r2) + " " + f1(Math.sin(a) * r2),
          "stroke-opacity": f1(0.12 + r() * 0.28)
        }));
      }
    }

    // Sigilli incisi sull'anello d'ottone
    var anello = svg.querySelector("[data-sigilli]");
    if (anello) {
      var n = 44;
      var griglia = [-4.5, 0, 4.5];
      for (var j = 0; j < n; j++) {
        var ang = (j / n) * 360;
        var d = "";
        var tratti = 2 + Math.floor(r() * 2);
        for (var s = 0; s < tratti; s++) {
          var x1 = griglia[Math.floor(r() * 3)], y1 = griglia[Math.floor(r() * 3)] * 1.4;
          var x2 = griglia[Math.floor(r() * 3)], y2 = griglia[Math.floor(r() * 3)] * 1.4;
          if (x1 === x2 && y1 === y2) y2 = -y1 || 6.3;
          d += "M" + x1 + " " + y1 + "L" + x2 + " " + y2;
        }
        var g = crea("g", { transform: "rotate(" + f1(ang) + ") translate(0 -229)" });
        g.appendChild(crea("path", { d: d }));
        if (r() < 0.22) g.appendChild(crea("circle", { cx: 0, cy: f1((r() - 0.5) * 6), r: 1.6 }));
        anello.appendChild(g);
      }
    }
  }

  function occhioVivo(svg, opzioni) {
    opzioni = opzioni || {};
    var iride = svg.querySelector("[data-iride]");
    var pupilla = svg.querySelector("[data-pupilla]");
    var alonePupilla = svg.querySelector("[data-alone-pupilla]");
    var lucentezza = svg.querySelector("[data-lucentezza]");
    var anello = svg.querySelector("[data-anello]");
    var palpebre = svg.querySelectorAll("[data-palpebra]");
    var scena = svg.closest(".occhio-scena");

    var tx = 0, ty = 0, x = 0, y = 0;
    var dil = 1, dilT = 1;
    var apertura = 1;
    var inizioApertura = 0;
    var battitoInizio = -1, battitoDoppio = false;
    var prossimoBattito = performance.now() + 2600 + Math.random() * 3000;
    var ultimoMovimento = -1e9;
    var bersaglio = null;
    var giro = 0, giroT = 0;
    var visibile = true;

    if (opzioni.apri && !riduci) {
      apertura = 0.03;
      inizioApertura = performance.now() + 350;
      if (scena) scena.style.setProperty("--alone", "0");
    }

    function guardaVerso(px, py) {
      var b = svg.getBoundingClientRect();
      var s = b.width / 520;
      var dx = (px - (b.left + b.width / 2)) / s;
      var dy = (py - (b.top + b.height / 2)) / s;
      var d = Math.hypot(dx, dy) || 1;
      var k = Math.min(1, d / 380);
      tx = (dx / d) * 46 * k;
      ty = (dy / d) * 24 * k;
    }

    function suPuntatore(e) {
      ultimoMovimento = performance.now();
      if (!bersaglio) guardaVerso(e.clientX, e.clientY);
    }
    window.addEventListener("pointermove", suPuntatore, { passive: true });
    window.addEventListener("pointerdown", suPuntatore, { passive: true });

    // L'occhio guarda i pulsanti quando li indichi, e la pupilla si dilata
    document.querySelectorAll("[data-sguardo]").forEach(function (el) {
      var entra = function () { bersaglio = el; dilT = 1.75; };
      var esce = function () { if (bersaglio === el) bersaglio = null; dilT = 1; };
      el.addEventListener("pointerenter", entra);
      el.addEventListener("pointerleave", esce);
      el.addEventListener("focus", entra);
      el.addEventListener("blur", esce);
    });

    // Toccalo: sbatte le palpebre, la pupilla si stringe, l'anello gira
    svg.addEventListener("click", function () {
      battito(true);
      dilT = 0.42;
      giroT += 120;
      setTimeout(function () { if (!bersaglio) dilT = 1; }, 750);
    });

    function battito(doppio) {
      battitoInizio = performance.now();
      battitoDoppio = !!doppio;
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (voci) {
        visibile = voci[0].isIntersecting;
        if (visibile) requestAnimationFrame(ciclo);
      }).observe(svg);
    }

    function chiusura(t) {
      // 1 = aperto, valori piccoli = palpebre chiuse
      if (battitoInizio < 0) return 1;
      var durata = 190;
      var p = (t - battitoInizio) / durata;
      if (battitoDoppio && p > 1 && p < 2.4) p = (p - 1.4) / 1;
      if (p < 0 || p > 1) {
        if ((t - battitoInizio) > durata * (battitoDoppio ? 2.6 : 1.1)) battitoInizio = -1;
        return 1;
      }
      return 1 - Math.sin(Math.PI * p) * 0.97;
    }

    function ciclo(t) {
      if (!visibile) return;

      // apertura iniziale
      if (inizioApertura) {
        var q = (t - inizioApertura) / 1600;
        if (q >= 0) {
          q = Math.min(1, q);
          apertura = 0.03 + (1 - 0.03) * (1 - Math.pow(1 - q, 3));
          if (scena) scena.style.setProperty("--alone", String(q));
          if (q === 1) inizioApertura = 0;
        }
      }

      // battiti spontanei
      if (!riduci && t > prossimoBattito && !inizioApertura) {
        battito(Math.random() < 0.2);
        prossimoBattito = t + 3200 + Math.random() * 5200;
      }

      // dove guardare
      if (bersaglio) {
        var b = bersaglio.getBoundingClientRect();
        guardaVerso(b.left + b.width / 2, b.top + b.height / 2);
      } else if (t - ultimoMovimento > 4000) {
        tx = Math.sin(t / 2400) * 30;
        ty = Math.sin(t / 3300) * 10 + Math.min(window.scrollY / 14, 16);
      }

      var lerp = riduci ? 1 : 0.12;
      x += (tx - x) * lerp;
      y += (ty - y) * lerp;
      dil += (dilT - dil) * (riduci ? 1 : 0.09);
      giro += (giroT - giro) * 0.05;

      iride.setAttribute("transform", "translate(" + f1(x) + " " + f1(y) + ")");
      if (lucentezza) lucentezza.setAttribute("transform", "translate(" + f1(x * 0.35) + " " + f1(y * 0.35) + ")");
      pupilla.setAttribute("rx", f1(9.5 * dil));
      pupilla.setAttribute("ry", f1(54 * (0.9 + 0.1 * dil)));
      if (alonePupilla) {
        alonePupilla.setAttribute("rx", f1(9.5 * dil + 4));
        alonePupilla.setAttribute("ry", f1(54 * (0.9 + 0.1 * dil) + 5));
      }

      var palpebra = apertura * chiusura(t);
      for (var i = 0; i < palpebre.length; i++) {
        palpebre[i].setAttribute("transform", "scale(1 " + Math.max(0.02, palpebra).toFixed(3) + ")");
      }

      if (anello) {
        var rot = window.scrollY * 0.05 + giro;
        anello.setAttribute("transform", "rotate(" + f1(rot) + ")");
      }

      requestAnimationFrame(ciclo);
    }
    requestAnimationFrame(ciclo);
  }

  /* ---------- Neve marina ---------- */

  function neveMarina(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var w = 0, h = 0, dpr = 1, particelle = [];
    var mx = -999, my = -999;

    function nuova(inizio) {
      return {
        x: Math.random() * w,
        y: inizio ? Math.random() * h : h + 6,
        r: Math.random() * 1.3 + 0.35,
        v: Math.random() * 0.16 + 0.035,
        f: Math.random() * Math.PI * 2,
        a: Math.random() * 0.45 + 0.12,
        c: Math.random() < 0.28 ? "63,224,181" : "233,225,204"
      };
    }

    function dimensiona() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(190, Math.round((w * h) / 8500));
      particelle = [];
      for (var i = 0; i < n; i++) particelle.push(nuova(true));
      if (riduci) disegna(0);
    }

    function disegna(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particelle.length; i++) {
        var p = particelle[i];
        if (!riduci) {
          p.y -= p.v;
          p.x += Math.sin(t / 3200 + p.f) * 0.1;
          if (p.y < -6) particelle[i] = p = nuova(false);
        }
        var d = Math.hypot(p.x - mx, p.y - my);
        var spinta = d < 150 ? (1 - d / 150) * 0.55 : 0;
        var alfa = p.a * (0.72 + 0.28 * Math.sin(t / 900 + p.f)) + spinta;
        ctx.fillStyle = "rgba(" + p.c + "," + Math.min(1, alfa).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + spinta * 0.8), 0, 6.2832);
        ctx.fill();
      }
    }

    function ciclo(t) {
      if (!document.hidden) disegna(t);
      requestAnimationFrame(ciclo);
    }

    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (riduci) disegna(0);
    }, { passive: true });
    window.addEventListener("resize", dimensiona);
    dimensiona();
    if (!riduci) requestAnimationFrame(ciclo);
  }

  /* ---------- Tentacoli ---------- */

  function tentacolo(r, base, punta, spessore, lato, pelle) {
    // curva di Bézier cubica tra base e punta, con due anse
    var p0 = base, p3 = punta;
    var p1 = [base[0] + (r() - 0.5) * 120, base[1] - 140 - r() * 60];
    var p2 = [punta[0] + (r() - 0.5) * 160, punta[1] + 90 + r() * 60];
    function punto(t) {
      var u = 1 - t;
      return [
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
      ];
    }
    var passi = 64, sinistra = [], destra = [], ventose = [];
    for (var i = 0; i <= passi; i++) {
      var t = i / passi;
      var a = punto(Math.max(0, t - 0.005)), b = punto(Math.min(1, t + 0.005));
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      var nx = -dy / L, ny = dx / L;
      var c = punto(t);
      var largo = spessore * Math.pow(1 - t, 0.85) + 0.6;
      sinistra.push([c[0] + nx * largo, c[1] + ny * largo]);
      destra.push([c[0] - nx * largo, c[1] - ny * largo]);
      if (i > 4 && i < passi - 10 && i % 4 === 0) {
        ventose.push([c[0] + nx * largo * 0.62 * lato, c[1] + ny * largo * 0.62 * lato, largo * 0.3]);
      }
    }
    var d = "M" + sinistra.map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L");
    d += "L" + destra.reverse().map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + "Z";
    var g = crea("g", { "class": "tentacolo" });
    g.style.animationDuration = (9 + r() * 6).toFixed(1) + "s";
    g.style.animationDelay = (-r() * 10).toFixed(1) + "s";
    g.appendChild(crea("path", { d: d, fill: "url(#" + pelle + ")" }));
    ventose.forEach(function (v) {
      g.appendChild(crea("circle", {
        cx: f1(v[0]), cy: f1(v[1]), r: f1(Math.max(0.8, v[2])),
        fill: "#0a2a30", stroke: "rgba(63,224,181,0.16)", "stroke-width": "0.8"
      }));
    });
    return g;
  }

  function tentacoli(contenitore) {
    var r = casuale(1928);
    var lati = [
      { allinea: "xMinYMax meet", lato: 1, forme: [[[40, 470], [190, 110], 26], [[150, 470], [40, 210], 20], [[-10, 470], [120, 300], 15]] },
      { allinea: "xMaxYMax meet", lato: -1, forme: [[[360, 470], [215, 130], 25], [[255, 470], [375, 230], 18], [[410, 470], [300, 320], 14]] }
    ];
    lati.forEach(function (gruppo, indice) {
      var pelle = "pelle-tentacolo-" + indice;
      var svg = crea("svg", { viewBox: "0 0 400 470", preserveAspectRatio: gruppo.allinea, "aria-hidden": "true", focusable: "false" });
      var defs = crea("defs", {});
      var grad = crea("linearGradient", { id: pelle, x1: "0", y1: "1", x2: "0", y2: "0" });
      grad.appendChild(crea("stop", { offset: "0", "stop-color": "#04161a" }));
      grad.appendChild(crea("stop", { offset: "1", "stop-color": "#0c2f36" }));
      defs.appendChild(grad);
      svg.appendChild(defs);
      gruppo.forme.forEach(function (f) {
        svg.appendChild(tentacolo(r, f[0], f[1], f[2], gruppo.lato, pelle));
      });
      contenitore.appendChild(svg);
    });
  }

  /* ---------- Avvio ---------- */

  function avvia() {
    var svg = document.querySelector("[data-occhio]");
    if (svg) {
      decoraOcchio(svg);
      occhioVivo(svg, { apri: svg.hasAttribute("data-apri") });
    }

    var canvas = document.getElementById("neve");
    if (canvas) neveMarina(canvas);

    var t = document.querySelector("[data-tentacoli]");
    if (t) tentacoli(t);

    // ingresso dei testi, in sincrono con l'apertura dell'occhio
    var hero = document.querySelector(".hero");
    if (hero) setTimeout(function () { hero.classList.add("pronto"); }, riduci ? 0 : 900);

    // indirizzo email composto qui, per tenerlo lontano dai programmi che raccolgono indirizzi
    document.querySelectorAll("[data-email]").forEach(function (el) {
      var indirizzo = el.getAttribute("data-u") + "@" + el.getAttribute("data-d");
      if (el.tagName === "A") el.href = "mailto:" + indirizzo;
      else el.textContent = indirizzo;
    });

    var anno = document.querySelector("[data-anno]");
    if (anno) anno.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
