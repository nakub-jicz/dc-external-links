import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

const requestHandler = createRequestHandler(build, "production");

export default {
    async fetch(request, env, ctx) {
        try {
            const loadContext = {
                cloudflare: {
                    env,
                    ctx,
                },
            };

            return await requestHandler(request, loadContext);
        } catch (error) {
            console.error("Worker error:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    },
}; 