const ORIGIN = "https://archlab.80.241.216.211.sslip.io";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const headers = new Headers();
      for (const name of [
        "accept",
        "content-type",
        "origin",
        "sec-fetch-site",
        "range",
      ]) {
        if (request.headers.has(name))
          headers.set(name, request.headers.get(name));
      }
      if (env.ORIGIN_PROXY_SECRET) {
        headers.set("x-archlab-proxy-token", env.ORIGIN_PROXY_SECRET);
        const ip = request.headers.get("CF-Connecting-IP");
        if (ip) headers.set("x-archlab-client-ip", ip);
      }
      const session = (request.headers.get("cookie") || "")
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("archlab_session="));
      if (session) headers.set("cookie", session);
      try {
        const response = await fetch(ORIGIN + url.pathname + url.search, {
          method: request.method,
          headers,
          body: ["GET", "HEAD"].includes(request.method)
            ? undefined
            : request.body,
          redirect: "manual",
        });
        const result = new Response(response.body, response);
        result.headers.set("Cache-Control", "no-store");
        return result;
      } catch {
        return Response.json(
          { message: "ARCHLAB server is temporarily unavailable" },
          { status: 502 },
        );
      }
    }
    let assetRequest = request;
    if (
      ["GET", "HEAD"].includes(request.method) &&
      request.headers.get("accept")?.includes("text/html")
    ) {
      const index = new URL(request.url);
      index.pathname = "/";
      index.search = "";
      assetRequest = new Request(index, request);
    }
    const response = await env.ASSETS.fetch(assetRequest);
    const result = new Response(response.body, response);
    result.headers.set("X-Content-Type-Options", "nosniff");
    result.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    result.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    return result;
  },
};
