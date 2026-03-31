import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  notifyNewParticipant,
  notifyEventConfirmed,
  notifyNewSupport,
  notifyTanePromoted,
} from "@/lib/line-notify";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = "https://yubitoma.shirubelab.jp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    switch (type) {
      case "new_participant": {
        // 参加者が来た → 言い出しっぺに通知
        const { eventId, participantName } = body;
        const { data: event } = await supabase
          .from("events")
          .select("title, organizer_id")
          .eq("id", eventId)
          .single();
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        const { data: organizer } = await supabase
          .from("profiles")
          .select("line_user_id")
          .eq("id", event.organizer_id)
          .single();
        if (!organizer?.line_user_id) return NextResponse.json({ ok: false, reason: "no_line_id" });

        await notifyNewParticipant(
          organizer.line_user_id,
          participantName,
          event.title,
          `${BASE_URL}/events/${eventId}`
        );
        return NextResponse.json({ ok: true });
      }

      case "event_confirmed": {
        // 開催確定 → 参加者全員に通知
        const { eventId } = body;
        const { data: event } = await supabase
          .from("events")
          .select("title")
          .eq("id", eventId)
          .single();
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        const { data: attendees } = await supabase
          .from("attendees")
          .select("user_id")
          .eq("event_id", eventId);

        const userIds = (attendees ?? []).map((a) => a.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("line_user_id")
          .in("id", userIds)
          .not("line_user_id", "is", null);

        const lineIds = (profiles ?? []).map((p) => p.line_user_id).filter(Boolean) as string[];
        const sent = await notifyEventConfirmed(lineIds, event.title, `${BASE_URL}/events/${eventId}`);
        return NextResponse.json({ ok: true, sent });
      }

      case "new_support": {
        // 応援 → 言い出しっぺに通知
        const { targetType, targetId, supporterName, currentCount, threshold } = body;
        const table = targetType === "tane" ? "tane" : "projects";
        const { data: target } = await supabase
          .from(table)
          .select("title, owner_id")
          .eq("id", targetId)
          .single();
        if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { data: owner } = await supabase
          .from("profiles")
          .select("line_user_id")
          .eq("id", target.owner_id)
          .single();
        if (!owner?.line_user_id) return NextResponse.json({ ok: false, reason: "no_line_id" });

        const url = targetType === "tane" ? `${BASE_URL}/tane/${targetId}` : `${BASE_URL}/projects/${targetId}`;
        await notifyNewSupport(owner.line_user_id, supporterName, target.title, currentCount, threshold, url);
        return NextResponse.json({ ok: true });
      }

      case "tane_promoted": {
        // タネ→プロジェクト昇格 → 応援者全員に通知
        const { taneId, projectId } = body;
        const { data: tane } = await supabase
          .from("tane")
          .select("title")
          .eq("id", taneId)
          .single();
        if (!tane) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { data: supports } = await supabase
          .from("supports")
          .select("user_id")
          .eq("target_type", "tane")
          .eq("target_id", taneId);

        const userIds = (supports ?? []).map((s) => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("line_user_id")
          .in("id", userIds)
          .not("line_user_id", "is", null);

        const lineIds = (profiles ?? []).map((p) => p.line_user_id).filter(Boolean) as string[];
        const sent = await notifyTanePromoted(lineIds, tane.title, `${BASE_URL}/projects/${projectId}`);
        return NextResponse.json({ ok: true, sent });
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (e) {
    console.error("[API] line-notify error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
