import { describe, expect, it } from "vitest";
import { getSessionColor, SESSION_COLORS } from "./session-colors";

describe("session-colors", () => {
  it("returns the first color for index 0", () => {
    expect(getSessionColor(0)).toBe(SESSION_COLORS[0]);
  });

  it("cycles colors using modulo", () => {
    expect(getSessionColor(SESSION_COLORS.length)).toBe(SESSION_COLORS[0]);
  });

  it("contains 20 valid hex colors", () => {
    expect(SESSION_COLORS).toHaveLength(20);
    SESSION_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it("does not repeat adjacent colors", () => {
    for (let index = 0; index < SESSION_COLORS.length - 1; index++) {
      expect(SESSION_COLORS[index]).not.toBe(SESSION_COLORS[index + 1]);
    }
  });
});
