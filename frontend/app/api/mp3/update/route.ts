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
  const upstreamResponse = await fetch(`${BACKEND_INTERNAL_API_URL}/api/v1/mp3/update`, {
    method: "POST",
    headers: {
      "x-api-key": API_SHARED_TOKEN,
    },
    body: formData,
  });

  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const contentDisposition = upstreamResponse.headers.get("content-disposition");

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  if (contentDisposition) {
    responseHeaders.set("content-disposition", contentDisposition);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
