import { Rating } from "@mantine/core";
import { Complexity } from "../../../types/question";

export default function ComplexityDisplay({
  complexity,
}: {
  complexity: Complexity;
}) {
  let rating = 0;
  if (complexity == "easy") {
    rating = 1;
  } else if (complexity == "medium") {
    rating = 2;
  } else if (complexity == "hard") {
    rating = 3;
  }

  return <Rating value={rating} readOnly />;
}
