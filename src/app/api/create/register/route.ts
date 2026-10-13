import { panta, errorResponse, PantaError } from "@/lib/panta";

export async function POST(req: Request) {
  try {
    const { createId, signature } = await req.json();
    for (let i = 0; ; i++) {
      try {
        return Response.json(await panta("/markets/register/", { method: "POST", body: { createId, signature } }));
      } catch (e) {
        if (!(e instanceof PantaError) || e.code !== "TX_NOT_FOUND" || i >= 14) throw e;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  } catch (e) {
    return errorResponse(e);
  }
}
