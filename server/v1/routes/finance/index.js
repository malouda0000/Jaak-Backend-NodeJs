import express from "express";
import finance from "./financeRoutes";

const route = express.Router();

route.use("", finance);

export default route;
