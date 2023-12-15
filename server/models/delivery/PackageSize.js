import mongoose, { Schema } from "mongoose";

let PackageSizeSchema = new Schema({
    name: { type: String, required: true },
    weight: { type: Number, required: true},
    size: { type: String, required: true },
    height: { type: Number, required: true}
}, { timestamps: true });

PackageSizeSchema.methods.validateName = async function () {
    let count = await this.model("PackageSize").count({ name: this.name });
    if (count) { return "Package size already used"; }
    else { return false; }
};
let PackageSize = mongoose.model("PackageSize", PackageSizeSchema);
export default PackageSize;