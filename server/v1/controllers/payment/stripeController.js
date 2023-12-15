import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import mongoose from "mongoose";
import multilingualService from "../../../services/multilingualService";
import { number } from "joi";
import { ModelBuildContext } from "twilio/lib/rest/autopilot/v1/assistant/modelBuild";
var axios = require("axios");
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

// module.exports.createToken = (req, res) => {
    
//         var data = {
//             "card[number]": req.body.card_number,
//             "card[exp_month]": req.body.card_exp_month,
//             "card[exp_year]": req.body.card_exp_year,
//             "card[cvc]": req.body.card_cvc
//           };
//           console.log("==data===",data)
//           var config = {
//             method: "post",
//             url: "https://api.stripe.com/v1/tokens",
//             headers: {
//               Username: `${stripeSecretKey}`,
//               "Content-Type": "application/json",
//             },
//             data: data,
//           };
//           axios(config)
//           .then(function (response) {
//             //console.log("success",JSON.stringify(response.data));
//            return res.send({
//               message: "Token created",
//               data: response.data,
//             });
//           })
//           .catch(function (error) {
//             console.log("error", error);
//             return res.send({
//               message: "Token create error",
//               error: error,
//             });
//           });
    
//     }

module.exports = {
 async addCard(req, res){
    try {
        if(!req.body.userId || !req.body.sourceId) return res.send({message:"Please fill all required field"})
        const user = await model.user.findOne({_id: req.body.userId});
        if(!user.customerEntity){
          const customer = await stripe.customers.create({});
          const customerCreate = await model.user.findOneAndUpdate({_id:req.body.userId},{customerEntity: customer},{ new: true })
          var customerId = customerCreate.customerEntity.id;
        } else{
          var customerId = user.customerEntity.id;
        }
        const card = await stripe.customers.createSource(
          customerId, {
          source: req.body.sourceId
        }
        )
        if (card){
          return res.send({
            message:"Card added successfully",
            data:card,
            status:200
          })
        }
    
      } catch (e) {
        console.log(e);
        return res.send({
          message:"Error at add card"+e,
          status:501
        });
      }
},

async getCard(req, res){
  try {
    if(!req.body.userId) return res.send({message:"Please fill all(*) required field"})
    const user = await model.user.findOne({_id: req.body.userId});

    const customerId = user.customerEntity.id;

    const cards = await stripe.customers.listSources(
      customerId,
      { object: 'card', limit: 5 }
    );
    if (cards)
      return res.send({message:"card successfully view",data:cards,status:200})
  } catch (e) {
      console.log(e);
      return res.send({message:"server error"+e,status:501})
  }

},
async payment(req, res){ 
  try{

    if(!req.body.userId || !req.body.sourceId || !req.body.amount || !req.body.currency) return res.send({message:"Please fill all required field"})
    const user = await model.user.findOne({_id: req.body.userId});
    const customerEntityId = user.customerEntity.id
 
  var charge = await stripe.charges.create({
    amount: req.body.amount * 100,
    currency: req.body.currency,
    customer: customerEntityId,
    source: req.body.sourceId,
    description: 'valueTransfer(created for API docs)',
  })
  if(charge){
    return res.send({
      message:"Payment succesfull",
      data:charge,
      status:200
    });
  }
  else{
    return res.send({
      message:"Payment failed",
      status:501
    });
  }
} catch (e) {
  console.log(e);
  return res.send({
    message:"Error at add card"+e,
    status:501
  });
}

}

}