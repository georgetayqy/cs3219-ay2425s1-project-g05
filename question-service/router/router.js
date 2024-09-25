import express from "express";
import { createQuestion, getAllQuestions, getQuestionById, deleteQuestionById, updateQuestionById, getFilteredQuestions, findQuestion, getDistinctCategories } from "../controller/question-controller.js";
import validateQuestion from '../middlewares/validation.js';

const router = express.Router();

// CREATE NEW QUESTION
router.post('/', validateQuestion, createQuestion);
// router.post('/', checkAdmin, validateQuestion, createQuestion);

// GET ALL QUESTIONS
router.route("/").get(getAllQuestions);

// GET QUESTION BY ID
router.route("/id/:id").get(getQuestionById);

// DELETE QUESTION BY ID
router.route("/id/:id").delete(deleteQuestionById);
//router.route("/id/:id").delete(checkAdmin, deleteQuestionById);

// UPDATE QUESTION BY ID
router.route("/id/:id").put(updateQuestionById);
//router.route("/id/:id").put(checkAdmin, updateQuestionById);

// GET ALL QUESTIONS BY CATEGORY & DIFFICULTY (CAN HAVE MULTIPLE/NO CATEGORIES/DIFFICULTIES)
router.route("/filter/").get(getFilteredQuestions);

// GET A RANDOM QUESTION BY CATEGORY &/OR DIFFICULTY (CAN HAVE MULTIPLE/NO CATEGORIES/DIFFICULTIES)
// IF BOTH CATEGORIES & DIFFICULTY ARE PROVIDED, NEED TO SATISFY EITHER ONE OF EACH
router.route("/random/").get(findQuestion);

// GET ALL DISTINCT CATEGORIES
router.route("/categories").get(getDistinctCategories);

 export default router;
