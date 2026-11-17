// Healthcheck container web. Tidak di bawah /api (di production /api milik service Rust).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
