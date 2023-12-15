const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const inventoryLogSchema = new Schema({
    itemId: { type: Schema.Types.ObjectId, ref: 'storeItemsEcommerce' },
    logs :[{
        itemQuantity : {
            type : Number
        },
        date:{
            type: Date
        },
        updatedBy:{
            type : String,
            enum : ['ADMIN','SUB-ADMIN','MERCHANT'],
            default: "ADMIN"
        }
    }]
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
const productInventoryLogEcommerce = mongoose.model('productInventoryLogEcommerce', inventoryLogSchema);
module.exports = productInventoryLogEcommerce;