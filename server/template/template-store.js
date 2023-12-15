let BASEURL = process.env.BASE_URL;
module.exports = {
    forgotPassword: async (payload) => {
        return new Promise((done, reject) => {
            const html = `<!DOCTYPE html>
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1">
  </head>
  
      
<body>
<table align="center" bgcolor="#EAECED" border="0" cellpadding="0" cellspacing="0" style="margin: 0px auto; width:600px;background: #FF5858; display: block;
            padding:20px 20px;box-shadow: 0 1px 6px 0 rgba(32, 33, 36, .28); font-family: Arial, Helvetica, sans-serif;">
    <tbody>
        <tr style="width: 100%;display: inline-block;text-align: center;">
            <td style=" color:#fff; font-size: 16px; font-weight: 600; padding: 10px 0px; width: 100%; display: inline-block; text-align: center;">
                <a href="${BASEURL}/v1/admin/panel/verifyStore?code=${payload.token}" style="color: #fff; text-decoration: underline;"> Click here </a>
            </td>
            <td style="color: #FFF; font-size: 16px; font-weight: 400; margin: 0px 0px; width: 100%; display: inline-block; ">
                <p style="margin: 0px;"> If you did not request a password reset, you can safely ignore this email. Only a person with access to your email can reset your account password.</p>
            </td>
        </tr>
    </tbody>
</table>
</div>
</body>

      
      </html>`;
            return done(html);
        });
    },
};

