export async function generateSequentialCodesForTypes(typeIds: string[]): Promise<string[]> {
  // Option 1: Sequential calls (safe but slower)
  const codes: string[] = [];
  for (const typeId of typeIds) {
    const res = await fetch(`/api/assets/next-code?typeId=${typeId}`);
    const data = await res.json();
    codes.push(data.code);
  }
  return codes;
}