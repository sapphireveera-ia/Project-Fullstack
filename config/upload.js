// ============================================
// KONFIGURASI MULTER UNTUK UPLOAD FILE
// ============================================
// Mengatur penyimpanan file upload produk
// Mendukung format gambar: jpg, jpeg, png, gif, webp
// On Vercel, uses /tmp (only writable directory in serverless)

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Detect serverless environment
const IS_VERCEL = !!process.env.VERCEL;

// On Vercel, only /tmp is writable; on localhost/Railway, use project uploads/ directory
const uploadBase = IS_VERCEL
    ? '/tmp/uploads'
    : path.join(__dirname, '..', 'uploads');
const uploadDir = path.join(uploadBase, 'products');

// Ensure upload directory exists (create if missing).
try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Upload directory ready at startup:', uploadDir);
} catch (e) {
    console.warn('Could not create upload directory at startup:', e.message);
}

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    // Tentukan folder tujuan upload
    destination: function (req, file, cb) {
        try {
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (e) {
            console.error('FATAL: cannot create/access upload directory:', uploadDir, e.message);
            cb(e);
        }
    },
    // Tentukan nama file (timestamp + nama asli)
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

// Filter hanya menerima file gambar JPG, JPEG, PNG
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.'), false);
    }
};

// Konfigurasi multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // Maksimal 2MB
    }
});

module.exports = upload;
