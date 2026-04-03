// const multer = require("multer");
// const path = require("path");
// const fs=require("fs")

// // Define storage for multer
// const multerStorageUser = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "../../files");
//     // Ensure directory exists
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },  
//   filename: (req, file, cb) => {
//     // Construct the filename
//     const filename = `${Date.now()}-${file.originalname}`;
//     req.file = `files/${filename}`;
//     cb(null, filename);
//   },
// });
// const uploadsUser = multer({
//   storage: multerStorageUser,
// });
// // Export the middleware for handling the file upload
// module.exports = uploadsUser.fields([{ name: "file", maxCount: 1 }]);


const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "files");
    // Create the directory if it does not exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

// Define file filter to allow only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
