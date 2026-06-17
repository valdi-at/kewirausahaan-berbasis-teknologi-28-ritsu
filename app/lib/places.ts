export type PlaceCategory = 'faculty' | 'mosque' | 'food' | 'park' | 'sports' | 'library' | 'admin'

export type PlaceItem = {
  label: string
  desc?: string
}

export type Place = {
  id: string
  name: string
  shortDesc: string
  description: string
  category: PlaceCategory
  items?: PlaceItem[]
}

export const categoryLabels: Record<PlaceCategory, string> = {
  faculty: 'Fakultas',
  mosque: 'Masjid',
  food: 'Kantin',
  park: 'Taman',
  sports: 'Olahraga',
  library: 'Perpustakaan',
  admin: 'Administrasi',
}

export const categoryIcons: Record<PlaceCategory, string> = {
  faculty: '🎓',
  mosque: '🕌',
  food: '🍽️',
  park: '🌳',
  sports: '⚽',
  library: '📚',
  admin: '🏛️',
}

export const places: Place[] = [
  // ── FACULTY BUILDINGS ──────────────────────────────────────────────────────
  {
    id: 'ftspk',
    name: 'FTSPK',
    shortDesc: 'Fakultas Teknik Sipil, Perencanaan, dan Kebumian',
    description:
      'Fakultas Teknik Sipil, Perencanaan, dan Kebumian (FTSPK) menaungi enam departemen rekayasa infrastruktur, perencanaan kota, dan ilmu kebumian. Gedung ini menjadi pusat pembelajaran bagi ribuan mahasiswa di bidang teknik sipil, arsitektur, dan lingkungan. Sebelum tahun 2020, fakultas ini dikenal sebagai FTSP (Fakultas Teknik Sipil dan Perencanaan).',
    category: 'faculty',
    items: [
      { label: 'Teknik Sipil', desc: 'Merancang dan membangun infrastruktur berkelanjutan' },
      { label: 'Arsitektur', desc: 'Desain bangunan dan lingkungan binaan' },
      { label: 'Teknik Lingkungan', desc: 'Solusi rekayasa untuk permasalahan lingkungan' },
      { label: 'Perencanaan Wilayah dan Kota', desc: 'Perencanaan tata ruang dan pembangunan daerah' },
      { label: 'Teknik Geomatika', desc: 'Pemetaan dan sistem informasi geografis' },
      { label: 'Teknik Geofisika', desc: 'Eksplorasi bumi menggunakan metode fisika' },
    ],
  },
  {
    id: 'ftk',
    name: 'FTK',
    shortDesc: 'Fakultas Teknologi Kelautan',
    description:
      'Fakultas Teknologi Kelautan (FTK) adalah fakultas unggulan ITS yang berfokus pada teknologi maritim. Sebagai perguruan tinggi teknologi dengan lokasi strategis di Surabaya — kota pelabuhan terbesar Indonesia — FTK melahirkan insinyur-insinyur ahli di bidang perkapalan dan kelautan yang diakui di tingkat internasional.',
    category: 'faculty',
    items: [
      { label: 'Teknik Perkapalan', desc: 'Desain dan konstruksi kapal laut' },
      { label: 'Teknik Sistem Perkapalan', desc: 'Sistem permesinan dan instalasi kapal' },
      { label: 'Teknik Kelautan', desc: 'Rekayasa struktur laut dan pantai' },
      { label: 'Transportasi Laut', desc: 'Manajemen dan logistik transportasi maritim' },
    ],
  },
  {
    id: 'ftis',
    name: 'FTIS',
    shortDesc: 'Fakultas Teknik Industri dan Sistem',
    description:
      'Fakultas Teknik Industri dan Sistem (FTIS) mencakup berbagai disiplin ilmu rekayasa industri dan sistem. Di sini mahasiswa mempelajari cara mengoptimalkan proses produksi, merancang sistem manufaktur, dan mengembangkan material baru untuk industri masa depan. FTIS merupakan salah satu dari tujuh fakultas inti ITS.',
    category: 'faculty',
    items: [
      { label: 'Teknik Mesin', desc: 'Perancangan dan manufaktur sistem mekanikal' },
      { label: 'Teknik Industri', desc: 'Optimasi sistem produksi dan manajemen operasi' },
      { label: 'Teknik Material dan Metalurgi', desc: 'Pengembangan dan karakterisasi material baru' },
      { label: 'Teknik Fisika', desc: 'Aplikasi fisika pada sistem rekayasa' },
      { label: 'Teknik Kimia', desc: 'Proses kimia dan industri petrokimia' },
    ],
  },
  {
    id: 'fsad',
    name: 'FSAD',
    shortDesc: 'Fakultas Sains dan Analitika Data',
    description:
      'Fakultas Sains dan Analitika Data (FSAD) adalah rumah bagi ilmu-ilmu dasar dan sains data di ITS. Mengintegrasikan keilmuan matematika, fisika, kimia, biologi, dan statistika dengan teknologi analitika data modern untuk menghadapi tantangan ilmiah di era digital.',
    category: 'faculty',
    items: [
      { label: 'Matematika', desc: 'Fondasi matematika untuk sains dan rekayasa' },
      { label: 'Fisika', desc: 'Penelitian fenomena alam dan aplikasinya' },
      { label: 'Kimia', desc: 'Ilmu dan rekayasa molekuler' },
      { label: 'Statistika', desc: 'Analisis data dan pemodelan statistik' },
      { label: 'Biologi', desc: 'Ilmu hayat dan bioteknologi' },
      { label: 'Sains dan Analitika Data', desc: 'Data science dan kecerdasan buatan' },
    ],
  },
  {
    id: 'fteic',
    name: 'FTEIC',
    shortDesc: 'Fakultas Teknologi Elektro dan Informatika Cerdas',
    description:
      'Fakultas Teknologi Elektro dan Informatika Cerdas (FTEIC) adalah jantung teknologi digital ITS. Menggabungkan keilmuan teknik elektro, informatika, dan biomedis, FTEIC mencetak talenta-talenta digital yang siap memimpin era kecerdasan buatan dan transformasi digital Indonesia.',
    category: 'faculty',
    items: [
      { label: 'Teknik Elektro', desc: 'Sistem tenaga, elektronika, dan telekomunikasi' },
      { label: 'Teknik Informatika', desc: 'Rekayasa perangkat lunak dan ilmu komputer' },
      { label: 'Sistem Informasi', desc: 'Manajemen dan arsitektur sistem informasi' },
      { label: 'Teknik Komputer', desc: 'Arsitektur komputer dan embedded systems' },
      { label: 'Teknik Biomedis', desc: 'Teknologi untuk aplikasi medis dan kesehatan' },
    ],
  },
  {
    id: 'fdkbd',
    name: 'FDKBD',
    shortDesc: 'Fakultas Desain Kreatif dan Bisnis Digital',
    description:
      'Fakultas Desain Kreatif dan Bisnis Digital (FDKBD) adalah fakultas termuda dan paling dinamis di ITS. Memadukan kreativitas desain dengan strategi bisnis digital, FDKBD menjadi inkubator bagi para inovator, desainer, dan entrepreneur masa depan di era ekonomi kreatif.',
    category: 'faculty',
    items: [
      { label: 'Desain Produk Industri', desc: 'Desain produk fungsional dan estetis untuk industri' },
      { label: 'Desain Komunikasi Visual', desc: 'Branding, komunikasi visual, dan media digital' },
      { label: 'Desain Interior', desc: 'Perancangan ruang interior dan furnitur' },
      { label: 'Manajemen Bisnis', desc: 'Strategi bisnis dan kewirausahaan digital' },
    ],
  },
  {
    id: 'vokasi',
    name: 'Fakultas Vokasi',
    shortDesc: 'Pendidikan vokasional terapan program D-4',
    description:
      'Fakultas Vokasi ITS menawarkan program D-4 yang berorientasi pada keahlian terapan dan kesiapan industri. Berlokasi di kampus Manyar, vokasi ITS menghasilkan lulusan-lulusan siap kerja dengan kompetensi praktis tinggi di bidang teknik dan teknologi terapan.',
    category: 'faculty',
    items: [
      { label: 'Teknik Sipil (D-4)', desc: 'Vokasional teknik sipil dan konstruksi' },
      { label: 'Teknik Instrumentasi', desc: 'Sistem instrumentasi dan kontrol industri' },
      { label: 'Teknologi Rekayasa Otomasi', desc: 'Otomasi dan robotika untuk industri' },
      { label: 'Teknologi Rekayasa Kimia Industri', desc: 'Proses kimia untuk skala industri' },
    ],
  },

  // ── MOSQUE ─────────────────────────────────────────────────────────────────
  {
    id: 'masjid-manarul-ilmi',
    name: 'Masjid Manarul Ilmi',
    shortDesc: 'Masjid utama kampus ITS sejak 1979',
    description:
      'Masjid Manarul Ilmi ITS adalah ikon spiritual kampus yang berdiri megah tepat di depan Gedung Rektorat. Didirikan pada tahun 1979 semasa kepemimpinan Prof. Mahmud Zaki M.Sc, masjid dengan luas bangunan 2.458 m² ini menjadi pusat kegiatan keagamaan civitas akademika ITS. Dengan arsitektur Islami berpilar putih dan taman yang rindang, masjid ini menjadi oasis ketenangan di tengah kesibukan kampus.',
    category: 'mosque',
    items: [
      { label: 'Ruang Sholat Utama', desc: 'Kapasitas ratusan jamaah dengan suasana sejuk dan nyaman' },
      { label: 'Taman Masjid', desc: 'Area hijau rindang untuk istirahat dan belajar' },
      { label: 'Perpustakaan Mini', desc: 'Koleksi buku Islam dan referensi keagamaan' },
      { label: 'Aula Kajian', desc: 'Ruang untuk kajian, seminar, dan acara keagamaan' },
      { label: 'Takmir Masjid', desc: 'Organisasi mahasiswa pengelola kegiatan masjid' },
      { label: 'Area Wudhu', desc: 'Fasilitas bersuci yang bersih dan memadai' },
    ],
  },

  // ── FOOD ───────────────────────────────────────────────────────────────────
  {
    id: 'kantin-pusat',
    name: 'Kantin Pusat ITS',
    shortDesc: 'Pusat kuliner utama kampus dengan beragam pilihan',
    description:
      'Kantin Pusat ITS adalah destinasi kuliner terbesar di kampus yang telah melayani civitas akademika selama puluhan tahun. Terletak di lokasi strategis di Jl. Teknik Mesin, kantin ini menyajikan beragam pilihan makanan khas Indonesia dengan harga terjangkau. Mengusung konsep green building dan dilengkapi fasilitas WiFi, kantin ini menjadi tempat favorit untuk makan siang dan bersantai.',
    category: 'food',
    items: [
      { label: 'Soto Ayam', desc: 'Menu legendaris sejak 1977 — soto ayam khas Surabaya' },
      { label: 'Gado-gado', desc: 'Sayuran segar dengan bumbu kacang khas Jawa' },
      { label: 'Mie Ayam', desc: 'Mie ayam dengan kuah gurih dan topping lengkap' },
      { label: 'Nasi Jamur', desc: 'Nasi putih dengan olahan jamur tiram pilihan' },
      { label: 'Aneka Minuman', desc: 'Minuman dingin dan hangat, dari es teh hingga kopi' },
      { label: 'Area WiFi', desc: 'Koneksi internet gratis untuk mahasiswa' },
    ],
  },
  {
    id: 'kantin-ftk',
    name: 'Kantin FTK',
    shortDesc: 'Kantin nyaman di kawasan Fakultas Teknologi Kelautan',
    description:
      'Kantin FTK melayani mahasiswa dan dosen Fakultas Teknologi Kelautan dengan menu-menu lezat pilihan. Suasana yang nyaman dan lokasi yang dekat dengan gedung perkuliahan menjadikan kantin ini pilihan utama warga FTK untuk mengisi energi di antara sesi kuliah.',
    category: 'food',
    items: [
      { label: 'Warung Nasi', desc: 'Nasi campur dengan pilihan lauk-pauk setiap hari' },
      { label: 'Kedai Kopi & Teh', desc: 'Minuman hangat dan dingin pilihan mahasiswa' },
      { label: 'Snack Corner', desc: 'Camilan dan makanan ringan untuk pengganjal perut' },
    ],
  },

  // ── PARKS ──────────────────────────────────────────────────────────────────
  {
    id: 'taman-alumni',
    name: 'Taman Alumni ITS',
    shortDesc: 'Taman hijau seluas 1,5 hektar untuk rekreasi',
    description:
      'Taman Alumni ITS adalah area hijau seluas 1,5 hektar yang menjadi paru-paru kampus dan ruang rekreasi bagi seluruh civitas akademika. Dengan pepohonan rindang dan jalur pejalan kaki yang nyaman, taman ini menjadi tempat favorit untuk bersantai, berolahraga ringan, atau sekadar melepas penat setelah kuliah.',
    category: 'park',
    items: [
      { label: 'Jalur Jogging', desc: 'Trek lari dan jalan kaki melingkar yang nyaman' },
      { label: 'Area Duduk', desc: 'Bangku taman dan gazebo di bawah pepohonan rindang' },
      { label: 'Taman Bunga', desc: 'Koleksi tanaman hias dan bunga warna-warni' },
      { label: 'Area Piknik', desc: 'Hamparan rumput hijau untuk bersantai bersama teman' },
    ],
  },
  {
    id: 'taman-air-mancur',
    name: 'Taman Air Mancur Menari',
    shortDesc: 'Landmark air mancur interaktif di bundaran ITS',
    description:
      'Taman Air Mancur Menari adalah landmark ikonik yang terletak di bundaran kampus ITS. Diresmikan pada 31 Mei 2018 sebagai hadiah dari Alumni Teknik Sipil ITS dalam rangka HUT Kota Surabaya ke-725, taman seluas 1.000 m² ini menampilkan air mancur interaktif yang menari mengikuti irama musik dan menjadi daya tarik tersendiri di malam hari.',
    category: 'park',
    items: [
      { label: 'Air Mancur Interaktif', desc: 'Pertunjukan air mancur dengan iringan musik pilihan' },
      { label: 'Area Duduk Melingkar', desc: 'Bangku dan kursi taman di sekeliling kolam' },
      { label: 'Spot Foto', desc: 'Lokasi favorit untuk foto dan dokumentasi mahasiswa' },
      { label: 'Lampu Taman', desc: 'Pencahayaan warna-warni yang memperindah suasana malam' },
    ],
  },

  // ── SPORTS ─────────────────────────────────────────────────────────────────
  {
    id: 'fasor',
    name: 'FASOR ITS',
    shortDesc: 'Kompleks olahraga lengkap untuk civitas akademika',
    description:
      'FASOR (Fasilitas Olahraga ITS) adalah kompleks olahraga terpadu yang menyediakan berbagai sarana olahraga bagi mahasiswa, dosen, dan staf ITS. Dengan berbagai fasilitas modern mulai dari lapangan sepak bola berstandar hingga kanal arung jeram, FASOR menjadi pusat aktivitas fisik dan pengembangan prestasi olahraga kampus.',
    category: 'sports',
    items: [
      { label: 'Lapangan Sepak Bola', desc: 'Lapangan berstandar untuk pertandingan resmi' },
      { label: 'Lapangan Futsal', desc: 'Beberapa lapangan futsal indoor dan outdoor' },
      { label: 'Lapangan Basket', desc: 'Lapangan basket untuk latihan dan pertandingan' },
      { label: 'Lapangan Tenis', desc: 'Lapangan tenis dengan fasilitas lengkap' },
      { label: 'Wall Climbing', desc: 'Dinding panjat tebing untuk latihan dan kompetisi' },
      { label: 'Gymnasium', desc: 'Pusat kebugaran dengan peralatan modern' },
      { label: 'Lapangan Badminton Indoor', desc: 'Lapangan badminton ber-AC untuk latihan intensif' },
      { label: 'Kanal Arung Jeram', desc: 'Fasilitas latihan olahraga air untuk UKM arung jeram' },
    ],
  },

  // ── LIBRARY ────────────────────────────────────────────────────────────────
  {
    id: 'perpustakaan',
    name: 'Perpustakaan ITS',
    shortDesc: 'Pusat sumber belajar dengan koleksi ribuan referensi',
    description:
      'Perpustakaan ITS berdiri sejak 1960 bersama pendirian kampus, dan kini telah berkembang menjadi pusat sumber belajar modern berlantai 5 dengan luas 7.500 m². Mengintegrasikan koleksi cetak dan digital dengan teknologi informasi terkini, perpustakaan ini melayani seluruh sivitas akademika ITS dalam mengakses pengetahuan untuk mendukung penelitian dan pembelajaran.',
    category: 'library',
    items: [
      { label: 'Ruang Baca', desc: 'Area membaca yang nyaman dan kondusif di setiap lantai' },
      { label: 'Koleksi Buku & Jurnal', desc: 'Ratusan ribu judul buku dan jurnal ilmiah internasional' },
      { label: 'Repositori Digital', desc: 'Akses ribuan tesis, disertasi, dan laporan penelitian ITS' },
      { label: 'Ruang Diskusi Kelompok', desc: 'Ruang diskusi kedap suara untuk belajar bersama' },
      { label: 'Akses Internet', desc: 'Fasilitas komputer dan WiFi berkecepatan tinggi' },
      { label: 'Katalog Online', desc: 'Sistem pencarian koleksi berbasis web yang mudah diakses' },
    ],
  },

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  {
    id: 'rektorat',
    name: 'Gedung Rektorat',
    shortDesc: 'Pusat administrasi dan kepemimpinan ITS',
    description:
      'Gedung Rektorat adalah jantung administratif Institut Teknologi Sepuluh Nopember yang berdiri megah di pusat kampus Sukolilo. Di gedung ini berpusat seluruh kebijakan akademik, administrasi, dan kepemimpinan institusional ITS. Tepat di depannya berdiri Masjid Manarul Ilmi, menciptakan harmoni antara ilmu pengetahuan dan nilai spiritual.',
    category: 'admin',
    items: [
      { label: 'Kantor Rektor', desc: 'Ruang kerja dan rapat pimpinan tertinggi ITS' },
      { label: 'Biro Akademik', desc: 'Layanan administrasi akademik dan kemahasiswaan' },
      { label: 'Biro Keuangan', desc: 'Layanan administrasi keuangan, UKT, dan beasiswa' },
      { label: 'Direktorat Kemahasiswaan', desc: 'Pusat layanan beasiswa dan kegiatan mahasiswa' },
      { label: 'Ruang Sidang Utama', desc: 'Aula rapat dan sidang institusional ITS' },
    ],
  },
]

export function getPlaceById(id: string): Place | undefined {
  return places.find((p) => p.id === id)
}
