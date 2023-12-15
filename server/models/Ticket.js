import mongoose, { Schema } from "mongoose";
let TicketSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    storeId: { type: mongoose.Types.ObjectId, ref: "Store" },
    winningDate: Date,
    status: Boolean,
  },
  {
    timestamps: true,
  }
);
let Ticket = mongoose.model("Ticket", TicketSchema);

export default Ticket;
