import express from "express";
import zone from "./routes"
const route = express.Router();

route.use("", zone);

export default route;
