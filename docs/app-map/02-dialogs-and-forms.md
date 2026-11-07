# 02 — Dialogs & forms

> Load khi: thêm/sửa form, Sheet, xác nhận.
covers: src/components/ui/client.tsx, src/app
last_verified: 2026-11-07
ttl_days: 90

Cơ chế: `Sheet` (`<dialog>` bên phải, toàn màn trên mobile) + `ActionForm` (lỗi hiện tại chỗ, toast khi xong). Xác nhận không đảo được dùng `<dialog>` riêng nêu hậu quả.

| Form | Ở màn | Service | AC |
|---|---|---|---|
| Đăng nhập | /dang-nhap | verifyLogin | — |
| Tiếp nhận đàn | S4 | receiveBroodstock | AC-2 |
| Tạo mẻ đẻ · Huỷ mẻ | S5 | createSpawnBatch · cancelSpawnBatch | AC-4 |
| Mở lô ương | S5 | openLot | AC-4, AC-5 |
| Thêm việc · Yêu cầu XN · Chuyển giai đoạn · Thu hoạch | S3 | addManualTask · requestLotTest · advanceStage · harvestLot | AC-12, 13, 24 |
| Xử lý sự cố | S7 | resolveIncident | — |
| Nhập kết quả + Chốt phiếu · Huỷ phiếu | S9 | finalizeTest · voidTest | AC-3, AC-11 |
| Phiếu nhập | S11 | createReceipt | AC-15 |
| Gửi yêu cầu · Cấp phát · Từ chối · Huỷ | S12 | createRequest · issueRequest · rejectRequest · cancelRequest | AC-16 |
| Bắt đầu kiểm kê · Gửi duyệt · Duyệt | S13 | startCount · submitCount · approveCount | AC-18 |
| Kế hoạch: Lưu nháp · Gửi duyệt · Duyệt/Trả lại | S17 | savePlan · submitPlan · reviewPlan | AC-21 |
| Thêm trại · Import bể/vật tư · Cấm vật tư | S15 | createFarm · importTanks · importMaterials · setMaterialBanned | AC-1 |
| Thêm người dùng · Sửa trại · Khoá | S16 | createUser · setUserFarms · setUserActive | — |
| Ghi nhật ký (offline) | M2 | outbox → /api/logs/sync | AC-6..9 |
| Xác nhận cảnh báo | M4, /thong-bao | ackAlert | AC-10 |
