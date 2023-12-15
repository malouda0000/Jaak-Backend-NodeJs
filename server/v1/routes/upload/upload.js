var aws = require('aws-sdk')
const router = require("express").Router();
const uploadService = require("../../../services/upload")
const multer = require("multer");
const multerS3 = require('multer-s3');
aws.config.update({
    secretAccessKey: process.env.SECRETACCESSKEY,
    accessKeyId: process.env.ACCESSKEYS3,
    // region: 'us-east-2',
})
var s3 = new aws.S3();
 
var upload = multer({
  storage: multerS3({
      s3: s3,
      bucket: process.env.BUCKET_NAME,
      acl : "public-read",
      key: function (req, file, cb) {
          console.log(file);
          cb(null, Date.now() + "_" + file.originalname); //use Date.now() for unique file keys
      }
  })
});
 
router.post('/upload', upload.single('file'),uploadService.upload);
router.post('/uploadLink', uploadService.upload_from_url);
router.post('/uploadFiles', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'gallery', maxCount: 8 }
  ]), function (req, res, next) {
      console.log('Uploaded!');
      res.send(req.files);
  });


module.exports = router;
