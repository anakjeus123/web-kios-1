// =========================================================
// DATA PENYEWAAN ADMIN — Logika CRUD Dinamis via Supabase
// Menggunakan fungsi dari shared.js
// =========================================================

// --- Elemen DOM Utama ---
const btnTambah       = document.getElementById('btn-tambah-sewa');
const modalTambah     = document.getElementById('modal-tambah');
const btnBatal        = document.getElementById('btn-batal');
const formTambahSewa  = document.getElementById('form-tambah-sewa');

const modalEdit       = document.getElementById('modal-edit');
const btnBatalEdit    = document.getElementById('btn-batal-edit');
const formEditSewa    = document.getElementById('form-edit-sewa');

const tabelBody       = document.getElementById('tabel-body-penyewaan');
const tabelRiwayat    = document.getElementById('tabel-riwayat-body');

// =========================================================
// FUNGSI: Render Tabel Utama (4 Slot Kios)
// =========================================================
async function renderTabel() {
    const kiosList = await getKiosData();
    tabelBody.innerHTML = '';

    kiosList.forEach((k) => {
        const tr = document.createElement('tr');

        if (!k.nama || k.nama.trim() === '') {
            // Slot kosong
            tr.classList.add('slot-kosong-row');
            tr.innerHTML = `
                <td>${k.slot}</td>
                <td colspan="8" style="text-align: center; color: #999; font-style: italic;">— Slot Kosong —</td>
                <td></td>
            `;
        } else {
            // Slot terisi
            const sisa = hitungSisaWaktu(k.selesai);
            const badgeClass = k.statusPembayaran === 'Lunas' ? 'badge-lunas-tbl' : 'badge-belum-tbl';
            
            tr.innerHTML = `
                <td>${k.slot}</td>
                <td>${k.nama}</td>
                <td>${k.hp}</td>
                <td>${formatTanggalIndo(k.mulai)}</td>
                <td>${k.durasi} Tahun</td>
                <td>${formatTanggalIndo(k.selesai)}</td>
                <td style="font-weight:600; color:#b85c00;">${sisa}</td>
                <td><span class="${badgeClass}">${k.statusPembayaran}</span></td>
                <td>${k.harga}</td>
                <td>
                    <button class="btn-edit" data-slot="${k.slot}">Edit</button>
                    <button class="btn-delete" data-slot="${k.slot}">Hapus</button>
                    <button class="btn-wa" data-slot="${k.slot}" title="Konfirmasi pembayaran via WhatsApp">WA</button>
                </td>
            `;
        }

        tabelBody.appendChild(tr);
    });
}

// =========================================================
// FUNGSI: Render Tabel Riwayat Penyewaan
// =========================================================
async function renderRiwayat() {
    const riwayatList = await getRiwayatData();
    tabelRiwayat.innerHTML = '';

    if (riwayatList.length === 0) {
        tabelRiwayat.innerHTML = `
            <tr>
                <td colspan="9" style="color: #aaa; font-style: italic; padding: 18px;">
                    Belum ada riwayat penyewaan.
                </td>
            </tr>
        `;
        return;
    }

    riwayatList.forEach((r, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${r.slot}</td>
            <td>${r.nama}</td>
            <td>${r.hp}</td>
            <td>${formatTanggalIndo(r.mulai)}</td>
            <td>${r.durasi}</td>
            <td>${formatTanggalIndo(r.selesai)}</td>
            <td>${r.status}</td>
            <td>${formatTanggalIndo(r.tanggalAksi)}</td>
        `;
        tabelRiwayat.appendChild(tr);
    });
}

// =========================================================
// FUNGSI: Isi Dropdown Slot Kosong di Modal Tambah
// =========================================================
async function isiDropdownSlotKosong() {
    const kiosList = await getKiosData();
    const selectSlot = document.getElementById('input-slot');
    selectSlot.innerHTML = '';

    const slotKosong = kiosList.filter(k => !k.nama || k.nama.trim() === '');

    if (slotKosong.length === 0) {
        selectSlot.innerHTML = '<option value="">Semua slot sudah terisi</option>';
    } else {
        slotKosong.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.slot;
            opt.textContent = `Slot ${k.slot}`;
            selectSlot.appendChild(opt);
        });
    }
}

// =========================================================
// EVENT: Buka Modal Tambah
// =========================================================
btnTambah.addEventListener('click', async function () {
    await isiDropdownSlotKosong();
    formTambahSewa.reset();
    modalTambah.style.display = 'flex';
});

// EVENT: Tutup Modal Tambah
btnBatal.addEventListener('click', function () {
    modalTambah.style.display = 'none';
});

// =========================================================
// EVENT: Submit Form Tambah Sewa (Admin manual input)
// =========================================================
formTambahSewa.addEventListener('submit', async function (event) {
    event.preventDefault();

    const slot   = document.getElementById('input-slot').value;
    const nama   = document.getElementById('input-nama').value.trim();
    const hp     = document.getElementById('input-hp').value.trim();
    const mulai  = document.getElementById('input-mulai').value;
    const durasi = document.getElementById('input-durasi').value;
    const status = document.getElementById('input-status').value;
    const harga  = document.getElementById('input-harga').value.trim();

    if (!slot) {
        alert('Tidak ada slot kosong tersedia!');
        return;
    }

    // Hitung tanggal selesai otomatis
    const selesai = hitungTanggalSelesai(mulai, durasi);

    const kiosList = await getKiosData();
    const idx = kiosList.findIndex(k => k.slot === slot);
    if (idx !== -1) {
        kiosList[idx] = { slot, nama, hp, mulai, durasi, selesai, statusPembayaran: status, harga };
        await saveKiosData(kiosList);
    }

    modalTambah.style.display = 'none';
    await renderTabel();
    await renderRiwayat();
});

// =========================================================
// EVENT DELEGATION: Klik Edit / Hapus / WA di dalam Tabel
// =========================================================
tabelBody.addEventListener('click', async function (event) {
    const target = event.target;
    const slot = target.getAttribute('data-slot');
    if (!slot) return;

    const kiosList = await getKiosData();
    const idx = kiosList.findIndex(k => k.slot === slot);
    if (idx === -1) return;

    // --- TOMBOL EDIT ---
    if (target.classList.contains('btn-edit')) {
        const k = kiosList[idx];
        document.getElementById('edit-slot-index').value = idx;
        document.getElementById('edit-slot').value = k.slot;
        document.getElementById('edit-nama').value = k.nama;
        document.getElementById('edit-hp').value = k.hp;
        document.getElementById('edit-mulai').value = k.mulai;
        document.getElementById('edit-durasi').value = k.durasi;
        document.getElementById('edit-status').value = k.statusPembayaran;
        document.getElementById('edit-harga').value = k.harga;
        modalEdit.style.display = 'flex';
    }

    // --- TOMBOL HAPUS (Kosongkan slot & pindah ke riwayat) ---
    if (target.classList.contains('btn-delete')) {
        const konfirmasi = confirm(`Apakah yakin ingin mengosongkan Slot ${slot} dan memindahkan data ke Riwayat Penyewaan?`);
        if (konfirmasi) {
            const k = kiosList[idx];

            // Tambahkan ke riwayat sebelum dihapus
            const riwayat = await getRiwayatData();
            riwayat.push({
                slot: k.slot,
                nama: k.nama,
                hp: k.hp,
                mulai: k.mulai,
                durasi: k.durasi + ' Tahun',
                selesai: k.selesai,
                status: 'Selesai / Dihapus Admin',
                tanggalAksi: new Date().toISOString().split('T')[0]
            });
            await saveRiwayatData(riwayat);

            // Kosongkan slot
            kiosList[idx] = { slot: k.slot, nama: '', hp: '', mulai: '', durasi: '', selesai: '', statusPembayaran: '', harga: '' };
            await saveKiosData(kiosList);

            await renderTabel();
            await renderRiwayat();
        }
    }

    // --- TOMBOL WA (Konfirmasi Pembayaran ke Penyewa) ---
    if (target.classList.contains('btn-wa')) {
        const k = kiosList[idx];
        const pesan = `Halo ${k.nama}, ini konfirmasi dari Admin Penyewaan Kios.\n\nDetail Sewa Kios Slot ${k.slot} Anda:\n- Tanggal Mulai: ${formatTanggalIndo(k.mulai)}\n- Tanggal Selesai: ${formatTanggalIndo(k.selesai)}\n- Durasi: ${k.durasi} Tahun\n- Harga Sewa: ${k.harga}\n- Status Pembayaran: ${k.statusPembayaran}\n\nTerima kasih sudah menyewa kios kami!`;
        bukaWhatsAppWeb(k.hp, pesan);
    }
});

// =========================================================
// EVENT: Tutup Modal Edit
// =========================================================
btnBatalEdit.addEventListener('click', function () {
    modalEdit.style.display = 'none';
});

// =========================================================
// EVENT: Submit Form Edit Sewa (Simpan Perubahan)
// =========================================================
formEditSewa.addEventListener('submit', async function (event) {
    event.preventDefault();

    const idx    = parseInt(document.getElementById('edit-slot-index').value);
    const nama   = document.getElementById('edit-nama').value.trim();
    const hp     = document.getElementById('edit-hp').value.trim();
    const mulai  = document.getElementById('edit-mulai').value;
    const durasi = document.getElementById('edit-durasi').value;
    const status = document.getElementById('edit-status').value;
    const harga  = document.getElementById('edit-harga').value.trim();

    // Hitung ulang tanggal selesai berdasarkan durasi baru
    const selesai = hitungTanggalSelesai(mulai, durasi);

    const kiosList = await getKiosData();
    if (idx >= 0 && idx < kiosList.length) {
        kiosList[idx] = {
            slot: kiosList[idx].slot,
            nama, hp, mulai, durasi, selesai,
            statusPembayaran: status,
            harga
        };
        await saveKiosData(kiosList);
    }

    modalEdit.style.display = 'none';
    await renderTabel();
    await renderRiwayat();
});

// =========================================================
// INISIALISASI AWAL
// =========================================================
async function init() {
    await renderTabel();
    await renderRiwayat();
}
init();
