import Joi from "joi";
import BadRequestError from "../../question-service/errors/BadRequestError.js";

const joiAttemptSchema = Joi.object({
  userEmail: Joi.string().trim().min(1).required().messages({
    "string.empty": "User's email cannot be empty",
    "string.min": "User's email must be at least 1 character long",
    "any.required": "User's email is required",
  }),
  otherUserEmail: Joi.string().trim().min(1).required().messages({
    "string.empty": "Other User's email cannot be empty",
    "string.min": "Other User's email must be at least 1 character long",
    "any.required": "Other User's email is required",
  }),
  questionId: Joi.string().trim().min(1).required().messages({
    "string.empty": "Question ID cannot be empty",
    "string.min": "Question ID must be at least 1 character long",
    "any.required": "Question ID is required",
  }),
  roomId: Joi.string().trim().min(1).required().messages({
    "string.empty": "Room ID cannot be empty",
    "string.min": "Room ID must be at least 1 character long",
    "any.required": "Room ID is required",
  }),
  notes: Joi.string().allow("").required().messages({
    "any.required": "Notes is required",
  }),
  attemptCode: Joi.string().allow("").required().messages({
    "any.required": "Code is required",
  }),
  testCasesResults: Joi.array()
    .items(
      Joi.object({
        isPassed: Joi.boolean().required().messages({
          "any.required": "isPassed is required",
        }),
        output: Joi.string().when("isPassed", {
          is: true,
          then: Joi.string().required().messages({
            "any.required": "Output is required",
          }),
        }),
        error: Joi.string().when("isPassed", {
          is: false,
          then: Joi.string().required().messages({
            "any.required": "Error is required",
          }),
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Test cases results must be an array",
      "array.min": "At least one test case result is required",
      "any.required": "Test cases results are required",
    }),
}).custom((value, helpers) => {
  // Check if userId and otherUserId are the same
  if (value.userEmail === value.otherUserEmail) {
    return helpers.message("UserEmail and otherUserEmail cannot be the same.");
  }
  return value;
}, "Custom validation for userId and otherUserId");

const validateAttempt = (req, res, next) => {
  const { error } = joiAttemptSchema.validate(req.body);
  if (error) {
    throw new BadRequestError(error.details[0].message);
  }
  next();
};

export { validateAttempt };
