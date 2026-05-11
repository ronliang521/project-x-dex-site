/**
 * 同域代理 Flux KPI API，解决浏览器 CORS 无法直连 flux.megaeth.com 的问题。
 * 其余请求交给静态资源（ASSETS）。
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/flux-kpi-details") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "Content-Type",
            "access-control-max-age": "86400",
          },
        });
      }

      const upstream = await fetch("https://flux.megaeth.com/api/kpi/details", {
        headers: { accept: "application/json" },
      });
      const body = await upstream.arrayBuffer();
      const headers = new Headers();
      headers.set("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("access-control-allow-methods", "GET, OPTIONS");
      headers.set("cache-control", "public, max-age=60");
      return new Response(body, { status: upstream.status, headers });
    }

    return env.ASSETS.fetch(request);
  },
};
