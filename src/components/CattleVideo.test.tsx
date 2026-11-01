import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CattleVideo from "./CattleVideo";

describe("cattle video recovery", () => {
  it("retries an undecodable source with a fresh player", () => {
    render(<CattleVideo src="https://example.test/cow.mp4" />);
    const original = screen.getByLabelText("Animal video");
    fireEvent.error(original);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download video" })).toHaveAttribute("href", "https://example.test/cow.mp4");
    fireEvent.click(screen.getByRole("button", { name: "Retry video" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Animal video")).not.toBe(original);
  });
});