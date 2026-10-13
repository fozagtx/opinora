import { panta, errorResponse } from "@/lib/panta";

export async function POST(req: Request) {
  try {
    const { createId, wallet } = await req.json();
    return Response.json(await panta("/markets/create/build/", { method: "POST", body: { createId, wallet } }));
  } catch (e) {
    return errorResponse(e);
  }
}
