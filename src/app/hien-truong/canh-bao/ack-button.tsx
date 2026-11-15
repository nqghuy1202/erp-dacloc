"use client";
import { ActionForm } from "@/components/ui/form";
import { FieldSubmit } from "@/components/field/client";
import { ack } from "./actions";

export function AckButton({ id }: { id: number }) {
  return (
    <ActionForm action={ack}>
      <input type="hidden" name="id" value={id} />
      <FieldSubmit>Xác nhận</FieldSubmit>
    </ActionForm>
  );
}
