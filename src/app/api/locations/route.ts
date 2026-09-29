import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";

    let query = supabase
      .from("experience")
      .select("experience_id, experience_name, city, district, state, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(20);

    if (q.length >= 2) {
      query = query.or(
        `experience_name.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, data: [], error: error.message });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: [], error: err.message },
      { status: 500 }
    );
  }
}
