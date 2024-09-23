import Question from "../model/model.js";

const createQuestion = async (question) => {
  const newQuestion = new Question(question);
  newQuestion.difficulty = question.difficulty.toUpperCase();
  newQuestion.categories = question.categories.map((category) =>
    category.replace(/\s+/g, "_").toUpperCase()
  );

  return newQuestion.save();
};

const getAllQuestions = async () => {
  return Question.find({ isDeleted: false });
};

const getQuestionById = async (id) => {
  return Question.findById(id);
};

const deleteQuestionById = async (id) => {
  // soft delete
  return Question.findByIdAndUpdate(id, { isDeleted: true });
};

const updateQuestionById = async (id, question) => {
    if (question.difficulty) {
        question.difficulty = question.difficulty.toUpperCase();
    }
    if (question.categories) {
        question.categories = question.categories.map((category) =>
            category.replace(/\s+/g, "_").toUpperCase()
        );
    }
  return Question.findByIdAndUpdate(id, question, { new: true });
};

const getFilteredQuestions = async (query) => {
  const { categories, difficulty } = query;
  let filter = { isDeleted: false };
  if (categories) {
    filter.categories = {
      $in: categories.split(",").map((category) => category.toUpperCase()),
    };
  }
  if (difficulty) {
    filter.difficulty = {
      $in: difficulty.split(",").map((difficulty) => difficulty.toUpperCase()),
    };
  }
  return Question.find(filter);
};

const getQuestionsByDescription = async (description) => {
  return Question.find({ description: description, isDeleted: false });
};

const getQuestionsByTitleAndDifficulty = async (title, difficulty) => {
  return Question.find({
    title: title,
    difficulty: difficulty.toUpperCase(),
    isDeleted: false,
  });
};

export {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  updateQuestionById,
  getFilteredQuestions,
  getQuestionsByDescription,
  getQuestionsByTitleAndDifficulty,
};
