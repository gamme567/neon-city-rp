// Three.js 3D motorunu ES Modül olarak yükle
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js';

// Render sunucusunun API adresi
sabit API = Dize(
    window.NEON_API_BASE || 'https://neon-city-rp-server.onrender.com'
).replace(/\/$/, '');

const $ = (id) => document.getElementById(id);
const screens = ['device', 'auth', 'home', 'servers', 'character', 'settings', 'game'];
const roleColors = { Vatandaş: '#54e2d6', Polis: '#6c9dff', Mekanik: '#ffb65a', Esnaf: '#d39aff' };
sabit durum = {
  ekran: 'ana sayfa', seçilen sunucu: null, seçilen rol: 'Vatandaş', oyuncu: null,
  kanal: 'genel', son mesaj zamanı: 0, görülen mesajlar: yeni Set(), uzak oyuncular: yeni Map(),
  Anahtarlar: new Set(), cameraYaw: 0, cameraPitch: 0.32, cameraDistance: 8,
  hassasiyet: 0.008, ipuçları: true, chatOpen: true, duraklatıldı: false, lastSync: 0,
  sunucu önbelleği: [], yerel hareket: false, bildirim zamanlayıcısı: null, kimlik doğrulama belirteci: localStorage.getItem('neon_auth_token') || '', hesap: null, ws: null, ws yeniden bağlantı zamanlayıcısı: null, ws ping zamanlayıcısı: null, kimlik doğrulama modu: 'giriş', cihaz türü: localStorage.getItem('neon_device_type') || '', dünya yapılandırması: null, şehir profili: null, şehir kataloğu: null, şehir görevleri: null, şehir sekmesi: 'alışveriş', aktif mini: null,
};

const scene = new THREE.Scene();
sahne.arka plan = yeni ÜÇ.Renk(0x09131d);
sahne.sis = yeni THREE.FogExp2(0x09131d, 0.0085);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 260);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('world-canvas'), antialias: true, alpha: false });
} hata yakala {
  clearTimeout(window.__neonBootWatchdog);
  $('boot-screen').classList.add('has-error');
  $('boot-status').textContent = '3D GRAFİK BAŞLATILAMADI';
  $('boot-error-details').hidden = false;
  $('boot-error-details').querySelector('p').textContent = 'Tarayıcı WebGL kayıtları başlatılamadı. Chrome'da donanım hızlandırmayı tarayıcıyı yeniden başlat.';
  console.error('WebGL oluşturucu başlatma başarısız oldu.', error);
  hata fırlat;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

sabit saat = yeni THREE.Clock();
sabit dünya = yeni THREE.Group();
scene.add(world);
const avatarGroup = new THREE.Group();
scene.add(avatarGroup);
const remoteGroup = new THREE.Group();
scene.add(remoteGroup);
const ambient = new THREE.HemisphereLight(0x8bbacb, 0x131923, 1.5);
scene.add(ambient);
const moonLight = new THREE.DirectionalLight(0xa7c9dc, 1.6);
moonLight.position.set(-25, 42, -15);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
Ayışığı.gölge.kamera.sol = -65; Ayışığı.gölge.kamera.sağ = 65;
Ayışığı.gölge.kamera.üst = 65; Ayışığı.gölge.kamera.alt = -65;
scene.add(moonLight);
const fillLight = new THREE.DirectionalLight(0x42a9ac, 0.55);
fillLight.position.set(30, 12, 25);
scene.add(fillLight);

const mat = (color, roughness = 0.78, metalness = 0.08, emissive = null) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...(emissive ? { emissive: new THREE.Color(emissive), emissiveIntensity: 0.55 } : {}) });
sabit matlar = {
  asfalt: mat(0x151f2a, 0.96), beton: mat(0x273541, 0.92), kaldırım: mat(0x35434b),
  binaA: mat(0x1b2b39), binaB: mat(0x22313c), binaC: mat(0x28313d),
  cam: yeni THREE.MeshStandardMaterial({ renk: 0x36717a, emisyon: 0x12464c, emisyon yoğunluğu: 0.8, pürüzlülük: 0.3, metaliklik: 0.55 }),
  darkGlass: new THREE.MeshStandardMaterial({ color: 0x172b38, emissive: 0x071b25, emissiveIntensity: 0.7, roughness: 0.25, metalness: 0.6 }),
  neon: new THREE.MeshStandardMaterial({ color: 0x59f2dc, emissive: 0x1ca69a, emissiveIntensity: 1.4 }),
  sıcak: yeni THREE.MeshStandardMaterial({ color: 0xffc16e, emissive: 0xb45a20, emissiveIntensity: 1.1 }),
};

fonksiyon kutusu(ebeveyn, x, y, z, w, h, d, malzeme, döküm = true, alma = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast; mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}
fonksiyon silindir(ebeveyn, x, y, z, r1, r2, h, malzeme, segmentler = 10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, segments), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}

fonksiyon addBuilding(x, z, w, h, d, index) {
  sabit grup = yeni THREE.Group();
  group.position.set(x, 0, z);
  const bodyMat = [mats.buildingA, mats.buildingB, mats.buildingC][index % 3];
  kutu(grup, 0, h / 2, 0, w, h, d, bodyMat);
  kutu(grup, 0, h + 0.12, 0, w + 0.35, 0.24, d + 0.35, mat(0x101e29));
  kutu(grup, 0, 1.1, d / 2 + 0.025, w * 0.64, 2.2, 0.08, mats.darkGlass, false);
  // Şehre bakan tarafta ışıklandırılmış pencerelerden oluşan bir ızgara.
  sabit satırlar = Math.max(2, Math.floor((h - 3) / 3.1));
  const cols = Math.max(2, Math.floor(w / 2.8));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      sabit wx = -w / 2 + (c + 0.5) * (w / cols);
      sabit wy = 2,5 + r * 3;
      sabit on = ((r * 7 + c * 3 + index * 5) % 7) < 3;
      const windowMat = on ? ((r + c) % 4 === 0 ? mats.warm : mats.glass) : mats.darkGlass;
      kutu(grup, wx, wy, d / 2 + 0.07, Math.min(1.15, w / sütunlar * 0.55), 1.15, 0.07, windowMat, false, false);
    }
  }
  // Yan pencereler, kamera bloğun etrafında dönerken derinlik katar.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      sabit wz = -d / 2 + (c + 0.5) * (d / 2);
      kutu(grup, w / 2 + 0.05, 2.5 + r * 3, wz, 0.07, 1.1, 1.05, ((r + c + indeks) % 3 === 0) ? mats.glass : mats.darkGlass, false, false);
    }
  }
  // Seçili binaların çatısında ince bir tabela.
  if (index % 3 === 0) {
    kutu(grup, 0, h + 1.0, d / 2 - 0.3, w * 0.5, 1.1, 0.18, mats.neon, false, false);
  }
  world.add(group);
}

fonksiyon addLamp(x, z) {
  const group = new THREE.Group(); group.position.set(x, 0, z);
  silindir(grup, 0, 2.3, 0, 0.07, 0.1, 4.6, mat(0x172a35));
  kutu(grup, 0.35, 4.45, 0, 0.8, 0.08, 0.08, mat(0x263c45));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.warm); bulb.position.set(0.72, 4.35, 0); group.add(bulb);
  const light = new THREE.PointLight(0xffbf80, 1.5, 12, 2); light.position.set(0.72, 4.15, 0); group.add(light);
  world.add(group);
}

fonksiyon addTree(x, z, scale = 1) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(scale);
  silindir(grup, 0, 0.8, 0, 0.18, 0.25, 1.6, mat(0x3d3026));
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), mat(0x173e3d));
  taç.konum.y = 2.05; taç.ölçek.ayarla(1, 1.25, 1); taç.gölgeyioluştur = true; grup.ekle(taç);
  const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), mat(0x20564e));
  crown2.position.set(0.35, 2.65, 0.12); crown2.castShadow = true; group.add(crown2);
  world.add(group);
}

buildWorld() fonksiyonu {
  // Geniş arazi ve merkezdeki yaya meydanı.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(190, 190), mats.asphalt);
  zemin.dönme.x = -Math.PI / 2; zemin.konum.y = -0.08; zemin.gölgeyial = true; dünya.ekle(zemin);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), mats.concrete);
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = -0.015; plaza.receiveShadow = true; world.add(plaza);
  const squareBorder = new THREE.Mesh(new THREE.RingGeometry(21.4, 22.2, 64), mat(0x53616a));
  squareBorder.rotation.x = -Math.PI / 2; squareBorder.position.y = 0.01; world.add(squareBorder);
  // Kavşaklar ve şerit işaretlemeleri.
  kutu(dünya, 0, 0.015, -31, 170, 0.035, 13, mat(0x101922), yanlış, doğru);
  kutu(dünya, 0, 0.015, 31, 170, 0.035, 13, mat(0x101922), yanlış, doğru);
  kutu(dünya, -31, 0.015, 0, 13, 0.035, 170, mat(0x101922), yanlış, doğru);
  kutu(dünya, 31, 0.015, 0, 13, 0.035, 170, mat(0x101922), yanlış, doğru);
  for (let x = -78; x <= 78; x += 8) {
    kutu(dünya, x, 0.045, -31, 3.2, 0.025, 0.16, mat(0x7a8588), false, false);
    kutu(dünya, x, 0.045, 31, 3.2, 0.025, 0.16, mat(0x7a8588), false, false);
  }
  for (let z = -78; z <= 78; z += 8) {
    kutu(dünya, -31, 0.045, z, 0.16, 0.025, 3.2, mat(0x7a8588), false, false);
    kutu(dünya, 31, 0.045, z, 0.16, 0.025, 3.2, mat(0x7a8588), false, false);
  }
  // Meydan kaldırım şeritleri.
  for (let i = -20; i <= 20; i += 5) {
    kutu(dünya, i, 0.012, 0, 0.035, 0.02, 42, mat(0x3b4b54), false, false);
    kutu(dünya, 0, 0.012, i, 42, 0.02, 0.035, mat(0x3b4b54), false, false);
  }
  // Ortada bir çeşme var.
  silindir(dünya, 0, 0.32, 0, 3.2, 3.7, 0.55, mat(0x485c65), 32);
  silindir(dünya, 0, 0.62, 0, 2.7, 2.9, 0.12, mat(0x213a43), 32);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.045, 32), new THREE.MeshStandardMaterial({ color: 0x247f86, emissive: 0x0b4548, emissiveIntensity: 0.65, metalness: 0.6, roughness: 0.2 }));
  su.konum.y = 0.72; dünya.suyu ekle;
  silindir(dünya, 0, 1.25, 0, 0.35, 0.5, 1.1, mat(0x536b72), 20);
  const fountainGlow = new THREE.PointLight(0x40d5ce, 1.2, 16); fountainGlow.position.set(0, 2.5, 0); world.add(fountainGlow);
  // Banklar ve küçük sokak aksesuarları.
  (sabit [x, z, rot] için [[-11, 0, 0], [11, 0, Math.PI], [0, -11, Math.PI / 2], [0, 11, -Math.PI / 2]]) {
    const bench = new THREE.Group(); bench.position.set(x, 0, z); bench.rotation.y = rot;
    kutu(tezgah, 0, 0.65, 0, 3.4, 0.16, 0.8, mat(0x684d3b));
    kutu(tezgah, 0, 1.25, -0.28, 3.4, 1.1, 0.13, mat(0x684d3b));
    for (const sx of [-1.25, 1.25]) { box(bench, sx, 0.31, 0, 0.12, 0.62, 0.12, mat(0x273a43)); }
    world.add(bench);
  }
  // Oynanabilir meydanın etrafındaki çevre silüeti.
  sabit bloklar = [
    [-51, -47, 19, 22, 20], [-28, -52, 17, 33, 18], [2, -54, 23, 29, 19], [35, -49, 22, 25, 22], [57, -26, 18, 31, 22],
    [55, 22, 20, 24, 22], [30, 52, 21, 32, 20], [-2, 55, 23, 25, 20], [-34, 51, 22, 28, 18], [-57, 22, 19, 24, 20],
  ];
  bloklar.forEach((b, i) => addBuilding(b[0], b[1], b[2], b[3], b[4], i));
  // Karşılıklı kenarlarda neon tabela kuleleri.
  const signA = new THREE.Group(); signA.position.set(-17, 0, -25); world.add(signA);
  kutu(signA, 0, 2.3, 0, 5.3, 4.6, 0.3, mat(0x152b38));
  box(signA, 0, 3,25, 0,2, 4,6, 0,12, 0,12, mats.neon, false, false);
  const signB = new THREE.Group(); signB.position.set(18, 0, 25); world.add(signB);
  kutu(signB, 0, 2.3, 0, 5.3, 4.6, 0.3, mat(0x152b38));
  kutu(signB, 0, 3.25, 0.2, 4.6, 0.12, 0.12, mats.warm, false, false);
  // Sahil boyunca ağaçlar ve lambalar.
  for (const [x, z] of [[-19,-18],[-19,18],[19,-18],[19,18],[-26,0],[26,0],[0,-26],[0,26]]) addTree(x,z,0.85);
  for (const [x, z] of [[-23,-23],[23,-23],[-23,23],[23,23],[-8,-23],[8,-23],[-8,23],[8,23],[-23,8],[23,8],[-23,-8],[23,-8]]) addLamp(x,z);
  // Uzaktaki dekoratif kule silüetleri ufka derinlik katıyor.
  for (let i = 0; i < 18; i++) {
    sabit açı = (i / 18) * Math.PI * 2;
    sabit yarıçap = 78 + (i % 3) * 6;
    sabit h = 18 + (i * 13 % 30);
    const b = new THREE.Mesh(new THREE.BoxGeometry(9 + (i % 3) * 3, h, 9 + (i % 2) * 3), mat(0x101e2a));
    b.position.set(Math.sin(angle) * radius, h / 2, Math.cos(angle) * radius); world.add(b);
  }
  // İnce yıldızlar/gökyüzü noktaları.
  const starGeometry = new THREE.BufferGeometry();
  sabit pozisyonlar = [];
  for (let i = 0; i < 380; i++) {
    const theta = Math.random() * Math.PI * 2;
    sabit y = 15 + Math.random() * 70;
    sabit yarıçap = 90 + Math.random() * 65;
    pozisyonlar.push(Math.cos(theta) * yarıçap, y, Math.sin(theta) * yarıçap);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x87b9c5, size: 0.28, transparent: true, opacity: 0.7 }));
  scene.add(stars);
}

fonksiyon makeNameSprite(etiket, renk = '#dffaf7') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(5,14,22,0.78)'; ctx.fillRect(8, 20, 496, 88);
  ctx.strokeStyle = 'rgba(85,230,219,0.65)'; ctx.lineWidth = 3; ctx.strokeRect(8, 20, 496, 88);
  ctx.fillStyle = color; ctx.font = 'bold 38px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase().slice(0, 18), 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(3.3, 0.83, 1); sprite.position.y = 3.15;
  sprite döndür;
}

fonksiyon createAvatar(name, color = '#54e2d6', role = 'Vatandaş') {
  sabit kök = yeni THREE.Group();
  const skin = mat(0xc58e71); const outfit = mat(color, 0.66, 0.13, color);
  const dark = mat(0x17232d); const shoe = mat(0x101820);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.72, 5, 8), outfit);
  gövde.konum.y = 1.35; gövde.gölgeyi oluştur = true; kök.ekle(gövde);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), skin);
  baş.konum.y = 2.18; baş.gölgeyioluştur = true; kök.baş ekle;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), dark);
  saç.konumu.y = 2.28; kök.ekle(saç);
  const leftArm = new THREE.Group(); leftArm.position.set(-0.51, 1.62, 0); root.add(leftArm);
  const larm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.52, 4, 7), outfit); larm.position.y = -0.34; leftArm.add(larm);
  const rightArm = new THREE.Group(); rightArm.position.set(0.51, 1.62, 0); root.add(rightArm);
  const rarm = larm.clone(); rarm.position.y = -0.34; rightArm.add(rarm);
  const leftLeg = new THREE.Group(); leftLeg.position.set(-0.21, 0.77, 0); root.add(leftLeg);
  const legGeo = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.52, 4, 7), dark); legGeo.position.y = -0.31; legGeo.castShadow = true; leftLeg.add(legGeo);
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.13, 0.48), shoe); leftShoe.position.set(0, -0.63, 0.1); leftLeg.add(leftShoe);
  const rightLeg = new THREE.Group(); rightLeg.position.set(0.21, 0.77, 0); root.add(rightLeg);
  const leg2 = legGeo.clone(); rightLeg.add(leg2);
  const shoe2 = leftShoe.clone(); rightLeg.add(shoe2);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.19, 0.035), mat(role === 'Polis' ? 0x9fc7ff : 0xc7e6df));
  rozet.konum.ayarla(0.19, 1.55, 0.43); kök.ekle(rozet);
  root.add(makeNameSprite(name, color));
  root.userData = { leftArm, rightArm, leftLeg, rightLeg, moving: false, walkPhase: 0, name, role };
  kök dizini döndür;
}

fonksiyon setAvatarIdentity(avatar, isim, renk, rol) {
  const oldLabel = avatar.children.find(c => c.isSprite);
  Eğer eski etiket mevcutsa, avatarı kaldırın; eski etiketin materyalini haritadan çıkarın; eski etiketin materyalini haritadan çıkarın.
  avatar.add(makeNameSprite(name, color));
  avatar.userData.name = name; avatar.userData.role = role;
}

buildWorld();
const localAvatar = createAvatar('MİSAFİR', roleColors.Vatandaş, 'Vatandaş');
avatarGroup.add(localAvatar);
localAvatar.visible = false;

fonksiyon toast(mesaj, süre = 2800) {
  const node = $('toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(state.toastTimer);
  durum.toastTimer = setTimeout(() => node.classList.remove('show'), süre);
}

asenkron fonksiyon api(yol, gövde = null) {
  const options = body === null ? { headers: { ...(state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {}) }, cache: 'no-store' } : {
    yöntem: 'POST', başlıklar: { 'Content-Type': 'application/json', ...(state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {}) }, gövde: JSON.stringify(gövde), önbellek: 'no-store'
  };
  const response = await fetch(`${API}${path}`, options);
  let data = {};
  try { data = await response.json(); } catch { /* hatalı yanıt */ }
  Eğer yanıt başarılı değilse, Sunucu hatası (${response.status}) fırlatılır.
  Veri döndür;
}

showScreen fonksiyonu (ad) {
  eğer (!screens.includes(name)) return;
  ekranlar.forEach(ekran => $(`ekran-${ekran}`).classList.toggle('aktif', ekran === isim));
  state.screen = name;
  document.body.classList.toggle('in-game', name === 'game');
  if (name === 'game') {
    durum.duraklatıldı = false; $('duraklatma-katmanı').sınıfList.kaldır('görünür');
    localAvatar.visible = true;
    Eğer oyuncunun durumu doğruysa, yerel avatarın konumunu oyuncunun x konumuna (0) ve z konumuna (0) ayarlayın.
  } aksi halde {
    state.keys.clear();
    Eğer ad 'karakter' ise, yerel avatarın görünürlüğü ayarlanır ve avatar kimliği, state.account?.username'e 'MİSAFİR' değeri atanarak belirlenir.
    aksi takdirde eğer (name === 'home' || name === 'servers' || name === 'settings') localAvatar.visible = false;
  }
  if (name === 'servers') loadServers();
  if (name === 'character') updateSelectedServer();
}

updateTop() fonksiyonu {
  $('top-player-name').textContent = state.player?.name?.toUpperCase() || 'GUEST';
  $('profile-avatar').textContent = (state.player?.name || 'G').slice(0, 1).toUpperCase();
}

asenkron fonksiyon loadBootstrap() {
  try {
    const data = await api('/api/bootstrap');
    state.serverCache = Array.isArray(data.servers) ? data.servers : [];
    state.worldConfig = data.world || null; applyWorldConfig();
    $('home-online').textContent = data.onlineTotal ?? 0;
    $('server-total-online').textContent = data.onlineTotal ?? 0;
    $('network-state').textContent = state.serverCache.length ? 'AĞ AKTİF' : 'AÇIK SUNUCU YOK';
    $('network-state').previousElementSibling?.classList.toggle('live-dot', state.serverCache.length > 0);
    renderServers();
  } yakala {
    // Gerçek sunucu kaybolduktan sonra eski/demo sunucu kartlarını asla görünür bırakmayın.
    state.serverCache = [];
    state.selectedServer = null;
    $('home-online').textContent = '0';
    $('server-total-online').textContent = '0';
    $('network-state').textContent = 'SUNUCU BEKLENİYOR';
    $('network-state').previousElementSibling?.classList.remove('live-dot');
    renderServers('Sunucuya ulaşılamıyor.server.py açık mı kontrol et.');
  }
}

fonksiyon renderServers(errorMessage = '') {
  sabit liste = $('sunucu listesi');
  list.innerHTML = '';

  eğer (!state.serverCache.length) {
    state.selectedServer = null;
    const empty = document.createElement('div');
    empty.className = 'server-empty-glass-card';
    empty.innerHTML = `
      <div class="server-empty-icon">⌁</div>
      <strong>${errorMessage ? 'SUNUCUYA BAĞLANILAMIYOR' : 'ŞU ANDA AÇIK SUNUCU YOK'</strong>
      <p>${escapeHtml(errorMessage || 'Listede yalnızca gerçekten çalışan NEON CITY RP sunucuları görünüyor. Bir sunucu açık burada listelenecek.')</p>
      <button type="button" class="btn btn-ghost" id="server-refresh">↻ YENİDEN TARA</button>`;
    list.appendChild(empty);
    $('server-total-online').textContent = '0';
    $('selected-server-name').textContent = 'Sunucunun seçimidi';
    $('selected-server-mode').textContent = '';
    $('character-join').disabled = true;
    $('character-error').textContent = 'Şehre girmek için açık bir sunucu gerekli.';
    $('server-refresh').addEventListener('click', loadServers);
    return;
  }

  $('character-join').disabled = !state.selectedServer || state.selectedServer.status === 'full';
  $('karakter-hatası').textContent = '';
  const stillListed = state.serverCache.find(s => s.id === state.selectedServer?.id);
  // Seçilen sunucunun oyuncu sayısını/durumunu en son kalp atışından itibaren yenileyin.
  durum.seçilenSunucu = hala listelenmiş || null;

  durum.sunucuönbelleği.herbiri için((sunucu, indeks) => {
    const card = document.createElement('article');
    kart.sınıfAdı = `sunucu-kartı ${state.selectedServer?.id === sunucu.id ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="server-visual ${server.accent || ''}"><span class="visual-sun"></span><i class="visual-building one"></i><i class="visual-building two"></i><i class="visual-building three"></i><i class="visual-building four"></i></div>
      <div class="server-meta"><span class="server-region">${escapeHtml(server.region)}</span><span class="server-state ${server.status === 'full' ? 'full' : ''}">${server.status === 'full' ? 'DOLU' : '● ÇEVRİMİÇİ'}</span></div>
      <h3>${escapeHtml(server.name)}</h3><p>${escapeHtml(server.description)}</p>
      <div class="server-stats"><span>OYUNCULAR <b>${Number(server.players) || 0} / ${Number(server.capacity) || 0}</b></span><span>${escapeHtml(String(server.mode || '').toUpperCase())}</span></div>
      <span class="server-select">SUNUCUYU SEÇ ↗</span>`;
    card.style.animationDelay = `${index * 0.08}s`;
    kart.addEventListener('click', () => {
      if (server.status === 'ful') { tost('Bu sunucu dolu.'); geri dönmek; }
      state.selectedServer = server;
      renderServers();
      $('selected-server-name').textContent = server.name;
      $('selected-server-mode').textContent = String(server.mode || '').toUpperCase();
      showScreen('karakter');
    });
    list.appendChild(card);
  });
}

asenkron fonksiyon loadServers() {
  try {
    const data = await api('/api/bootstrap');
    state.serverCache = Array.isArray(data.servers) ? data.servers : [];
    $('server-total-online').textContent = data.onlineTotal ?? 0;
    $('home-online').textContent = data.onlineTotal ?? 0;
    renderServers();
  } yakala {
    state.serverCache = [];
    state.selectedServer = null;
    $('server-total-online').textContent = '0';
    $('home-online').textContent = '0';
    renderServers('Sunucuya ulaşılamıyor.server.py açık mı kontrol et.');
  }
}

updateSelectedServer() fonksiyonu {
  Eğer (!state.selectedServer veya !state.serverCache'te s'nin kimliği state.selectedServer.id'ye eşit değilse) {
    state.selectedServer = state.serverCache.find(s => s.status !== 'full') || null;
  }
  $('selected-server-name').textContent = state.selectedServer?.name || 'Sunucu sıradandi';
  $('selected-server-mode').textContent = (state.selectedServer?.mode || '').toUpperCase();
  $('character-join').disabled = !state.selectedServer || state.selectedServer.status === 'full';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[ch]));
}

addChatMessage fonksiyonu (mesaj) {
  Eğer mesaj yoksa veya state.seenMessages.has(message.id) içeriyorsa, geri dön.
  state.seenMessages.add(message.id);
  durum.sonMesajZamanı = Math.max(durum.sonMesajZamanı, Number(mesaj.zaman) || 0);
  sabit tutucu = $('sohbet-mesajları');
  const row = document.createElement('div');
  row.className = `chat-message ${message.channel === 'sistem' ? 'system' : message.channel === 'rol' ? 'role' : ''}`;
  const date = new Date(mesaj.zaman || Date.şimdi());
  const damgası = mesaj.kanal === 'sistem' ? 'SİSTEM' : `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  const name = document.createElement('b'); name.textContent = message.channel === 'sistem' ? 'NEON CITY' : message.name || 'OYUNCU';
  const text = document.createElement('p'); text.textContent = message.text || '';
  const time = document.createElement('span'); time.className = 'chat-time'; time.textContent = stamp;
  row.append(time, name, text);
  satır.veri kümesi.kanal = mesaj.kanal || 'genel';
  holder.appendChild(row);
  filterChat();
  while (holder.children.length > 100) holder.removeChild(holder.firstChild);
  holder.scrollTop = holder.scrollHeight;
}

filterChat() fonksiyonu {
  document.querySelectorAll('.chas-message').forEach(node ​​=> {
    const kanalı = node.dataset.channel || 'genel';
    node.style.display = (channel === 'sistem' || channel === state.channel) ? '' : 'none';
  });
  document.querySelectorAll('.chat-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.channel === state.channel));
}

updatePlayerList fonksiyonu (oyuncular) {
  $('game-player-count').textContent = players.length;
  $('players-count-label').textContent = String(players.length).padStart(2, '0');
  const list = $('players-list'); list.innerHTML = '';
  if (!players.length) { list.innerHTML = '<div class="empty-players">Şimdilik yalnızsın.</div>'; geri dönmek; }
  oyuncular.dilim(0, 20).herbiri için(p => {
    const row = document.createElement('div'); row.className = 'player-row';
    const dot = document.createElement('i'); dot.className = 'player-dot'; dot.style.color = p.color || '#54e2d6'; dot.style.background = p.color || '#54e2d6';
    const info = document.createElement('span'); info.className = 'player-info';
    const name = document.createElement('b'); name.textContent = p.name || 'Oyuncu';
    const role = document.createElement('small'); role.textContent = (p.role || 'Vatandaş').toUpperCase();
    bilgi.ekle(ad, rol); satır.ekle(nokta, bilgi); liste.ekle(satır);
  });
}

fonksiyon syncRemotePlayers(oyuncular) {
  sabit alive = new Set();
  (sabit p oyuncu için) {
    Eğer p.id, state.player?.id'ye eşit değilse devam et;
    alive.add(p.id);
    avatar = state.remotePlayers.get(p.id);
    eğer (!avatar) {
      avatar = createAvatar(p.name || 'Oyuncu', p.color || '#a78bfa', p.role || 'Vatandaş');
      remoteGroup.add(avatar); state.remotePlayers.set(p.id, avatar);
    }
    if (avatar.userData.name !== p.name) setAvatarIdentity(avatar, p.name || 'Oyuncu', p.color || '#a78bfa', p.role || 'Vatandaş');
    avatar.position.lerp(new THREE.Vector3(Number(px) || 0, 0, Number(pz) || 0), 0.45);
    avatar.rotation.y = Number(p.yaw) || 0;
  }
  for (const [id, avatar] of state.remotePlayers()) {
    Eğer (id) mevcut değilse, remoteGroup.remove(avatar); disposeObject(avatar); state.remotePlayers.delete(id); }
  }
}

function disposeObject(obj) {
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    eğer (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      malzemeler.forEach(m => { m.map?.dispose(); m.dispose(); });
    }
  });
}

gerçek zamanlı URL işlevi {
  sabit temel = API || konum.kaynak;
  sabit url = yeni URL(base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws'; url.search = ''; url.hash = '';
  url.searchParams.set('token', state.authToken);
  url.searchParams.set('playerId', state.player.id);
  url.searchParams.set('server', state.player.serverId);
  url.toString(); döndür
}

connectRealtime() fonksiyonu {
  if (!state.player || !state.authToken || 'WebSocket' in window)) return;
  try {
    const socket = new WebSocket(realtimeUrl()); state.ws = socket;
    soket.onopen = () => {
      $('network-state').textContent = 'CANLI BAĞLANTI';
      if (state.wsPingTimer) clearInterval(state.wsPingTimer);
      state.wsPingTimer = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({type:'ping'})); }, 25000);
    };
    soket.onmesaj = olay => {
      let data; try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'snapshot' || data.type === 'state') {
        syncRemotePlayers(data.players || []); updatePlayerList(data.players || []);
        (data.messages || []).forEach(addChatMessage);
      } aksi takdirde (data.type === 'chat' ve data.message) addChatMessage(data.message);
    };
    soket.onclose = () => {
      if (state.ws === socket) state.ws = null;
      Eğer `state.wsPingTimer` doğruysa, `clearInterval(state.wsPingTimer)` değerini `null` olarak ayarlayın.
      if (state.player && state.screen === 'game') {
        $('network-state').textContent = 'BAĞLANTI YENİLENİYOR';
        clearTimeout(state.wsReconnectTimer);
        state.wsReconnectTimer = setTimeout(connectRealtime, 2200);
      }
    };
    socket.onerror = () => { try { socket.close(); } catch {} };
  } catch (error) { console.warn('WebSocket başlatılamadı; HTTP yedek bellek kullanılacak.', error); }
}

Gerçek Zamanlı Kapatma İşlevi (closeRealtime()) {
  clearTimeout(state.wsReconnectTimer); state.wsReconnectTimer = null;
  if (state.wsPingTimer) clearInterval(state.wsPingTimer); state.wsPingTimer = null;
  const socket = state.ws; state.ws = null;
  Eğer soket mevcut değilse, soketi kapatıp kapatmayı deneyin; ardından soketi kapatın. Bir sorun oluşursa, sorun devam ederse yeni bir soket seçin.
}

asenkron fonksiyon joinGame() {
  const name = state.account?.username || '';
  $('karakter-hatası').textContent = '';
  if (!state.authToken || name.length < 3) { $('character-error').textContent = 'Önce giriş yapmalısınız.'; showScreen('yetki'); geri dönmek; }
  if (!state.selectedServer) { $('character-error').textContent = 'Önce bir sunucu seçmelisin.'; geri dönmek; }
  const button = $('character-join'); button.disabled = true; button.querySelector('span').textContent = 'BAĞLANILIYOR...';
  try {
    const data = await api('/api/join', { role: state.selectedRole, serverId: state.selectedServer.id, color: roleColors[state.selectedRole] });
    state.player = data.player;
    Oyuncunun x ekseni = 0; Oyuncunun z ekseni = 4; Oyuncunun yaw ekseni = 0;
    localAvatar.visible = true;
    localAvatar.position.set(0, 0, 4); localAvatar.rotation.y = 0;
    setAvatarIdentity(localAvatar, name, roleColors[state.selectedRole], state.selectedRole);
    state.cameraYaw = 0; state.lastMessageTime = 0; state.seenMessages.clear();
    $('chat-messages').innerHTML = '';
    $('game-server-name').textContent = state.selectedServer.name.toUpperCase();
    $('top-player-name').textContent = name.toUpperCase();
    $('profile-avatar').textContent = name.slice(0,1).toUpperCase();
    addChatMessage({ id: 'welcome-local',channel: 'sistem', text: `${name}, NEON CITY'ye hoş geldin. WASD ile şehri keşfedt.`, time: Date.now() });
    updateTop(); showScreen('game'); refreshCity();
    tost(`${state.selectedServer.name} sunucusuna bağlandın. Fareyi sahneye tıklatıp kamerayı çevirebilirsin.`);
    connectRealtime();
    await pollState();
  } hata yakala {
    $('character-error').textContent = error.message || 'Bağlantı kurulamadı.';
  } sonunda {
    button.disabled = false; button.querySelector('span').textContent = 'ŞEHRE GİR';
  }
}

asenkron fonksiyon pollState() {
  Eğer oyuncu durumu 'oyun' değilse, geri dön;
  if (state.ws && state.ws.readyState === WebSocket.OPEN) return;
  try {
    const data = await api(`/api/state?server=${encodeURIComponent(state.player.serverId)}&since=${state.lastMessageTime}`);
    syncRemotePlayers(data.players || []);
    updatePlayerList(data.players || []);
    (data.messages || []).forEach(addChatMessage);
  } catch { /* geçici yoklama hatası; sonraki döngüde tekrar denenecek */ }
}

asenkron fonksiyon syncPosition() {
  Eğer oyuncu durumu 'oyun' değilse, geri dön;
  state.player.x = localAvatar.position.x; state.player.z = localAvatar.position.z; state.player.yaw = localAvatar.rotation.y;
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify({type:'position', x:state.player.x, z:state.player.z, yaw:state.player.yaw}));
    return;
  }
  try { await api('/api/player', { id: state.player.id, x: state.player.x, z: state.player.z, yaw: state.player.yaw }); }
  catch { tost('Bağlantı yenileniyor.'); }
}

asenkron fonksiyon sendChat(event) {
  event?.preventDefault();
  eğer (state.player) değilse geri dön;
  const input = $('chat-input'); const text = input.value.trim();
  eğer metin yoksa geri dön;
  input.value = '';
  try {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({type:'chat', text, channel:state.channel}));
    } aksi halde {
      const data = await api('/api/chat', { playerId: state.player.id, text, channel: state.channel });
      addChatMessage(data.message);
    }
  } catch (error) { toast(error.message); }
}

async function leaveGame() { closeCityPanel(); closeRealtime();
  eğer (state.player) {
    sabit id = state.player.id;
    state.player = null;
    try { await api('/api/leave', { id }); } catch { /* oturum TTL süresiyle sona erecek */ }
  }
  for (const avatar of state.remotePlayers.values()) { remoteGroup.remove(avatar); disposeObject(avatar); }
  state.remotePlayers.clear(); state.keys.clear(); state.paused = false;
  $('pause-overlay').classList.remove('visible');
  updateTop(); showScreen('servers'); loadBootstrap();
}

fonksiyon togglePause(değer = !state.paused) {
  Eğer (ekran durumu 'oyun' değilse) geri dön;
  durum.duraklatıldı = değer; $('duraklatma-katmanı').classList.toggle('görünür', durum.duraklatıldı);
  eğer (durum duraklatılmışsa) durum anahtarlarını temizle();
}

updateAvatar fonksiyonu (delta) {
  Eğer (ekran durumu 'oyun' değilse veya duraklatılmış değilse veya oyuncu durumu yoksa) geri dön;
  sabit anahtarlar = durum.anahtarları;
  let forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  let side = (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0);
  const isMoving = forward !== 0 || side !== 0;
  eğer (hareket ediyorsa) {
    const length = Math.hypot(forward, side); forward /= length; side /= length;
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 9.2 : 5.6;
    sabit yaw = state.cameraYaw;
    const dirX = Math.sin(yaw) * ileri + Math.cos(yaw) * yan;
    const dirZ = Math.cos(yaw) * forward - Math.sin(yaw) * side;
    localAvatar.position.x = THREE.MathUtils.clamp(localAvatar.position.x + dirX * speed * delta, -40, 40);
    localAvatar.position.z = THREE.MathUtils.clamp(localAvatar.position.z + dirZ * speed * delta, -40, 40);
    localAvatar.rotation.y = Math.atan2(dirX, dirZ);
    state.localMove = true;
  } aksi takdirde { state.localMove = false; }
  const ud = localAvatar.userData; ud.moving = Hareketli;
  eğer (hareket ediyorsa) {
    ud.walkPhase += delta * (keys.has('ShiftLeft') ? 12 : 8);
    sabit salınım = Math.sin(ud.walkPhase) * 0.58;
    ud.leftLeg.rotation.x = swing; ud.rightLeg.rotation.x = -swing;
    ud.leftArm.rotation.x = -swing * 0.72; ud.rightArm.rotation.x = swing * 0.72;
  } aksi halde {
    ud.leftLeg.rotation.x = THREE.MathUtils.damp(ud.leftLeg.rotation.x, 0, 9, delta);
    ud.rightLeg.rotation.x = THREE.MathUtils.damp(ud.rightLeg.rotation.x, 0, 9, delta);
    ud.leftArm.rotation.x = THREE.MathUtils.damp(ud.leftArm.rotation.x, 0, 9, delta);
    ud.rightArm.rotation.x = THREE.MathUtils.damp(ud.rightArm.rotation.x, 0, 9, delta);
  }
  localAvatar.position.y = Hareket Ediyor mu? Math.abs(Math.sin(ud.walkPhase * 2)) * 0,045 : 0;
}

fonksiyon updateCamera(delta, elapsed) {
  if (state.screen === 'character') {
    const target = new THREE.Vector3(0, 1.45, 0);
    const desired = new THREE.Vector3(4.7, 3.1, -7.5);
    kamera.konumu.lerp(istenilen, 1 - Math.exp(-2.5 * delta));
    camera.lookAt(target);
  } aksi takdirde eğer (state.screen === 'game' && state.player) {
    const hedef = new THREE.Vector3(localAvatar.position.x, 1.65, localAvatar.position.z);
    sabit mesafe = durum.kameraMesafesi;
    sabit yatay = Math.cos(state.cameraPitch) * mesafe;
    const offset = new THREE.Vector3(-Math.sin(state.cameraYaw) * horizontal, Math.sin(state.cameraPitch) * distance + 1.1, -Math.cos(state.cameraYaw) * horizontal);
    const desired = target.clone().add(offset);
    kamera.konumu.lerp(istenilen, 1 - Math.exp(-7 * delta));
    camera.lookAt(target);
  } aksi halde {
    sabit t = geçen süre * 0,12;
    const desired = new THREE.Vector3(18 + Math.sin(t) * 5, 10.5 + Math.sin(t * 0.7) * 1.1, -28 + Math.cos(t) * 4);
    kamera.konumu.lerp(istenilen, 1 - Math.exp(-1.5 * delta));
    camera.lookAt(0, 2.5, 0);
  }
}

let lastPoll = 0;
let lastPositionSync = 0;
animate() fonksiyonu {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;
  updateAvatar(delta);
  updateCamera(delta, elapsed);
  // Önizleme avatarı için hafif bir bekleme animasyonu.
  if (state.screen === 'character') localAvatar.rotation.y = Math.sin(elapsed * 0.5) * 0.28;
  aksi takdirde eğer (state.screen !== 'game') localAvatar.rotation.y = Math.sin(elapsed * 0.35) * 0.18;
  if (state.screen === 'game' && !state.paused) {
    son Anket += delta; lastPositionSync += delta;
    Eğer son anket 1,35'ten büyükse, son anketi 0'a eşitle ve anket durumunu ayarla.
    Eğer lastPositionSync 0.12'den büyükse, lastPositionSync değerini 0'a eşitleyin ve konumu senkronize edin.
  }
  renderer.render(sahne, kamera);
}
animate();

// Kalıcı hesap ekonomisi ve şehir merkezi. Ödüller ve satın alımlar server.py tarafından doğrulanır.
asenkron fonksiyon loadCityProfile() {
  const data = await api('/api/profile');
  eyalet.şehirProfil = veri.profil; eyalet.şehirKatalogu = veri.katalog; eyalet.şehirGörevleri = veri.görevler;
  renderCityPanel();
}
function cityMoney(value) { return `₺${Number(value || 0).toLocaleString('tr-TR')}`; }
renderCityPanel() fonksiyonu {
  eğer (!state.cityProfile) ise geri dön;
  $('city-balance').textContent = cityMoney(state.cityProfile.balance);
  document.querySelectorAll('[data-city-tab]').forEach(b => b.classList.toggle('active', b.dataset.cityTab === state.cityTab));
  const root = $('city-panel-content'); root.innerHTML = '';
  const addCard = (icon, title, desc, price, action, disabled=false, button='SATIN AL') => {
    const card = document.createElement('article'); card.className = 'city-item';
    const i = document.createElement('span'); i.className='city-icon'; i.textContent=icon;
    const b = document.createElement('b'); b.textContent = başlık;
    const p = document.createElement('p'); p.textContent = desc;
    const strong = document.createElement('strong'); strong.textContent = price;
    const btn = document.createElement('button'); btn.textContent = 'button'; btn.disabled = 'disabled'; btn.addEventListener('click', action);
    card.append(i,b,p,strong,btn); root.append(card);
  };
  if (state.cityTab === 'shop') {
    const hint=document.createElement('p');hint.className='city-hint';hint.textContent='Araçlar hesabına kalıcı olarak eklenir. Eşya satın almaları envanteri işlenir.';root.append(hint);
    Object.entries(state.cityCatalog).forEach(([id,item])=>{const owned=item.kind==='car'&&state.cityProfile.cars.includes(id);addCard(item.kind==='car'?'🚗':'🛍️',item.name,item.description,cityMoney(item.price),()=>buyCityItem(id),owned||state.cityProfile.balance<item.price,owned?'GARAJINDA':item.kind==='car'?'ARACI AL':'SATIN AL');});
  } aksi takdirde eğer (state.cityTab === 'garage') {
    const arabalar=state.cityProfile.cars||[]; if(!cars.length){root.innerHTML='<div class="city-empty">Henüz araç yok. Marketten ilk aracı satın al!</div>';return;}
    arabalar.forEach(id=>{const item=state.cityCatalog[id];if(item)addCard('🚘',item.name,'Bu araç hesabına kayıtlı.
  } aksi takdirde eğer (state.cityTab === 'quests') {
    const today=new Date().toISOString().slice(0,10);
    Object.entries(state.cityQuests).forEach(([id,q])=>{const done=(id==='first-steps'&&state.cityProfile.joinedOnce)||(id==='game-time'&&(state.cityProfile.miniGames||0)>0)||(id==='city-life'&&(state.cityProfile.marketBuys||0)>0);const claims=state.cityProfile.claimedQuests?.[id]===today;addCard('📋',q.title,q.description,`ÖDÜL ${cityMoney(q.reward)}`,()=>claimQuest(id),!done||claimed,claimed?'BUGÜN ALINDI':done?'ÖDÜLÜ AL':'ÖNCE TAMAMLA');});
  } aksi halde {
    const games=[['math','🧠','Hızlı Matematik','Kısa bir işlem çözer.','₺90'],['memory','🔢','Sayı Hafızası','Sayı dizisini aklında tut ve tekrar et.','₺110'],['reaction','⚡','Refleks Testi','Ekrandaki işarete doğru zamanda tepki ver.','₺80']];
    games.forEach(([id,icon,title,desc,reward])=>addCard(icon,title,desc,`ÖDÜL ${reward}`,()=>startMiniGame(id),false,'OYNA'));
  }
}
async function refreshCity() { try { await loadCityProfile(); } catch(e) { toast(e.message); } }
async function buyCityItem(itemId) { try { const r = await api('/api/shop/buy', {itemId}); state.cityProfile.balance = r.balance; state.cityProfile.cars = r.cars; state.cityProfile.items = r.items; state.cityProfile.marketBuys = r.marketBuys; renderCityPanel(); toast(r.message); } catch (e) { toast(e.message); } }
async function claimQuest(questId) { try { const r=await api('/api/quest/claim',{questId});state.cityProfile.balance=r.balance;state.cityProfile.claimedQuests[questId]=new Date().toISOString().slice(0,10);renderCityPanel();toast(`Görev tamamlandı! +${cityMoney(r.reward)}`); } catch(e){toast(e.message);} }
asenkron fonksiyon startMiniGame(id) {
  try { const r=await api('/api/minigame/start',{gameId:id});state.activeMini={id,nonce:r.nonce}; const root=$('city-panel-content');root.innerHTML='';
    const wrap = document.createElement('div'); wrap.className = 'mini-question'; const title = document.createElement('h3'); const prompt = document.createElement('p'); const input = document.createElement('input'); input.autocomplete = 'off'; input.placeholder = 'Cevabını yaz'; const btn = document.createElement('button'); btn.textContent = 'CEVABI GÖNDER'; wrap.append(title, prompt, input, btn); root.append(wrap);
    let answer=''; if(id==='math'){const a=7+Math.floor(Math.random()*13),b=3+Math.floor(Math.random()*9);answer=String(a*b);title.textContent='HIZLI MATEMATİK';prompt.textContent=`${a} × ${b} sonucu kaç?`;input.inputMode='numeric';} else if(id==='memory'){const seq=Array.from({length:5},()=>Math.floor(Math.random()*9)+1).join(' ');answer=seq.replaceAll(' ','');title.textContent='SAYI HAFIZASI';prompt.textContent=`Bu diziyi 4 saniye ile: ${seq}`;input.placeholder='Sayıları yerel yaz';setTimeout(()=>{prompt.textContent='Şimdi diziyi hatırlayıp kurtarabilir yaz.';},4000);answer=seq.replaceAll(' ','');} else {answer='NEON';title.textContent='REFLEKS TESTİ';prompt.textContent='NEON kelimesini gördüğünde aynen yaz. Hazır ol!';setTimeout(()=>{prompt.textContent='ŞİMDİ! NEON yaz ve gönder.';},2500);}
    btn.addEventListener('click',async()=>{if(input.value.trim().replaceAll(' ','').toUpperCase()!==answer.toUpperCase()){toast('Cevap doğru değil, tekrar dene.');return;}btn.disabled=true;try{const done=await api('/api/minigame/finish',{nonce:r.nonce});state.cityProfile.balance=done.balance;state.cityProfile.miniGames=(state.cityProfile.miniGames||0)+1;toast(`Başardın! +${cityMoney(done.reward)}`);renderCityPanel();}catch(e){btn.disabled=false;toast(e.message);}});input.focus();
  } catch(e){toast(e.message);}
}
function openCityPanel(tab='shop') { state.cityTab=tab;$('city-panel').classList.add('open');refreshCity(); }
function closeCityPanel(){ $('city-panel').classList.remove('open');state.activeMini=null; }

// İlk ziyarette cihaz seçimi. Seçim yerel olarak kaydedilir ve daha sonra değiştirilebilir.
startAfterDeviceChoice() fonksiyonu {
  Eğer cihaz türü belirtilmemişse, 'cihaz' ekranını göster ve işlemi sonlandır.
  eğer (state.authToken) {
    api('/api/me').then(data => { state.account = data.account; updateTop(); showScreen('home'); }).catch(() => {
      state.authToken = ''; state.account = null; localStorage.removeItem('neon_auth_token'); showScreen('auth');
    });
  } aksi takdirde { showScreen('auth'); }
}
document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
  state.deviceType = button.dataset.device;
  localStorage.setItem('neon_device_type', state.deviceType);
  document.body.dataset.device = state.deviceType;
  startAfterDeviceChoice();
}));
if (state.deviceType) document.body.dataset.device = state.deviceType;

// Hesap girişi/kaydı; hesap adı, oyun içindeki tek kimliktir.
$('auth-switch').addEventListener('click', () => {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  $('auth-title').innerHTML = state.authMode === 'giriş' ? 'ŞEHRE <span>HOŞ GELDİN</span>' : 'YENİ BİR <span>HİKÂYE</span>';
  $('auth-submit').querySelector('span').textContent = state.authMode === 'giriş yap' ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR';
  $('auth-switch').textContent = state.authMode === 'giriş' ? 'Hesabın yok mu? Hesap oluştur' : 'Zaten hesabın var mı? Giriş yap';
  $('auth-password').autocomplete = state.authMode === 'login' ? 'current-password' : 'new-password';
  $('auth-error').textContent = '';
});
$('auth-form').addEventListener('submit', async event => {
  event.preventDefault(); $('auth-error').textContent = '';
  const button = $('auth-submit'); button.disabled = true;
  try {
    const data = await api(state.authMode === 'login' ? '/api/login' : '/api/register', { username: $('auth-username').value.trim(), password: $('auth-password').value });
    state.authToken = data.token; state.account = data.account; localStorage.setItem('neon_auth_token', data.token);
    $('auth-password').value = ''; updateTop(); showScreen('ev'); tost(state.authMode === 'login' ? 'Giriş başarılı.' : 'Hesabın oluşturuldu.');
  } catch (error) { $('auth-error').textContent = error.message; }
  Son olarak, düğme devre dışı bırakıldı: false; }
});

// Gezinme ve menü kontrolleri.
$('city-menu-open').addEventListener('click',()=>openCityPanel('shop'));
$('city-panel-close').addEventListener('click',closeCityPanel);
$('city-panel').addEventListener('click',e=>{if(e.target.id==='city-panel')closeCityPanel();});
document.querySelectorAll('[data-city-tab]').forEach(b=>b.addEventListener('click',()=>{state.cityTab=b.dataset.cityTab;renderCityPanel();}));
$('profile-avatar').addEventListener('click', () => { if (!confirm('Hesaptan çıkmak istiyor musun?')) return; state.authToken = ''; state.account = null; localStorage.removeItem('neon_auth_token'); updateTop(); showScreen('auth'); });
$('home-play').addEventListener('click', () => showScreen('servers'));
$('home-servers').addEventListener('click', () => showScreen('servers'));
document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.screen)));
$('character-join').addEventListener('click', joinGame);
$('chat-form').addEventListener('submit', sendChat);
$('leave-game').addEventListener('click', () => togglePause(true));
$('resume-game').addEventListener('click', () => togglePause(false));
$('pause-leave').addEventListener('click', leaveGame);
$('chat-collapse').addEventListener('click', () => {
  state.chatOpen = !state.chatOpen;
  $('chat-window').classList.toggle('collapsed', !state.chatOpen);
  $('chat-collapse').textContent = state.chatOpen ? '-' : '+';
});
document.querySelectorAll('.chat-tab').forEach(tab => tab.addEventListener('click', () => { state.channel = tab.dataset.channel; filterChat(); $('chat-input').placeholder = state.channel === 'rol' ? 'Rol mesajını yaz...' : 'Mesajını yaz...'; $('chat-input').focus(); }));
document.querySelectorAll('.role-card').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.role-card').forEach(card => card.classList.remove('selected'));
  button.classList.add('selected'); state.selectedRole = button.dataset.role;
  setAvatarIdentity(localAvatar, state.account?.username || 'GUEST', button.dataset.color, state.selectedRole);
}));
$('sensitivity-setting').addEventListener('input', event => { state.sensitivity = Number(event.target.value) / 1000; });
$('tips-setting').addEventListener('change', event => { state.tips = event.target.checked; $('interaction-hint').style.display = state.tips ? '' : 'none'; document.querySelector('.control-card').style.display = state.tips ? '' : 'none'; });
$('kalite ayarı').addEventListener('değişim', olay => {
  sabit seviye = olay.hedef.değer;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, level === 'high' ? 1.7 : level === 'medium' ? 1.25 : 1));
  renderer.shadowMap.enabled = level !== 'low';
  tost(`Görsel kalite: ${level === 'yüksek' ? 'Yüksek' : seviye === 'orta' ? 'Orta' : 'Düşük'}`);
});

pencere.addEventListener('keydown', olay => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    Eğer olay anahtarı 'Escape' ise, olay hedefi bulanıklaştırılır.
    return;
  }
  Eğer olay kodu 'Escape' ise, olay varsayılan ayarını devre dışı bırak ve oyunu durdur; eğer ekran durumu 'game' ise, duraklatmayı aç ve bırak;
  Eğer 'game' durumu ve 'KeyT' durumu doğruysa, 'chat-input' olayına odaklanıp işlemi durdurun.
  if (state.screen === 'game' && event.code === 'KeyE' && !state.paused) { tost('Yakında etkileşime açık bir nokta yok.'); geri dönmek; }
  if (state.screen === 'game' && ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code)) {
    event.preventDefault(); state.keys.add(event.code);
  }
});
window.addEventListener('keyup', event => state.keys.delete(event.code));
window.addEventListener('blur', () => state.keys.clear());
let pointerDown = false; let lastPointerX = 0; let lastPointerY = 0;
$('world-canvas').addEventListener('click', () => {
  if (state.screen === 'game' && !state.paused && document.pointerLockElement !== $('world-canvas')) $('world-canvas').requestPointerLock?.();
});
$('world-canvas').addEventListener('pointerdown', event => {
  Eğer (ekran durumu 'oyun' değilse veya duraklatılmışsa) geri dön;
  pointerDown = true; lastPointerX = event.clientX; lastPointerY = event.clientY;
});
document.addEventListener('mousemove', event => {
  Eğer (ekran durumu 'oyun' değilse veya duraklatılmışsa) geri dön;
  if (!pointerDown && document.pointerLockElement !== $('world-canvas')) return;
  const dx = document.pointerLockElement === $('world-canvas') ? event.movementX : event.clientX - lastPointerX;
  const dy = document.pointerLockElement === $('world-canvas') ? event.movementY : event.clientY - lastPointerY;
  lastPointerX = event.clientX; lastPointerY = event.clientY;
  durum.kameraYaw -= dx * durum.hassasiyet;
  state.cameraPitch = THREE.MathUtils.clamp(state.cameraPitch + dy * 0.0025, -0.05, 0.78);
});
$('world-canvas').addEventListener('pointerup', () => { pointerDown = false; });
document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== $('world-canvas')) pointerDown = false; });
$('world-canvas').addEventListener('pointercancel', () => { pointerDown = false; });
$('world-canvas').addEventListener('wheel', event => {
  Eğer (ekran durumu 'oyun' değilse) geri dön;
  state.cameraDistance = THREE.MathUtils.clamp(state.cameraDistance + Math.sign(event.deltaY) * 0.7, 5, 13);
}, { pasif: doğru });
pencere.addEventListener('yeniden boyutlandırma', () => {
  kamera.en boy oranı = iç genişlik / iç yükseklik; kamera.projeksiyon matrisini güncelle();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
});

// Şehir saati, başlatma ve ilk ağ durumu.
applyWorldConfig() fonksiyonu {
  const mode = state.worldConfig?.timeOfDay || 'evening';
  const hour = mode === 'morning' ? 8 : mode === 'noon' ? 13 : mode === 'night' ? 23 : mode === 'cycle' ? new Date().getHours() : 19;
  const t = Math.max(0, Math.min(1, (hour - 6) / 18));
  const night = Math.max(0, Math.min(1, Math.abs(hour - 13) / 7));
  const sky = new THREE.Color().setHSL(0.57, 0.36, 0.055 + (1-night)*0.32);
  scene.background.copy(sky); scene.fog.color.copy(sky);
  Ortam yoğunluğu = 0,65 + (1-gece)*1,1; Ay ışığı yoğunluğu = 0,25 + gece*1,65;
  fillLight.intensity = 0.2 + (1-night)*0.5;
}

updateClock() fonksiyonu {
  const now = new Date();
  $('city-clock').textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
updateClock(); setInterval(updateClock, 15000); setInterval(() => { if (state.worldConfig?.timeOfDay === 'cycle') applyWorldConfig(); }, 60000);
loadBootstrap();
startAfterDeviceChoice();
setInterval(() => { if (!state.player) loadBootstrap(); }, 12000);
setInterval(() => { if (!state.player && state.screen === 'servers') loadServers(); }, 5000);
window.__neonGameReady = true;
clearTimeout(window.__neonBootWatchdog);
$('boot-screen').classList.remove('has-error');
$('boot-error-details').hidden = true;
setTimeout(() => $('boot-screen').classList.add('done'), 650);

// Oyuncu katılmadan önce şehrin çekici bir şekilde çerçevelenmiş olduğundan emin olun.
camera.position.set(18, 10.5, -28);
camera.lookAt(0, 2.5, 0);