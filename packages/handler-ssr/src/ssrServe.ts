import qs from "querystringify";
import { Context, HandlerPlugin } from "@webiny/handler/types";
import mime from "mime-types";
import { getSsrHtml } from "./functions";
import zlib from "zlib";
import { ClientContext } from "@webiny/handler-client/types";
import { HttpContext } from "@webiny/handler-http/types";

const createSsrResponse = (props, http) => {
    return http.response({
        isBase64Encoded: true,
        headers: {
            "Cache-Control": "no-store",
            "Content-Encoding": "gzip",
            "Content-Type": "text/html"
        },
        ...props
    });
};

export default (options): HandlerPlugin => {
    if (options.cache.enabled) {
        return {
            type: "handler",
            name: "handler-ssr-with-cache",
            async handle(context: Context & ClientContext & HttpContext, next) {
                const { http } = context;
                if (!(http.method == "GET" && !mime.lookup(http.path.base))) {
                    return next();
                }

                const path = http.path.base + "?" + qs.stringify(http.path.query);

                const { SsrCache } = context.models;
                let ssrCache = await SsrCache.findByPath(path);
                if (!ssrCache) {
                    ssrCache = new SsrCache();
                    ssrCache.path = path;
                    await ssrCache.save();
                }

                const version = http.headers["X-Cdn-Deployment-Id"];
                const noCache =
                    http.path.query && typeof http.path.query["ssr-no-cache"] !== undefined;

                if (noCache) {
                    await ssrCache.refresh(version);
                    let buffer = Buffer.from(ssrCache.content);
                    buffer = zlib.gzipSync(buffer);
                    return createSsrResponse(
                        {
                            body: buffer.toString("base64")
                        },
                        http
                    );
                }

                if (ssrCache.isEmpty) {
                    await ssrCache.refresh(version);
                } else {
                    if (ssrCache.isStale(version)) {
                        // On expiration, asynchronously trigger SSR cache refreshing.
                        // This will only increment expiresOn for the "options.cache.staleTtl" seconds, which
                        // is a short duration, enough for the actual refresh to complete, which will again update the
                        // expiration. Default value of "options.cache.staleTtl" is 20 seconds.
                        await ssrCache.incrementExpiresOn().save();

                        await context.handlerClient.invoke({
                            await: false,
                            name: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            payload: {
                                ...http,
                                httpMethod: "POST",
                                body: {
                                    ssr: [
                                        "invalidateSsrCacheByPath",
                                        {
                                            path: ssrCache.path,
                                            refresh: true
                                        }
                                    ]
                                }
                            }
                        });
                    }
                }

                let buffer = Buffer.from(ssrCache.content);
                buffer = zlib.gzipSync(buffer);

                return createSsrResponse(
                    {
                        body: buffer.toString("base64"),
                        headers: {
                            "Cache-Control": "public, max-age=" + ssrCache.expiresIn / 1000,
                            "Content-Encoding": "gzip"
                        }
                    },
                    http
                );
            }
        };
    }

    return {
        type: "handler",
        name: "handler-ssr-no-cache",
        async handle(context: Context & HttpContext, next) {
            const { http } = context;

            if (!(http.method === "GET" && !mime.lookup(http.path.base))) {
                return next();
            }

            const path = http.path + "?" + qs.stringify(http.path.query);
            const body = await getSsrHtml(context, options.ssrFunction, { path });

            let buffer = Buffer.from(body);
            buffer = zlib.gzipSync(buffer);

            return createSsrResponse(
                {
                    body: buffer.toString("base64")
                },
                http
            );
        }
    };
};
