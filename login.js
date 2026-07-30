// =========================================================
// LOGIKA LOGIN & REGISTRASI PENYEWA MURNI VIA SUPABASE
// =========================================================

// Ambil Klien Supabase jika tersedia
function getSupabaseClient() {
    if (typeof getSupabase === 'function') {
        return getSupabase();
    }
    return null;
}

// --- 1. Ambil Elemen dari HTML ---
const loginForm = document.getElementById('login-form');
const linkDaftar = document.getElementById('link-to-register');

// --- 2. Logika Submit Login Murni Supabase ---
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    if (!usernameInput || !passwordInput) {
        alert('Harap isi username dan password!');
        return;
    }

    // Cek apakah ini login admin (hardcoded lokal tetap didukung)
    if (usernameInput.toLowerCase() === 'abim' && passwordInput === 'admin') {
        alert('Login Admin Berhasil!');
        localStorage.setItem('namaPenyewa', 'abiM');
        localStorage.setItem('namaAdmin', 'abiM');
        window.location.href = 'dashboard_admin.html';
        return;
    }

    const client = getSupabaseClient();
    if (!client) {
        alert('Koneksi database Supabase tidak tersedia.');
        return;
    }

    try {
        // Ambil data akun dari database Supabase (case-insensitive)
        const { data, error } = await client
            .from('akun_penyewa')
            .select('*')
            .ilike('username', usernameInput);

        if (error) throw error;

        if (!data || data.length === 0) {
            alert('Akun belum terdaftar! Silakan buat akun baru terlebih dahulu dengan mengeklik "Daftar Sekarang" di bawah.');
            return;
        }

        // Cari password yang cocok (case-sensitive)
        const user = data.find(u => u.password === passwordInput);
        if (!user) {
            alert('Password salah! Harap periksa kembali password Anda.');
            return;
        }

        // Login Berhasil
        alert('Login Berhasil! Selamat Datang, ' + user.username);
        localStorage.setItem('namaPenyewa', user.username);
        if (user.username.toLowerCase() === 'abim') {
            localStorage.setItem('namaAdmin', 'abiM');
        } else {
            localStorage.removeItem('namaAdmin');
        }
        window.location.href = 'dashboard_penyewa.html';

    } catch (err) {
        console.error("Gagal verifikasi login via Supabase:", err);
        alert("Gagal terhubung ke database Supabase. Silakan periksa koneksi internet Anda.");
    }
});

// --- 3. Logika Registrasi Akun Baru Murni Supabase ---
linkDaftar.addEventListener('click', async function (e) {
    e.preventDefault();

    const usernameBaru = prompt("=== PENDAFTARAN AKUN PENYEWA ===\n\nMasukkan Username Baru:");
    if (usernameBaru === null) return;
    const usernameClean = usernameBaru.trim();
    if (usernameClean === "") {
        alert("Username tidak boleh kosong!");
        return;
    }

    const passwordBaru = prompt("Masukkan Password:");
    if (passwordBaru === null) return;
    const passwordClean = passwordBaru.trim();
    if (passwordClean === "") {
        alert("Password tidak boleh kosong!");
        return;
    }

    const client = getSupabaseClient();
    if (!client) {
        alert("Koneksi database Supabase tidak tersedia.");
        return;
    }

    try {
        // 1. Cek apakah username sudah ada di Supabase
        const { data: existingUsers, error: checkError } = await client
            .from('akun_penyewa')
            .select('username')
            .ilike('username', usernameClean);

        if (checkError) throw checkError;

        if (existingUsers && existingUsers.length > 0) {
            alert("Username '" + usernameClean + "' sudah terdaftar! Gunakan nama lain.");
            return;
        }

        // 2. Insert akun baru secara langsung ke Supabase
        const { error: insertError } = await client
            .from('akun_penyewa')
            .insert([{ username: usernameClean, password: passwordClean }]);

        if (insertError) throw insertError;

        // 3. Pop-up Sukses & Auto-fill Form Login
        alert("Akun '" + usernameClean + "' berhasil dibuat!\nSilakan login menggunakan username dan password Anda.");
        
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        if (usernameEl) usernameEl.value = usernameClean;
        if (passwordEl) {
            passwordEl.value = "";
            passwordEl.focus();
        }
    } catch (err) {
        console.error("Gagal mendaftar ke Supabase:", err);
        alert("Gagal mendaftar ke server Supabase: " + (err.message || "Terjadi kesalahan jaringan."));
    }
});

// --- 4. Logika Lupa Password Murni Supabase ---
const linkLupa = document.getElementById('link-to-forgot');
if (linkLupa) {
    linkLupa.addEventListener('click', async function (e) {
        e.preventDefault();

        const usernameInput = prompt("=== ATUR ULANG PASSWORD ===\n\nMasukkan Username Anda:");
        if (usernameInput === null) return;
        const usernameClean = usernameInput.trim();
        if (usernameClean === "") {
            alert("Username tidak boleh kosong!");
            return;
        }

        const client = getSupabaseClient();
        if (!client) {
            alert("Koneksi database Supabase tidak tersedia.");
            return;
        }

        try {
            // Cek apakah username terdaftar di Supabase
            const { data, error } = await client
                .from('akun_penyewa')
                .select('*')
                .ilike('username', usernameClean);

            if (error) throw error;

            if (!data || data.length === 0) {
                alert("Username '" + usernameClean + "' tidak ditemukan! Pastikan Anda memasukkan username dengan benar.");
                return;
            }

            // Minta password baru jika ditemukan
            const passwordBaru = prompt("Username ditemukan!\n\nMasukkan Password Baru:");
            if (passwordBaru === null) return;
            const passwordClean = passwordBaru.trim();
            if (passwordClean === "") {
                alert("Password baru tidak boleh kosong!");
                return;
            }

            // Update password langsung di Supabase
            const { error: updateError } = await client
                .from('akun_penyewa')
                .update({ password: passwordClean })
                .ilike('username', usernameClean);

            if (updateError) throw updateError;

            alert("Password untuk akun '" + usernameClean + "' berhasil diubah!\nSilakan login menggunakan password baru Anda.");
        } catch (err) {
            console.error("Gagal reset password di Supabase:", err);
            alert("Gagal memperbarui password di server Supabase: " + (err.message || "Terjadi kesalahan."));
        }
    });
}
