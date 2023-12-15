const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const FaqSchema = new Schema(
    {
        isDeleted: {
            type: Boolean,
            default: false
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        answer: {
            type: String,
            default: ""
        },
        question: {
            type: String,
            default: ""
        },
    },
    {
        timestamps: true,
    }
);

let Faq = mongoose.model('Faq', FaqSchema)
export default Faq;