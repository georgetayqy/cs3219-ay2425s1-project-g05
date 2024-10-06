
import express from "express";
import { validateAttempt } from "../middlewares/validation.js";
import { createAttempt, deleteAttempt, getAttempt, getUserAttempts, updateAttempt } from "../controller/history-controller.js";

const router = express.Router();

// CREATE NEW ATTEMPT
router.post('/', validateAttempt, createAttempt);

// GET ATTEMPT BASED ON USERID AND ROOMID
router.route("/").get(getAttempt);

// DELETE ATTEMPT BASED ON USERID AND ROOMID
router.route("/:userId/:roomId").delete(deleteAttempt);

// UPDATE ATTEMPT BY ID
router.route("/:userId/:roomId").put(updateAttempt);

// GET ALL ATTEMPTS BY USERID
router.route("/user/:userId").get(getUserAttempts);

 export default router;
