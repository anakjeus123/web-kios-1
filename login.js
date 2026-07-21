// =========================================================
// LOGIKA LOGIN & REGISTRASI PENYEWA VIA SUPABASE
// =========================================================

// Ambil Klien Supabase jika tersedia
function getSupabaseClient() {
    if (typeof getSupabase === 'function') {
        return getSupabase();
    }
    return null;
}

// Inisialisasi akun default jika belum ada di localStorage (fallback)
function inisialisasiAkun() {
    if (!localStorage.getItem('akunPenyewa')) {
        const akunDefault = [
            { username: "wulan", password: "123" }
        ];
        localStorage.setItem('akunPenyewa', JSON.stringify(akunDefault));
    }
}
inisialisasiAkun();

// --- 1. Ambil Elemen dari HTML ---
const loginForm = document.getElementById('login-form');
const linkDaftar = document.getElementById('link-to-register');

// --- 2. Logika Submit Login ---
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    if (!usernameInput || !passwordInput) {
        alert('Harap isi username dan password!');
        return;
    }

    // Cek apakah ini admin (hardcoded lokal tetap didukung)
    if (usernameInput.toLowerCase() === 'abim' && passwordInput === 'admin') {
        alert('Login Admin Berhasil!');
        localStorage.setItem('namaPenyewa', 'abiM');
        localStorage.setItem('namaAdmin', 'abiM');
        window.location.href = 'dashboard_admin.html';
        return;
    }

    const client = getSupabaseClient();
    let akunCocok = null;
    let databaseTerhubung = false;
    let userExist = false;

    if (client) {
        try {
            // Ambil dari database Supabase
            const { data, error } = await client
                .from('akun_penyewa')
                .select('*')
                .ilike('username', usernameInput);
            
            if (error) throw error;
            
            databaseTerhubung = true; // Koneksi ke Supabase berhasil

            if (data && data.length > 0) {
                userExist = true; // Username ditemukan
                // Cari password yang cocok (case-sensitive untuk password)
                const user = data.find(u => u.password === passwordInput);
                if (user) {
                    akunCocok = { username: user.username };
                }
            }
        } catch (err) {
            console.error("Gagal verifikasi login via Supabase, mencoba localStorage:", err);
            databaseTerhubung = false; // Gagalkan koneksi untuk memicu fallback
        }
    }

    // Fallback ke localStorage HANYA JIKA tidak menggunakan Supabase atau koneksi Supabase gagal
    if (!client || (!databaseTerhubung && !akunCocok)) {
        const akunList = JSON.parse(localStorage.getItem('akunPenyewa')) || [];
        const userExistsLocal = akunList.some(a => a.username.toLowerCase() === usernameInput.toLowerCase());
        if (userExistsLocal) {
            userExist = true;
        }
        const localUser = akunList.find(a =>
            a.username.toLowerCase() === usernameInput.toLowerCase() &&
            a.password === passwordInput
        );
        if (localUser) {
            akunCocok = { username: localUser.username };
        }
    }

    if (akunCocok) {
        alert('Login Berhasil! Selamat Datang, ' + akunCocok.username);
        localStorage.setItem('namaPenyewa', akunCocok.username);
        if (akunCocok.username.toLowerCase() === 'abim') {
            localStorage.setItem('namaAdmin', 'abiM');
        } else {
            localStorage.removeItem('namaAdmin');
        }
        window.location.href = 'dashboard_penyewa.html';
    } else {
        if (!userExist) {
            alert('Akun belum terdaftar! Silakan buat akun baru terlebih dahulu dengan mengeklik "Daftar Sekarang" di bawah.');
        } else {
            alert('Password salah! Harap periksa kembali password Anda.');
        }
    }
});

// --- 3. Logika Registrasi Akun Baru ---
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
    let terdaftar = false;

    if (client) {
        try {
            // Cek apakah username sudah ada
            const { data, error } = await client
                .from('akun_penyewa')
                .select('username')
                .ilike('username', usernameClean);
            
            if (error) throw error;
            if (data && data.length > 0) {
                alert("Username '" + usernameClean + "' sudah terdaftar! Gunakan nama lain.");
                return;
            }

            // Insert akun baru ke Supabase
            const { error: insertError } = await client
                .from('akun_penyewa')
                .insert([{ username: usernameClean, password: passwordClean }]);
            
            if (insertError) throw insertError;
            terdaftar = true;
        } catch (err) {
            console.error("Gagal daftar via Supabase:", err);
            alert("Gagal mendaftar ke server Supabase. Silakan coba lagi.");
            return;
        }
    }

    // Selalu simpan ke localStorage juga sebagai cadangan
    const akunList = JSON.parse(localStorage.getItem('akunPenyewa')) || [];
    const sudahAda = akunList.some(a => a.username.toLowerCase() === usernameClean.toLowerCase());
    
    if (!client) {
        if (sudahAda) {
            alert("Username '" + usernameClean + "' sudah terdaftar! Gunakan nama lain.");
            return;
        }
        akunList.push({
            username: usernameClean,
            password: passwordClean
        });
        localStorage.setItem('akunPenyewa', JSON.stringify(akunList));
        terdaftar = true;
    } else {
        // Jika pakai Supabase dan berhasil, kita sync juga ke local storage cadangan
        if (!sudahAda) {
            akunList.push({
                username: usernameClean,
                password: passwordClean
            });
            localStorage.setItem('akunPenyewa', JSON.stringify(akunList));
        }
    }

    if (terdaftar) {
        alert("Akun '" + usernameClean + "' berhasil dibuat!\nSilakan login menggunakan username dan password Anda.");
    }
});

// --- 4. Logika Lupa Password ---
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
        let userDitemukan = false;

        if (client) {
            try {
                const { data, error } = await client
                    .from('akun_penyewa')
                    .select('*')
                    .ilike('username', usernameClean);
                
                if (error) throw error;
                if (data && data.length > 0) {
                    userDitemukan = true;
                }
            } catch (err) {
                console.error("Gagal cek username di Supabase:", err);
            }
        }

        // Cek localStorage jika Supabase tidak aktif atau tidak ditemukan
        const akunList = JSON.parse(localStorage.getItem('akunPenyewa')) || [];
        const indexAkun = akunList.findIndex(a => a.username.toLowerCase() === usernameClean.toLowerCase());
        
        if (!client) {
            userDitemukan = indexAkun !== -1;
        }

        if (!userDitemukan && indexAkun === -1) {
            alert("Username '" + usernameClean + "' tidak ditemukan! Pastikan Anda memasukkan username dengan benar.");
            return;
        }

        // Jika ditemukan, minta password baru
        const passwordBaru = prompt("Username ditemukan!\n\nMasukkan Password Baru:");
        if (passwordBaru === null) return;
        const passwordClean = passwordBaru.trim();
        if (passwordClean === "") {
            alert("Password baru tidak boleh kosong!");
            return;
        }

        let resetBerhasil = false;

        if (client && userDitemukan) {
            try {
                const { error } = await client
                    .from('akun_penyewa')
                    .update({ password: passwordClean })
                    .ilike('username', usernameClean);
                
                if (error) throw error;
                resetBerhasil = true;
            } catch (err) {
                console.error("Gagal update password di Supabase:", err);
                alert("Gagal memperbarui password di server Supabase.");
                return;
            }
        }

        // Update localStorage
        if (indexAkun !== -1) {
            akunList[indexAkun].password = passwordClean;
            localStorage.setItem('akunPenyewa', JSON.stringify(akunList));
            resetBerhasil = true;
        }

        if (resetBerhasil) {
            alert("Password untuk akun '" + usernameClean + "' berhasil diubah!\nSilakan login menggunakan password baru Anda.");
        }
    });
}
