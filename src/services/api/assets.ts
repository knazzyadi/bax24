// src/services/api/assets.ts
export async function generateSequentialCode(
  typeId: string | null,
  roomId: string
): Promise<string> {
  const params = new URLSearchParams();
  if (typeId) params.append("typeId", typeId);
  if (roomId) params.append("roomId", roomId);
  const res = await fetch(`/api/assets/next-code?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to generate code");
  const data = await res.json();
  return data.code;
}