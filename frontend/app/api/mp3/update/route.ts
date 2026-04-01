const BACKEND_INTERNAL_API_URL = process.env.BACKEND_INTERNAL_API_URL?.trim() ?? "";
const API_SHARED_TOKEN = process.env.API_SHARED_TOKEN?.trim() ?? "";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!BACKEND_INTERNAL_API_URL) {
    return Response.json(
      { detail: "Backend internal API URL is not configured on the frontend server." },
      { status: 500 },
    );
  }

  if (!API_SHARED_TOKEN) {
    return Response.json(
      { detail: "API token is not configured on the frontend server." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  try {
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
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to reach backend API.";

    return Response.json(
      { detail: `Frontend proxy could not reach backend API at ${BACKEND_INTERNAL_API_URL}: ${detail}` },
      { status: 500 },
    );
  }
}
