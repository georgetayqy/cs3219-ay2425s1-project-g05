import { Question } from "./question";

// src/types/attempts.ts
export interface TestCaseResult {
  isPassed: boolean;
  output: string;
  _id: string;
}

export interface UserAttempt {
  _id: string;
  userEmail: string;
  otherUserEmail: string;
  question: Question;
  roomId: string;
  notes: string;
  attemptCode: string;
  testCasesResults: TestCaseResult[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AttemptData {
  attempts: UserAttempt[];
}
