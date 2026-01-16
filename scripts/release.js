import fs from 'fs-extra';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process'; // Untuk menjalankan 'npm run build'

// --- 1. SETUP PATH ---
// Dapatkan path absolut untuk file dan direktori saat ini
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Tentukan direktori root proyek (satu level di atas folder 'scripts')
const projectRoot = path.resolve(__dirname, '..');

// --- 2. BACA KONFIGURASI ---
// Baca package.json dari root proyek untuk mendapatkan nama dan versi
const packageJsonPath = path.resolve(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const pluginName = packageJson.name;
const pluginVersion = packageJson.version;

// --- 3. TENTUKAN PATH RILIS ---
const releaseDir = path.resolve(projectRoot, 'release');
const outputDir = path.resolve(releaseDir, pluginName); // Folder tujuan: /release/wp-sig
const zipFileName = `${pluginName}-v${pluginVersion}.zip`;
const zipFilePath = path.resolve(projectRoot, zipFileName); // File zip akhir di root

// --- 4. DAFTAR FILE YANG AKAN DIABAIKAN ---
// Semua file atau folder yang ada di daftar ini TIDAK akan disalin ke folder rilis.
const ignoredItems = new Set([
    '.git',
    '.github',
    'node_modules',
    'src',
    'scripts',
    'release', // Folder rilis itu sendiri
    '.gitignore',
    '.env',
    'composer.json',
    'composer.lock',
    'package.json',
    'package-lock.json',
    'tailwind.config.js', // Semua file konfigurasi build
    'postcss.config.js',
    'webpack.config.js',
    'jsconfig.json',
    'components.json',
    'README.md',
    zipFileName, // File zip yang akan kita buat
    'release.js', // Skrip ini sendiri
    '.DS_Store'
]);

/**
 * Fungsi utama untuk menjalankan proses rilis.
 */
async function createRelease() {
    try {
        console.log('--- Memulai Proses Rilis ---');

        // --- LANGKAH 1: MEMBERSIHKAN RILIS SEBELUMNYA ---
        console.log('1/4: Membersihkan folder "release" dan file .zip lama...');
        await fs.remove(releaseDir);
        await fs.remove(zipFilePath);
        console.log('   -> Selesai.');

        // --- LANGKAH 2: MENJALANKAN BUILD REACT ---
        console.log('2/4: Menjalankan "npm run build" untuk kompilasi aset...');
        // Menjalankan 'npm run build' dari direktori root proyek
        execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
        console.log('   -> Selesai.');

        // --- LANGKAH 3: MENYALIN FILE-FILE PLUGIN ---
        console.log('3/4: Menyalin file-file plugin ke folder rilis...');
        // Buat direktori output (contoh: /release/wp-sig)
        await fs.ensureDir(outputDir);
        
        // Baca semua item di direktori root proyek
        const itemsInRoot = await fs.readdir(projectRoot);
        
        // Loop dan salin HANYA item yang tidak ada di dalam daftar ignoredItems
        for (const item of itemsInRoot) {
            if (!ignoredItems.has(item)) {
                const sourcePath = path.resolve(projectRoot, item);
                const destPath = path.resolve(outputDir, item);
                await fs.copy(sourcePath, destPath);
                console.log(`   -> Menyalin: ${item}`);
            }
        }
        console.log('   -> Selesai.');

        // --- LANGKAH 4: MENGKOMPRES FOLDER RILIS MENJADI .ZIP ---
        console.log(`4/4: Membuat file arsip: ${zipFileName}...`);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } }); // Kompresi level tertinggi

        archive.pipe(output);
        // Tambahkan semua file dari dalam 'outputDir' ke root .zip
        archive.directory(outputDir, false);
        await archive.finalize();

        // (Opsional) Hapus folder 'release' setelah di-zip
        await fs.remove(releaseDir);

        console.log('\n--- RILIS BERHASIL! ---');
        console.log(`File rilis Anda siap di: ${zipFilePath}`);

    } catch (err) {
        console.error('\n--- TERJADI ERROR SAAT PROSES RILIS ---');
        console.error(err);
        process.exit(1);
    }
}

// Jalankan fungsi utama
createRelease();