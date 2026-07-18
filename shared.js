// Nomor WhatsApp Admin utama untuk menerima konfirmasi sewa dan pembayaran
const WHATSAPP_ADMIN = "6287789501951";

// Konfigurasi Kredensial Supabase
// Silakan isi sesuai dengan URL dan Anon Key project Supabase Anda
const SUPABASE_URL = "https://bdxusqheorosmjtulzgg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkeHVzcWhlb3Jvc21qdHVsemdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNTMwMDksImV4cCI6MjA5OTkyOTAwOX0.CLCT9MCWz67yMWksdbFQ_SGfBp23tWXWRfC_5ewdHY4";

let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL !== "SILAKAN_ISI_URL_SUPABASE_ANDA") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Fungsi helper untuk mendapatkan instance supabase
function getSupabase() {
    if (!supabaseClient) {
        if (typeof supabase !== 'undefined' && SUPABASE_URL !== "SILAKAN_ISI_URL_SUPABASE_ANDA") {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            return supabaseClient;
        }
        return null;
    }
    return supabaseClient;
}

// Data Kios Default (Hanya diinisialisasi jika localStorage kosong)
const DEFAULT_KIOS_DATA = [
    {
        slot: "1",
        nama: "Wulan",
        hp: "08123456789",
        mulai: "2027-07-12",
        durasi: "1", // Dalam tahun
        selesai: "2028-07-12",
        statusPembayaran: "Lunas",
        harga: "Rp. 20.000.000"
    },
    {
        slot: "2",
        nama: "",
        hp: "",
        mulai: "",
        durasi: "",
        selesai: "",
        statusPembayaran: "",
        harga: ""
    },
    {
        slot: "3",
        nama: "",
        hp: "",
        mulai: "",
        durasi: "",
        selesai: "",
        statusPembayaran: "",
        harga: ""
    },
    {
        slot: "4",
        nama: "",
        hp: "",
        mulai: "",
        durasi: "",
        selesai: "",
        statusPembayaran: "",
        harga: ""
    }
];

// Konversi dari database (snake_case) ke format JS (camelCase)
function mapKiosFromDB(k) {
    return {
        slot: k.slot,
        nama: k.nama || "",
        hp: k.hp || "",
        mulai: k.mulai || "",
        durasi: k.durasi || "",
        selesai: k.selesai || "",
        statusPembayaran: k.status_pembayaran || "",
        harga: k.harga || ""
    };
}

// Konversi dari format JS (camelCase) ke database (snake_case)
function mapKiosToDB(k) {
    return {
        slot: k.slot,
        nama: k.nama || "",
        hp: k.hp || "",
        mulai: k.mulai || "",
        durasi: k.durasi || "",
        selesai: k.selesai || "",
        status_pembayaran: k.statusPembayaran || "",
        harga: k.harga || ""
    };
}

// Konversi dari database (snake_case) ke format JS (camelCase) untuk Riwayat
function mapRiwayatFromDB(r) {
    return {
        slot: r.slot,
        nama: r.nama,
        hp: r.hp || "",
        mulai: r.mulai || "",
        durasi: r.durasi || "",
        selesai: r.selesai || "",
        status: r.status || "",
        tanggalAksi: r.tanggal_aksi
    };
}

// Konversi dari format JS (camelCase) ke database (snake_case) untuk Riwayat
function mapRiwayatToDB(r) {
    return {
        slot: r.slot,
        nama: r.nama,
        hp: r.hp || "",
        mulai: r.mulai || "",
        durasi: r.durasi || "",
        selesai: r.selesai || "",
        status: r.status || "",
        tanggal_aksi: r.tanggalAksi
    };
}

// Fungsi untuk inisialisasi data di localStorage jika belum ada (sebagai cadangan)
function inisialisasiDatabase() {
    if (!localStorage.getItem('kiosData')) {
        localStorage.setItem('kiosData', JSON.stringify(DEFAULT_KIOS_DATA));
    }
    if (!localStorage.getItem('riwayatPenyewaan')) {
        localStorage.setItem('riwayatPenyewaan', JSON.stringify([]));
    }
}

// Menjalankan inisialisasi saat script ini dimuat
inisialisasiDatabase();

// Fungsi membaca data Kios (Asinkron)
async function getKiosData() {
    const client = getSupabase();
    if (!client) {
        return JSON.parse(localStorage.getItem('kiosData'));
    }
    try {
        const { data, error } = await client
            .from('kios')
            .select('*')
            .order('slot', { ascending: true });

        if (error) throw error;
        return data.map(mapKiosFromDB);
    } catch (err) {
        console.error("Gagal getKiosData dari Supabase, memuat dari localStorage:", err);
        return JSON.parse(localStorage.getItem('kiosData'));
    }
}

// Fungsi menyimpan data Kios (Asinkron)
async function saveKiosData(data) {
    localStorage.setItem('kiosData', JSON.stringify(data));

    const client = getSupabase();
    if (!client) return;

    try {
        const dbData = data.map(mapKiosToDB);
        const { error } = await client
            .from('kios')
            .upsert(dbData, { onConflict: 'slot' });

        if (error) throw error;
    } catch (err) {
        console.error("Gagal saveKiosData ke Supabase:", err);
    }
}

// Fungsi membaca data Riwayat (Asinkron)
async function getRiwayatData() {
    const client = getSupabase();
    if (!client) {
        return JSON.parse(localStorage.getItem('riwayatPenyewaan'));
    }
    try {
        const { data, error } = await client
            .from('riwayat_penyewaan')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map(mapRiwayatFromDB);
    } catch (err) {
        console.error("Gagal getRiwayatData dari Supabase, memuat dari localStorage:", err);
        return JSON.parse(localStorage.getItem('riwayatPenyewaan'));
    }
}

// Fungsi menyimpan data Riwayat (Asinkron)
async function saveRiwayatData(data) {
    localStorage.setItem('riwayatPenyewaan', JSON.stringify(data));

    const client = getSupabase();
    if (!client) return;

    try {
        if (data.length > 0) {
            const itemTerakhir = data[data.length - 1];
            const dbItem = mapRiwayatToDB(itemTerakhir);
            const { error } = await client
                .from('riwayat_penyewaan')
                .insert([dbItem]);
            if (error) throw error;
        }
    } catch (err) {
        console.error("Gagal saveRiwayatData ke Supabase:", err);
    }
}

// Fungsi menghitung tanggal selesai (tanggalMulai + durasiTahun)
function hitungTanggalSelesai(mulaiStr, durasiTahun) {
    if (!mulaiStr || !durasiTahun) return "";
    const date = new Date(mulaiStr);
    const tahunBaru = date.getFullYear() + parseInt(durasiTahun);
    date.setFullYear(tahunBaru);

    // Format kembali ke YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Fungsi menghitung sisa waktu sewa
function hitungSisaWaktu(selesaiStr) {
    if (!selesaiStr) return "Masa Sewa Habis";

    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0); // Nolkan jam agar kalkulasi hari akurat

    const tglSelesai = new Date(selesaiStr);
    tglSelesai.setHours(0, 0, 0, 0);

    const selisihWaktu = tglSelesai - hariIni;
    if (selisihWaktu <= 0) {
        return "Masa Sewa Habis";
    }

    const selisihHariTotal = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));

    let tahun = Math.floor(selisihHariTotal / 365);
    const sisaHariTahun = selisihHariTotal % 365;
    let bulan = Math.floor(sisaHariTahun / 30);
    const hari = sisaHariTahun % 30;

    if (bulan === 12) {
        tahun += 1;
        bulan = 0;
    }

    let hasil = [];
    if (tahun > 0) hasil.push(`${tahun} Tahun`);
    if (bulan > 0) hasil.push(`${bulan} Bulan`);
    if (hari > 0) hasil.push(`${hari} Hari`);

    return hasil.join(' ') + ' lagi';
}

// Fungsi mengonversi YYYY-MM-DD ke DD/MM/YYYY
function formatTanggalIndo(tanggalStr) {
    if (!tanggalStr) return "-";
    if (tanggalStr.includes('/')) return tanggalStr; // Sudah format indo
    const parts = tanggalStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return tanggalStr;
}

// Fungsi mengonversi DD/MM/YYYY ke YYYY-MM-DD
function formatTanggalISO(tanggalStr) {
    if (!tanggalStr) return "";
    if (tanggalStr.includes('-')) return tanggalStr; // Sudah format ISO
    const parts = tanggalStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return tanggalStr;
}

// Fungsi memformat nomor HP ke format internasional (misal 0812 -> 62812)
function formatNomorHP(hp) {
    if (!hp) return "";
    let clean = hp.replace(/[^0-9]/g, ''); // Hapus semua karakter non-angka
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    }
    return clean;
}

// Fungsi untuk membuka chat WhatsApp Web
function bukaWhatsAppWeb(nomorTujuan, pesan) {
    const nomorFormat = formatNomorHP(nomorTujuan);
    const url = `https://web.whatsapp.com/send?phone=${nomorFormat}&text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank');
}
