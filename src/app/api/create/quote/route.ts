import { panta, errorResponse } from "@/lib/panta";
import { questionImage } from "@/lib/card";
import { CATEGORIES } from "@/lib/config";

type Body = {
  wallet: string;
  question: string;
  rule: string;
  source: string;
  category: string;
  closesAt: number;
  resolvesAt: number;
};

type Upload = { uploadUrl: string; fields: Record<string, string | number> };

async function uploadCard(question: string, category: string): Promise<string> {
  const png = await (await questionImage(question, category)).arrayBuffer();
  const signed = await panta<Upload>("/markets/create/image-upload/", { method: "POST", body: {} });
  const form = new FormData();
  for (const [k, v] of Object.entries(signed.fields)) form.append(k, String(v));
  form.append("file", new Blob([png], { type: "image/png" }), "card.png");
  const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
  const out = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!res.ok || !out.secure_url) throw new Error(out.error?.message ?? "Image upload failed");
  return out.secure_url;
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;
    const question = b.question?.trim();
    if (!b.wallet || !question) return Response.json({ message: "Connect a wallet and write your take" }, { status: 400 });
    const category = (CATEGORIES as readonly string[]).includes(b.category) ? b.category : "other";
    const imageUrl = await uploadCard(question, category);
    const quote = await panta<Record<string, unknown>>("/markets/create/quote/", {
      method: "POST",
      body: {
        wallet: b.wallet,
        question,
        title: question,
        description: b.rule.trim(),
        resolutionRule: b.rule.trim(),
        sourcesOfTruth: [b.source.trim()],
        category,
        startTime: b.closesAt,
        endTime: b.resolvesAt,
        resolutionTime: b.resolvesAt,
        imageUrl,
        marketType: "standard",
      },
    });
    return Response.json({ ...quote, imageUrl });
  } catch (e) {
    return errorResponse(e);
  }
}
