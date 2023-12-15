const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const { extname } = require('path');


const bucketName = process.env.BUCKET_NAME

aws.config.update({
    secretAccessKey: "M5IASW/h6y0xWcM26VJvaH3gdP38wgZ3j3aDeW0x",
    accessKeyId: "AKIAYORYWNANNREFRB5G",
    // region: 'us-east-2',
})


const s3 = new aws.S3();


const storage = multerS3({
    s3,
    bucket: "blockcart",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function(_req, _file, cb ){
        cb(null, Object.assign({}, 'metadata'));
    },
    key( _req, file, cb){
        cb(null,/* Date.now()  +*/ file.originalname /*+ extname(file.originalname)*/,file.originalname)
    },
    acl: 'public-read'
});


const upload = multer({
    storage,
    limits:{
        fileSize: 125 * 1024 * 1024
    }
});

    

    

module.exports = {
    upload
}
