import { NextResponse } from "next/server";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  return NextResponse.redirect(`${origin}/`);
}