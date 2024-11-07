import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(file); //Debugging

    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {              //Can replace the 'req' with '_'. Cuz we're not using 'req'
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage: storage,
});
