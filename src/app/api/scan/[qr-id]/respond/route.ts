import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { alertId, response, etaMinutes, reason } = await request.json();

    if (!alertId || !response) {
      return NextResponse.json({ error: "alertId and response required" }, { status: 400 });
    }

    const validResponses = ["coming", "busy", "chatting"];
    if (!validResponses.includes(response)) {
      return NextResponse.json({ error: "Invalid response type" }, { status: 400 });
    }

    // Update alert
    const updateData: Record<string, unknown> = {
      status: response,
      updated_at: new Date().toISOString(),
    };
    if (response === "coming" && etaMinutes) {
      updateData.eta_minutes = etaMinutes;
    }
    if (response === "busy" && reason) {
      updateData.owner_response = reason;
    }

    const { error } = await supabase
      .from("alerts")
      .update(updateData)
      .eq("id", alertId);

    if (error) {
      return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
    }

    // Update the scan_log resolution_status
    const { data: alert } = await supabase
      .from("alerts")
      .select("scan_id")
      .eq("id", alertId)
      .single();

    if (alert?.scan_id) {
      const resolutionStatus = response === "coming" ? "resolved" : response === "busy" ? "busy" : "chatting";
      await supabase
        .from("scan_logs")
        .update({ resolution_status: resolutionStatus })
        .eq("id", alert.scan_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Respond API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
