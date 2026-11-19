import { manifest } from "@/lib/skills";

// Manifest of the agent skills: name, a content hash and the file URLs. `asta-ui skills update` reads it. Built once.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await manifest(), { headers: { "access-control-allow-origin": "*" } });
}
