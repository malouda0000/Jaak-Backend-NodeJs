import express from "express";

import Auth from "../../../auth";
import uploads from "../../../services/FileUploadService";
import employeeController from "../../controllers/store/employeeController";
let employeeRepo = new employeeController();

let employeeRoutes = express.Router();

employeeRoutes.post(
  "/signup",
  uploads.subAdminImage.single("profilePic"),
  employeeRepo.createEmployee
);
employeeRoutes.put(
  "/updateEmployee/:id",
  uploads.subAdminImage.single("profilePic"),
  employeeRepo.updateEmployee
);
employeeRoutes.post("/login", employeeRepo.login);
employeeRoutes.get("/orders", employeeRepo.orders);
employeeRoutes.get("/employeeById/:id", employeeRepo.getEmployeeById);
employeeRoutes.delete("/delete/:id", employeeRepo.deleteEmployeeById);

export default employeeRoutes;
