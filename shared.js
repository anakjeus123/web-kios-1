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
        harga: "Rp. 20.000.000",
        lokasi: "Blok A No. 1",
        luas: "4m x 4m",
        buktiPembayaran: ""
    },
    {
        slot: "2",
        nama: "",
        hp: "",
        mulai: "",
        durasi: "",
        selesai: "",
        statusPembayaran: "",
        harga: "",
        lokasi: "Blok A No. 2",
        luas: "4m x 4m",
        buktiPembayaran: ""
    },
    {
        slot: "3",
        nama: "",
        hp: "",
        mulai: "",
        durasi: "",
        selesai: "",
        statusPembayaran: "",
        harga: "",
        lokasi: "Blok B No. 1",
        luas: "4m x 5m",
        buktiPembayaran: ""
    },
    {
        slot: "4",
        nama: "",
        hp: "",
        mulai: "",
        durasi: "",
        selesai: "",
        statusPembayaran: "",
        harga: "",
        lokasi: "Blok B No. 2",
        luas: "5m x 5m",
        buktiPembayaran: ""
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
        harga: k.harga || "",
        lokasi: k.lokasi || (k.slot === "1" || k.slot === "2" ? "Blok A No. " + k.slot : "Blok B No. " + (parseInt(k.slot) - 2)),
        luas: k.luas || (k.slot === "4" ? "5m x 5m" : k.slot === "3" ? "4m x 5m" : "4m x 4m"),
        buktiPembayaran: k.bukti_pembayaran || ""
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
        harga: k.harga || "",
        lokasi: k.lokasi || "",
        luas: k.luas || "",
        bukti_pembayaran: k.buktiPembayaran || ""
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
    const existing = localStorage.getItem('kiosData');
    if (!existing || existing.toLowerCase().includes('wahyudi')) {
        localStorage.setItem('kiosData', JSON.stringify(DEFAULT_KIOS_DATA));
    }
    if (!localStorage.getItem('riwayatPenyewaan')) {
        localStorage.setItem('riwayatPenyewaan', JSON.stringify([]));
    }
    if (!localStorage.getItem('komentarKios')) {
        localStorage.setItem('komentarKios', JSON.stringify([]));
    }
}

// Menjalankan inisialisasi saat script ini dimuat
inisialisasiDatabase();

// Fungsi membaca data Kios (Asinkron)
async function getKiosData() {
    const client = getSupabase();
    if (!client) {
        return JSON.parse(localStorage.getItem('kiosData')) || DEFAULT_KIOS_DATA;
    }
    try {
        const { data, error } = await client
            .from('kios')
            .select('*')
            .order('slot', { ascending: true });

        if (error) throw error;
        
        let mapped = data.map(mapKiosFromDB);

        // Jika data dari Supabase berisi Wahyudi di slot 1, otomatis bersihkan dan timpa menjadi Wulan
        const slot1 = mapped.find(k => k.slot === "1");
        if (!slot1 || (slot1.nama && slot1.nama.toLowerCase().includes('wahyudi'))) {
            await saveKiosData(DEFAULT_KIOS_DATA);
            return DEFAULT_KIOS_DATA;
        }

        return mapped;
    } catch (err) {
        console.error("Gagal getKiosData dari Supabase, memuat dari localStorage:", err);
        return JSON.parse(localStorage.getItem('kiosData')) || DEFAULT_KIOS_DATA;
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
    let riwayat = [];
    if (!client) {
        riwayat = JSON.parse(localStorage.getItem('riwayatPenyewaan')) || [];
    } else {
        try {
            const { data, error } = await client
                .from('riwayat_penyewaan')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            riwayat = data.map(mapRiwayatFromDB);
        } catch (err) {
            console.error("Gagal getRiwayatData dari Supabase, memuat dari localStorage:", err);
            riwayat = JSON.parse(localStorage.getItem('riwayatPenyewaan')) || [];
        }
    }
    // Filter data Wahyudi jika ada
    return riwayat.filter(r => !r.nama || !r.nama.toLowerCase().includes('wahyudi'));
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

// Fungsi membaca data Komentar Diskusi (Asinkron)
async function getKomentarData(slot) {
    const client = getSupabase();
    if (!client) {
        const localData = JSON.parse(localStorage.getItem('komentarKios')) || [];
        return localData.filter(c => c.slot === slot);
    }
    try {
        const { data, error } = await client
            .from('diskusi_komentar')
            .select('*')
            .eq('slot', slot)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map(c => ({
            id: c.id,
            slot: c.slot,
            nama: c.nama,
            pesan: c.komentar,
            tanggal: c.created_at,
            parentId: c.parent_id
        }));
    } catch (err) {
        console.warn("Gagal getKomentarData dari Supabase, menggunakan fallback localStorage:", err);
        const localData = JSON.parse(localStorage.getItem('komentarKios')) || [];
        return localData.filter(c => c.slot === slot);
    }
}

// Fungsi menyimpan/menambahkan data Komentar Diskusi (Asinkron)
async function saveKomentarData(comment) {
    // Update local storage
    const localData = JSON.parse(localStorage.getItem('komentarKios')) || [];
    localData.push(comment);
    localStorage.setItem('komentarKios', JSON.stringify(localData));

    const client = getSupabase();
    if (!client) return;

    try {
        const dbItem = {
            id: comment.id,
            slot: comment.slot,
            nama: comment.nama,
            komentar: comment.pesan,
            created_at: comment.tanggal,
            parent_id: comment.parentId
        };
        const { error } = await client
            .from('diskusi_komentar')
            .insert([dbItem]);

        if (error) throw error;
    } catch (err) {
        console.error("Gagal saveKomentarData ke Supabase:", err);
    }
}

// =========================================================
// FITUR DEDICATED FORUM DISKUSI KIOS (V-CLASS STYLE)
// =========================================================

// Membaca Topik Diskusi (Opsional Filter per Slot Kios)
async function getTopikDiskusiData(slotFilter) {
    const client = getSupabase();
    let topics = [];
    if (!client) {
        topics = JSON.parse(localStorage.getItem('topikDiskusiKios')) || [];
    } else {
        try {
            let query = client.from('topik_diskusi').select('*').order('created_at', { ascending: false });
            if (slotFilter) {
                query = query.eq('slot', slotFilter);
            }
            const { data, error } = await query;
            if (error) throw error;
            topics = data.map(t => ({
                id: t.id,
                slot: t.slot || "1",
                subject: t.subject,
                nama: t.nama,
                role: t.role,
                pesan: t.pesan,
                tanggal: t.created_at,
                balasanCount: t.balasan_count || 0,
                waktuTerakhir: t.waktu_terakhir || t.created_at
            }));
        } catch (err) {
            console.warn("Gagal getTopikDiskusiData dari Supabase, memuat dari localStorage:", err);
            topics = JSON.parse(localStorage.getItem('topikDiskusiKios')) || [];
        }
    }
    if (slotFilter) {
        topics = topics.filter(t => !t.slot || t.slot === slotFilter);
    }
    return topics;
}

// Menyimpan Topik Diskusi Baru
async function saveTopikDiskusiData(topikObj) {
    const localData = JSON.parse(localStorage.getItem('topikDiskusiKios')) || [];
    localData.unshift(topikObj);
    localStorage.setItem('topikDiskusiKios', JSON.stringify(localData));

    const client = getSupabase();
    if (!client) return;

    try {
        const dbItem = {
            id: topikObj.id,
            slot: topikObj.slot || "1",
            subject: topikObj.subject,
            nama: topikObj.nama,
            role: topikObj.role,
            pesan: topikObj.pesan,
            created_at: topikObj.tanggal,
            balasan_count: topikObj.balasanCount,
            waktu_terakhir: topikObj.waktuTerakhir
        };
        const { error } = await client
            .from('topik_diskusi')
            .insert([dbItem]);

        if (error) throw error;
    } catch (err) {
        console.error("Gagal saveTopikDiskusiData ke Supabase:", err);
    }
}

// Membaca Balasan Diskusi per Topik
async function getBalasanDiskusiData(topikId) {
    const client = getSupabase();
    if (!client) {
        const localData = JSON.parse(localStorage.getItem('balasanDiskusiKios')) || [];
        return localData.filter(b => b.topikId === topikId);
    }
    try {
        const { data, error } = await client
            .from('balasan_diskusi')
            .select('*')
            .eq('topik_id', topikId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map(b => ({
            id: b.id,
            topikId: b.topik_id,
            parentId: b.parent_id,
            nama: b.nama,
            pesan: b.pesan,
            tanggal: b.created_at
        }));
    } catch (err) {
        console.warn("Gagal getBalasanDiskusiData dari Supabase, memuat dari localStorage:", err);
        const localData = JSON.parse(localStorage.getItem('balasanDiskusiKios')) || [];
        return localData.filter(b => b.topikId === topikId);
    }
}

// Menyimpan Balasan Diskusi Baru
async function saveBalasanDiskusiData(balasanObj) {
    // 1. Simpan Balasan ke localStorage
    const localBalasan = JSON.parse(localStorage.getItem('balasanDiskusiKios')) || [];
    localBalasan.push(balasanObj);
    localStorage.setItem('balasanDiskusiKios', JSON.stringify(localBalasan));

    // 2. Update counter balasan di Topik
    const localTopik = JSON.parse(localStorage.getItem('topikDiskusiKios')) || [];
    const idx = localTopik.findIndex(t => t.id === balasanObj.topikId);
    if (idx !== -1) {
        localTopik[idx].balasanCount = (localTopik[idx].balasanCount || 0) + 1;
        localTopik[idx].waktuTerakhir = balasanObj.tanggal;
        localStorage.setItem('topikDiskusiKios', JSON.stringify(localTopik));
    }

    const client = getSupabase();
    if (!client) return;

    try {
        const dbItem = {
            id: balasanObj.id,
            topik_id: balasanObj.topikId,
            parent_id: balasanObj.parentId,
            nama: balasanObj.nama,
            pesan: balasanObj.pesan,
            created_at: balasanObj.tanggal
        };
        const { error } = await client
            .from('balasan_diskusi')
            .insert([dbItem]);

        if (error) throw error;
    } catch (err) {
        console.error("Gagal saveBalasanDiskusiData ke Supabase:", err);
    }
}

// Menghapus Topik Diskusi beserta Balasannya
async function deleteTopikDiskusiData(topikId) {
    // 1. Hapus dari localStorage
    let localTopik = JSON.parse(localStorage.getItem('topikDiskusiKios')) || [];
    localTopik = localTopik.filter(t => t.id !== topikId);
    localStorage.setItem('topikDiskusiKios', JSON.stringify(localTopik));

    let localBalasan = JSON.parse(localStorage.getItem('balasanDiskusiKios')) || [];
    localBalasan = localBalasan.filter(b => b.topikId !== topikId);
    localStorage.setItem('balasanDiskusiKios', JSON.stringify(localBalasan));

    // 2. Hapus dari Supabase
    const client = getSupabase();
    if (!client) return;

    try {
        await client.from('balasan_diskusi').delete().eq('topik_id', topikId);
        await client.from('topik_diskusi').delete().eq('id', topikId);
    } catch (err) {
        console.error("Gagal deleteTopikDiskusiData dari Supabase:", err);
    }
}
