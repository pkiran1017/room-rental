const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDirs = () => {
    const dirs = [
        'uploads',
        'uploads/rooms',
        'uploads/profiles'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Initialize directories
ensureUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/rooms/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `room-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/svg+xml'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, SVG, and ICO images.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: (parseInt(process.env.MAX_IMAGE_SIZE_KB) || 500) * 1024,
        files: parseInt(process.env.MAX_IMAGES_PER_ROOM) || 5
    }
});

// In-memory upload for room images (so we can push to external storage like IMGBB)
const roomUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: (parseInt(process.env.MAX_IMAGE_SIZE_KB) || 500) * 1024,
        files: parseInt(process.env.MAX_IMAGES_PER_ROOM) || 5
    }
});

// Error handling wrapper
const handleUpload = (fieldName, maxCount = 5) => {
    return (req, res, next) => {
        const uploadMiddleware = roomUpload.array(fieldName, maxCount);
        
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: `File too large. Maximum size is ${process.env.MAX_IMAGE_SIZE_KB || 500}KB.`
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: `Too many files. Maximum is ${maxCount} images.`
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Unexpected field name for file upload.'
                    });
                }
            }
            
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            
            next();
        });
    };
};

// Profile image upload
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `profile-${uniqueSuffix}${ext}`);
    }
});

const profileUpload = multer({
    storage: profileStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB for profile images
    }
});

module.exports = {
    upload,
    roomUpload,
    handleUpload,
    profileUpload
};
