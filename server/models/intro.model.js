import mongoose, { Schema } from "mongoose";

let introScreenSchema = new Schema(
  {
    title : { type : String },
    image : { type: String },
    description : { type: String }
  },
  { timestamps: true,
    toObject: { virtuals: true }, toJSON: { virtuals: true }
    }
);

let IntroScreen = mongoose.model("IntroScreen", introScreenSchema);

export default IntroScreen;
