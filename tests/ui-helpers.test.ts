import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { fold, matchRows, searchText } from "@/components/ui/search";
import { readOptions } from "@/components/ui/options";
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

describe("searchText — chữ tìm của dòng bảng tĩnh", () => {
  it("gom children và nhãn label/title (Badge Astryx)", () => {
    const row = createElement("tr", null, createElement("td", null, "ĐBM-01"), createElement("td", null, createElement("x-badge", { label: "Cách ly" })));
    expect(searchText(row)).toContain("ĐBM-01");
    expect(searchText(row)).toContain("Cách ly");
  });
});

describe("readOptions — <option>/<optgroup> → options của Selector", () => {
  it("option rỗng bị khoá đầu tiên thành chữ gợi ý, optgroup thành nhóm", () => {
    const r = readOptions([
      createElement("option", { key: "p", value: "", disabled: true }, "Chọn bể"),
      createElement("optgroup", { key: "g", label: "Trại 1" }, createElement("option", { value: 5 }, "TG1-B05")),
    ]);
    expect(r.placeholder).toBe("Chọn bể");
    expect(r.options).toEqual([{ type: "section", title: "Trại 1", options: [{ value: "5", label: "TG1-B05", disabled: undefined }] }]);
    expect(r.count).toBe(1);
  });
  it("option rỗng KHÔNG khoá (vd 'Tất cả') vẫn chọn được", () => {
    const r = readOptions([createElement("option", { key: "a", value: "" }, "Tất cả"), createElement("option", { key: "b", value: "PL" }, "PL")]);
    expect(r.placeholder).toBe("Tất cả");
    expect(r.options.map((o) => ("value" in o ? o.value : ""))).toEqual(["", "PL"]);
  });
  it("ô bắt buộc: option rỗng chỉ là chữ gợi ý, không chọn được", () => {
    const r = readOptions([createElement("option", { key: "a", value: "" }, "Chọn vai trò"), createElement("option", { key: "b", value: "worker" }, "Công nhân")], true);
    expect(r.placeholder).toBe("Chọn vai trò");
    expect(r.options).toEqual([{ value: "worker", label: "Công nhân", disabled: undefined }]);
  });
});
