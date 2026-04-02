import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const LLMS_FILE_PATH = path.join(process.cwd(), "content", "llms.txt");

export async function GET(): Promise<Response> {
  try {
    const body = await readFile(LLMS_FILE_PATH, "utf8");

    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("llms.txt is not configured.", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }
}
