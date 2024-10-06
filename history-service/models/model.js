import mongoose from "mongoose";
const Schema = mongoose.Schema;

const testCaseResultSchema = new Schema({
    isPassed: {
        type: Boolean,
        required: [true, "isPassed is required"],
    },
    output: {
        type: String,
        required: function() {
            // Output is required if isPassed is true
            return this.isPassed === true;
        },
    },
    error: {
        type: String,
        required: function() {
            // Output is required if isPassed is false
            return this.isPassed === false;
        },
    },
});

const attemptSchema = new Schema({
    userId: {
        type: String,
        required: [true, "User ID is required"],
    },
    
    otherUserId: {
        type: String,
        required: [true, "Other user ID is required"],
    },
    questionId: {
        type: String,
        required: [true, "Question ID is required"],
    },
    roomId: {
        type: String,
        required: [true, "Room ID is required"],
    },
    notes: {
        type: String,
        required: [true, "Notes is required"],
    },
    attemptCode: {
        type: String,
        required: [true, "Attempt code is required"],
    },
    testCasesResults: {
        type: [testCaseResultSchema],
        required: [true, "Test cases results are required"],
        validate: {
            validator: (value) => {
                return value.length > 0;
            },
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    }
});

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt;
