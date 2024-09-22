import mongoose from "mongoose";
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    unique: true,
  },
  image: {
    type: Buffer,
  },
  categories: {
    type: [String],
    required: [true, "Topic is required"],
    validate: {
      validator: (value) => {
        return value.length > 0;
      },
      message: "At least one topic is required",
    },
  },
  difficulty: {
    type: String,
    enum: {
      values: ["EASY", "MEDIUM", "HARD"],
      message: "{VALUE} is not a valid difficulty level",
    },
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Question = mongoose.model("Question", questionSchema);
export default Question;
