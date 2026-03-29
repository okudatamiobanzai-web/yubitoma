"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchEvent, fetchTaneById, fetchProject, fetchProjects } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";
import type { Event, Tane, Project } from "@/lib/types";
import { updateEvent, updateTane, updateProject } from "@/lib/admin-data";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";

const statusLabels: Record<string, string> = {
  recruiting: "募集中",
  confirmed: "開催確定",
  closed: "終了",
  cancelled: "キャンセル",
  open: "募集中",
  reached: "達成",
  promoted: "昇格済",
  planning: "企画中",
  active: "進行中",
  paused: "一時停止",
  completed: "完了",
};

function getCategoryInfo(type: string) {
  return CATEGORIES.find((c) => c.value === type) ?? CATEGORIES[0];
}

type ContentData =
  | { kind: "event"; data: Event }
  | { kind: "tane"; data: Tane }
  | { kind: "project"; data: Project }
  | null;

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
      />
    </div>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] resize-vertical"
      />
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function EventEditForm({ event }: { event: Event }) {
  const router = useRouter();
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [date, setDate] = useState(event.date);
  const [startTime, setStartTime] = useState(event.start_time);
  const [venueName, setVenueName] = useState(event.venue_name ?? "");
  const [venueAddress, setVenueAddress] = useState(event.venue_address ?? "");
  const [minPeople, setMinPeople] = useState(String(event.min_people));
  const [maxPeople, setMaxPeople] = useState(String(event.max_people ?? ""));
  const [feePerPerson, setFeePerPerson] = useState(String(event.fee_per_person ?? ""));
  const [status, setStatus] = useState(event.status);
  const [coverImageUrl, setCoverImageUrl] = useState(event.cover_image_url ?? null);
  const [flyerUrl, setFlyerUrl] = useState(event.flyer_url ?? null);
  const [relatedProjectId, setRelatedProjectId] = useState(event.related_project_id ?? "");
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProjects().then(setAllProjects).catch(() => setAllProjects([]));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await updateEvent(event.id, {
        title,
        description,
        date,
        start_time: startTime,
        venue_name: venueName || null,
        venue_address: venueAddress || null,
        min_people: Number(minPeople),
        max_people: maxPeople ? Number(maxPeople) : null,
        fee_per_person: feePerPerson ? Number(feePerPerson) : null,
        status,
        cover_image_url: coverImageUrl,
        flyer_url: flyerUrl,
        related_project_id: relatedProjectId || null,
      });
      setMessage("保存しました！");
      setTimeout(() => router.push(`/admin/content/${event.id}`), 1500);
    } catch (e) {
      setMessage("エラー: " + (e instanceof Error ? e.message : "保存に失敗しました"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <LabeledInput label="タイトル" value={title} onChange={setTitle} />
      <LabeledTextarea label="説明" value={description} onChange={setDescription} rows={6} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminImageUpload
          label="カバー画像"
          currentUrl={coverImageUrl}
          onUrlChange={setCoverImageUrl}
          folder={`events/${event.id}`}
        />
        <AdminImageUpload
          label="チラシ画像"
          currentUrl={flyerUrl}
          onUrlChange={setFlyerUrl}
          folder={`events/${event.id}`}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LabeledInput label="日付" value={date} onChange={setDate} type="date" />
        <LabeledInput label="開始時間" value={startTime} onChange={setStartTime} type="time" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LabeledInput label="会場名" value={venueName} onChange={setVenueName} />
        <LabeledInput label="住所" value={venueAddress} onChange={setVenueAddress} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LabeledInput label="最少人数" value={minPeople} onChange={setMinPeople} type="number" />
        <LabeledInput label="最大人数" value={maxPeople} onChange={setMaxPeople} type="number" placeholder="上限なし" />
        <LabeledInput label="参加費 (円)" value={feePerPerson} onChange={setFeePerPerson} type="number" placeholder="無料" />
      </div>
      <LabeledSelect
        label="ステータス"
        value={status}
        onChange={(v) => setStatus(v as "recruiting" | "confirmed" | "closed" | "cancelled")}
        options={[
          { value: "recruiting", label: statusLabels.recruiting },
          { value: "confirmed", label: statusLabels.confirmed },
          { value: "closed", label: statusLabels.closed },
          { value: "cancelled", label: statusLabels.cancelled },
        ]}
      />
      <LabeledSelect
        label="プロジェクト紐付け"
        value={relatedProjectId}
        onChange={setRelatedProjectId}
        options={[
          { value: "", label: "なし" },
          ...allProjects.map((p) => ({ value: p.id, label: `🚀 ${p.title}` })),
        ]}
      />
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <Link
          href={`/admin/content/${event.id}`}
          className="px-6 py-2.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-sub)] hover:bg-[var(--color-soft)] transition-colors"
        >
          キャンセル
        </Link>
        {message && (
          <span className={`text-sm ${message.startsWith("エラー") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

function TaneEditForm({ tane }: { tane: Tane }) {
  const router = useRouter();
  const [title, setTitle] = useState(tane.title);
  const [description, setDescription] = useState(tane.description);
  const [threshold, setThreshold] = useState(String(tane.promotion_threshold));
  const [status, setStatus] = useState(tane.status);
  const [coverImageUrl, setCoverImageUrl] = useState(tane.cover_image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await updateTane(tane.id, {
        title,
        description,
        promotion_threshold: Number(threshold),
        status,
        cover_image_url: coverImageUrl,
      });
      setMessage("保存しました！");
      setTimeout(() => router.push(`/admin/content/${tane.id}`), 1500);
    } catch (e) {
      setMessage("エラー: " + (e instanceof Error ? e.message : "保存に失敗しました"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <LabeledInput label="タイトル" value={title} onChange={setTitle} />
      <LabeledTextarea label="説明" value={description} onChange={setDescription} rows={6} />
      <AdminImageUpload
        label="カバー画像"
        currentUrl={coverImageUrl}
        onUrlChange={setCoverImageUrl}
        folder={`tane/${tane.id}`}
      />
      <LabeledInput label="昇格閾値 (人)" value={threshold} onChange={setThreshold} type="number" />
      <LabeledSelect
        label="ステータス"
        value={status}
        onChange={(v) => setStatus(v as "open" | "reached" | "promoted" | "closed")}
        options={[
          { value: "open", label: statusLabels.open },
          { value: "reached", label: statusLabels.reached },
          { value: "promoted", label: statusLabels.promoted },
          { value: "closed", label: statusLabels.closed },
        ]}
      />
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <Link
          href={`/admin/content/${tane.id}`}
          className="px-6 py-2.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-sub)] hover:bg-[var(--color-soft)] transition-colors"
        >
          キャンセル
        </Link>
        {message && (
          <span className={`text-sm ${message.startsWith("エラー") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

function ProjectEditForm({ project }: { project: Project }) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [coverImageUrl, setCoverImageUrl] = useState(project.cover_image_url ?? null);
  const [links, setLinks] = useState(
    project.external_links.map((l) => ({ ...l }))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await updateProject(project.id, {
        title,
        description,
        status,
        cover_image_url: coverImageUrl,
        external_links: links,
      });
      setMessage("保存しました！");
      setTimeout(() => router.push(`/admin/content/${project.id}`), 1500);
    } catch (e) {
      setMessage("エラー: " + (e instanceof Error ? e.message : "保存に失敗しました"));
    } finally {
      setSaving(false);
    }
  }

  function addLink() {
    setLinks([...links, { label: "", url: "", type: "website" as const }]);
  }

  function updateLink(index: number, field: string, value: string) {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <LabeledInput label="タイトル" value={title} onChange={setTitle} />
      <LabeledTextarea label="説明" value={description} onChange={setDescription} rows={6} />
      <AdminImageUpload
        label="カバー画像"
        currentUrl={coverImageUrl}
        onUrlChange={setCoverImageUrl}
        folder={`projects/${project.id}`}
      />
      <LabeledSelect
        label="ステータス"
        value={status}
        onChange={(v) => setStatus(v as "planning" | "active" | "paused" | "completed")}
        options={[
          { value: "planning", label: statusLabels.planning },
          { value: "active", label: statusLabels.active },
          { value: "paused", label: statusLabels.paused },
          { value: "completed", label: statusLabels.completed },
        ]}
      />

      {/* External links editor */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">外部リンク</label>
        <div className="space-y-3">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                placeholder="ラベル"
                className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
                placeholder="URL"
                className="flex-2 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => removeLink(i)}
                className="px-2 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                削除
              </button>
            </div>
          ))}
          <button
            onClick={addLink}
            className="text-sm text-[var(--color-primary)] hover:underline cursor-pointer"
          >
            + リンクを追加
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <Link
          href={`/admin/content/${project.id}`}
          className="px-6 py-2.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-sub)] hover:bg-[var(--color-soft)] transition-colors"
        >
          キャンセル
        </Link>
        {message && (
          <span className={`text-sm ${message.startsWith("エラー") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ContentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [content, setContent] = useState<ContentData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [event, tane, project] = await Promise.all([
          fetchEvent(id),
          fetchTaneById(id),
          fetchProject(id),
        ]);

        if (event) {
          setContent({ kind: "event", data: event });
        } else if (tane) {
          setContent({ kind: "tane", data: tane });
        } else if (project) {
          setContent({ kind: "project", data: project });
        } else {
          setContent(null);
        }
      } catch (e) {
        console.error("Failed to load content:", e);
        setContent(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-mute)]">読み込み中...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <>
        <Link
          href="/admin/content"
          className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
        >
          ← コンテンツ一覧に戻る
        </Link>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-12 text-center">
          <p className="text-[var(--color-mute)]">コンテンツが見つかりません</p>
        </div>
      </>
    );
  }

  const { kind, data } = content;
  const type =
    kind === "event" ? data.event_type : kind === "tane" ? "tane" : "project";
  const cat = getCategoryInfo(type);

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/content"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← 一覧
        </Link>
        <span className="text-[var(--color-border)]">/</span>
        <Link
          href={`/admin/content/${id}`}
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          {data.title}
        </Link>
        <span className="text-[var(--color-border)]">/</span>
        <span className="text-sm text-[var(--color-sub)]">編集</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-[var(--color-mute)]">
          {cat.emoji} {cat.label}
        </span>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">編集</h1>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
        {kind === "event" && <EventEditForm event={data} />}
        {kind === "tane" && <TaneEditForm tane={data} />}
        {kind === "project" && <ProjectEditForm project={data} />}
      </div>
    </>
  );
}
