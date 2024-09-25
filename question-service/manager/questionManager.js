import {
  ormCreateQuestion as _createQuestion,
  ormGetAllQuestions as _getAllQuestions,
  ormGetQuestionById as _getQuestionById,
  ormDeleteQuestionById as _deleteQuestionById,
  ormUpdateQuestionById as _updateQuestionById,
  ormGetFilteredQuestions as _getFilteredQuestions,
  ormFindQuestion as _findQuestion,
  ormGetQuestionsByDescription as _getQuestionsByDescription,
  ormGetQuestionsByTitleAndDifficulty as _getQuestionByTitleAndDifficulty,
  ormGetDistinctCategories as _getDistinctCategories,
} from "../orm/orm.js";

const createQuestion = async (req, res) => {
  try {
    // CHECK WHETHER QUESTION WITH THE SAME DESCRIPTION ALREADY EXISTS
    const duplicateDescriptionQuestions = await _getQuestionsByDescription(
      req.body.description
    );

    if (duplicateDescriptionQuestions.length > 0) {
      return res
        .status(409)
        .json({ message: "A question with this description already exists" });
    }

    // CHECK WHETHER QUESTION WITH THE SAME TITLE AND DIFFICULTY ALREADY EXISTS (ONLY CHECK NOT DELETED ONES)
    const duplicateTitleAndDifficultyQuestions =
      await _getQuestionByTitleAndDifficulty(
        req.body.title,
        req.body.difficulty
      );

    if (duplicateTitleAndDifficultyQuestions.length > 0) {
      return res
        .status(409)
        .json({
          message: "A question with such title and difficulty already exists",
        });
    }

    const question = await _createQuestion(req.body);
    return res.status(201).json({ data: question });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Database failure when creating new Question!" });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const questions = await _getAllQuestions(req.query);
    return res.json({ data: questions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error retrieving questions!" });
  }
};

const getQuestionById = async (req, res) => {
  const { id } = req.params;

  try {
    const question = await _getQuestionById(id);

    if (!question) {
      return res.status(404).json({ message: "Question not found!" });
    }
    return res.json({ data: question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error retrieving question!" });
  }
};

const deleteQuestionById = async (req, res) => {
  const { id } = req.params;

  try {
    const questionToDelete = await _getQuestionById(id);
    if (!questionToDelete) {
      return res.status(404).json({ message: "Question not found!" });
    }

    const result = await _deleteQuestionById(id);

    if (!result) {
      return res.status(404).json({ message: "Question not found!" });
    }
    return res.status(200).json({ message: "Question deleted!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error deleting question!" });
  }
};

const updateQuestionById = async (req, res) => {
  const { id } = req.params;

  try {
    // CHECK WHETHER QUESTION TO UPDATE EXISTS
    const questionToUpdate = await _getQuestionById(id);

    if (!questionToUpdate) {
      return res.status(404).json({ message: "Question not found" });
    }
    // CHECK WHETHER UPDATED QUESTION HAS THE SAME DESCRIPTION AS ANOTHER QUESTION
    if (req.body.description) {
      const duplicateDescriptionQuestions = await _getQuestionsByDescription(
        req.body.description
      );
      // can have the same description as current question
      if (duplicateDescriptionQuestions.length > 1) {
        return res
          .status(409)
          .json({ message: "A question with this description already exists" });
      }
    }
    // CHECK WHETHER UPDATED QUESTION HAS THE SAME TITLE AND DIFFICULTY LEVEL AS ANOTHER QUESTION
    if (req.body.title || req.body.difficulty) {
      const titleToCheck = req.body.title
        ? req.body.title
        : questionToUpdate.title;
      const difficultyToCheck = req.body.difficulty
        ? req.body.difficulty
        : questionToUpdate.difficulty;
      const duplicateTitleQuestions = await _getQuestionByTitleAndDifficulty(
        titleToCheck,
        difficultyToCheck
      );
      if (duplicateTitleQuestions.length > 1) {
        return res
          .status(409)
          .json({
            message: "A question with such title and difficulty already exists",
          });
      }
    }

    const updatedQuestion = await _updateQuestionById(id, req.body);

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found!" });
    }

    return res.json({ data: updatedQuestion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating question!" });
  }
};

const getFilteredQuestions = async (req, res) => {
  try {

    if (req.body.categories) {
      if (!Array.isArray(req.body.categories)) {
        return res.status(400).json({ message: "Categories should be an array" });
      }
    }
    if (req.body.difficulty) {
      if (!Array.isArray(req.body.difficulty)) {
        return res.status(400).json({ message: "Difficulties should be an array" });
      }
    }
    const filteredQuestions = await _getFilteredQuestions(req.body);


    return res.json({ data: filteredQuestions });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error retrieving filtered questions!" });
  }
};

const findQuestion = async (req, res) => {
  try {
    const foundQuestions = await _findQuestion(req.query);

    return res.json({ data: foundQuestions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error finding questions!" });
  }
};

const getDistinctCategories = async (req, res) => {
  try {
    const distinctCategories = await _getDistinctCategories();
    return res.json({ data: distinctCategories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error retrieving categories!" });
  }
}

export {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  updateQuestionById,
  getFilteredQuestions,
  findQuestion,
  getDistinctCategories
};
