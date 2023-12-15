import mongoose, { Schema } from "mongoose";
let SeoSchema = new Schema(
  {
    seo: { type: String, def :"SEO or Search Engine Optimisation is the process which attempts to improve the search engine ranking.Google display those search result for the customer queries which are relevant and authoritative.SEO helps in increasing the quality and the quantity of the traffic to the website." },
    socialMediaImage: { type: String, def :"" },
    socialMediaPageTitle: { type: String, def :"" },
    socialMediaPageDescription: { type: String, def :"" },
    googleTagManagerKey: { type: String, def :"" },
    googleSiteVerificationId: { type: String, def :"" },
    playStoreId: { type: String, def :"" },
    appStoreId: { type: String, def :"" },
  },
  {
    timestamps: true,
  }
);
let Seo = mongoose.model("Seo", SeoSchema);

export default Seo;
