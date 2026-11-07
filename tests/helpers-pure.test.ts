import { describe, expect, it } from "vitest";
import { alertShort, dayDiff, lotProgress } from "@/server/queries-production";
import { parseCsv } from "@/server/catalog";
import { addDays, makeCode, ymd } from "@/server/util";
import { fmtCompact, translator } from "@/lib/i18n";

describe("tiện ích thuần", () => {
  it("dayDiff / addDays", () => {
    expect(dayDiff("2026-11-01", "2026-11-08")).toBe(7);
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
  it("ymd theo giờ Việt Nam", () => {
    expect(ymd(new Date("2026-11-07T18:30:00Z"))).toBe("2026-11-08");
  });
  it("lotProgress tính ngày tuổi và ngày còn lại", () => {
    const p = lotProgress({ stockedAt: new Date("2026-10-17T01:00:00Z"), expectedHarvestAt: "2026-11-08" }, new Date("2026-11-07T03:00:00Z"));
    expect(p).toMatchObject({ day: 22, total: 22, left: 1 });
  });
  it("alertShort lấy phần đầu tiêu đề", () => {
    expect(alertShort("PH 9,1 · bể TG1-B05")).toBe("pH 9,1");
  });
  it("parseCsv đọc dấu phẩy, chấm phẩy, ngoặc kép, BOM", () => {
    expect(parseCsv("﻿a,b\n1,\"x,y\"\n")).toEqual([["a", "b"], ["1", "x,y"]]);
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("makeCode đúng dạng", () => {
    expect(makeCode("PN", new Date("2026-11-07T00:00:00Z"))).toMatch(/^PN-2611-[A-Z2-9]{4}$/);
  });
  it("i18n: khoá thiếu ở en rơi về vi; số rút gọn theo locale", () => {
    expect(translator("en")("ov.title")).toBe("Hatchery overview");
    expect(fmtCompact("vi", 3_500_000)).toBe("3,5 tr");
    expect(fmtCompact("en", 3_500_000)).toBe("3.5 M");
  });
});
