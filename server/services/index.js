module.exports = {
  HashService: require("./HashService"),
  OtpService: require("./OtpService"),
  JwtService: require("./JwtService"),
  EmailService: require("./EmailService"),
  Notification: require("./PushNotificationService"),
  Handler: require("./errorHandler"),
  db: require("./dbServices"),
  FileUploadS3Service: require("./FileUploadS3Service"),
  RandomService: require("./randomService"),
  uploadS3: require('./uploads3.service'),
  selectOtpServiceAndSend: require('./selectOtpService'),
  upload: require('./upload'),
};