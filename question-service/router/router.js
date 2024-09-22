import express from "express";
import { createQuestion, getAllQuestions, getQuestionById, deleteQuestionById, updateQuestionById, getFilteredQuestions, findQuestion } from "../manager/questionManager.js";
import validateQuestion from '../middlewares/validation.js';

const router = express.Router();

// CREATE NEW QUESTION
router.post('/', validateQuestion, createQuestion);

// GET ALL QUESTIONS
router.route("/").get(getAllQuestions);

// GET QUESTION BY ID
router.route("/id/:id").get(getQuestionById);

// DELETE QUESTION BY ID
router.route("/id/:id").delete(deleteQuestionById);

// UPDATE QUESTION BY ID
router.route("/id/:id").put(updateQuestionById);

// GET ALL QUESTIONS BY CATEGORY & DIFFICULTY (CAN HAVE MULTIPLE/NO CATEGORIES/DIFFICULTIES)
router.route("/filter/").get(getFilteredQuestions);

// GET A RANDOM QUESTION BY CATEGORY &/OR DIFFICULTY (CAN HAVE MULTIPLE/NO CATEGORIES/DIFFICULTIES)
// IF BOTH CATEGORIES & DIFFICULTY ARE PROVIDED, NEED TO SATISFY EITHER ONE OF EACH
router.route("/random/").get(findQuestion);

 export default router;
