const BACKEND_INTERNAL_API_URL =
  process.env.BACKEND_INTERNAL_API_URL ?? "http://backend:8000";

const API_SHARED_TOKEN = process.env.API_SHARED_TOKEN ?? "";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!API_SHARED_TOKEN) {
    return Response.json(
      { detail: "API token is not configured on the frontend server." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const upstreamResponse = await fetch(`${BACKEND_INTERNAL_API_URL}/api/v1/mp3/read`, {
    method: "POST",
    headers: {
      "x-api-key": API_SHARED_TOKEN,
    },
    body: formData,
  });

  const contentType = upstreamResponse.headers.get("content-type") ?? "application/json";
  const body = await upstreamResponse.text();

  return new Response(body, {
    status: upstreamResponse.status,
    headers: {
      "content-type": contentType,
    },
  });
}
