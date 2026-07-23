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
                <td style="text-align: center;">—</td>
            `;
        } else {
            // Slot terisi
            const sisa = hitungSisaWaktu(k.selesai);
            const badgeClass = k.statusPembayaran === 'Lunas' ? 'badge-lunas-tbl' : 'badge-belum-tbl';
            
            const btnBuktiHtml = `<button class="btn-bukti-view" data-slot="${k.slot}">🔍 Bukti</button>`;

            tr.innerHTML = `
                <td>${k.slot}</td>
                <td>${k.nama}</td>
                <td>${k.hp}</td>
                <td>${formatTanggalIndo(k.mulai)}</td>
                <td>${k.durasi} Tahun</td>
                <td>${formatTanggalIndo(k.selesai)}</td>
                <td><span class="sisa-waktu-text">${sisa}</span></td>
                <td><span class="${badgeClass}">${k.statusPembayaran}</span></td>
                <td>${k.harga}</td>
                <td>
                    <button class="btn-edit" data-slot="${k.slot}">Edit</button>
                    <button class="btn-delete" data-slot="${k.slot}">Hapus</button>
                    <button class="btn-wa" data-slot="${k.slot}" title="Konfirmasi pembayaran via WhatsApp">WA</button>
                    ${btnBuktiHtml}
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
        const oldObj = kiosList[idx] || {};
        kiosList[idx] = {
            ...oldObj,
            slot, nama, hp, mulai, durasi, selesai, statusPembayaran: status, harga,
            lokasi: oldObj.lokasi || (slot === "1" || slot === "2" ? "Blok A No. " + slot : "Blok B No. " + (parseInt(slot) - 2)),
            luas: oldObj.luas || (slot === "4" ? "5m x 5m" : slot === "3" ? "4m x 5m" : "4m x 4m"),
            buktiPembayaran: oldObj.buktiPembayaran || ""
        };
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

            // Kosongkan slot dengan tetap menjaga data lokasi & luas
            const oldObj = kiosList[idx] || {};
            kiosList[idx] = {
                slot: k.slot, nama: '', hp: '', mulai: '', durasi: '', selesai: '', statusPembayaran: '', harga: '',
                lokasi: oldObj.lokasi || (k.slot === "1" || k.slot === "2" ? "Blok A No. " + k.slot : "Blok B No. " + (parseInt(k.slot) - 2)),
                luas: oldObj.luas || (k.slot === "4" ? "5m x 5m" : k.slot === "3" ? "4m x 5m" : "4m x 4m"),
                buktiPembayaran: ''
            };
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

    // --- TOMBOL BUKTI ---
    if (target.classList.contains('btn-bukti-view')) {
        const k = kiosList[idx];
        showBuktiBayarModal(k.buktiPembayaran || '');
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
        const oldObj = kiosList[idx] || {};
        kiosList[idx] = {
            ...oldObj,
            slot: oldObj.slot,
            nama, hp, mulai, durasi, selesai,
            statusPembayaran: status,
            harga,
            lokasi: oldObj.lokasi || (oldObj.slot === "1" || oldObj.slot === "2" ? "Blok A No. " + oldObj.slot : "Blok B No. " + (parseInt(oldObj.slot) - 2)),
            luas: oldObj.luas || (oldObj.slot === "4" ? "5m x 5m" : oldObj.slot === "3" ? "4m x 5m" : "4m x 4m"),
            buktiPembayaran: oldObj.buktiPembayaran || ""
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

// =========================================================
// FITUR MODAL BUKTI BAYAR & FORUM DISKUSI (ADMIN SIDE)
// =========================================================
const adminSenderName = localStorage.getItem('namaAdmin') || 'Admin';

function showBuktiBayarModal(base64Image) {
    const imgEl = document.getElementById('img-bukti-preview');
    const noBuktiEl = document.getElementById('no-bukti-box');
    if (base64Image && base64Image.trim() !== '') {
        imgEl.src = base64Image;
        imgEl.style.display = 'inline-block';
        if (noBuktiEl) noBuktiEl.style.display = 'none';
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
        if (noBuktiEl) noBuktiEl.style.display = 'block';
    }
    document.getElementById('modal-bukti').style.display = 'flex';
}

if (document.getElementById('close-bukti')) {
    document.getElementById('close-bukti').addEventListener('click', function() {
        document.getElementById('modal-bukti').style.display = 'none';
    });
}

if (document.getElementById('modal-bukti')) {
    document.getElementById('modal-bukti').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
}

let currentSlotDiskusi = "";

async function openDiskusiModal(slot) {
    currentSlotDiskusi = slot;
    document.getElementById('modal-diskusi-title').textContent = `Forum Diskusi Kios Slot ${slot}`;
    document.getElementById('komentar-parent-id').value = '';
    document.getElementById('replying-label-container').style.display = 'none';
    document.getElementById('modal-diskusi').style.display = 'flex';
    await loadKomentar(slot);
}

if (document.getElementById('close-diskusi')) {
    document.getElementById('close-diskusi').addEventListener('click', function() {
        document.getElementById('modal-diskusi').style.display = 'none';
    });
}

if (document.getElementById('modal-diskusi')) {
    document.getElementById('modal-diskusi').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
}

if (document.getElementById('btn-cancel-reply')) {
    document.getElementById('btn-cancel-reply').addEventListener('click', function() {
        document.getElementById('komentar-parent-id').value = '';
        document.getElementById('replying-label-container').style.display = 'none';
    });
}

async function loadKomentar(slot) {
    const list = await getKomentarData(slot);
    const container = document.getElementById('komentar-container');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p style="color: #777; font-style: italic; text-align: center; margin-top: 20px;">Belum ada diskusi di kios ini. Mari mulai berkomentar!</p>`;
        return;
    }

    const rootComments = list.filter(c => !c.parentId);
    const replies = list.filter(c => c.parentId);

    rootComments.forEach(c => {
        const commentEl = createCommentElement(c, false);
        container.appendChild(commentEl);

        const childReplies = replies.filter(r => r.parentId === c.id);
        childReplies.forEach(reply => {
            const replyEl = createCommentElement(reply, true);
            container.appendChild(replyEl);
        });
    });
}

function createCommentElement(c, isReply) {
    const div = document.createElement('div');
    div.style.padding = '12px 16px';
    div.style.borderRadius = '8px';
    div.style.marginBottom = '12px';
    div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    div.style.boxSizing = 'border-box';

    if (isReply) {
        div.style.marginLeft = '40px';
        div.style.borderLeft = '4px solid #28c25a';
        div.style.background = '#f9f9f9';
    } else {
        div.style.borderLeft = '4px solid #7e57c2';
        div.style.background = '#ffffff';
        div.style.border = '1px solid #eee';
    }

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.fontSize = '12px';
    header.style.color = '#666';
    header.style.marginBottom = '8px';

    const author = document.createElement('strong');
    author.textContent = c.nama;
    author.style.color = isReply ? '#2e7d32' : '#7e57c2';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = new Date(c.tanggal).toLocaleString('id-ID');

    header.appendChild(author);
    header.appendChild(dateSpan);

    const body = document.createElement('div');
    body.style.fontSize = '14px';
    body.style.color = '#333';
    body.style.lineHeight = '1.5';

    if (isReply) {
        const reHeader = document.createElement('div');
        reHeader.style.fontWeight = 'bold';
        reHeader.style.color = '#555';
        reHeader.style.fontSize = '12px';
        reHeader.style.marginBottom = '4px';
        reHeader.textContent = `Re: Diskusi Kios`;
        body.appendChild(reHeader);
    }

    const contentText = document.createElement('p');
    contentText.textContent = c.pesan;
    body.appendChild(contentText);

    div.appendChild(header);
    div.appendChild(body);

    if (!isReply) {
        const actions = document.createElement('div');
        actions.style.textAlign = 'right';
        actions.style.marginTop = '8px';

        const replyBtn = document.createElement('button');
        replyBtn.textContent = 'Reply';
        replyBtn.style.background = 'none';
        replyBtn.style.border = 'none';
        replyBtn.style.color = '#0288d1';
        replyBtn.style.fontWeight = 'bold';
        replyBtn.style.cursor = 'pointer';
        replyBtn.style.fontSize = '12px';
        replyBtn.addEventListener('click', function() {
            document.getElementById('komentar-parent-id').value = c.id;
            document.getElementById('replying-to-name').textContent = c.nama;
            document.getElementById('replying-label-container').style.display = 'flex';
            document.getElementById('input-komentar-teks').focus();
        });

        actions.appendChild(replyBtn);
        div.appendChild(actions);
    }

    return div;
}

// Submit komentar baru (Admin)
if (document.getElementById('form-tulis-komentar')) {
    document.getElementById('form-tulis-komentar').addEventListener('submit', async function(e) {
        e.preventDefault();
        const textInput = document.getElementById('input-komentar-teks');
        const parentIdInput = document.getElementById('komentar-parent-id');
        const pesan = textInput.value.trim();
        const parentId = parentIdInput.value || null;

        if (!pesan) return;

        const commentObj = {
            id: Date.now().toString(),
            slot: currentSlotDiskusi,
            nama: adminSenderName + " (Admin)",
            pesan: pesan,
            tanggal: new Date().toISOString(),
            parentId: parentId
        };

        await saveKomentarData(commentObj);

        textInput.value = '';
        parentIdInput.value = '';
        document.getElementById('replying-label-container').style.display = 'none';

        await loadKomentar(currentSlotDiskusi);
    });
}
