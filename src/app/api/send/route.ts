import { sendAndConfirm } from "@/lib/solana";
import { errorResponse } from "@/lib/panta";

export async function POST(req: Request) {
  try {
    const { transaction } = await req.json();
    return Response.json({ signature: await sendAndConfirm(transaction) });
  } catch (e) {
    return errorResponse(e);
  }
}
