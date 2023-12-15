const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const LanguageSchema = new Schema(
    {   
        languageFor: {
            type: String,
            enum : ["ADMIN", "MERCHANT", "DRIVERAPP","CUSTOMERAPP", "BACKEND"]
        },
        languageName: {
            type: String,
        },
        language: [{
            key:{type: String},
            value:{type: String}
        }],
        image: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true,
    }
);

let Language = mongoose.model('Language', LanguageSchema)
export default Language;