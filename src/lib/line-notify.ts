// LINE Messaging API でプッシュ通知を送る

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

interface LineMessage {
  type: "text";
  text: string;
}

async function pushMessage(lineUserId: string, messages: LineMessage[]): Promise<boolean> {
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error("[LINE] Channel access token not set");
    return false;
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[LINE] Push failed:", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[LINE] Push error:", e);
    return false;
  }
}

// ==========================================
// 通知テンプレート
// ==========================================

/** 新しい参加者が来た → 言い出しっぺに通知 */
export async function notifyNewParticipant(
  organizerLineId: string,
  participantName: string,
  eventTitle: string,
  eventUrl: string
) {
  return pushMessage(organizerLineId, [
    {
      type: "text",
      text: `✋ ${participantName}さんが参加しました！\n\n📅 ${eventTitle}\n\n${eventUrl}`,
    },
  ]);
}

/** イベント開催確定 → 参加者全員に通知 */
export async function notifyEventConfirmed(
  participantLineIds: string[],
  eventTitle: string,
  eventUrl: string
) {
  const results = await Promise.allSettled(
    participantLineIds.map((lineId) =>
      pushMessage(lineId, [
        {
          type: "text",
          text: `🎉 開催確定！\n\n📅 ${eventTitle}\n\n参加者が集まりました！お楽しみに！\n\n${eventUrl}`,
        },
      ])
    )
  );
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

/** タネに応援が来た → 言い出しっぺに通知 */
export async function notifyNewSupport(
  ownerLineId: string,
  supporterName: string,
  taneTitle: string,
  currentCount: number,
  threshold: number,
  taneUrl: string
) {
  return pushMessage(ownerLineId, [
    {
      type: "text",
      text: `📣 ${supporterName}さんが応援しました！\n\n🌱 ${taneTitle}\n\n応援 ${currentCount}/${threshold}人\n\n${taneUrl}`,
    },
  ]);
}

/** タネがプロジェクトに昇格 → 応援者全員に通知 */
export async function notifyTanePromoted(
  supporterLineIds: string[],
  taneTitle: string,
  projectUrl: string
) {
  const results = await Promise.allSettled(
    supporterLineIds.map((lineId) =>
      pushMessage(lineId, [
        {
          type: "text",
          text: `🚀 プロジェクト始動！\n\n「${taneTitle}」が応援目標を達成してプロジェクト化しました！\n\n${projectUrl}`,
        },
      ])
    )
  );
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}
