"use client";

import { useState } from "react";

interface ParticipationTermsProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: (termsAgreed: boolean, snsNg: boolean) => void;
  eventTitle: string;
}

export function ParticipationTerms({ isOpen, onClose, onAgree, eventTitle }: ParticipationTermsProps) {
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [snsNg, setSnsNg] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* ボトムシート */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease-out]">
        <div className="bg-[var(--color-card)] rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
          {/* ハンドル */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>

          <div className="px-5 pb-8">
            {/* ヘッダー */}
            <div className="text-center mb-5">
              <div className="text-2xl mb-2">📋</div>
              <h2 className="text-base font-bold">参加にあたっての確認</h2>
              <p className="text-xs text-[var(--color-mute)] mt-1">「{eventTitle}」への参加</p>
            </div>

            {/* 利用規約チェック */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 bg-[var(--color-soft)] rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded accent-[var(--color-primary)] flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">利用規約に同意する</div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] text-[var(--color-mute)] mt-0.5">・</span>
                      <p className="text-[11px] text-[var(--color-sub)] leading-relaxed">
                        アップした写真・動画は指とま運営がPR等に使用できます
                      </p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] text-[var(--color-mute)] mt-0.5">・</span>
                      <p className="text-[11px] text-[var(--color-sub)] leading-relaxed">
                        イベント中の写真が指とまのSNS等で使用される場合があります
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* SNS NG チェック */}
              <label className="flex items-start gap-3 bg-[var(--color-soft)] rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snsNg}
                  onChange={(e) => setSnsNg(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded accent-[var(--color-warning)] flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">SNS・広報への顔出しNG</div>
                  <p className="text-[11px] text-[var(--color-mute)] mt-1 leading-relaxed">
                    （当日、NGネームプレートをお渡しします）
                  </p>
                </div>
              </label>
            </div>

            {/* 参加確定ボタン */}
            <button
              type="button"
              disabled={!termsAgreed}
              onClick={() => onAgree(termsAgreed, snsNg)}
              className="w-full mt-5 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
            >
              参加を確定する
            </button>

            {/* キャンセル */}
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-3 text-sm text-[var(--color-mute)] hover:text-[var(--color-sub)] transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
