import { describe, it, expect } from "vitest";
import {
  parseTimestampToSeconds,
  formatSecondsAsTimestamp,
  clampTimestamp,
} from "@/lib/utils/time";

describe("parseTimestampToSeconds", () => {
  describe("plain number input", () => {
    it("parses '83' to 83", () => {
      expect(parseTimestampToSeconds("83")).toBe(83);
    });

    it("parses '0' to 0", () => {
      expect(parseTimestampToSeconds("0")).toBe(0);
    });

    it("parses '3600' to 3600", () => {
      expect(parseTimestampToSeconds("3600")).toBe(3600);
    });
  });

  describe("MM:SS format", () => {
    it("parses '1:23' to 83", () => {
      expect(parseTimestampToSeconds("1:23")).toBe(83);
    });

    it("parses '01:23' to 83", () => {
      expect(parseTimestampToSeconds("01:23")).toBe(83);
    });

    it("parses '0:00' to 0", () => {
      expect(parseTimestampToSeconds("0:00")).toBe(0);
    });

    it("parses '59:59' to 3599", () => {
      expect(parseTimestampToSeconds("59:59")).toBe(3599);
    });
  });

  describe("H:MM:SS format", () => {
    it("parses '1:02:15' to 3735", () => {
      expect(parseTimestampToSeconds("1:02:15")).toBe(3735);
    });

    it("parses '0:01:00' to 60", () => {
      expect(parseTimestampToSeconds("0:01:00")).toBe(60);
    });

    it("parses '2:00:00' to 7200", () => {
      expect(parseTimestampToSeconds("2:00:00")).toBe(7200);
    });
  });

  describe("invalid input", () => {
    it("returns null for empty string", () => {
      expect(parseTimestampToSeconds("")).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(parseTimestampToSeconds("   ")).toBeNull();
    });

    it("returns null for alphabetic strings", () => {
      expect(parseTimestampToSeconds("abc")).toBeNull();
    });

    it("returns null for seconds >= 60 in MM:SS", () => {
      expect(parseTimestampToSeconds("1:60")).toBeNull();
    });

    it("returns null for seconds >= 60 in H:MM:SS", () => {
      expect(parseTimestampToSeconds("1:00:60")).toBeNull();
    });

    it("returns null for minutes >= 60 in H:MM:SS", () => {
      expect(parseTimestampToSeconds("1:60:00")).toBeNull();
    });

    it("returns null for four-part timestamps", () => {
      expect(parseTimestampToSeconds("1:00:00:00")).toBeNull();
    });

    it("returns null for negative plain number", () => {
      expect(parseTimestampToSeconds("-5")).toBeNull();
    });
  });
});

describe("formatSecondsAsTimestamp", () => {
  describe("under 1 hour — MM:SS format", () => {
    it("formats 0 as '00:00'", () => {
      expect(formatSecondsAsTimestamp(0)).toBe("00:00");
    });

    it("formats 83 as '01:23'", () => {
      expect(formatSecondsAsTimestamp(83)).toBe("01:23");
    });

    it("formats 3599 as '59:59'", () => {
      expect(formatSecondsAsTimestamp(3599)).toBe("59:59");
    });

    it("formats 60 as '01:00'", () => {
      expect(formatSecondsAsTimestamp(60)).toBe("01:00");
    });
  });

  describe("1 hour or more — H:MM:SS format", () => {
    it("formats 3600 as '1:00:00'", () => {
      expect(formatSecondsAsTimestamp(3600)).toBe("1:00:00");
    });

    it("formats 3735 as '1:02:15'", () => {
      expect(formatSecondsAsTimestamp(3735)).toBe("1:02:15");
    });

    it("formats 7200 as '2:00:00'", () => {
      expect(formatSecondsAsTimestamp(7200)).toBe("2:00:00");
    });
  });

  describe("edge cases", () => {
    it("floors fractional seconds", () => {
      expect(formatSecondsAsTimestamp(83.9)).toBe("01:23");
    });

    it("clamps negative input to 0", () => {
      expect(formatSecondsAsTimestamp(-10)).toBe("00:00");
    });
  });
});

describe("clampTimestamp", () => {
  it("returns the value unchanged when within range", () => {
    expect(clampTimestamp(60, 120)).toBe(60);
  });

  it("clamps to duration when value exceeds it", () => {
    expect(clampTimestamp(200, 120)).toBe(120);
  });

  it("clamps negative values to 0", () => {
    expect(clampTimestamp(-10, 120)).toBe(0);
  });

  it("clamps to 0 with no duration given", () => {
    expect(clampTimestamp(-5)).toBe(0);
  });

  it("does not clamp beyond 0 when duration is null", () => {
    expect(clampTimestamp(9999, null)).toBe(9999);
  });

  it("does not clamp when duration is undefined", () => {
    expect(clampTimestamp(9999, undefined)).toBe(9999);
  });
});
