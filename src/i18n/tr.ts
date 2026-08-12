import type { Dict } from './en';

/**
 * Ekranın sözlüğü — Türkçe, beklemede.
 *
 * Faz 1'de ekran bunu okumuyor. Ölü kod değil: sitenin bugüne kadarki bütün
 * Türkçe metni burada duruyor ve Faz 2'nin (dil değiştirici + `/tr` adresleri)
 * metin işi hazır bekliyor. Alternatifi dizeleri bulundukları yerde çevirmekti;
 * o durumda bu cümleler yalnızca git geçmişinde kalırdı ve Faz 2 zaten yazılmış
 * olanı ikinci kez yazmak zorunda kalırdı.
 *
 * Cümleler **birebir** taşındı, yeniden yazılmadı.
 *
 * ⚠️ Ekranda noktalı büyük İ yok — sahibin kesin kuralı. IÇIN, KADIFE, KESKIN,
 * TEMIZ, KIRLI, DIP, AILE: hepsi noktasız I.
 *
 * ⚠️ Faz 2'de bu sözlüğün ekrana çıktığı gün `<html lang>` sorusu açılacak:
 * `lang="tr"` yazılırsa tarayıcı Türkçe büyütme kuralına geçer ve CSS'in
 * `uppercase` dönüşümü i→İ üretir. Yukarıdaki kural o gün kendiliğinden çöker;
 * çözüm gerçek tarayıcıda ölçülmeden seçilmemeli.
 */
export const TR: Dict = {
  site: {
    name: 'OSMOS',
    title: 'OSMOS',
    description: 'Koku evreni — niche parfümlerin haritası.',
  },

  nav: {
    notes: 'NOTALAR',
    backToSpace: '← uzaya dön',
    allNotes: '← bütün notalar',
  },

  notify: {
    cta: 'HABER VER',
    active: 'HABERDAR',
    aria: 'Yeni parfüm bildirimleri',
    blocked: 'Tarayıcı bildirimleri engelliyor',
    pushTitle: 'OSMOS',
    pushBody: (name, brand) => `Haritaya yeni parfüm girdi: ${name} — ${brand}`,
  },

  account: {
    signIn: 'giriş yap',
    signOut: 'çıkış yap',
    signInTitle: 'Giriş · OSMOS',
    signInLede: 'Hesap isteğe bağlı. Sana üstünde dört parfüm olan bir profil veriyor.',
    withGoogle: 'Google ile devam et',
    orEmail: 'ya da bir e-posta adresiyle',
    email: 'E-posta',
    password: 'Şifre',
    createAccount: 'Hesap oluştur',
    haveAccount: 'Zaten hesabım var',
    emailOptIn: 'Haritaya yeni parfüm girince haber ver',
    checkInbox: 'Gelen kutuna bak — adresi doğrulayacak bir bağlantı bekliyor.',

    resendConfirm: 'Doğrulama mektubunu tekrar gönder',
    resentConfirm: 'O adresin doğrulanması gerekiyorsa yeni bağlantı yola çıktı.',
    forgot: 'Şifremi unuttum',
    sendReset: 'Sıfırlama bağlantısı gönder',
    sentReset: 'O adresin hesabı varsa sıfırlama bağlantısı yola çıktı.',
    resetTitle: 'Yeni şifre · OSMOS',
    resetHeading: 'Yeni bir şifre seç',
    newPassword: 'Yeni şifre',
    resetDone: 'Oldu — yeni şifrenle giriş yapabilirsin.',
    resetBadLink: 'Bu bağlantının süresi dolmuş ya da kullanılmış. Yenisini iste.',

    username: {
      title: 'Kullanıcı adı seç · OSMOS',
      heading: 'Kullanıcı adı seç',
      lede: (base) => `Profilin şurada duracak: ${base}/u/…`,
      label: 'Kullanıcı adı',
      save: 'Devam',
      errors: {
        tooShort: 'En az 3 karakter.',
        tooLong: 'En fazla 20 karakter.',
        charset: 'Yalnızca a–z harfleri, rakam ve alt tire.',
        startsWithDigit: 'Bir harfle başlasın.',
        reserved: 'Bu ad sitenin kendisine ait.',
        taken: 'Bu adı birisi almış.',
      },
    },

    profile: {
      title: (username) => `${username} · OSMOS`,
      description: (username) => `OSMOS'ta ${username} — dört parfüm.`,
      topFour: 'DÖRTLÜ',
      empty: 'Henüz parfüm seçilmemiş.',
      signatureLabel: (username) => `${username} imzası, dört parfümünden çizildi`,
      edit: 'düzenle',
      bioLabel: 'Kendinle ilgili bir satır',
    },

    settings: {
      title: 'Ayarlar · OSMOS',
      heading: 'Ayarlar',
      bio: 'Senin satırın',
      bioHint: (max) => `En fazla ${max} karakter.`,
      hidden: 'Profilimi gizle',
      hiddenHint: 'Profilin başkasına açılmaz olur. Hiçbir şey silinmez.',
      save: 'Kaydet',
      saved: 'Kaydedildi.',
      dangerHeading: 'Hesabı sil',
      dangerLine: 'Hesabın, dört parfümün ve satırın silinir. Bunun geri dönüşü yok.',
      deleteConfirm: 'Onaylamak için kullanıcı adını yaz',
      delete: 'Hesabımı sil',
    },

    top: {
      heading: 'Senin dörtlün',
      add: 'dörtlüme ekle',
      added: 'dörtlünde',
      remove: 'çıkar',
      search: '52 parfüm içinde ara',
      noMatch: 'Eşleşen yok.',
      full: 'Sınır dört — birini değiştir.',
      errors: {
        tooMany: 'Sınır dört.',
        duplicate: 'Bu zaten dörtlünde.',
        unknown: 'Böyle bir parfüm yok.',
        /* Hız sınırı — koruma devreye girdiğinde. */
        tooFast: 'Hızlı oldu. Bir an bekleyip tekrar dene.',
      },
    },

    privacy: {
      title: 'Gizlilik · OSMOS',
      heading: 'Ne saklanıyor',
      body: [
        'Bu siteyi hesapsız gezmek hiçbir şey saklamıyor: çerez yok, hesap yok, takip yok. Ziyaretler sitenin kendi çerezsiz ölçümüyle sayılıyor ve o ölçüm kimseyi tanıyamıyor.',
        'Hesap açarsan üç şey saklanıyor: giriş yaptığın e-posta adresi, seçtiğin kullanıcı adı ve satır, bir de seçtiğin dört parfüm. Giriş ayrıca bir çerez bırakıyor — tek işi seni girişte tutmak.',
        'Profilin, ayarlardan gizlemediğin sürece herkese açık. Hesabını silmek bunların hepsini bir anda ve kalıcı olarak siliyor.',
        'Bazı parfüm sayfalarında mağazalara giden bağlantılar var. Bir bağlantı ortaklık bağlantısıysa, oradan yapılan alışveriş siteye komisyon yazabilir. Ödediğin fiyatı hiç değiştirmiyor, ve haritada hangi parfümlerin durduğunu ya da onlar hakkında ne yazıldığını hiç etkilemiyor.',
      ],
    },
  },

  studio: {
    title: 'Kur · OSMOS',
    heading: 'Kendi parfümünü kur',
    lede: 'Notaları seç, her birinin sesini ayarla, şeklin oluşmasını izle. Haritadaki 52 parfümle aynı ölçüyle okunuyor.',
    notes: 'NOTALAR',
    search: '136 nota içinde ara',
    weight: 'Ne kadar yüksek',
    curve: 'NASIL AÇILIYOR',
    nearest: 'HARITADA EN YAKINLAR',
    name: 'Adını koy',
    save: 'Kaydet',
    saved: 'Kaydedildi —',
    signInToSave: 'Saklamak için giriş yap',
    limitReached: 'Sınır on iki nota.',
    needsPatron: 'Ücretsiz sürüm üç notada duruyor. Gerisini Patron açıyor.',
    errors: {
      tooFew: 'En az iki nota.',
      tooMany: 'Sınır on iki nota.',
      duplicate: 'Bu nota zaten içinde.',
      unknown: 'Böyle bir nota yok.',
      weight: 'Bu ağırlık aralığın dışında.',
      tooFast: 'Hızlı oldu. Bir an bekleyip tekrar dene.',
      noName: 'Bir ad koy.',
      needsPatron: 'Ücretsiz sürüm üç notada duruyor.',
      tooManySaved: 'Saklayabileceğin kadarı bu.',
      unauthorized: 'Önce giriş yap.',
    },
    mine: 'KOMPOZISYONLAR',
    patronMark: 'PATRON',
    clip: 'klip olarak indir',
    clipBusy: 'kaydediliyor',
  },

  notFound: {
    mark: 'HARITADA YOK',
    line: 'Böyle bir sayfa yok. Adres yanlış yazılmış olabilir, ya da seçkiye hiç girmemiş bir parfüm olabilir.',
  },

  error: {
    mark: 'BIR SEY KIRILDI',
    line: 'Sayfa çizilemedi. Tekrar denemek çoğu zaman yetiyor; yetmezse aşağıdaki yol seni geri götürür.',
    retry: 'tekrar dene',
  },

  space: {
    intro: (count) =>
      `${count} parfüm, konumları nota akrabalığından hesaplandı. Sürükle, yakınlaş, bir noktaya dokun.`,
    entryHint: 'KAYDIRMAYA DEVAM ET',
    /*
      Türkçede ayrım yok ve olmasına gerek de yok: "kaydırmak" hem tekerleği
      hem parmağı karşılıyor. İngilizcedeki scroll/swipe ayrımı Türkçede
      bulunmadığı için iki anahtar aynı cümleyi taşıyor — bu bir kopyala
      yapıştır değil, dilin kendi cevabı.
    */
    entryHintTouch: 'KAYDIRMAYA DEVAM ET',
    heading: 'Koku uzayı',
    keyboardList: 'Koku uzayı — parfüme git',
    perfumeLink: (name) => `${name} sayfası`,
    sliders: {
      temperature: { label: 'Sıcaklık — soğuktan sıcağa', low: 'SOĞUK', high: 'SICAK' },
      cleanliness: { label: 'Temizlik — kirliden temize', low: 'KIRLI', high: 'TEMIZ' },
      texture: { label: 'Doku — kadifemsiden keskine', low: 'KADIFE', high: 'KESKIN' },
      proximity: {
        label: 'Yakınlık — havada dağılandan tene yapışana',
        low: 'HAVADA',
        high: 'TENDE',
      },
      openDetail: 'Iki eksen daha: doku ve yakınlık',
      closeDetail: 'Doku ve yakınlık eksenlerini kapat',
    },
  },

  intro: {
    word: 'osmos',
    tag: (count) => `${count} parfüm, nota akrabalığından doğan bir harita`,
    hint: 'yaklaşmak için kaydır',
    /** Türkçede "kaydır" ikisini de karşılıyor; gerekçe `space.entryHintTouch`ta. */
    hintTouch: 'yaklaşmak için kaydır',
  },

  shelf: {
    kinds: { owned: 'bende var', tried: 'denedim', wishlist: 'istiyorum' },
    removeLabel: (label: string) => `"${label}" işaretini kaldır`,
    title: (username: string) => `${username} — rafları · OSMOS`,
    heading: 'RAFLAR',
    description: (username: string) =>
      `${username} nelere sahip, neleri denedi, neleri istiyor.`,
    open: 'raflar',
    headings: { owned: 'BENDE VAR', tried: 'DENEDIM', wishlist: 'ISTIYORUM' },
    counts: {
      owned: (n: number) => `${n} bende`,
      tried: (n: number) => `${n} denedim`,
      wishlist: (n: number) => `${n} listemde`,
    },
    empty: 'Raflar henüz boş.',
  },

  nose: {
    title: (username: string) => `${username} — burun raporu · OSMOS`,
    heading: 'BURUN RAPORU',
    description: (username: string) =>
      `${username} kullanıcısının parfümlerinin ortak yanı.`,
    open: 'burun raporu',
    readFrom: (count: number) => `${count} parfümden okundu.`,
    notEnough: (need: number) =>
      need === 1
        ? 'Bir parfüm daha işaretle, rapor belirsin.'
        : `${need} parfüm daha işaretle, rapor belirsin.`,
    sections: {
      families: 'AILELER',
      character: 'KARAKTER',
      range: 'GENIŞLIK',
      outlier: 'YABANCI',
      next: 'SIRADAKI',
    },
    range: {
      narrow: 'Dar bir burun — bunlar yakın akraba.',
      balanced: 'Dengeli bir burun — akraba ama kendini tekrar etmiyor.',
      wide: 'Geniş bir burun — bu parfümlerin ortak yanı az.',
    },
    outlierNote: 'Kalanlara en az benzeyen.',
    nextNote: 'Burnuna en yakın olanlar; henüz raflarında değiller.',
  },

  similar: {
    title: (name: string, brand: string) => `${name} — ${brand} benzerleri · OSMOS`,
    description: (name: string, count: number) =>
      `${name} parfümüne en yakın ${count} parfüm ve paylaştıkları notalar.`,
    heading: (name: string) => `${name} benzerleri`,
    lede: (count: number) => `En yakın ${count} parfüm, ve her birinin onunla paylaştığı.`,
    sharedLabel: 'ortak',
    noShared: 'adı ortak nota yok — benzerlik ailede ve karakterde',
    open: 'benzer parfümler',
    back: (name: string) => `${name} sayfasına dön`,
  },
  perfume: {
    title: (name, brand) => `${name} — ${brand} · OSMOS`,
    fallbackDescription: (name, brand) => `${name}, ${brand}.`,
    frame: { family: 'AILE', year: 'YIL', notes: 'NOTA' },
    position: (index, total) => `PARFÜM ${String(index).padStart(3, '0')}/${total}`,
    sections: { evolution: 'EVRIM', notes: 'NOTALAR', neighbours: 'KOMŞULAR' },
    neighbourLabel: (name, count, list) =>
      `${name} parfümüne en çok benzeyen ${count} parfüm: ${list}.`,
    neighbourEntry: (name, percent) => `${name}, %${percent}`,
    neighbourCaption:
      'Ortadaki bu parfüm. Yakınlık benzerlik: ne kadar yakınsa o kadar benziyor. Yükseklik kokunun uzaydaki derinliği — halkanın üstündekiler daha derin, altındakiler daha yüzeysel. Haritanın düz hâlinde görünmeyen fark bu.',
    /* İkisi de küçük harf kalıyor; büyütülselerdi kural noktasız I isterdi. */
    whereToFind: 'nerede bulunur',
    commissionNote: 'bunların bazıları ortaklık bağlantısı: birinden alışveriş yapılırsa siteye komisyon yazabilir, sana ek maliyeti olmaz',
  },

  note: {
    title: (name) => `${name} — nota · OSMOS`,
    frame: { band: 'BANT', peak: 'TEPE', life: 'ÖMÜR' },
    position: (index, total) => `NOTA ${String(index).padStart(3, '0')}/${total}`,
    usage: (carriers, total) => `${carriers}/${total} PARFÜM`,
    carriersHeading: (count) => (count > 0 ? `${count} PARFÜMDE` : 'HENÜZ HIÇBIR PARFÜMDE'),
    unused: (total) =>
      `Bu nota paletin parçası ama seçkideki ${total} parfümün hiçbirinde geçmiyor. Ansiklopedi bir nota sözlüğü; kullanım listesi değil.`,
    orbitEmpty: (name) => `${name} henüz hiçbir parfümde geçmiyor.`,
    orbitLabel: (name, count, list) =>
      `${name} notasını içeren ${count} parfüm, üç boyutlu bir yörüngede dönüyor: ${list}.`,
    measures: {
      volatility: 'UÇUCULUK',
      character: 'KARAKTER',
      peak: 'TEPE',
      halfLife: 'YARI ÖMÜR',
    },
    shortMinutes: (minutes) => `${minutes}′`,
    shortHours: (hours) => `${hours}s`,
    shortHoursMinutes: (hours, minutes) => `${hours}s ${minutes}′`,
  },

  notesIndex: {
    title: (count) => `Notalar — ${count} malzeme · OSMOS`,
    description: 'Koku uzayını besleyen nota veritabanı, uçuculuk bandına göre.',
    heading: 'Notalar',
    lede: (count) =>
      `${count} malzeme, uçuculuk bandına göre. Renk baskın koku ailesi — uzaydaki noktalarla aynı palet.`,
    status: (count) => `PALET ${count}`,
    tail: (used) => `${used} KULLANIMDA`,
  },

  bands: { top: 'ÜST', heart: 'KALP', base: 'DIP' },

  chart: {
    tiers: { top: 'Üst', heart: 'Kalp', base: 'Dip' },
    timeLabel: 'Zaman',
    disclaimer:
      'Bu çizelge bir tahmindir, ölçüm değil. Notaların uçuculuğundan modellenmiştir; gerçek gelişim sıcaklığa, tene ve konsantrasyona göre değişir.',
    signatureLabel: (name, notes) =>
      `${name} evrim imzası: ${notes} notalarının 8 saat boyunca yükselip düşüşü.`,
  },

  phases: { opening: 'Açılış', heart: 'Kalp', base: 'Dip' },

  duration: {
    firstSeconds: 'ilk saniyeler',
    minutes: (n) => `${n} dakika`,
    hours: (h) => `${h} saat`,
    hoursMinutes: (h, m) => `${h} saat ${m} dakika`,
  },

  axes: {
    temperature: { low: 'SOĞUK', high: 'SICAK', lowWord: 'soğuk', highWord: 'sıcak' },
    texture: { low: 'KADIFE', high: 'KESKIN', lowWord: 'kadifemsi', highWord: 'keskin' },
    cleanliness: { low: 'KIRLI', high: 'TEMIZ', lowWord: 'kirli', highWord: 'temiz' },
    proximity: {
      low: 'HAVADA',
      high: 'TENDE',
      lowWord: 'havada dağılan',
      highWord: 'tene yapışan',
    },
  },

  axisWords: {
    between: (low, high) => `${low} ile ${high} arasında`,
    faint: (word) => `hafif ${word}`,
    plain: (word) => word,
    strong: (word) => `belirgin ${word}`,
  },

  draft: {
    spaceTitle: 'Uzay taslağı · OSMOS',
    evolutionTitle: 'Evrim taslağı · OSMOS',
    spaceHeading: 'Uzay taslağı',
    spaceLede: (count) =>
      `Benzerlik motorunun doğrulama ekranı. ${count} parfüm; her biri üç kanaldan okunuyor — koku ailesi, karakter (sıcaklık, doku, temizlik, yakınlık) ve paylaşılan notalar. Üçünün birleşiminden çıkan kosinüs uzaklığı klasik MDS ile iki boyuta indirildi. Renk baskın aileyi, nokta boyutu üçüncü bileşeni (derinlik) gösteriyor.`,
    spaceHint: 'Üstüne gel — adı çıkar. Tıkla — en yakın üç komşusuna bağlanır.',
    spaceLabel: 'Parfümlerin koku uzayındaki dağılımı',
    checkpoints: 'Kontrol noktaları',
    neighbours: 'En yakın komşular',
    neighboursNote: 'Sayı kosinüs benzerliği: 1.00 aynı karakter, 0.00 ortak hiçbir şey yok.',
    missing: 'yok',
    expectations: {
      nasomatto: 'Nasomatto çifti yakın olmalı',
      mossy: 'Yosunlu uç bir arada olmalı',
      dirty: 'Kirli uç bir arada olmalı',
      alone: 'Not a Perfume yapayalnız olmalı',
    },
  },
};
