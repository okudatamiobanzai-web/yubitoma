// LINE通知を送るクライアント側ヘルパー
// 各ページから呼び出し、API Route経由でLINE Messaging APIに送信

async function sendNotify(body: Record<string, unknown>) {
  try {
    await fetch("/api/line-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // 通知失敗してもユーザー操作をブロックしない
  }
}

/** 新しい参加者 → 言い出しっぺに通知 */
export function lineNotifyNewParticipant(eventId: string, participantName: string) {
  return sendNotify({ type: "new_participant", eventId, participantName });
}

/** イベント開催確定 → 参加者全員に通知 */
export function lineNotifyEventConfirmed(eventId: string) {
  return sendNotify({ type: "event_confirmed", eventId });
}

/** 応援 → 言い出しっぺに通知 */
export function lineNotifyNewSupport(
  targetType: "tane" | "project",
  targetId: string,
  supporterName: string,
  currentCount: number,
  threshold: number
) {
  return sendNotify({ type: "new_support", targetType, targetId, supporterName, currentCount, threshold });
}

/** タネ→プロジェクト昇格 → 応援者全員に通知 */
export function lineNotifyTanePromoted(taneId: string, projectId: string) {
  return sendNotify({ type: "tane_promoted", taneId, projectId });
}
