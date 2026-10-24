// Standalone Cloudflare entry point: static assets bypass the Worker entirely.
// The game, private projections and D1 operations use the existing shared API.
import { GET, POST } from "../app/api/multiplayer/route";

const worker = {
  async fetch(request: Request): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/health" && request.method === "GET") {
      return Response.json({ service: "le-pire-date", status: "ok" }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (pathname !== "/api/multiplayer") return new Response("Not found", { status: 404 });
    if (request.method === "GET") return GET(request);
    if (request.method === "POST") return POST(request);
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
  },
};

export default worker;
