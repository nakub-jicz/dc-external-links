import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

export default {
    async fetch(request, env, ctx) {
        try {
            const loadContext = {
                cloudflare: {
                    env,
                    ctx,
                },
            };

            const handler = createRequestHandler(build, "production");
            return await handler(request, loadContext);
        } catch (error) {
            console.error("Worker error:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    },
}; 