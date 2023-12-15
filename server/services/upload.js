import multilingualService from "./multilingualService";
var aws = require('aws-sdk')
const request = require("request")
const multer = require("multer");
const multerS3 = require('multer-s3');
aws.config.update({
  secretAccessKey: process.env.SECRETACCESSKEY,
  accessKeyId: process.env.ACCESSKEYS3,
  // region: 'us-east-2',
})
var s3 = new aws.S3();

module.exports.upload = async (req, res, next) => {
  try {
    let lang = req.headers.language || "en";
    if (!req.file) throw new Error("UPLOADING_ERROR");

    // const filePath = "/" + req.file.path.replace(/\/?public\/?/g, "");
    const filePath = req.file;
    const image = filePath.location;

    return res.send({
      message: multilingualService.getResponseMessage(
        "TRUEMSG",
        lang
      ),
      data: image,
      status: true
    });
  } catch (error) {
    next(error);
  }
}

function put_from_url(url, key, callback) {
  request({
    url: url,
    encoding: null
  },async function (err, res, body) {
    if (err)
      return callback(err, res);

    const exists = await s3.headObject({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  }).promise().then(
    () => true,
    err => {
      if (err.code === 'NotFound') {
        s3.putObject({
          Bucket: process.env.BUCKET_NAME,
          Key: key,
          ACL: 'public-read',
          ContentType: res.headers['content-type'],
          ContentLength: res.headers['content-length'],
          Body: body // buffer
        }, callback);
      }
      throw err;
    }
  );
  })
}

module.exports.upload_from_url = async (url) => {
  try {
    let key = url.substring(url.lastIndexOf('/')+1);
    await put_from_url(url, key, function (err, res1) {
      if (err)
        throw err;
      console.log('Uploaded data successfully!', `${process.env.S3URL}${key}`);
      return `${process.env.S3URL}${key}`;
    });
  } catch (error) {
  }
}