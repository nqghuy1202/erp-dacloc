"use client";
import { ActionForm, Submit } from "@/components/ui/client";
import { ack } from "./actions";

export function AckButton({ id }: { id: number }) {
  return (
    <ActionForm action={ack}>
      <input type="hidden" name="id" value={id} />
      <Submit className="min-h-12 w-full">Xác nhận</Submit>
    </ActionForm>
  );
}
