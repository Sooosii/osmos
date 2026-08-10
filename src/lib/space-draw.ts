import type { SpaceMark } from '@/data/types';
import { type Camera, type Viewport, markRadius, worldToScreen } from './space-camera';
import { type FeelTarget, feelAnchor, feelMatch, hasFeel } from './space-feel';

/**
 * Koku Uzayı'nın çizimi — tuval, veri ve kamera girer, resim çıkar.
 *
 * Durumu yok, React'i tanımıyor: aynı girdi her zaman aynı kareyi veriyor.
 * Bileşen "ne zaman çizileceğine", bu modül "neyin çizileceğine" bakıyor.
 */

/** Sönük nokta opaklığı — seçim varken haritanın geri kalanı bu değerde. */
const DIM_ALPHA = 0.16;

/** Normal opaklık tabanı ve derinlikle eklenen pay. */
const ALPHA_BASE = 0.55;
const ALPHA_RANGE = 0.45;

/** Lekenin yarıçapı, noktanınkinin katı. Uzaya "parlıyor" hissini veren kısım. */
const HALO_SCALE = 3.2;
const HALO_ALPHA = 0.3;

/**
 * Zemin — mat siyah (sahip denemesi, 2026-08-10).
 *
 * Eskisi bir vinyetti: merkez `#14141B`, kenar `#050507` — haritayı yuvarlak
 * bir alan gibi okutuyordu. Sahip düz mat siyah istedi; iki sabit aynı değere
 * çekildi ama ayrı duruyorlar ki vinyet tek satırla geri gelebilsin.
 */
const BACKGROUND_CENTER = '#000000';
const BACKGROUND_EDGE = '#000000';

/**
 * Kenara doğru sönüm — noktalar uzaklaştıkça kayboluyor.
 *
 * Ölçü, görüş alanına çizilebilen en büyük dairenin yarıçapı: 1.0 o dairenin
 * kenarı, köşeler 1.4 civarı. Bu yüzden sönüm 1.0'da başlıyor — daire içi hiç
 * dokunulmamış kalıyor, boşalan yalnızca köşeler.
 *
 * ⚠️ Seçili parfüm ve komşuları bu sönümün dışında. Kenardaki bir noktaya
 * basıldığında sönük bir leke değil, net bir nokta görünmeli — atmosfer bilgiyi
 * yutmamalı.
 */
const FADE_START = 1.0;
const FADE_END = 1.6;

/** Üstüne gelinen ya da seçilen nokta bu kadar piksel büyüyor. */
const ACTIVE_GROWTH = 2.5;

/**
 * Tarife uyan noktanın öne çıkışı — büyüme (px) ve lekesinin katsayısı.
 *
 * ⚠️ Bunlar olmadan kaydıraç cevabı okunmuyordu ve sebebi ince: uyan noktalar
 * aslında hiç parlamıyor, yalnızca **diğerleri sönüyordu.** En iyi eşleşme
 * kaydıraca dokunulmadan önceki parlaklığında kalıyor, dolayısıyla ekran
 * "seçilenler öne çıktı" değil "her şey biraz karardı" gibi okunuyordu.
 *
 * Şimdi uyan nokta hem birkaç piksel büyüyor hem lekesi güçleniyor. Boy, küçük
 * noktalarda opaklıktan daha hızlı okunuyor; leke ise koyu zeminde "parlıyor"
 * hissini veren asıl şey — `HALO_SCALE`in en baştaki gerekçesi de buydu.
 *
 * Çekirdeğin opaklığına dokunulmuyor: derin noktalar zaten 1'e yakın, orada
 * kazanılacak yer yok ve zorlamak rengi ağartırdı.
 *
 * Uyum 0 iken ikisi de etkisiz (büyüme 0, katsayı 1) — kaydıraca dokunulmamış
 * uzay birebir eskisi gibi çiziliyor.
 */
const FEEL_GROWTH = 1.8;
const FEEL_GLOW = 2.2;

const LINK_COLOR = 'rgba(255, 255, 255, 0.28)';
const LINK_WIDTH = 1;

/** Dolan halkanın noktadan uzaklığı ve kalınlığı. */
const RING_GAP = 9;
const RING_WIDTH = 2;

/** Ekranın düz renge kapanmaya başladığı ilerleme. Son çeyrek. */
const COVER_START = 0.75;

export interface SpaceScene {
  readonly marks: readonly SpaceMark[];
  readonly camera: Camera;
  readonly viewport: Viewport;
  readonly selectedId: string | null;
  readonly hoveredId: string | null;
  /** Kaydırarak giriş birikimi; yokken `{ markId: null, progress: 0 }`. */
  readonly entry: { readonly markId: string | null; readonly progress: number };
  /** Sinestezi kaydıraçlarının tarifi; dokunulmamışken `NO_FEEL`. */
  readonly feel: FeelTarget;
}

/**
 * `#RRGGBB` → `rgba(...)`.
 *
 * Aile renkleri sözlükte hex olarak duruyor (okunabilir, kopyalanabilir) ama
 * tuvalde opaklık gerekiyor. `globalAlpha` yerine renge gömülüyor ki leke ile
 * çekirdek tek geçişte farklı saydamlıkta çizilebilsin.
 */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Merkezden uzaklaştıkça 1'den 0'a inen çarpan. Kare alınıyor ki geçiş yumuşasın. */
function edgeFade(sx: number, sy: number, viewport: { width: number; height: number }): number {
  const radius = Math.min(viewport.width, viewport.height) / 2;
  const distance = Math.hypot(sx - viewport.width / 2, sy - viewport.height / 2) / radius;

  if (distance <= FADE_START) return 1;
  if (distance >= FADE_END) return 0;
  return (1 - (distance - FADE_START) / (FADE_END - FADE_START)) ** 2;
}

function drawBackground(ctx: CanvasRenderingContext2D, viewport: { width: number; height: number }) {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
  gradient.addColorStop(0, BACKGROUND_CENTER);
  gradient.addColorStop(1, BACKGROUND_EDGE);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

/**
 * Noktanın kenar sönümü uygulanmamış opaklığı.
 *
 * Üç şey aynı kanalı paylaşıyor — derinlik, seçim ve kaydıraçlar — ve sıraları
 * burada tek yerde kuruluyor. Ayrı ayrı çarpılsalardı hem seçilmemiş hem tarife
 * uzak bir nokta iki kez sönüp çamura dönerdi.
 */
function markAlpha(mark: SpaceMark, dimmed: boolean, nearness: number | null): number {
  if (dimmed) return DIM_ALPHA;

  const full = ALPHA_BASE + mark.depth * ALPHA_RANGE;

  /*
   * ⚠️ Seçim kazanır: kaydıraç sönmesi yalnızca seçim YOKKEN uygulanıyor.
   *
   * İki soru farklı ölçekte. Kaydıraç geniş bir soru ("şuna benzer bir şey"),
   * seçim dar bir soru ("bu neye benziyor"). Bir noktaya basmak dar soruya
   * geçmek demek ve cevabı seçili + komşuları; kaydıraç tarifi o cevabın üstüne
   * binseydi komşulardan bazıları tarife uzak diye sönerdi — yani harita "bu
   * ona benziyor" derken aynı anda "ama bak sönük" derdi. Boşluğa basıp seçim
   * kalkınca geniş soru geri geliyor.
   */
  // Kaydıraç konuşmuyorsa (seçim var ya da hiçbir eksen sorulmamış) tam parlaklık.
  if (nearness === null) return full;

  /*
   * Yakınlık tam parlaklıkla sönüğün arasında geziniyor. Çarpma DEĞİL ara değer:
   * çarpsaydık taban da ölçekleneceği için kaydıraçla sönen nokta, seçimle sönen
   * noktadan daha karanlık olurdu ve uzayda iki ayrı "sönük" seviyesi doğardı.
   */
  return DIM_ALPHA + (full - DIM_ALPHA) * nearness;
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  mark: SpaceMark,
  scene: SpaceScene,
  dimmed: boolean,
  anchor: number,
  responding: boolean,
) {
  const { sx, sy } = worldToScreen(mark, scene.camera, scene.viewport);
  const active = mark.id === scene.hoveredId || mark.id === scene.selectedId;

  // `null` "kaydıraç konuşmuyor" demek; 0…1 ise tarife uyum derecesi.
  const nearness = responding ? feelMatch(mark.feel, scene.feel, anchor) : null;
  const lift = nearness ?? 0;

  const radius =
    markRadius(mark.depth, scene.camera.scale) +
    (active ? ACTIVE_GROWTH : 0) +
    lift * FEEL_GROWTH;

  // Seçim varken vurgulanan noktalar sönümün dışında kalıyor.
  const exempt = scene.selectedId !== null && !dimmed;
  const fade = exempt ? 1 : edgeFade(sx, sy, scene.viewport);
  if (fade === 0) return;

  const alpha = markAlpha(mark, dimmed, nearness) * fade;

  // Leke önce, çekirdek sonra: sıralama ters olsaydı halo çekirdeği yıkardı.
  const glow = 1 + (FEEL_GLOW - 1) * lift;
  const halo = ctx.createRadialGradient(sx, sy, radius, sx, sy, radius * HALO_SCALE);
  halo.addColorStop(0, withAlpha(mark.color, Math.min(alpha * HALO_ALPHA * glow, 1)));
  halo.addColorStop(1, withAlpha(mark.color, 0));

  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sx, sy, radius * HALO_SCALE, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = withAlpha(mark.color, alpha);
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Seçili noktadan en yakın komşularına ince çizgiler. Noktaların ALTINDA kalıyor. */
function drawLinks(ctx: CanvasRenderingContext2D, selected: SpaceMark, scene: SpaceScene) {
  const byId = new Map(scene.marks.map((mark) => [mark.id, mark]));
  const from = worldToScreen(selected, scene.camera, scene.viewport);

  ctx.strokeStyle = LINK_COLOR;
  ctx.lineWidth = LINK_WIDTH;

  for (const neighborId of selected.neighborIds) {
    const neighbor = byId.get(neighborId);
    if (!neighbor) continue;

    const to = worldToScreen(neighbor, scene.camera, scene.viewport);
    ctx.beginPath();
    ctx.moveTo(from.sx, from.sy);
    ctx.lineTo(to.sx, to.sy);
    ctx.stroke();
  }
}

/**
 * Kaydırarak giriş — nokta büyüyüp ekranı dolduruyor.
 *
 * Sayfa "açılmıyor", nokta **genişliyor**: parfüm sayfasının tepesindeki ışık
 * da aynı aile rengi, dolayısıyla geçiş tek bir hareket gibi okunuyor. Yol
 * haritasının açılış sahnesi için tarif ettiği "kesintisiz zoom"un bir kat
 * aşağısı bu.
 *
 * Kare alınıyor: ilerlemenin başı yavaş, sonu hızlı. Doğrusal olsaydı ilk
 * çentikte ekranın yarısı kaplanır, kullanıcı istemeden girdiğini sanırdı.
 */
function drawEntry(ctx: CanvasRenderingContext2D, mark: SpaceMark, scene: SpaceScene) {
  const { progress } = scene.entry;
  if (progress <= 0) return;

  const { sx, sy } = worldToScreen(mark, scene.camera, scene.viewport);
  // Ekranın en uzak köşesine ulaşan yarıçap — hangi köşede olursa olsun kaplıyor.
  const corner = Math.hypot(
    Math.max(sx, scene.viewport.width - sx),
    Math.max(sy, scene.viewport.height - sy),
  );
  const radius = corner * progress ** 2;
  if (radius <= 0) return;

  /*
   * Dolan halka — basılı tutmanın geri bildirimi.
   *
   * Olmasaydı tutma kör bir bekleyiş olurdu: kullanıcı bir şey olup olmadığını
   * bilemez, erken bırakır ve "açmıyor" der. Halka hem "sayıyorum" diyor hem
   * ne kadar kaldığını gösteriyor.
   *
   * Leke tam kaplarken çiziliyor ama sönerek: son anda halka değil geçiş
   * görülsün.
   */
  if (progress < 1) {
    const ringRadius = markRadius(mark.depth, scene.camera.scale) + RING_GAP;
    ctx.strokeStyle = withAlpha(mark.color, 0.9);
    ctx.lineWidth = RING_WIDTH;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // −π/2: saat 12'den başlayıp saat yönünde dolsun.
    ctx.arc(sx, sy, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
  glow.addColorStop(0, withAlpha(mark.color, Math.min(progress * 1.4, 1)));
  glow.addColorStop(0.55, withAlpha(mark.color, progress * 0.5));
  glow.addColorStop(1, withAlpha(mark.color, 0));

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fill();

  /*
   * Son evre — ekran düz renge kapanıyor.
   *
   * Geçişin kesik görünmesinin sebebi buydu: leke merkezde opaklaşıyor ama
   * kenarları saydam kalıyordu, dolayısıyla gezinme anında haritanın köşeleri
   * hâlâ görünürdü. Göz iki ayrı görüntü arasında bir sıçrama yakalıyordu.
   *
   * Artık ilerlemenin son çeyreğinde tuvalin tamamı aile rengiyle doluyor.
   * Parfüm sayfası da aynı renkten açılıp söndüğü için iki ekran arasında
   * ortak, tek renk bir kare var — kesme noktası görünmez oluyor.
   */
  if (progress > COVER_START) {
    const cover = (progress - COVER_START) / (1 - COVER_START);
    ctx.fillStyle = withAlpha(mark.color, Math.min(cover, 1));
    ctx.fillRect(0, 0, scene.viewport.width, scene.viewport.height);
  }
}

export function drawSpace(ctx: CanvasRenderingContext2D, scene: SpaceScene) {
  // Zemin opak: temizlemeye gerek yok, üstüne yazıyor.
  drawBackground(ctx, scene.viewport);

  const selected = scene.selectedId
    ? (scene.marks.find((mark) => mark.id === scene.selectedId) ?? null)
    : null;

  // Seçim varken yalnızca o parfüm ve komşuları tam parlaklıkta kalıyor —
  // harita bir anda "şu, şuna benziyor" cümlesine dönüşüyor.
  const highlighted = selected ? new Set([selected.id, ...selected.neighborIds]) : null;

  if (selected) drawLinks(ctx, selected, scene);

  /*
   * Giriş ilerledikçe sönük noktalar çizilmiyor.
   *
   * Kare maliyetinin büyük kısmı nokta başına kurulan radyal degrade lekesi:
   * 44 nokta = 44 degrade, her karede yeniden. Giriş yarılandığında o
   * noktaların üstünü zaten büyüyen leke örtüyor — görünmeyen şeyi çizmek
   * açılışın en kritik anında boşa harcanan zaman. Vurgulananlar (seçili +
   * komşuları) çizilmeye devam ediyor: geçişin okunması onlara bağlı.
   */
  const skipDimmed = scene.entry.progress > 0.5;

  /*
   * Cevabın çapası kare başına bir kez: en yakın noktanın uzaklığı.
   *
   * Kaydıraca dokunulmadıysa hiç hesaplanmıyor — dizi bile kurulmuyor. Sık olan
   * durum bu ve uzayın açılış karesi de buraya düşüyor.
   */
  // Kaydıraç ancak seçim yokken konuşuyor — gerekçesi `markAlpha`da.
  const responding = scene.selectedId === null && hasFeel(scene.feel);
  const anchor = responding
    ? feelAnchor(
        scene.marks.map((mark) => mark.feel),
        scene.feel,
      )
    : 0;

  for (const mark of scene.marks) {
    const dimmed = highlighted !== null && !highlighted.has(mark.id);
    if (dimmed && skipDimmed) continue;
    drawMark(ctx, mark, scene, dimmed, anchor, responding);
  }

  // Giriş lekesi en son: noktaların da bağlantıların da ÜSTÜNÜ örtüyor.
  // Aradan çizilseydi harita lekenin içinden görünür, "içine giriliyor"
  // hissi yerine "üstüne bir şey kondu" hissi çıkardı.
  const entering = scene.entry.markId
    ? (scene.marks.find((mark) => mark.id === scene.entry.markId) ?? null)
    : null;
  if (entering) drawEntry(ctx, entering, scene);
}
