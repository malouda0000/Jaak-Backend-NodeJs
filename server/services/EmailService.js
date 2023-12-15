import dotenv from "dotenv";
dotenv.config();
var ejs = require("ejs");
var fs = require("fs")
// var nodemailer = require("nodemailer");

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID);
const fromMail = process.env.SENDGRIDFROMEMAIL;

// let transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "appdemo5494@gmail.com", // generated ethereal user
//     pass: "Secure@098", // generated ethereal password
//   },
// });

const constants = require("../constant");
module.exports = {
  async mailer(inputs, template) {
    let message = inputs.text
    template = template == true ? true : false
    if (template) {
      let serve
      inputs.data.items.forEach(element => {
        serve += `
        <td class="col-md-6" style="border-right: 1px solid #ddd;">
            <p style="font-size: 14px; color:#0000005e ;">${element.itemId.productName}</p>
            <p style="font-size: 14px; color:#0000005e ;">${element.itemId.name}</p>
            <p style="font-size: 14px; color:#0000005e ;">${element.quantity} </p>
            <p style="font-size: 14px; color:#0000005e ;">${element.totalAmount}</p>
        </td>`
      });
      message = `<!DOCTYPE html5>
      <html>
      
      <head>
          <title>
              Email Template
          </title>
      </head>
      
      <body style="width: 600px;margin: 50px auto;">
          <div style="border-top: 15px solid #000;border-bottom: 15px solid #000;box-shadow: 0 1px 21px #808080;padding: 40px 30px;line-height: 1.42857143;color: #333;font-family: sans-serif;font-size: 14px;">
              <table style="width: 100%;">
                  <tr>
                      <td style="vertical-align: top;">
                          <img class="img" alt="Invoce Template" src="https://apptunix.s3.amazonaws.com/Jaak/1635415928428_1635228799304_jaak.png" style="width: 60px;">
                      </td>
                      <td style="text-align: right;">
                          <p style="font-size: 14px;margin: 0;">${inputs.data.orderNumber}</p>
                          <p style="font-size: 14px;margin-bottom: 0;margin-top: 5px;">Merchant Name</p>
                          <p style="font-size: 14px;margin-bottom: 0;margin-top: 5px;">${inputs.data.storeId.restaurantName}</p>
                      </td>
                  </tr>
              </table>
              <h2 style="text-align: center;margin-bottom: 0px;margin-top: 20px;font-weight: 500;font-size: 30px;">Order Id</h2>
              <p style="text-align: center;margin-top:0px;">${inputs.data.orderNumber}</p>
              <table style="width: 100%;margin-top: 20px;border-collapse: collapse;">
                  <tr>
                      <td colspan="1">
                          <p style="font-weight: bold;margin: 0px;font-size: 14px;padding-bottom: 5px;">Item details</p>
                      </td>
                  </tr>
                  <tr>
                      <td colspan="1">
                          <p style="margin: 0px;font-size: 14px;padding-bottom: 5;">${serve}</p>
                      </td>
                  </tr>
                  <tr>
                      <td colspan="1">
                          <p style="color: #0000005e;font-size: 14px;font-weight: 400;margin: 0px;">Date and Time of Order</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="padding-bottom: 20px;">
                          <p style="margin: 0px;font-size: 14px;">${inputs.data.createdAt}</p>
                      </td>
                      <td style="text-align: right;padding-bottom: 20px;">
                          <h5 style=" background: #fcb03a52;padding: 10px;border-radius: 11px;text-align: center;margin: 0px;width: 100px;display: inline-block;">Delivery</h5>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 2px solid #ddd;padding: 10px 10px;">
                          <h5 style="margin: 0px;font-size: 14px;font-weight: 400;">Payment Method</h5>
                      </td>
                      <td style="text-align: right;border-top: 2px solid #ddd;padding: 10px 10px;">
                          <p style="margin: 0px;font-size: 14px;">${inputs.data.paymentMode}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Customer Detail</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.userId.firstName}</p>
                          <p style="color: #6dc96d;margin: 0px;font-size: 14px;">${inputs.data.userId.email}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Rider Detail</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.driverId ? inputs.data.driverId.firstName : ""}</p>
                          <p style="color: #6dc96d;margin: 0px;font-size: 14px;">${inputs.data.driverId ? inputs.data.driverId.email : ""}</p>
                      </td>
                  </tr>
                  <tr>
                      <td colspan="2">
                          <table style="width: 100%;border-collapse: collapse;">
                              <tr>
                                  <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Product Name</h5>
                                  </td>
                                  <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Item Name</h5>
                                  </td>
                                  <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Quantity</h5>
                                  </td>
                                  <td style="border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Total Amount</h5>
                                  </td>
                              </tr>
                              <tr>
                                  <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <p style="margin: 0px;font-size: 14px;"></p>
                                  </td>
                                  <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <p style="margin: 0px;font-size: 14px;"></p>
                                  </td>
                                  <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <p style="margin: 0px;font-size: 14px;"></p>
                                  </td>
                                  <td style="border-top: 1px solid #ddd;padding: 10px 10px;">
                                      <p style="margin: 0px;font-size: 14px;"></p>
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Delivery Address</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.address.address}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Delivery Notes</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.note}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Store Name</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.storeId.restaurantName}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Rating</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">*</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">service charge:</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.serviceFee}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Delivery charge:</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.deliveryFee}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-right: 1px solid #ddd;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #0000005e;margin: 0px;font-size: 14px;font-weight: 400;">Total cost:</h5>
                      </td>
                      <td style="text-align: right;border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #0000005e;margin: 0px;font-size: 14px;">${inputs.data.totalAmount}</p>
                      </td>
                  </tr>
                  <tr>
                      <td style="border-top: 1px solid #ddd;padding: 10px 10px;">
                          <h5 style="color: #FBB03A;margin: 0px;font-size: 20px;font-weight: 700;">Estimated bill:</h5>
                      </td>
                      <td style="border-top: 1px solid #ddd;padding: 10px 10px;">
                          <p style="color: #FBB03A;margin: 0px;font-size: 20px;font-weight: 700;">${inputs.data.totalAmount}</p>
                      </td>
                  </tr>
              </table>
          </div>
      </body>
      
      </html>`
    }

    let msg = {
      from: fromMail, // sender address
      to: inputs.to,
      subject: inputs.subject, // Subject line
      html: message, // html body
    };

    try {
      const result = await sgMail.send(msg);
      if(result){
        return true;
      }
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendUserVerifyMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Verify Email",
      html: "-",
    };

    let link =
      config.userVerificationUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;

    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }

  },
  sendUserForgotPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Forgot password",
      html: "-",
    };

    let link = config.userForgotUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendUserPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Password",
      html: "-",
    };
    let password = payload.password ? payload.password : "";
    let email = payload.email;

    msg.html = `Your Email is ${email}
    Your Password:${password} 
    And your redirect URL is ${process.env.SALESPERSONURL}`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendStoreVerifyMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Verify Email",
      html: "-",
    };

    let link =
      config.storeVerificationUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendStoreForgotPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Forgot password",
      html: "-",
    };
    let link = config.storeForgotUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendStorePasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Password",
      html: "-",
    };
    let password = payload.password ? payload.password : "";
    let link = payload.link ? payload.link : config.storeUrl;
    msg.html = `Your Password:${password},<br>Login:${link}`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendRestaurantVerifyMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Verify Email",
      html: "-",
    };
    let link =
      config.restaurantVerificationUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendRestaurantForgotPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Forgot password",
      html: "-",
    };
    let link =
      config.restaurantForgotUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendRestaurantPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Password",
      html: "-",
    };
    let password = payload.password ? payload.password : "";
    let link = payload.link ? payload.link : config.restaurantUrl;
    msg.html = `Your Password:${password},<br>Login:${link}`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendAdminForgotPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Forgot password",
      html: "-",
    };
    let link = config.adminForgotUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendDriverForgotPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Forgot password",
      html: "-",
    };
    let link = config.driverForgotUrl + (payload.token ? payload.token : "");
    msg.html = `<a href="${link}">Click here to verify your mail.</a>`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  sendDriverPasswordMail: async (payload) => {
    let msg = {
      from: fromMail,
      to: payload.email ? payload.email : "-",
      subject: process.env.PROJECT_NAME + " - Password",
      html: "-",
    };
    let password = payload.password ? payload.password : "";
    msg.html = `Your Password:${password}`;
    try {
      const result = await sgMail.send(msg);
      return result
    } catch (error) {
      console.error(error, "resulterror");
    }
  },
  test() {
    return new Promise(async(resolve, reject) => {
      const msg = {
        from: fromMail,
        to: "appdemo5494@gmail.com",
        subject: "Rupee Driver - Reset Password",
        html: getTemplate(),
      };
      try {
        const result = await sgMail.send(msg);
        reslove(msg)
        return result
      } catch (error) {
        reject(error);
        console.error(error, "resulterror");
      }
    });
  },
};

function getTemplate() {
  return `<div style="text-align: center; width:100%;table-layout:fixed;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#dfa601;">
    <div style="max-width:600px;margin-top:0;margin-bottom:0;margin-right:auto;margin-left:auto;">
      <table align="center" cellpadding="0" style="border-spacing:0;font-family:'Muli',Arial,sans-serif;color:#2059FE;Margin:0 auto;width:100%;max-width:600px;">
        <tbody>
          <tr>
            <td align="center" class="vervelogoplaceholder" height="143" style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;height:143px;vertical-align:middle;" valign="middle"><span class="sg-image" <a href="trotdrive.com" target="_blank"><img alt="TrotDrive"src="https://trotdrive.com:8002/static/customers/loginlogo.png" width="100"></a></span></td>
          </tr>
          <!-- Start of Email Body-->
          <tr>
            <td class="one-column" style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;background-color:#ffffff;">
              <!--[if gte mso 9]>
                    <center>
                    <table width="80%" cellpadding="20" cellspacing="30"><tr><td valign="top">
                    <![endif]-->
              <table style="border-spacing:0;" width="100%">
                <tbody>
                  <tr>
                    <td align="center" class="inner" style="padding-top:0px;padding-bottom:35px;padding-right:30px;padding-left:30px;" valign="middle"><span class="sg-image" <img alt="Forgot Password" class="banner" height="93" style="border-width: 0px; margin-top: 30px; width: 255px; height: 93px;" width="255"></span></td>
                  </tr>
                 <tr> <td style="color:#000000;font-family:'ClanPro-Book','HelveticaNeue-Light','Helvetica Neue Light',Helvetica,Arial,sans-serif;font-size:28px;line-height:36px;padding-left: 20px;padding-bottom:30px;padding-top:0px;text-align:left">
Hi Mitendra!
</td></tr>
                  <tr>
<td style="color:#595959;font-family:'ClanPro-Book','HelveticaNeue-Light','Helvetica Neue Light',Helvetica,Arial,sans-serif;font-size:16px;line-height:28px;padding-bottom:28px;padding-left: 20px;text-align:left">

<p>Here’s your verification code: 
  <strong>9576</strong></p>

<p>Enter it to finish updating your email address.</p>


</td>
</tr>
                </tbody>
              </table>
              <!--[if (gte mso 9)|(IE)]>
                    </td></tr></table>
                    </center>
                    <![endif]-->
            </td>
          </tr>
          <!-- End of Email Body-->
          <!-- whitespace -->
           <tr  align="center">
    <td style="background:#2059FE;padding-left:5px;"bgcolor="#009fdf">

                    <table style="font-family:sans-serif">

                    <td style="padding-top: 10px">
                      <!--   <table style="border-spacing:0;color:#ffffff;font-family:sans-serif;font-size:14px"> -->


                                <td style="padding:15px;text-align:right">     


                                <a href="#" target="_blank" ><img src="img/fb.png"  width="25" height="25" ></a>&nbsp;
                                <a href="#" target="_blank" ><img src="img/twit.png"  width="25" height="25" ></a>&nbsp;
                                <a href="#" target="_blank" ><img src="img/instagram.png"  width="25" height="25" ></a>&nbsp;
                                <a href="#" target="_blank" ><img src="img/youtube.png"  width="25" height="25" ></a>&nbsp;
                            </td>

                      </table>
                   <!--  </td> -->
              <!-- display:inline-block;-->

    </td>
</tr>
          <!-- whitespace -->
          <tr>
            <td height="25">
              <p style="line-height: 25px; padding: 0 0 0 0; margin: 0 0 0 0;">&nbsp;</p>

              <p>&nbsp;</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:0;padding-bottom:0;padding-right:30px;padding-left:30px;text-align:center;Margin-right:auto;Margin-left:auto;">
              <div style="text-align: center">
                <p style="font-family:'Muli',Arial,sans-serif;Margin:0;text-align:center;Margin-right:auto;Margin-left:auto;font-size:15px;color:#000000;line-height:23px;">Problems or questions? Call us at
                  <nobr><a class="tel" href="tel:045705713" style="color:#000000;text-decoration:none;" target="_blank"><span style="white-space: nowrap">045705713</span></a></nobr>
                </p>

                <p style="font-family:'Muli',Arial,sans-serif;Margin:0;text-align:center;Margin-right:auto;Margin-left:auto;font-size:15px;color:#000000;line-height:23px;">or email <a href="mailto:info@trotdrive.com" style="color:#000000;text-decoration:underline;" target="_blank">info@trotdrive.com</a></p>


                 <p style="font-family:'Muli',Arial,sans-serif;Margin:0;text-align:center;Margin-right:auto;Margin-left:auto;padding-top:10px;padding-bottom:0px;font-size:15px;color:#000000;line-height:23px;">To change your settings or <a href="mailto:info@trotdrive.com" style="color:#000000;text-decoration:underline;" target="_blank">unsubscribe</a> please login to your account, <span style="white-space: nowrap">and modify your notification policy</span>, <span style="white-space: nowrap">You cannot reply directly to this email.</span> </p>
                  <p style="font-family:'Muli',Arial,sans-serif;Margin:0;text-align:center;Margin-right:auto;Margin-left:auto;padding-top:10px;padding-bottom:0px;font-size:15px;color:#000000;line-height:23px;">© Trot Drive Technology Services <span style="white-space: nowrap">Barsha​</span>, <span style="white-space: nowrap">Dubai</span> <span style="white-space: nowrap">UAE</span></p>
              </div>
            </td>
          </tr>
          <!-- whitespace -->
          <tr>
            <td height="40">
              <p style="line-height: 40px; padding: 0 0 0 0; margin: 0 0 0 0;">&nbsp;</p>

              <p>&nbsp;</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
}