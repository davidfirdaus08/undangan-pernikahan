(function(){
  'use strict';

  /* Kunci posisi gulir: cegah peramban memulihkan posisi lama saat dimuat ulang */
  try{
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }catch(e){}

  /* Deteksi perangkat lemah -> matikan animasi tak berujung (hemat CPU & baterai) */
  try{
    var perangkatLemah =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 2);
    if (perangkatLemah) document.documentElement.classList.add('hemat');
  }catch(e){}

  /* ====== Konstanta ====== */
  var TANGGAL_ACARA = new Date(2027, 0, 23, 8, 0, 0); // 23 Januari 2027, pukul 08.00 WIB
  var NOMOR_PANITIA = '6281234567890';                 // Nomor WhatsApp panitia (format 62...)

  var modalKalender = document.getElementById('modalKalender');
  var toast  = document.getElementById('toast');
  var toastPesan = document.getElementById('toastPesan');
  var modalAktif  = null;
  var pemicuModal = null;

  /* ====== Penghitung mundur menuju hari pernikahan ====== */
  var cdHari  = document.getElementById('cdHari');
  var cdJam   = document.getElementById('cdJam');
  var cdMenit = document.getElementById('cdMenit');
  var cdDetik = document.getElementById('cdDetik');
  var cdWrap  = document.getElementById('cdWrap');
  var cdSelesai = document.getElementById('cdSelesai');

  function duaDigit(angka){
    return angka < 10 ? '0' + angka : String(angka);
  }

  function perbaruiHitung(){
    var selisih = TANGGAL_ACARA.getTime() - Date.now();

    // Apabila acara telah berlalu, hentikan penghitung dan tampilkan sapaan penutup
    if (selisih <= 0){
      cdWrap.hidden = true;
      cdSelesai.hidden = false;
      clearInterval(penghitung);
      return;
    }

    cdHari.textContent  = duaDigit(Math.floor(selisih / 86400000));
    cdJam.textContent   = duaDigit(Math.floor(selisih / 3600000) % 24);
    cdMenit.textContent = duaDigit(Math.floor(selisih / 60000) % 60);
    cdDetik.textContent = duaDigit(Math.floor(selisih / 1000) % 60);
  }

  perbaruiHitung();
  var penghitung = setInterval(perbaruiHitung, 1000);

  /* ====== Nama tamu dari tautan (?to=Nama%20Tamu) ====== */
  (function(){
    var tamu = '';
    try{
      tamu = (new URLSearchParams(window.location.search).get('to') || '').trim().slice(0, 60);
    }catch(e){
      var m = window.location.search.match(/[?&]to=([^&]*)/);
      if (m) tamu = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim().slice(0, 60);
    }
    var elTamu = document.getElementById('namaTamu');
    if (elTamu) elTamu.textContent = tamu || 'Tamu Undangan';
  })();

  /* ====== Kelopak jatuh di sampul ====== */
  var kanvasKelopak = document.getElementById('kelopak');
  var ctxKelopak    = kanvasKelopak ? kanvasKelopak.getContext('2d') : null;
  var daftarKelopak = [], rafKelopak = null, waktuLalu = 0;
  var gerakDikurangi = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ukurKanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    kanvasKelopak.width  = kanvasKelopak.offsetWidth * dpr;
    kanvasKelopak.height = kanvasKelopak.offsetHeight * dpr;
    ctxKelopak.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function buatKelopak(dariAtas){
    var W = kanvasKelopak.offsetWidth, H = kanvasKelopak.offsetHeight;
    return {
      x: Math.random() * W,
      y: dariAtas ? -30 - Math.random() * 80 : Math.random() * H,
      s: 6 + Math.random() * 8,
      v: 16 + Math.random() * 22,
      a: Math.random() * Math.PI * 2,
      putar: (Math.random() - .5) * 1.4,
      ph: Math.random() * Math.PI * 2,
      phv: .8 + Math.random() * 1.2,
      sw: 16 + Math.random() * 28,
      c: Math.random() < .55 ? '219,168,160' : '203,184,120',
      o: .3 + Math.random() * .3
    };
  }
  function bingkaiKelopak(now){
    var dt = Math.min((now - waktuLalu) / 1000, .05); waktuLalu = now;
    var W = kanvasKelopak.offsetWidth, H = kanvasKelopak.offsetHeight, i, p;
    ctxKelopak.clearRect(0, 0, W, H);
    for (i = 0; i < daftarKelopak.length; i++){
      p = daftarKelopak[i];
      p.ph += p.phv * dt; p.a += p.putar * dt;
      p.y += p.v * dt;    p.x += Math.sin(p.ph) * p.sw * dt;
      if (p.y > H + 30){ daftarKelopak[i] = buatKelopak(true); p = daftarKelopak[i]; }
      if (p.x < -30) p.x = W + 30;
      if (p.x > W + 30) p.x = -30;
      ctxKelopak.save();
      ctxKelopak.translate(p.x, p.y); ctxKelopak.rotate(p.a);
      ctxKelopak.scale(1, .35 + .65 * Math.abs(Math.sin(p.ph)));
      ctxKelopak.globalAlpha = p.o;
      ctxKelopak.fillStyle = 'rgb(' + p.c + ')';
      ctxKelopak.beginPath();
      ctxKelopak.moveTo(0, -p.s);
      ctxKelopak.bezierCurveTo( p.s * .95, -p.s * .55,  p.s * .75, p.s * .65, 0, p.s);
      ctxKelopak.bezierCurveTo(-p.s * .75,  p.s * .65, -p.s * .95, -p.s * .55, 0, -p.s);
      ctxKelopak.fill();
      ctxKelopak.restore();
    }
    rafKelopak = window.requestAnimationFrame(bingkaiKelopak);
  }
  function mulaiKelopak(){
    if (!ctxKelopak || gerakDikurangi) return;
    if (!window.requestAnimationFrame) return;
    if (document.documentElement.classList.contains('hemat')) return;
    ukurKanvas();
    var jumlah = Math.min(16, Math.floor(window.innerWidth / 55) + 6), i;
    for (i = 0; i < jumlah; i++) daftarKelopak.push(buatKelopak(false));
    waktuLalu = performance.now();
    rafKelopak = window.requestAnimationFrame(bingkaiKelopak);
  }
  function hentikanKelopak(){
    if (rafKelopak) window.cancelAnimationFrame(rafKelopak);
    rafKelopak = null;
    if (ctxKelopak) ctxKelopak.clearRect(0, 0, kanvasKelopak.width, kanvasKelopak.height);
  }
  window.addEventListener('resize', function(){ if (rafKelopak) ukurKanvas(); });
  mulaiKelopak();

  /* ====== Tombol buka sampul ====== */
  var sampul  = document.getElementById('sampul');
  var btnBuka = document.getElementById('btnBuka');
  if (sampul && btnBuka){
    btnBuka.addEventListener('click', function(){
      hentikanKelopak();
      sampul.classList.add('terbuka');
      document.body.classList.remove('terkunci');
      window.scrollTo(0, 0);
      mulaiReveal();
      window.setTimeout(function(){ sampul.style.display = 'none'; }, 1150);
    });
  } else {
    mulaiReveal();
  }

  /* ====== Tombol gulir (panah di hero) ====== */
  var cue = document.getElementById('cue');
  if (cue){
    cue.addEventListener('click', function(){
      var tujuan = document.getElementById('undangan');
      if (tujuan) tujuan.scrollIntoView({ behavior: gerakDikurangi ? 'auto' : 'smooth' });
    });
  }

  /* ====== Peta: tautan pintar + pratinjau + salin alamat ====== */
  (function(){
    var LAT = -6.816700, LNG = 108.200000;
    var NAMA_TEMPAT = 'Kediaman Keluarga Mempelai';
    var ALAMAT = 'Jl. Raya Talaga - Cikijing, Maja Sel., Kec. Maja, ' +
                 'Kabupaten Majalengka, Jawa Barat 45461';

    var ua = navigator.userAgent;
    var perangkatApple = /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPad mode desktop

    var btnMaps = document.getElementById('btnMaps');
    var ketMaps = document.getElementById('ketMaps');
    var peta    = document.getElementById('peta');

    if (btnMaps){
      btnMaps.href = perangkatApple
        ? 'https://maps.apple.com/?daddr=' + LAT + ',' + LNG +
          '&q=' + encodeURIComponent(NAMA_TEMPAT)
        : 'https://www.google.com/maps/dir/?api=1&destination=' + LAT + ',' + LNG;
    }
    if (ketMaps){
      ketMaps.textContent = perangkatApple ? 'Akan terbuka di Apple Maps'
                                           : 'Akan terbuka di Google Maps';
    }
    if (peta){
      var bx = 0.005;
      peta.src = 'https://www.openstreetmap.org/export/embed.html' +
        '?bbox=' + (LNG - bx) + '%2C' + (LAT - bx * .65) + '%2C' +
                   (LNG + bx) + '%2C' + (LAT + bx * .65) +
        '&layer=mapnik&marker=' + LAT + '%2C' + LNG;
    }

    var btnSalin = document.getElementById('btnSalinAlamat');
    if (btnSalin){
      btnSalin.addEventListener('click', function(){
        salinTeks(NAMA_TEMPAT + ', ' + ALAMAT + ' (' + LAT + ', ' + LNG + ')')
          .then(function(berhasil){
            tampilkanToast(berhasil ? 'Alamat & koordinat berhasil disalin'
                                    : 'Gagal menyalin, mohon salin secara manual');
          });
      });
    }
  })();

  /* ====== Animasi kemunculan elemen saat digulir ====== */
  var revealDimulai = false;
  function mulaiReveal(){
    if (revealDimulai) return;
    revealDimulai = true;

    var daftarReveal = document.querySelectorAll('[data-reveal]');

    if ('IntersectionObserver' in window){
      var pengamat = new IntersectionObserver(function(entri){
        entri.forEach(function(e){
          if (e.isIntersecting){
            e.target.classList.add('is-visible');
            pengamat.unobserve(e.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

      daftarReveal.forEach(function(el){ pengamat.observe(el); });
    } else {
      // Cadangan untuk peramban lama: langsung tampilkan seluruh elemen
      daftarReveal.forEach(function(el){ el.classList.add('is-visible'); });
    }
  }

  /* ====== Dialog lokasi dan kalender: buka, tutup, dan kelola fokus ====== */
  function bukaModal(modal, pemicu){
    modalAktif = modal;
    pemicuModal = pemicu || null;
    modal.hidden = false;
    document.body.classList.add('terkunci');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ modal.classList.add('tampil'); });
    });
    var tautanPertama = modal.querySelector('.modal-aksi a');
    if (tautanPertama) tautanPertama.focus();
  }

  function tutupModal(){
    var modal = modalAktif;
    if (!modal) return;
    modal.classList.remove('tampil');
    document.body.classList.remove('terkunci');
    window.setTimeout(function(){ modal.hidden = true; }, 300);
    if (pemicuModal) pemicuModal.focus();
    pemicuModal = null;
    modalAktif = null;
  }

  document.getElementById('btnSimpan').addEventListener('click', function(){
    bukaModal(modalKalender, this);
  });

  document.querySelectorAll('.modal').forEach(function(modal){
    modal.querySelectorAll('[data-tutup]').forEach(function(el){
      el.addEventListener('click', tutupModal);
    });
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modalAktif) tutupModal();
  });

  /* ====== Toast pemberitahuan singkat ====== */
  var waktuToast;
  function tampilkanToast(pesan){
    toastPesan.textContent = pesan;
    toast.classList.add('tampil');
    window.clearTimeout(waktuToast);
    waktuToast = window.setTimeout(function(){
      toast.classList.remove('tampil');
    }, 2600);
  }

  /* ====== Salin teks ke papan klip, dengan cadangan untuk peramban lama ====== */
  function salinTeks(teks){
    if (navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(teks).then(function(){ return true; })
        .catch(function(){ return salinLama(teks); });
    }
    return Promise.resolve(salinLama(teks));
  }

  function salinLama(teks){
    var ta = document.createElement('textarea');
    ta.value = teks;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var berhasil = false;
    try { berhasil = document.execCommand('copy'); } catch (e) { berhasil = false; }
    document.body.removeChild(ta);
    return berhasil;
  }

  document.querySelectorAll('[data-rek]').forEach(function(tombol){
    tombol.addEventListener('click', function(){
      salinTeks(tombol.getAttribute('data-rek')).then(function(berhasil){
        tampilkanToast(berhasil ? 'Nomor rekening berhasil disalin'
                                : 'Gagal menyalin, mohon salin secara manual');
      });
    });
  });

  /* ====== Formulir konfirmasi kehadiran via WhatsApp ====== */
  var formRsvp  = document.getElementById('formRsvp');
  var inNama    = document.getElementById('inNama');
  var inUcapan  = document.getElementById('inUcapan');
  var inJumlah  = document.getElementById('inJumlah');
  var wrapJumlah = document.getElementById('wrapJumlah');
  var galatRsvp = document.getElementById('galatRsvp');

  // Sembunyikan pilihan jumlah orang apabila memilih berhalangan
  formRsvp.querySelectorAll('input[name="hadir"]').forEach(function(radio){
    radio.addEventListener('change', function(){
      wrapJumlah.style.display = (radio.value === 'hadir' && radio.checked) ? '' : 'none';
    });
  });

  inNama.addEventListener('input', function(){ galatRsvp.hidden = true; });

  formRsvp.addEventListener('submit', function(e){
    e.preventDefault();

    var nama = inNama.value.trim();
    if (nama === ''){
      galatRsvp.hidden = false;
      inNama.focus();
      return;
    }
    galatRsvp.hidden = true;

    var status = formRsvp.querySelector('input[name="hadir"]:checked').value;
    var ucapan = inUcapan ? inUcapan.value.trim() : '';
    var pesan  = 'Assalamu\'alaikum, saya ' + nama;

    if (status === 'hadir'){
      pesan += ' akan hadir di acara pernikahan Zakiy & Indi';
      if (!wrapJumlah.hidden){
        pesan += ' (jumlah ' + inJumlah.value + ' orang)';
      }
    } else {
      pesan += ' berhalangan hadir di acara pernikahan Zakiy & Indi';
    }
    pesan += ' pada Rabu, 23 Januari 2027. Terima kasih.';
    if (ucapan) pesan += '\n\nUcapan & doa: ' + ucapan;

    window.open('https://wa.me/' + NOMOR_PANITIA + '?text=' + encodeURIComponent(pesan), '_blank');
    tampilkanToast('Membuka WhatsApp...');
  });


  /* ====== Cetak Undangan ====== */
  function drawUndanganCanvas(nama, callback) {
    var canvas = document.createElement('canvas');
    var scale = 2;
    canvas.width = 595 * scale;
    canvas.height = 842 * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    var KC = '#F5F0E6', KB = '#C9C2AC', KE = '#97793F', KR = '#33402A', KM = '#5C6650', KK = '#FCFAF4';

    ctx.fillStyle = KC;
    ctx.fillRect(0, 0, 595, 842);

    ctx.strokeStyle = KB; ctx.lineWidth = 1.4; ctx.strokeRect(26, 26, 543, 790);
    ctx.strokeStyle = KE; ctx.lineWidth = 0.9; ctx.strokeRect(34, 34, 527, 774);

    function berlian(cx, cy, r, wr){
      ctx.fillStyle = wr;
      ctx.beginPath();
      ctx.moveTo(cx, cy + r); ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy - r); ctx.lineTo(cx - r, cy);
      ctx.closePath(); ctx.fill();
    }
    berlian(297.5, 842 - 808, 4, KE);
    berlian(297.5, 842 - 34, 4, KE);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    
    var FONT = '"Cormorant Garamond", Georgia, serif';

    function teks(s, y, font, wr){
      ctx.font = font;
      ctx.fillStyle = wr;
      ctx.fillText(s, 297.5, 842 - y);
    }
    function garis(x1, y1, x2, y2, w, wr){
      ctx.strokeStyle = wr;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x1, 842 - y1);
      ctx.lineTo(x2, 842 - y2);
      ctx.stroke();
    }

    teks('UNDANGAN PERNIKAHAN', 795, 'bold 9px ' + FONT, KE);

    var namaTeks = 'Kepada Yth. ' + (nama || 'Tamu Undangan');
    var sizeNama = 11;
    ctx.font = sizeNama + 'px ' + FONT;
    while (ctx.measureText(namaTeks).width > 480 && sizeNama > 7) {
      sizeNama -= 0.5;
      ctx.font = sizeNama + 'px ' + FONT;
    }
    teks(namaTeks, 775, sizeNama + 'px ' + FONT, KM);

    // Setup Bingkai Foto
    var fotoW = 140, fotoH = 160;
    var fotoX = 297.5 - fotoW/2;
    var fotoYTop = 75;

    function drawBingkaiPath(x, y, w, h, rTop, rBottom) {
      ctx.beginPath();
      ctx.moveTo(x + rTop, y);
      ctx.lineTo(x + w - rTop, y);
      ctx.arc(x + w - rTop, y + rTop, rTop, -Math.PI/2, 0);
      ctx.lineTo(x + w, y + h - rBottom);
      ctx.arc(x + w - rBottom, y + h - rBottom, rBottom, 0, Math.PI/2);
      ctx.lineTo(x + rBottom, y + h);
      ctx.arc(x + rBottom, y + h - rBottom, rBottom, Math.PI/2, Math.PI);
      ctx.lineTo(x, y + rTop);
      ctx.arc(x + rTop, y + rTop, rTop, Math.PI, 1.5 * Math.PI);
      ctx.closePath();
    }

    function drawBingkaiDanFoto(img) {
      // 1. Background Bingkai
      ctx.fillStyle = KK;
      drawBingkaiPath(fotoX, fotoYTop, fotoW, fotoH, fotoW/2, 18);
      ctx.fill();
      ctx.strokeStyle = KE; ctx.lineWidth = 1.4;
      ctx.stroke();

      // 2. Clip area dalam & Gambar Foto
      var pad = 8;
      var ibx = fotoX + pad, iby = fotoYTop + pad, ibw = fotoW - 2*pad, ibh = fotoH - 2*pad;
      
      if (img) {
        ctx.save();
        drawBingkaiPath(ibx, iby, ibw, ibh, ibw/2, 12);
        ctx.clip();
        
        var aspect = img.width / img.height;
        var iaspect = ibw / ibh;
        var dw, dh, dx, dy;
        if (aspect > iaspect) {
          dh = ibh; dw = dh * aspect; dx = ibx + (ibw - dw)/2; dy = iby;
        } else {
          dw = ibw; dh = dw / aspect; dx = ibx; dy = iby + (ibh - dh)/2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.save();
        drawBingkaiPath(ibx, iby, ibw, ibh, ibw/2, 12);
        ctx.clip();
        ctx.fillStyle = '#EDE6D6';
        ctx.fillRect(ibx, iby, ibw, ibh);
        ctx.restore();
      }

      // 3. Border dalam
      drawBingkaiPath(ibx, iby, ibw, ibh, ibw/2, 12);
      ctx.strokeStyle = 'rgba(169,138,77,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    var img = new Image();
    img.onload = function() {
      drawBingkaiDanFoto(img);
      drawText();
    };
    img.onerror = function() {
      drawBingkaiDanFoto(null);
      drawText();
    };

    try {
      fetch('assets/gambar/kenangan/resepsi.png')
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
          var reader = new FileReader();
          reader.onloadend = function() {
            if (reader.result) {
              img.src = reader.result;
            } else {
              img.src = 'assets/gambar/kenangan/resepsi.png';
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch(function() {
          img.src = 'assets/gambar/kenangan/resepsi.png';
        });
    } catch(e) {
      img.src = 'assets/gambar/kenangan/resepsi.png';
    }

    function drawText() {
      teks('Zakiy', 572, '40px ' + FONT, KR);
      teks('&', 552, 'italic 19px ' + FONT, KE);
      teks('Indi', 512, '40px ' + FONT, KR);

      teks('Rabu, 23 Januari 2027', 472, '13px ' + FONT, KR);
      garis(150, 472, 208, 472, 0.8, KE);
      garis(387, 472, 445, 472, 0.8, KE);

      garis(190, 442, 278, 442, 0.7, KB);
      berlian(297.5, 442, 3.5, KE);
      garis(317, 442, 405, 442, 0.7, KB);

      teks('Akad Nikah', 407, 'bold 17px ' + FONT, KR);
      teks('Rabu, 23 Januari 2027', 387, '11.5px ' + FONT, KM);
      teks('Pukul 08.00 - 10.00 WIB', 371, '11.5px ' + FONT, KM);

      teks('Resepsi', 327, 'bold 17px ' + FONT, KR);
      teks('Rabu, 23 Januari 2027', 307, '11.5px ' + FONT, KM);
      teks('Pukul 11.00 - 14.00 WIB', 291, '11.5px ' + FONT, KM);

      teks('LOKASI', 252, 'bold 9px ' + FONT, KE);
      teks('Kediaman Keluarga Mempelai', 230, 'bold 14.5px ' + FONT, KR);
      teks('Jl. Raya Talaga - Cikijing, Maja Sel., Kec. Maja,', 211, '11px ' + FONT, KM);
      teks('Kabupaten Majalengka, Jawa Barat 45461', 197, '11px ' + FONT, KM);

      teks('"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan', 156, 'italic 10.5px ' + FONT, KM);
      teks('untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram', 142, 'italic 10.5px ' + FONT, KM);
      teks('kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."', 128, 'italic 10.5px ' + FONT, KM);
      teks('QS. AR-RUM : 21', 108, 'bold 8.5px ' + FONT, KE);

      teks('Zakiy & Indi', 66, 'italic 17px ' + FONT, KR);
      teks('BESERTA KELUARGA BESAR KEDUA MEMPELAI', 48, 'bold 8px ' + FONT, KE);

      callback(canvas);
    }
  }

  function unduhUndanganPDF(nama){
    tampilkanToast('Menyiapkan undangan PDF...');
    drawUndanganCanvas(nama, function(canvas) {
      try {
        var dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        } catch (e1) {
          throw new Error('Peramban memblokir ekspor gambar (Canvas Tainted). Coba format PNG.');
        }
        
        var base64 = dataUrl.split(',')[1];
        var binary = atob(base64);
        var len = binary.length;
        var imgBytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) imgBytes[i] = binary.charCodeAt(i);

        var contentStr = 'q 595 0 0 842 0 0 cm /Im1 Do Q';

        var pdfParts = [];
        var currentOffset = 0;
        var offsets = [];

        function addStr(str) {
          var s = unescape(encodeURIComponent(str));
          var bytes = new Uint8Array(s.length);
          for (var i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
          pdfParts.push(bytes);
          currentOffset += bytes.length;
        }
        function addBytes(bytes) {
          pdfParts.push(bytes);
          currentOffset += bytes.length;
        }

        addStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

        offsets.push(currentOffset);
        addStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

        offsets.push(currentOffset);
        addStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

        offsets.push(currentOffset);
        addStr('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');

        offsets.push(currentOffset);
        addStr('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + canvas.width + ' /Height ' + canvas.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + len + ' >>\nstream\n');
        addBytes(imgBytes);
        addStr('\nendstream\nendobj\n');

        offsets.push(currentOffset);
        var contentBytes = new Uint8Array(contentStr.length);
        for (var i = 0; i < contentStr.length; i++) contentBytes[i] = contentStr.charCodeAt(i);
        addStr('5 0 obj\n<< /Length ' + contentBytes.length + ' >>\nstream\n');
        addBytes(contentBytes);
        addStr('\nendstream\nendobj\n');

        var xrefOffset = currentOffset;
        addStr('xref\n0 6\n0000000000 65535 f \n');
        for (var i = 0; i < offsets.length; i++) {
          addStr(('0000000000' + offsets[i]).slice(-10) + ' 00000 n \n');
        }
        addStr('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF');

        var blob = new Blob(pdfParts, { type: 'application/pdf' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Undangan-Zakiy-Indi.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
      } catch(e) {
        console.error(e);
        tampilkanToast(e.message || 'Gagal mengunduh, coba gunakan format PNG');
      }
    });
  }

  function unduhUndanganPNG(nama){
    tampilkanToast('Menyiapkan unduhan PNG...');
    drawUndanganCanvas(nama, function(canvas) {
      try {
        var dataUrl = canvas.toDataURL('image/png');
        var a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'Undangan-Zakiy-Indi.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch(e) {
        console.error(e);
        tampilkanToast('Gagal mengunduh.');
      }
    });
  }

  var modalUnduhan = document.getElementById('modalUnduhan');
  var btnUnduh = document.getElementById('btnUnduh');
  var inNamaUnduh = document.getElementById('inNamaUnduh');

  // Wajib isi nama sebelum buka dialog unduhan
  if (btnUnduh) {
    btnUnduh.addEventListener('click', function() {
      var nama = inNamaUnduh.value.trim();
      if (nama === '') {
        tampilkanToast('Mohon isi nama Anda terlebih dahulu.');
        inNamaUnduh.focus();
        return;
      }
      bukaModal(modalUnduhan, this);
    });
  }

  var btnUnduhPDF = document.getElementById('btnUnduhPDF');
  var btnUnduhPNG = document.getElementById('btnUnduhPNG');

  if (btnUnduhPDF) {
    btnUnduhPDF.addEventListener('click', function() {
      tutupModal();
      unduhUndanganPDF(inNamaUnduh.value.trim() || 'Tamu Undangan');
    });
  }

  if (btnUnduhPNG) {
    btnUnduhPNG.addEventListener('click', function() {
      tutupModal();
      unduhUndanganPNG(inNamaUnduh.value.trim() || 'Tamu Undangan');
    });
  }
})();