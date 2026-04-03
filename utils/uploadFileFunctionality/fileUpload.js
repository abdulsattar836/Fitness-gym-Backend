// multer configuration
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getExtensionOfFile,
} = require("../../functions/forFiles/forFiles_functions");

const multerStorageUser = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../files");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    try {
      // console.log(file);
      const fileExtension = getExtensionOfFile(file.originalname);
      const filename = `${Date.now()}.${fileExtension}`;
      cb(null, filename);
    } catch (err) {
      console.error(err);
      cb(err);
    }
  },
});

const uploadsUser = multer({
  storage: multerStorageUser,
});

module.exports = uploadsUser.fields([{ name: "file", maxCount: 100 }]);
