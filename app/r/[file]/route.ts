import { registryGet, registryParams } from "@/lib/registry-route";

// shadcn registry items (Radix), static at build time. See lib/registry-route.ts.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = registryParams;
export const GET = registryGet("radix");
