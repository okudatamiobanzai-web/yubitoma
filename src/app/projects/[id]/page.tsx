"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { fetchProject, addSupport, notifySupportReceived, createNotification, fetchSupportComments } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatarWithFallback } from "@/components/UserAvatar";
import { ProjectStatus, Profile, Project, Event, SUPPORT_PRESETS, Support } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statusConfig: Record<ProjectStatus, { emoji: string; label: string }> = {
  planning: { emoji: "\uD83D\uDD35", label: "計画中" },
  active: { emoji: "\uD83D\uDFE2", label: "進行中" },
  paused: { emoji: "\uD83D\uDFE1", label: "休止中" },
  completed: { emoji: "✅", label: "完了" },
};

const eventStatusLabels: Record<string, { label: string; color: string }> = {
  recruiting: { label: "募集中", color: "var(--color-primary)" },
  confirmed: { label: "開催確定", color: "var(--color-success, #22c55e)" },
  closed: { label: "終了", color: "var(--color-mute)" },
  cancelled: { label: "中止", color: "var(--color-mute)" },
};

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-HTTPS (LINE browser etc.)
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { user, dbProfileId, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [supportComment, setSupportComment] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // ISSUE 5: participation request state
  const [joinRequested, setJoinRequested] = useState(false);
  const [joinRequesting, setJoinRequesting] = useState(false);

  // ISSUE 6: project comments
  const [comments, setComments] = useState<Support[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const proj = await fetchProject(params.id as string);
        setProject(proj);
        if (proj) {
          // Load all comments
          fetchSupportComments("project", proj.id).then(setComments).catch(() => {});
        }
      } catch (e) {
        console.error("Failed to load project:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-project)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-mute)]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">🚀</div>
        <p className="text-[var(--color-sub)] font-medium">プロジェクトが見つかりません</p>
        <Link href="/" className="mt-4 text-sm text-[var(--color-primary)] font-medium">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  const st = statusConfig[project.status];
  const isOwner = dbProfileId ? project.owner_id === dbProfileId : false;
  const isMember = project.core_members?.some((m) => m.id === dbProfileId) ?? false;
  const shortTitle = project.title.length > 12 ? project.title.slice(0, 12) + "…" : project.title;

  const handleSupportSubmit = async () => {
    if (!dbProfileId || !project) return;
    try {
      await addSupport("project", project.id, dbProfileId, supportComment.trim() || undefined);
      // オーナーに通知を送信
      if (project.owner_id && project.owner_id !== dbProfileId) {
        const supporterName = user?.displayName ?? "ユーザー";
        notifySupportReceived("project", project.id, project.title, project.owner_id, supporterName, dbProfileId).catch(() => {});
      }
      setSupportSent(true);
      // Reload comments to include new one
      fetchSupportComments("project", project.id).then(setComments).catch(() => {});
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSent(false);
        setSupportComment("");
      }, 1500);
    } catch (e) {
      console.error("Support error:", e);
      alert("応援の送信に失敗しました。もう一度お試しください。");
    }
  };

  const handleInviteCopy = async () => {
    const ok = await copyToClipboard(`https://yubitoma.shirubelab.jp/projects/${project.id}`);
    if (ok) {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  // ISSUE 5: request to join project
  const handleJoinRequest = async () => {
    if (!dbProfileId || !project || joinRequesting) return;
    setJoinRequesting(true);
    try {
      const requesterName = user?.displayName ?? "ユーザー";
      await createNotification({
        user_id: project.owner_id,
        type: "join_request",
        title: "コアメンバー参加リクエスト",
        body: `${requesterName}さんが「${project.title}」のコアメンバーへの参加をリクエストしました`,
        project_id: project.id,
        from_user_id: dbProfileId,
      });
      setJoinRequested(true);
    } catch (e) {
      console.error("Join request error:", e);
      alert("リクエストの送信に失敗しました。もう一度お試しください。");
    } finally {
      setJoinRequesting(false);
    }
  };

  // ISSUE 6: submit comment
  const handleCommentSubmit = async () => {
    if (!dbProfileId || !newComment.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addSupport("project", project.id, dbProfileId, newComment.trim());
      // Notify owner
      if (project.owner_id && project.owner_id !== dbProfileId) {
        const commenterName = user?.displayName ?? "ユーザー";
        notifySupportReceived("project", project.id, project.title, project.owner_id, commenterName, dbProfileId).catch(() => {});
      }
      setNewComment("");
      // Reload comments
      fetchSupportComments("project", project.id).then(setComments).catch(() => {});
    } catch (e) {
      console.error("Comment error:", e);
      alert("コメントの送信に失敗しました。もう一度お試しください。");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const shareUrl = `https://yubitoma.shirubelab.jp/projects/${project.id}`;

  return (
    <div className="pb-28">
      <PageHeader
        title={shortTitle}
        backHref="/"
        backLabel="ホーム"
        rightAction={
          isOwner ? (
            <Link
              href={`/projects/${project.id}/update`}
              className="text-xs font-bold text-white bg-[var(--color-project)] px-3 py-1.5 rounded-full"
            >
              📝 進捗投稿
            </Link>
          ) : undefined
        }
      />

      <div className="px-4 py-4 space-y-5">
        {/* ===== Hero Section ===== */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🚀</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-snug mb-1.5">{project.title}</h2>
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: project.status === "active" ? "var(--color-project)" : "var(--color-soft)",
                  color: project.status === "active" ? "white" : "var(--color-sub)",
                }}
              >
                {st.emoji} {st.label}
              </span>
            </div>
          </div>
          {/* Owner info - ISSUE 1: use UserAvatar */}
          {project.owner && (
            <div className="flex items-center gap-2 mt-3">
              <UserAvatarWithFallback
                profile={project.owner}
                size="w-7 h-7"
                textSize="text-xs"
                bgColor="bg-[var(--color-project)]/20"
                textColor="text-[var(--color-project)]"
              />
              <div>
                <span className="text-xs font-medium">{project.owner.display_name}</span>
                <span className="text-[10px] text-[var(--color-mute)] ml-1.5">言い出しっぺ</span>
              </div>
            </div>
          )}
        </div>

        {/* ===== Stats Bar ===== */}
        <div className="flex items-center justify-around bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] py-3.5 px-4">
          <div className="text-center">
            <div className="text-sm font-bold">👥 {project.core_members?.length ?? 0}人</div>
            <div className="text-[10px] text-[var(--color-mute)]">コア</div>
          </div>
          <div className="w-px h-8 bg-[var(--color-border)]" />
          <div className="text-center">
            <div className="text-sm font-bold">📣 {project.supporter_count ?? 0}人</div>
            <div className="text-[10px] text-[var(--color-mute)]">応援</div>
          </div>
          <div className="w-px h-8 bg-[var(--color-border)]" />
          <div className="text-center">
            <div className="text-sm font-bold">👀 {project.watcher_count ?? 0}人</div>
            <div className="text-[10px] text-[var(--color-mute)]">ウォッチ</div>
          </div>
        </div>

        {/* ===== Description ===== */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
        </div>

        {/* ===== Core Members ===== */}
        {project.core_members && project.core_members.length > 0 && (
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              👥 コアメンバー
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {project.core_members.map((member) => (
                <div key={member.id} className="flex flex-col items-center gap-1.5">
                  <UserAvatarWithFallback
                    profile={member}
                    size="w-12 h-12"
                    textSize="text-base"
                    bgColor="bg-[var(--color-project)]/20"
                    textColor="text-[var(--color-project)]"
                  />
                  <span className="text-xs font-medium text-center leading-tight">{member.display_name}</span>
                  {member.area && (
                    <span className="text-[10px] text-[var(--color-mute)]">{member.area}</span>
                  )}
                </div>
              ))}
            </div>
            {isOwner && (
              <button
                onClick={handleInviteCopy}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: inviteCopied ? "var(--color-project)" : "var(--color-soft)",
                  color: inviteCopied ? "white" : "var(--color-project)",
                }}
              >
                {inviteCopied ? "✓ リンクをコピーしました" : "🔗 プロジェクトページをシェア"}
              </button>
            )}
          </div>
        )}

        {/* ===== ISSUE 5: Participation Request ===== */}
        {dbProfileId && !isOwner && !isMember && (
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              🙋 コアメンバーに参加する
            </h3>
            <p className="text-xs text-[var(--color-mute)] mb-3">
              プロジェクトのコアメンバーとして参加したい場合、言い出しっぺにリクエストを送れます。
            </p>
            {joinRequested ? (
              <div className="bg-[var(--color-project)]/10 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-[var(--color-project)]">✓ リクエストを送信しました</p>
                <p className="text-[10px] text-[var(--color-mute)] mt-0.5">言い出しっぺの確認をお待ちください</p>
              </div>
            ) : (
              <button
                onClick={handleJoinRequest}
                disabled={joinRequesting}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 border-2 border-[var(--color-project)] text-[var(--color-project)] hover:bg-[var(--color-project)]/10"
              >
                {joinRequesting ? "送信中..." : "🙋 参加リクエストを送る"}
              </button>
            )}
          </div>
        )}

        {/* ===== Unified Timeline ===== */}
        {(() => {
          // Merge updates and related events into a unified timeline
          type TimelineItem =
            | { kind: "update"; date: string; data: NonNullable<Project["updates"]>[number] }
            | { kind: "event"; date: string; data: Event };

          const items: TimelineItem[] = [];
          if (project.updates) {
            for (const u of project.updates) {
              items.push({ kind: "update", date: u.created_at, data: u });
            }
          }
          if (project.related_events) {
            for (const e of project.related_events) {
              items.push({ kind: "event", date: e.created_at, data: e });
            }
          }
          // Sort newest first
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  📊 タイムライン
                </h3>
                {isOwner && (
                  <Link
                    href={`/projects/${project.id}/update`}
                    className="text-xs font-bold text-white px-3 py-1.5 rounded-full transition-all active:scale-[0.98]"
                    style={{ backgroundColor: "var(--color-project)" }}
                  >
                    📝 進捗を報告する
                  </Link>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-xs text-[var(--color-mute)]">まだ投稿はありません</p>
                  {isOwner && (
                    <p className="text-[10px] text-[var(--color-mute)] mt-0.5">最初の進捗を投稿しよう！</p>
                  )}
                </div>
              ) : (
                <div className="relative pl-6">
                  {/* Vertical line */}
                  <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-[var(--color-border)]" />

                  <div className="space-y-5">
                    {items.map((item) => {
                      if (item.kind === "update") {
                        const update = item.data;
                        return (
                          <div key={`update-${update.id}`} className="relative">
                            <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-[var(--color-project)] border-2 border-[var(--color-card)] flex items-center justify-center">
                              <span className="text-[8px]">📝</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-[var(--color-mute)]">
                                  {formatDate(update.created_at)}
                                </span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-project)]/10 text-[var(--color-project)]">
                                  進捗
                                </span>
                                {update.author && (
                                  <span className="text-[10px] font-medium text-[var(--color-sub)]">
                                    {update.author.display_name}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{update.content}</p>
                              {update.image_urls.length > 0 && (
                                <div className="flex gap-2 mt-2 overflow-x-auto">
                                  {update.image_urls.map((url, i) => (
                                    <div
                                      key={i}
                                      className="w-24 h-24 rounded-xl bg-[var(--color-soft)] bg-cover bg-center shrink-0"
                                      style={{ backgroundImage: `url(${url})` }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } else {
                        const event = item.data;
                        const evStatus = eventStatusLabels[event.status] ?? eventStatusLabels.recruiting;
                        const attendeeCount = event.attendees?.length ?? 0;
                        return (
                          <div key={`event-${event.id}`} className="relative">
                            <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-card)] flex items-center justify-center">
                              <span className="text-[8px]">{event.event_type === "nomikai" ? "🍻" : "🎪"}</span>
                            </div>
                            <Link href={`/events/${event.id}`} className="block">
                              <div className="bg-[var(--color-soft)] rounded-xl p-3.5 hover:bg-[var(--color-border)] transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] text-[var(--color-mute)]">
                                    {formatDate(event.date)}
                                  </span>
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                    イベント
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-bold truncate flex-1 mr-2">
                                    {event.event_type === "nomikai" ? "🍻" : "🎪"} {event.title}
                                  </span>
                                  <span
                                    className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: evStatus.color }}
                                  >
                                    {evStatus.label}
                                  </span>
                                </div>
                                <div className="text-xs text-[var(--color-mute)]">
                                  {formatDate(event.date)} {event.start_time}〜
                                  {event.venue_name && ` · ${event.venue_name}`}
                                  {attendeeCount > 0 && ` · 👥${attendeeCount}人`}
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ===== Comments Section ===== */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            💬 コメント
            <span className="text-xs text-[var(--color-mute)] font-normal">({comments.length}件)</span>
          </h3>
          {comments.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-xs text-[var(--color-mute)]">まだコメントはありません</p>
              <p className="text-[10px] text-[var(--color-mute)] mt-0.5">最初のコメントを書こう！</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <UserAvatarWithFallback
                    profile={c.profile}
                    name={c.profile?.display_name ?? "?"}
                    size="w-8 h-8"
                    textSize="text-xs"
                    bgColor="bg-[var(--color-project)]/20"
                    textColor="text-[var(--color-project)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{c.profile?.display_name}</span>
                      <span className="text-[10px] text-[var(--color-mute)]">
                        {formatShortDate(c.created_at)}
                      </span>
                    </div>
                    {c.comment && (
                      <p className="text-xs text-[var(--color-sub)] mt-0.5">{c.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          {dbProfileId && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力..."
                className="flex-1 px-3 py-2.5 bg-[var(--color-soft)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-project)]/50 placeholder:text-[var(--color-mute)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || commentSubmitting}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ backgroundColor: "var(--color-project)" }}
              >
                送信
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Bottom Fixed Bar ===== */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-30">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => setShowSupportModal(true)}
            className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg"
            style={{ backgroundColor: "var(--color-project)", boxShadow: "0 4px 14px rgba(139,92,246,0.25)" }}
          >
            📣 応援する
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="py-3.5 px-5 rounded-2xl bg-[var(--color-soft)] text-[var(--color-sub)] font-bold text-sm transition-all active:scale-[0.98]"
          >
            🔗 共有
          </button>
        </div>
      </div>

      {/* ===== Support Modal ===== */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setShowSupportModal(false); setSupportSent(false); setSupportComment(""); }}>
          <div
            className="bg-[var(--color-card)] w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />

            {supportSent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-lg font-bold mb-1">応援を送りました！</p>
                <p className="text-xs text-[var(--color-mute)]">プロジェクトの力になります</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-1">📣 応援する</h3>
                <p className="text-xs text-[var(--color-mute)] mb-4">コメントを添えて応援しよう</p>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {SUPPORT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setSupportComment(preset)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        supportComment === preset
                          ? "bg-[var(--color-project)] text-white"
                          : "bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Free text */}
                <textarea
                  value={supportComment}
                  onChange={(e) => setSupportComment(e.target.value)}
                  placeholder="自由にコメントを書けます"
                  rows={3}
                  className="w-full p-3 bg-[var(--color-soft)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-project)]/50 placeholder:text-[var(--color-mute)]"
                />

                <button
                  onClick={handleSupportSubmit}
                  disabled={!supportComment.trim()}
                  className="w-full mt-4 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-project)" }}
                >
                  📣 応援を送る
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== Share Modal (ISSUE 4: fixed) ===== */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setShowShareModal(false); setCopied(false); }}>
          <div
            className="bg-[var(--color-card)] w-full max-w-lg mx-auto rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4">シェアする</h3>

            {/* Project summary */}
            <div className="bg-[var(--color-soft)] rounded-xl p-3 mb-5">
              <div className="text-sm font-bold">🚀 {project.title}</div>
              <div className="text-[11px] text-[var(--color-mute)] mt-0.5">
                {st.emoji} {st.label} · 📣 応援{project.supporter_count ?? 0}人
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* LINE - ISSUE 4: use line.me/R/share format */}
              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(`🚀 「${project.title}」を応援しよう！\n${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[#06C755]/10 rounded-xl hover:bg-[#06C755]/20 transition-colors"
              >
                <div className="w-12 h-12 bg-[#06C755] rounded-xl flex items-center justify-center text-white text-xl font-bold">L</div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">LINE</span>
              </a>

              {/* X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`「${project.title}」を応援しています！\n#指とま #道東`)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[var(--color-soft)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--color-ink)] rounded-xl flex items-center justify-center text-white text-xl">{"\uD835\uDD4F"}</div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">X</span>
              </a>

              {/* URL Copy - ISSUE 4: clipboard fallback */}
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(shareUrl);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } else {
                    alert("URLをコピーできませんでした。手動でコピーしてください。");
                  }
                }}
                className="flex flex-col items-center gap-2 p-4 bg-[var(--color-soft)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--color-project)] rounded-xl flex items-center justify-center text-white">
                  {copied ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">
                  {copied ? "コピー済み" : "URLコピー"}
                </span>
              </button>
            </div>

            <button
              onClick={() => { setShowShareModal(false); setCopied(false); }}
              className="w-full py-3 bg-[var(--color-soft)] rounded-xl text-sm font-medium text-[var(--color-sub)]"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
