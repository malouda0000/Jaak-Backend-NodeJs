module.exports = (
  amount,
  currency,
  name,
  description,
  id,
  customerName,
  email,
  phoneNumber,
  address,
  KEY_ID,
  orderId
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Page Title</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
     
    </head>
    <body>
      <div
        class="p-btn"
        style="
          text-align: center;
          margin-top: 15px;
          position: absolute;
          left: 0;
          top: 50%;
          right: 0;
          margin: auto;
          width:80%;
          transform: translateY(-50%);
        "
      >
        <div class="vec-img" style="margin-bottom: 26px ;    width: 80%;">
          <img style=" width: 100%" src="https://mangoappnew.s3.ap-south-1.amazonaws.com/image-1622715683715.png" />
        </div>
        <button id="rzp-button1" style="padding: 20px 20px;border-radius: 50px;background: #ff8a74;font-size:16px;color: #ffffff;width: 100%;line-height:normal;display:inline-block;border:unset;">
          Pay Now
        </button>
        <p style="color:#000;font-size:14px;line-height:normal;font-weight:600;margin-top:10px;">Amount to Pay: <span style="display:inline-block;margin-left:5px;">Rs ${amount}</span></p>
      </div>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script >
      var options = {
          "key": "${KEY_ID}",
          "amount": ${amount * 100},
          "currency": "${currency}",
          "name": "${name}",
          "description": "${description}",
          "image": "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
          "order_id": "${id}",
          "callback_url": "https://prod.webdevelopmentsolution.net:3003/razor-success?orderId=${orderId}",
          "prefill": {
              "name": "${customerName}",
              "email": "${email}",
              "contact": "${phoneNumber}"
          },
          "notes": {
              "address": "${address}"
          },
          "theme": {
              "color": "#3399cc"
          }
      };
      var rzp1 = new Razorpay(options);
        
      document.getElementById('rzp-button1').onclick = function(e){
          rzp1.open();
          e.preventDefault();
      }
    </script>

    </body>
  </html>;`
};
