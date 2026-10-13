const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB is generous for a question spreadsheet
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ];
    if (!allowed.includes(file.mimetype) && !file.originalname.match(/\.(csv|xlsx|xls|json)$/i)) {
      return cb(new Error('File must be a .csv, .xls, .xlsx, or .json file.'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
