const mongoose = require("mongoose");
const Schema1 = mongoose.Schema;
const Schema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  geofenceId: { type: Schema1.Types.ObjectId, ref: 'geofence',default : null },
  email: { type: String, required: true },
  permissions: [
    {
      parent: {
        type: Boolean,
      },
      name: {
        type: String,
      },
      childs: [
        {
          childName: {
            type: String,
          },
          view: {
            type: Boolean,
            default: false,
          },
          edit: {
            type: Boolean,
            default: false,
          },
          delete: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
  ],
  password: { type: String },
  countryCode: { type: Number },
  phone: { type: Number },
  profilePic: { type: String },
  role: { type: String, default: "subAdmin" },
  authToken: {
    type: String,
    select: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});
let SubAdmin2 = mongoose.model("subAdmin", Schema);

export default SubAdmin2;
