import Joi from "joi";
const joiQuestionSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.object().required(),
    image: Joi.string().optional(),
    categories: Joi.array().items(Joi.string()).min(1).required(),
    difficulty: Joi.string().valid('HARD', 'MEDIUM', 'EASY').required(),
    isDeleted: Joi.boolean().default(false)
  });

  // VALIDATION MIDDLEWARE
  const validateQuestion = (req, res, next) => {
    const questionToCreate = req.body;
    questionToCreate.difficulty = questionToCreate.difficulty.toUpperCase();
    const { error } = joiQuestionSchema.validate(req.body);
    
    if (error) {
      error.isJoi = true; 
      return next(error); 
    }
    
    next(); 
  };
  
  export default validateQuestion;