
const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({storage: storage});

const s3Client = new AWS.S3({
    accessKeyId: process.env.ACCESSKEYS3,
    secretAccessKey: process.env.SECRETACCESSKEY,
    // region :'ur region'
});

const uploadParams = {
        Bucket: process.env.BUCKET_NAME, 
        Key: '', // pass key
        Body: null, // pass file body
};


router.post('/api/file/upload', upload.single("file"),(req,res) => {
    const params = uploadParams;

    uploadParams.Key = req.file.originalname;
    uploadParams.Body = req.file.buffer;

    s3Client.upload(params, (err, data) => {
        if (err) {
            res.status(500).json({error:"Error -> " + err});
        }
        res.json({message: 'File uploaded successfully','filename': 
        req.file.originalname, 'location': data.Location});
    });
});

module.exports = router;