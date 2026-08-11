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

  /**
   * Hesaplar, profil ve Top 4.
   *
   * ⚠️ Üyelik **isteğe bağlı** ve dil bunu yansıtıyor: hiçbir yerde "kayıt ol
   * ve şunu kazan" yok. Köşedeki bağlantı sönük, davet alçak sesli. Site
   * girişsiz bugünkü gibi gezilmeye devam ediyor.
   *
   * Hata metinleri **anahtarla** eşleşiyor (`username.ts`, `top-four.ts`
   * anahtar döndürüyor, cümle değil): saf modülün içine ekran metni koymak
   * bu depoda bir kez düzeltilmiş bir hataydı.
   */
  account: {
    signIn: 'sign in',
    signOut: 'sign out',
    signInTitle: 'Sign in · OSMOS',
    /* Neden var olduğu tek cümlede; kimseye bir şey vaat etmeden. */
    signInLede: 'An account is optional. It gives you a profile with four perfumes on it.',
    withGoogle: 'Continue with Google',
    orEmail: 'or with an email address',
    email: 'Email',
    password: 'Password',
    createAccount: 'Create account',
    haveAccount: 'I already have an account',
    emailOptIn: 'Tell me when a new perfume enters the map',
    checkInbox: 'Check your inbox — there is a link waiting to confirm the address.',

    /**
     * Şifre sıfırlama.
     *
     * ⚠️ `sentReset` bilerek **belirsiz**: "böyle bir hesap yok" demek, bir
     * adresin kayıtlı olup olmadığını herkese söyleyen bir sorgu açardı.
     * Kayıt ekranındaki sahte başarıyla aynı gerekçe.
     */
    /**
     * ⚠️ **Bu bağlantı bir kilidin anahtarı.** Doğrulama mektubu gitmezse
     * (posta servisi düşer, adres yanlış yazılır, mektup spam'e düşüp
     * silinir) kişi kalıcı olarak kilitleniyordu: giriş yapamıyor çünkü
     * doğrulanmamış, tekrar kayıt olamıyor çünkü sahte başarı dönüyor,
     * ve mektubu yeniden isteyemiyor. Ölçüldü.
     */
    resendConfirm: 'Send the confirmation email again',
    resentConfirm: 'If that address needs confirming, a new link is on its way.',
    forgot: 'I forgot my password',
    sendReset: 'Send a reset link',
    sentReset: 'If that address has an account, a reset link is on its way.',
    resetTitle: 'New password · OSMOS',
    resetHeading: 'Choose a new password',
    newPassword: 'New password',
    resetDone: 'Done — you can sign in with the new password.',
    resetBadLink: 'This link has expired or was already used. Ask for a new one.',

    username: {
      title: 'Choose a username · OSMOS',
      heading: 'Choose a username',
      lede: (base: string) => `Your profile will live at ${base}/u/…`,
      label: 'Username',
      save: 'Continue',
      /** `usernameError` anahtarlarıyla birebir eşleşiyor. */
      errors: {
        tooShort: 'At least 3 characters.',
        tooLong: 'At most 20 characters.',
        charset: 'Letters a–z, digits and underscore only.',
        startsWithDigit: 'Start with a letter.',
        reserved: 'That one is taken by the site.',
        taken: 'Someone already has that one.',
      },
    },

    profile: {
      title: (username: string) => `${username} · OSMOS`,
      description: (username: string) => `${username} on OSMOS — four perfumes.`,
      topFour: 'TOP FOUR',
      empty: 'No perfumes chosen yet.',
      /** İmzanın ekran okuyucu karşılığı. */
      signatureLabel: (username: string) => `${username}'s signature, drawn from their four perfumes`,
      edit: 'edit',
      bioLabel: 'A line about you',
    },

    settings: {
      title: 'Settings · OSMOS',
      heading: 'Settings',
      bio: 'Your line',
      bioHint: (max: number) => `${max} characters at most.`,
      hidden: 'Hide my profile',
      hiddenHint: 'Your profile stops opening for anyone else. Nothing is deleted.',
      save: 'Save',
      saved: 'Saved.',
      dangerHeading: 'Delete account',
      dangerLine:
        'Your account, your four perfumes and your line are removed. This cannot be undone.',
      deleteConfirm: 'Type your username to confirm',
      delete: 'Delete my account',
    },

    top: {
      heading: 'Your four',
      add: 'add to my top four',
      added: 'in your top four',
      remove: 'remove',
      search: 'Search the 52 perfumes',
      noMatch: 'Nothing matches.',
      full: 'Four is the limit — replace one instead.',
      errors: {
        tooMany: 'Four is the limit.',
        duplicate: 'That one is already in your four.',
        unknown: 'No such perfume.',
        /* Hız sınırı — koruma devreye girdiğinde. */
        tooFast: 'That was quick. Give it a moment and try again.',
      },
    },

    privacy: {
      title: 'Privacy · OSMOS',
      heading: 'What is stored',
      /*
        ⚠️ Bu sayfa dürüst olmak zorunda ve bir cümlesi sitenin eski sözünü
        düzeltiyor: site bugüne kadar hiç çerez yazmıyordu. Giriş yapan için
        bir oturum çerezi var; girişsiz gezinti hâlâ çerezsiz.
      */
      body: [
        'Browsing this site without an account stores nothing: no cookie, no account, no tracking. Visits are counted by the site\'s own cookie-less analytics, which cannot identify anyone.',
        'If you create an account, three things are stored: the email address you signed in with, the username and line you chose, and the four perfumes you picked. Signing in also sets one cookie — it only keeps you signed in.',
        'Your profile is public unless you hide it in settings. Deleting your account removes all of it, at once and for good.',
      ],
    },
  },

  /**
   * Kurma aracı — Patron'un asıl sebebi.
   *
   * Dil bilerek sakin: "sınırsız erişim", "hemen yükselt" yok. Araç kendini
   * anlatıyor; davet yalnızca sınıra gelindiğinde ve tek cümlede.
   */
  studio: {
    title: 'Compose · OSMOS',
    heading: 'Compose your own',
    lede: 'Choose notes, set how loud each one is, and watch the thing take shape. It is read with the same measure as the 52 on the map.',
    notes: 'NOTES',
    search: 'Search the 136 notes',
    weight: 'How loud',
    curve: 'HOW IT UNFOLDS',
    nearest: 'CLOSEST ON THE MAP',
    name: 'Name it',
    save: 'Save it',
    saved: 'Saved —',
    signInToSave: 'Sign in to keep it',
    limitReached: 'Twelve notes is the limit.',
    /* Sınıra gelen kişiye tek cümle; bağırmadan. */
    needsPatron: 'Three notes is where the free version stops. Patron opens the rest.',
    errors: {
      tooFew: 'At least two notes.',
      tooMany: 'Twelve notes is the limit.',
      duplicate: 'That note is already in.',
      unknown: 'No such note.',
      weight: 'That weight is out of range.',
      tooFast: 'That was quick. Give it a moment and try again.',
      noName: 'Give it a name.',
      needsPatron: 'Three notes is where the free version stops.',
      tooManySaved: 'That is as many as you can keep.',
      unauthorized: 'Sign in first.',
    },
    /** Profildeki bölüm. */
    mine: 'COMPOSITIONS',
    /** Sönük rozet — statü değil, destek işareti. */
    patronMark: 'PATRON',
    /** Hareketli imza; hikâye boyutunda iniyor. */
    clip: 'download it as a clip',
    clipBusy: 'recording',
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

  /**
   * Raflar — künyedeki üç düğme ve kendi sayfası.
   *
   * ⚠️ `kinds` anahtarları `SHELF_KINDS` ile birebir; ekran o diziyi geziyor,
   * yani buradan bir anahtar düşerse düğme yazısız çizilir.
   */
  shelf: {
    kinds: { owned: 'have it', tried: 'tried it', wishlist: 'want it' },
    /** Etkin düğmeye tekrar basmanın ne yapacağı — ekran okuyucu için. */
    removeLabel: (label: string) => `take "${label}" back off`,
    title: (username: string) => `${username}'s shelves · OSMOS`,
    heading: 'SHELVES',
    description: (username: string) => `What ${username} has, has tried, and wants.`,
    /** Profildeki özet satırının bağlantısı. */
    open: 'shelves',
    headings: { owned: 'HAS', tried: 'TRIED', wishlist: 'WANTS' },
    counts: {
      owned: (n: number) => `${n} owned`,
      tried: (n: number) => `${n} tried`,
      wishlist: (n: number) => `${n} wanted`,
    },
    empty: 'Nothing on the shelves yet.',
  },

  /**
   * Burun raporu — rafların ve Top 4'ün birlikte söylediği şey.
   *
   * Eksen adları burada YOK: `space.sliders` zaten söylüyor ve ikinci bir
   * kopya, bir gün biri değişince raporla kaydıraçların ayrı şeyler demesine
   * yol açardı.
   */
  nose: {
    title: (username: string) => `${username}'s nose · OSMOS`,
    heading: 'NOSE REPORT',
    description: (username: string) => `What ${username}'s perfumes have in common.`,
    open: 'nose report',
    /**
     * Dürüstlük satırı — raporun kaç parfümden okunduğu.
     *
     * Site hiçbir yerde elindekinden fazlasını iddia etmiyor; üç parfümlük bir
     * portre ile yirmi parfümlük olanı ayırt etmek okuyanın hakkı.
     */
    readFrom: (count: number) => `Read from ${count} perfumes.`,
    notEnough: (need: number) =>
      need === 1
        ? 'Mark one more perfume and the report appears.'
        : `Mark ${need} more perfumes and the report appears.`,
    sections: {
      families: 'FAMILIES',
      character: 'CHARACTER',
      range: 'RANGE',
      outlier: 'THE ODD ONE',
      next: 'WHAT TO TRY NEXT',
    },
    range: {
      narrow: 'A narrow nose — these are close relatives.',
      balanced: 'A balanced nose — related, but not repeating themselves.',
      wide: 'A wide nose — these perfumes have little in common.',
    },
    outlierNote: 'The one least like the rest.',
    nextNote: 'Closest to your nose, and not on your shelves yet.',
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
