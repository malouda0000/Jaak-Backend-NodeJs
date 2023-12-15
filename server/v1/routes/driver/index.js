import express from "express";
import driver from "./driverRoutes";

const route = express.Router();

route.use("", driver);

export default route;
