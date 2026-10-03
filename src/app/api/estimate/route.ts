import { NextResponse } from "next/server";
import { getEstimator } from "../../../lib/estimator";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const { description, tags } = (body ?? {}) as { description?: unknown; tags?: unknown };
  const text = typeof description === "string" ? description.slice(0, 1500) : "";
  const list = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string").slice(0, 12) : [];
  if (!text.trim() && list.length === 0) {
    return NextResponse.json({ error: "Describe your project first." }, { status: 400 });
  }
  const estimate = await getEstimator().estimate({ description: text, tags: list });
  return NextResponse.json(estimate);
}
