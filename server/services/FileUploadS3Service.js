import model from "../models/index";
// import multerS3 from 'multer-s3';
// import aws from 'aws-sdk'

// var s3 = new aws.S3({
//     accessKeyId: config.awsS3.accessKeyId,
//     secretAccessKey: config.awsS3.secretAccessKey
// });

// script to change
var perPage = 100;
var temppage = 0;
const s3upload = async () => {
    await model.storeCategory.find().limit(perPage).skip(temppage)
        .then(data => {
            if (data.length) {
                data.map((dat1, j) => {
                    if (dat1.image.length > 0) {
                        let arr = [];
                        for (let i = 0; i < dat1.image.length; i++) {
                            var options = {
                                uri: dat1.image[i],
                                encoding: null
                            };
                            request(options, function (error, response, body) {
                                if (error || response.statusCode !== 200) {
                                    console.log(error, "err")
                                } else {
                                    s3.upload({
                                        ACL: 'public-read',
                                        Bucket: 'realtor2',
                                        Key: Date.now().toString() + 'propertyImage.jpg',
                                        ContentType: 'jpg',
                                        Body: body
                                    }, function (error, image) {
                                        if (error) {
                                            console.log(error, "err")
                                        } else {
                                            arr.push(image.Location);
                                            Property.findOneAndUpdate({ _id: dat1._id }, { 'image': arr }, { new: true })
                                                .then(upda => {
                                                    if (j + 1 == data.length) {
                                                        temppage += perPage;
                                                        s3upload();
                                                    }
                                                })
                                        }
                                    });
                                }
                            });
                        }
                    } else {
                        if (j + 1 == data.length) {
                            temppage += perPage;
                            s3upload();
                        }
                    }
                })
            }
        })
}

module.exports = {
    s3upload: s3upload,
}


