(function () {
  const B = MiniBoot;
  const root = document.getElementById("screen");
  const KEY = "kuis-laga-v1";
  let bank = [];
  let pack = 0;

  function today() { return B.wibDateISO(); }
  function hash(s) { var h=0; for (var i=0;i<s.length;i++) h=(h*33+s.charCodeAt(i))>>>0; return h; }
  function packQs(p) {
    var start = hash(today() + ":" + p) % bank.length;
    var out = [];
    for (var i = 0; i < 5; i++) out.push(bank[(start + i * 7) % bank.length]);
    return out;
  }
  function rec() { return B.load(KEY, { days: {} }); }

  function render() {
    var qs = packQs(pack);
    var day = rec().days[today()] || { packs: {} };
    var prog = day.packs[pack] || { answers: {}, i: 0 };
    var i = Math.min(prog.i, qs.length);
    var done = i >= qs.length;
    var score = 0;
    qs.forEach(function (q, n) { if (prog.answers[n] === q.a) score++; });
    var html = '<div class="screen-fade"><div class="top"><div><div class="eyebrow">Kuis aturan & turnamen</div><h1>Kuis Laga</h1></div><div class="date-chip">' + B.escapeHtml(B.formatIdDate()) + "</div></div>";
    if (!done) {
      var q = qs[i];
      html += '<div class="card"><p class="muted">Soal ' + (i+1) + ' / 5</p><p class="lead">' + B.escapeHtml(q.q) + '</p><div class="choices">';
      q.choices.forEach(function (c, n) {
        html += '<button class="choice" data-n="' + n + '">' + B.escapeHtml(c) + "</button>";
      });
      html += "</div></div>";
    } else {
      html += '<div class="card"><p class="muted">Paket ' + (pack+1) + '</p><p class="clock">' + score + '/5</p>';
      qs.forEach(function (q, n) {
        var ok = prog.answers[n] === q.a;
        html += '<p class="muted" style="margin-top:10px"><strong>' + (ok?"Benar":"Tinjauan") + ".</strong> " + B.escapeHtml(q.q) + " — " + B.escapeHtml(q.why) + "</p>";
      });
      html += '<div data-ad-slot="banner" hidden></div>';
      html += '<div class="btn-row two"><button class="btn" id="share">Bagikan</button><button class="btn secondary" id="lagi">Paket lain</button></div>';
      html += '<div class="affiliate-row"><div data-affiliate="shopee" hidden><a href="#"><span data-affiliate-label>Shopee</span></a></div><div data-affiliate="tokopedia" hidden><a href="#"><span data-affiliate-label>Tokopedia</span></a></div></div>';
      html += '<button class="stars-btn" data-stars hidden><span data-stars-label>Hapus iklan</span></button></div>';
    }
    html += '<p class="footer-links">Tanpa logo klub, foto pemain, atau merek resmi. Soal merujuk fakta umum pertandingan dan turnamen. Bukan aplikasi federasi.</p></div>';
    root.innerHTML = html;
    if (MiniAds && MiniAds.apply) MiniAds.apply(root);
    Array.prototype.forEach.call(document.querySelectorAll("[data-n]"), function (b) {
      b.onclick = function () {
        var n = Number(b.getAttribute("data-n"));
        var r = rec();
        r.days[today()] = r.days[today()] || { packs: {} };
        var p = r.days[today()].packs[pack] || { answers: {}, i: 0 };
        p.answers[p.i] = n;
        p.i += 1;
        r.days[today()].packs[pack] = p;
        B.store(KEY, r);
        if (p.i >= 5) {
          if (pack === 0) B.updateStreak(KEY + "-streak", today());
          MiniAds.maybeInterstitial();
        }
        render();
      };
    });
    var lg = document.getElementById("lagi");
    if (lg) lg.onclick = function () {
      function go() { pack += 1; render(); }
      if (MiniAds.rewardedAvailable()) MiniAds.showRewarded().then(function (res) { if (res.ok) go(); else B.toast("Iklan paket tambahan belum diatur."); });
      else go();
    };
    var sh = document.getElementById("share");
    if (sh) sh.onclick = function () {
      var card = B.drawShareCard({
        bg: "#0F3D2E", ink: "#F3FFF6", muted: "#B5D8C4", accent: "#7CFFB2", wash: "rgba(124,255,178,0.12)",
        eyebrow: "Kuis Laga", title: score + " / 5",
        lines: [{ text: B.formatIdDate(), muted: true }, { text: "Paket " + (pack+1), muted: true }],
        footer: "kabarunnie.github.io/kuis-laga"
      });
      B.shareCanvas(card, "Kuis Laga " + today() + ": " + score + "/5", "https://kabarunnie.github.io/kuis-laga/");
    };
  }

  B.setupTelegram();
  Promise.all([fetch("data/kuis.json").then(function (r) { return r.json(); }), MiniAds.load("data/ads.json")]).then(function (res) {
    bank = res[0]; render();
  });
})();
