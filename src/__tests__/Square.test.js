import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Game from "../components/Game";

it("Next Player Text Renders with Correct Initial State", () => {
  render(<Game />);
  expect(screen.getByText("Next player: X")).toBeInTheDocument();
});
