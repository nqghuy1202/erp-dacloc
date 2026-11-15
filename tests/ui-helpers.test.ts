import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { fold, matchRows } from "@/components/ui/search";
import { textOf } from "@/components/ui/text";

describe("fold — tìm không dấu", () => {
  it("bỏ dấu tiếng Việt và đ/Đ, chữ thường", () => {
    expect(fold("Lô Ương Đắc Lộc")).toBe("lo uong dac loc");
  });
});

describe("matchRows — lọc bảng phía trình duyệt", () => {
  const rows = [
    { id: "1", cells: {}, search: "L-TG1-B04-0013 TG1-B04 Trại giống 1 PL14" },
    { id: "2", cells: {}, search: "L-TG2-B13-0110 TG2-B13 Trại giống 2 PL12" },
    { id: "3", cells: {} },
  ];
  it("từ khoá rỗng trả nguyên danh sách", () => expect(matchRows(rows, "  ")).toHaveLength(3));
  it("khớp không dấu, mọi từ phải có", () => {
    expect(matchRows(rows, "trai giong 2").map((r) => r.id)).toEqual(["2"]);
    expect(matchRows(rows, "tg1 pl14").map((r) => r.id)).toEqual(["1"]);
  });
  it("không khớp → rỗng; dòng thiếu chữ tìm không bao giờ khớp", () => {
    expect(matchRows(rows, "zzz")).toEqual([]);
  });
});

describe("textOf — nhãn trợ năng cho nút Astryx", () => {
  it("lấy chữ từ chuỗi, số, mảng và phần tử lồng; bỏ icon", () => {
    const icon = createElement("svg", { "aria-hidden": true });
    expect(textOf(["Mở lô ", 2, icon])).toBe("Mở lô 2");
    expect(textOf(createElement("span", null, "Ghi việc ", createElement("b", null, "B-03")))).toBe("Ghi việc B-03");
    expect(textOf(null)).toBe("");
  });
});
