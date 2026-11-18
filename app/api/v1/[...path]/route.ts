import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = (process.env.GAMEVERSE_API_URL || "https://gameverse-platform-drdc.onrender.com").replace(/\/$/, "");
const PORTAL_ORIGIN = process.env.PORTAL_ORIGIN || "";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const endpoint = API_BASE + "/api/v1/" + path.map(encodeURIComponent).join("/") + request.nextUrl.search;
    const session = (await cookies()).get("gv_portal_session")?.value;
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const origin = request.headers.get("origin") || PORTAL_ORIGIN;
    if (origin) headers.set("Origin", origin);
    if (session) headers.set("Cookie", "gv_session=" + session);

    const hasBody = !["GET", "HEAD"].includes(request.method);
    const upstream = await fetch(endpoint, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual"
    });
    const body = [204, 304].includes(upstream.status) ? null : await upstream.arrayBuffer();
    const response = new NextResponse(body, { status: upstream.status });
    for (const key of ["content-type", "cache-control", "content-disposition", "location"]) {
      const value = upstream.headers.get(key);
      if (value) response.headers.set(key, value);
    }

    const setCookie = upstream.headers.get("set-cookie") || "";
    if (setCookie.includes("gv_session=")) {
      const token = setCookie.match(/(?:^|,\\s*)gv_session=([^;]*)/)?.[1] ?? "";
      if (!token || /max-age=0/i.test(setCookie)) {
        response.cookies.set("gv_portal_session", "", {
          httpOnly: true, secure: process.env.NODE_ENV === "production",
          sameSite: "lax", path: "/", maxAge: 0
        });
      } else {
        response.cookies.set("gv_portal_session", token, {
          httpOnly: true, secure: process.env.NODE_ENV === "production",
          sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7
        });
      }
    }
    return response;
  } catch (error) {
    console.error("GameVerse API proxy failed:", error);
    return NextResponse.json({ error: "تعذر الاتصال بخدمة GameVerse" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
