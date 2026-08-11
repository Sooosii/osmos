/**
 * Ekranın sözlüğü — İngilizce.
 *
 * Bu dosya sözlüğün ŞEKLİNİ tanımlıyor: `type Dict = typeof EN`. `tr.ts` onu
 * imzalamak zorunda, yani bir anahtar eksik kalırsa derleme kırılır. Aynı
 * numara `Note.description` ve `Perfume.year`da da var — veri bütünlüğünü
 * sınamaya değil tipe bekletmek.
 *
 * ⚠️ `as const` KOYULMAYACAK. O durumda `typeof EN` her değeri kendi dize
 * sabitine daraltır ve `tr.ts` hiçbir anahtarı tutturamaz. Zorunluluk
 * anahtarlarda, değerlerde değil.
 *
 * Araya giren değerler işlev olarak yazılıyor, şablon dizesi olarak değil:
 * İngilizce ile Türkçenin sözcük sırası aynı değil ("52 parfümde" ↔ "in 52
 * perfumes") ve yüzde işareti bile yer değiştiriyor (%85 ↔ 85%). Dilbilgisi
 * sözlüğün içinde kalsın diye.
 *
 * İmla İngiliz: `colour`, `neighbour`. Tek bir imla seçilip her yerde tutuluyor;
 * karışık imla, metnin çeviri olduğunu ele veren ilk şeydir.
 */
export const EN = {
  site: {
    name: 'OSMOS',
    title: 'OSMOS',
    description: 'The scent universe — a map of niche perfume.',
  },

  nav: {
    notes: 'NOTES',
    backToSpace: '← back to the space',
    allNotes: '← all notes',
  },

  /**
   * Bildirim düğmesi ve bildirimin kendisi.
   *
   * `cta`/`active` çerçevenin mikro-tipografisinde duruyor — kısa ve büyük
   * harfli. Bildirim metni de ekran metnidir: noktalı büyük İ yasağı sistem
   * bildirimi için de geçerli (`push-payload.test.ts` 52 parfümü iki dilde
   * tarıyor).
   */
  notify: {
    cta: 'NOTIFY',
    active: 'NOTIFYING',
    aria: 'New-perfume notifications',
    blocked: 'Notifications are blocked in this browser',
    pushTitle: 'OSMOS',
    pushBody: (name: string, brand: string) => `New perfume on the map: ${name} — ${brand}`,
  },

  /** Haritada olmayan bir adrese gidildiğinde. */
  notFound: {
    mark: 'NOT ON THE MAP',
    line: 'There is no such page. The address may be mistyped, or it may have been a perfume that never entered the selection.',
  },

  /** Sayfa çizilirken bir şey patladığında. */
  error: {
    mark: 'SOMETHING BROKE',
    line: 'This page could not be drawn. Trying again usually settles it; if it does not, the way back is below.',
    retry: 'try again',
  },

  space: {
    intro: (count: number) =>
      `${count} perfumes, placed by what their notes share. Drag, zoom, touch a point.`,
    entryHint: 'KEEP SCROLLING',
    /**
     * Dokunmatik cihazın karşılığı.
     *
     * İngilizcede "scroll" telefonda da kullanılıyor, yani yanlış değil — ama
     * parmakla süpüren biri için doğru kelime "swipe". Ayrım cihaza göre
     * yapılıyor, CSS ile: `pointer: coarse`.
     */
    entryHintTouch: 'KEEP SWIPING',
    keyboardList: 'Scent space — go to a perfume',
    perfumeLink: (name: string) => `${name} page`,
    sliders: {
      temperature: { label: 'Temperature — cool to warm', low: 'COOL', high: 'WARM' },
      cleanliness: { label: 'Cleanliness — dirty to clean', low: 'DIRTY', high: 'CLEAN' },
      texture: { label: 'Texture — velvety to sharp', low: 'VELVET', high: 'SHARP' },
      proximity: { label: 'Proximity — airborne to skin-close', low: 'AIR', high: 'SKIN' },
      openDetail: 'Two more axes: texture and proximity',
      closeDetail: 'Close the texture and proximity axes',
    },
  },

  /** Açılış perdesi ve astronot — ikisi aynı ipucunu söylüyor. */
  intro: {
    word: 'osmos',
    tag: (count: number) => `${count} perfumes, a map drawn from the kinship of notes`,
    hint: 'scroll to come closer',
    /** Dokunmatik cihazın karşılığı — gerekçe `space.entryHintTouch`ta. */
    hintTouch: 'swipe to come closer',
  },

  perfume: {
    title: (name: string, brand: string) => `${name} — ${brand} · OSMOS`,
    fallbackDescription: (name: string, brand: string) => `${name}, ${brand}.`,
    frame: { family: 'FAMILY', year: 'YEAR', notes: 'NOTES' },
    position: (index: number, total: number) =>
      `PERFUME ${String(index).padStart(3, '0')}/${total}`,
    sections: { evolution: 'EVOLUTION', notes: 'NOTES', neighbours: 'NEIGHBOURS' },
    neighbourLabel: (name: string, count: number, list: string) =>
      `The ${count} perfumes closest to ${name}: ${list}.`,
    neighbourEntry: (name: string, percent: number) => `${name}, ${percent}%`,
    neighbourCaption:
      'The one in the middle is this perfume. Closeness is similarity: the nearer it sits, the more alike it is. Height is depth in the space — those above the ring sit deeper, those below sit closer to the surface. It is the difference the flat map cannot show.',
    /*
      Künyedeki satıcı satırı. Sözcükler bilerek alçak sesli: "buy now" değil
      "where to find" — künye kimlik anlatır, satış bağırmaz. Dipnot yasal
      beyan (komisyonlu bağlantı açıklanmak zorunda) ve yalnızca satırı olan
      sayfada görünür.
    */
    whereToFind: 'where to find',
    commissionNote: 'links may earn a commission',
  },

  note: {
    title: (name: string) => `${name} — note · OSMOS`,
    frame: { band: 'BAND', peak: 'PEAK', life: 'LIFE' },
    position: (index: number, total: number) => `NOTE ${String(index).padStart(3, '0')}/${total}`,
    usage: (carriers: number, total: number) => `${carriers}/${total} PERFUMES`,
    carriersHeading: (count: number) => (count > 0 ? `IN ${count} PERFUMES` : 'IN NO PERFUME YET'),
    unused: (total: number) =>
      `This note is part of the palette but appears in none of the ${total} perfumes in the selection. The encyclopedia is a dictionary of notes, not a list of uses.`,
    orbitEmpty: (name: string) => `${name} appears in no perfume yet.`,
    orbitLabel: (name: string, count: number, list: string) =>
      `${count} perfumes containing ${name}, turning in a three-dimensional orbit: ${list}.`,
    measures: {
      volatility: 'VOLATILITY',
      character: 'CHARACTER',
      peak: 'PEAK',
      halfLife: 'HALF-LIFE',
    },
    /** Çerçevenin dar alanına sığan kısaltma: 90 dakika → `1h 30′`. */
    shortMinutes: (minutes: number) => `${minutes}′`,
    shortHours: (hours: number) => `${hours}h`,
    shortHoursMinutes: (hours: number, minutes: number) => `${hours}h ${minutes}′`,
  },

  notesIndex: {
    title: (count: number) => `Notes — ${count} materials · OSMOS`,
    description: 'The note database behind the scent space, ordered by volatility band.',
    heading: 'Notes',
    lede: (count: number) =>
      `${count} materials, ordered by volatility band. Colour is the dominant scent family — the same palette as the points in the space.`,
    status: (count: number) => `PALETTE ${count}`,
    tail: (used: number) => `${used} IN USE`,
  },

  /**
   * Bant ve piramit katmanı adları — büyük harfli.
   *
   * Tek harita iki tipe hizmet ediyor: `NoteBand` ile `PyramidTier` aynı üç
   * değere sahip ve ekranda aynı sözcükleri gösteriyorlar. Ayrı iki harita
   * tutmak "aynı veriye iki ad" olurdu.
   */
  bands: { top: 'TOP', heart: 'HEART', base: 'BASE' },

  chart: {
    /** Çizelgenin katman göstergesi — büyük harfli değil, cümle düzeni. */
    tiers: { top: 'Top', heart: 'Heart', base: 'Base' },
    timeLabel: 'Time',
    disclaimer:
      'This chart is an estimate, not a measurement. It is modelled from the volatility of the notes; the real development shifts with temperature, skin and concentration.',
    signatureLabel: (name: string, notes: string) =>
      `${name} evolution signature: ${notes} rising and falling over eight hours.`,
  },

  /** `phaseLabel` — dakikanın hangi evrede olduğu. */
  phases: { opening: 'Opening', heart: 'Heart', base: 'Base' },

  /**
   * `formatDuration` — dakikayı okunur süreye çevirir.
   *
   * ⚠️ Tekil/çoğul ayrımı Türkçede yoktu ve İngilizcede zorunlu: `peakMinutes`
   * 1 olan notalar var (`aldehydes`), yani "1 minutes" gerçekten ekrana çıkardı.
   */
  duration: {
    firstSeconds: 'the first seconds',
    minutes: (n: number) => `${n} minute${n === 1 ? '' : 's'}`,
    hours: (h: number) => `${h} hour${h === 1 ? '' : 's'}`,
    hoursMinutes: (h: number, m: number) =>
      `${h} hour${h === 1 ? '' : 's'} ${m} minute${m === 1 ? '' : 's'}`,
  },

  /**
   * Nota sayfasındaki dört karakter ekseni.
   *
   * `low`/`high` ekranda büyük harfle duran uç damgaları; `lowWord`/`highWord`
   * ekran okuyucunun duyduğu sıfat hâlleri.
   *
   * ⚠️ Uç damgaları **en fazla altı harf**. Sütun genişliği (`EDGE_CLASS`,
   * `w-[4.2rem]`) en uzun etikete göre sabit; daha uzunu dört kaydıracın rayını
   * farklı yerlerden başlatır ve sütun eğrilir. 'ON SKIN' bu yüzden elendi,
   * 'SKIN' kaldı.
   *
   * Uç sözcükleri kaydıraçlarınkiyle (`space.sliders`) aynı olmak zorunda: ikisi
   * aynı veriyi (`Character`) gösteriyor ve tek eksene iki ad takmak kullanıcıya
   * iki ayrı şey varmış gibi geliyor — bu şikâyet Türkçede bir kez yaşandı.
   *
   * ⚠️ Eksen **kimlikleri** burada yok: `Character`ın anahtarlarıyla eşleşmek
   * zorundalar ve çevrilecek bir şey değiller. Sıra da burada değil; ikisi de
   * `note-measures.ts`te, kavramın sahibinde duruyor.
   */
  axes: {
    temperature: { low: 'COOL', high: 'WARM', lowWord: 'cool', highWord: 'warm' },
    texture: { low: 'VELVET', high: 'SHARP', lowWord: 'velvety', highWord: 'sharp' },
    cleanliness: { low: 'DIRTY', high: 'CLEAN', lowWord: 'dirty', highWord: 'clean' },
    proximity: { low: 'AIR', high: 'SKIN', lowWord: 'airborne', highWord: 'skin-close' },
  },

  /** `axisWord` — ölçümün sıfatı, basamakların yerine okunan metin. */
  axisWords: {
    between: (low: string, high: string) => `between ${low} and ${high}`,
    faint: (word: string) => `faintly ${word}`,
    plain: (word: string) => word,
    strong: (word: string) => `distinctly ${word}`,
  },

  /** Doğrulama ekranları — sahip kalmalarına karar verdi. */
  draft: {
    /*
      Sekme başlıkları. Doğrulama ekranlarının ikisi de kök düzenin düz
      "OSMOS"unu miras alıyordu; sekmede, yer iminde ve geçmişte birbirinden
      ayırt edilemiyorlardı.
    */
    spaceTitle: 'Space draft · OSMOS',
    evolutionTitle: 'Evolution draft · OSMOS',
    spaceHeading: 'Space draft',
    spaceLede: (count: number) =>
      `The verification screen for the similarity engine. ${count} perfumes; each read through three channels — scent family, character (temperature, texture, cleanliness, proximity) and shared notes. The cosine distance of the three combined was reduced to two dimensions with classical MDS. Colour shows the dominant family, point size the third component (depth).`,
    spaceHint: 'Hover — the name appears. Click — it links to its three nearest neighbours.',
    spaceLabel: 'How the perfumes spread across the scent space',
    checkpoints: 'Checkpoints',
    neighbours: 'Nearest neighbours',
    neighboursNote:
      'The number is cosine similarity: 1.00 the same character, 0.00 nothing in common.',
    missing: 'none',
    expectations: {
      nasomatto: 'The Nasomatto pair should sit close',
      mossy: 'The mossy edge should hold together',
      dirty: 'The dirty edge should hold together',
      alone: 'Not a Perfume should stand alone',
    },
  },
};

export type Dict = typeof EN;
