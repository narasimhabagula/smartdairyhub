import { describe, expect, it } from "vitest";
import { describeDay, isOpenNow, parseOpeningHours, slotsForDate, todayHours } from "@/lib/vetHours";

const hours = { mon: "09:00-13:00,16:00-19:00", tue: "09:00-13:00", sun: "closed" };

describe("parseOpeningHours", () => {
  it("returns null when no usable hours are provided", () => {
    expect(parseOpeningHours(null)).toBeNull();
    expect(parseOpeningHours({})).toBeNull();
    expect(parseOpeningHours({ mon: "whenever" })).toBeNull();
  });

  it("keeps only the days the clinic actually provided", () => {
    const parsed = parseOpeningHours(hours)!;
    expect(parsed.map((d) => d.day)).toEqual(["mon", "tue", "sun"]);
    expect(parsed[0].slots).toHaveLength(2);
    expect(parsed[2].closed).toBe(true);
  });

  it("formats a day for display", () => {
    const parsed = parseOpeningHours(hours)!;
    expect(describeDay(parsed[0])).toBe("9:00 AM – 1:00 PM, 4:00 PM – 7:00 PM");
    expect(describeDay(parsed[2])).toBe("Closed");
  });
});

describe("open now", () => {
  const monday10 = new Date("2026-09-14T10:00:00"); // Monday
  const monday14 = new Date("2026-09-14T14:00:00");
  const wednesday = new Date("2026-09-16T10:00:00");

  it("is open inside a slot and closed between slots", () => {
    const parsed = parseOpeningHours(hours);
    expect(isOpenNow(parsed, monday10)).toBe(true);
    expect(isOpenNow(parsed, monday14)).toBe(false);
  });

  it("is unknown for days without hours", () => {
    const parsed = parseOpeningHours(hours);
    expect(todayHours(parsed, wednesday)).toBeNull();
    expect(isOpenNow(parsed, wednesday)).toBeNull();
  });
});

describe("slotsForDate", () => {
  it("has no slots on a closed day or an unknown day", () => {
    const parsed = parseOpeningHours(hours);
    expect(slotsForDate(parsed, new Date("2026-09-20T09:00:00"))).toEqual([]); // Sunday, closed
    expect(slotsForDate(parsed, new Date("2026-09-16T09:00:00"))).toEqual([]); // Wednesday, unknown
  });

  it("builds 30 minute slots inside clinic hours for a future day", () => {
    const parsed = parseOpeningHours({ mon: "09:00-10:30" });
    const future = new Date();
    future.setDate(future.getDate() + 700);
    while (future.getDay() !== 1) future.setDate(future.getDate() + 1);
    expect(slotsForDate(parsed, future)).toEqual(["09:00", "09:30", "10:00"]);
  });
});
