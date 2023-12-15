import express from "express";
import delivery from "./routes";

const route = express.Router();

route.use("", delivery);

export default route;
