"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Model = {
  id: string;
  name: string;
  tag: string;
  detail: string;
  speed: number;
  intelligence: number;
};

type SummaryStyle = "paragraph" | "bullets" | "one-sentence";

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODELS: Model[] = [
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    tag: "Small / Fast",
    detail:
      "OpenAI’s lightweight GPT-4.1 variant optimized for low latency and cost. Best for high-throughput tasks, lightweight reasoning, and fast responses.",
    speed: 5,
    intelligence: 3,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek Chat V3",
    tag: "Large / Reasoning",
    detail:
      "DeepSeek’s large-scale chat model designed for strong reasoning, coding, and instruction-following. Performs well on complex multi-step tasks.",
    speed: 3,
    intelligence: 5,
  },
];

const SUMMARY_STYLES: { id: SummaryStyle; label: string; icon: string; desc: string }[] = [
  { id: "paragraph", label: "Paragraph", icon: "¶", desc: "Flowing prose" },
  { id: "bullets", label: "Bullet Points", icon: "≡", desc: "Scannable list" },
  { id: "one-sentence", label: "One Sentence", icon: "—", desc: "Distilled essence" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function DotBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="h-[3px] w-3 rounded-full transition-all duration-300"
          style={{ backgroundColor: i < value ? color : "rgba(0,0,0,0.1)" }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ControlsSidebar({
  selectedModel,
  onModelChange,
  summaryStyle,
  onSummaryStyleChange,
}: {
  selectedModel: string;
  onModelChange: (id: string) => void;
  summaryStyle: SummaryStyle;
  onSummaryStyleChange: (s: SummaryStyle) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* ── Mobile Toggle Button (Visible only on < 768px) ── */}
      <button className="mobile-nav-trigger" onClick={toggleMobile}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      {/* ── Backdrop for Mobile ── */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-topbar">
          <div className="logo-container">
            <span className="logo-mark">📰</span>
            <span className="logo-text">NEWSROOM</span>
          </div>
          
          {/* Collapse toggle (Hidden on mobile as we use the backdrop/X to close) */}
          <button
            className="collapse-btn desktop-only"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d={collapsed ? "M5 2l4 5-4 5" : "M9 2L5 7l4 5"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Close button for Mobile only */}
          <button className="mobile-only close-btn" onClick={() => setMobileOpen(false)}>
            ✕
          </button>
        </div>

        <div className="sidebar-scroll-area">
          <div className="sidebar-content">
            <section className="control-section">
              <p className="section-label">Model</p>
              <div className="model-group">
                {MODELS.map((model) => {
                  const active = selectedModel === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model.id);
                        if (window.innerWidth < 768) setMobileOpen(false);
                      }}
                      className={`model-btn ${active ? "active" : ""}`}
                    >
                      <span className={`model-bar ${active ? "active" : ""}`} />
                      <div className="model-btn-inner">
                        <div className="model-name-row">
                          <span className="model-name">{model.name}</span>
                          <span className="model-tag">{model.tag}</span>
                        </div>
                        <p className="model-detail">{model.detail}</p>
                        <div className="model-stats">
                          <div className="stat-row"><span className="stat-label">Speed</span><DotBar value={model.speed} color="#10b981" /></div>
                          <div className="stat-row"><span className="stat-label">IQ&nbsp;&nbsp;&nbsp;</span><DotBar value={model.intelligence} color="#3b82f6" /></div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="control-section">
              <p className="section-label">Summary Style</p>
              <div className="style-group">
                {SUMMARY_STYLES.map((style) => {
                  const active = summaryStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => {
                        onSummaryStyleChange(style.id);
                        if (window.innerWidth < 768) setMobileOpen(false);
                      }}
                      className={`style-btn ${active ? "active" : ""}`}
                    >
                      <span className="style-icon">{style.icon}</span>
                      <div className="style-text">
                        <span className="style-label">{style.label}</span>
                        <span className="style-desc">{style.desc}</span>
                      </div>
                      {active && <span className="style-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Collapsed view icons (Only shown when collapsed on desktop) */}
          <div className="collapsed-icons">
            {MODELS.map((m) => (
              <button key={m.id} onClick={() => onModelChange(m.id)} className={`icon-pill ${selectedModel === m.id ? "active" : ""}`}>
                {m.name.slice(0, 1)}
              </button>
            ))}
            <div className="icon-divider" />
            {SUMMARY_STYLES.map((s) => (
              <button key={s.id} onClick={() => onSummaryStyleChange(s.id)} className={`icon-pill ${summaryStyle === s.id ? "active-style" : ""}`}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <style>{`
        /* ── Layout Variables ── */
        :root {
          --sidebar-width: 280px;
          --sidebar-collapsed-width: 52px;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease, width 0.25s cubic-bezier(0.4,0,0.2,1);
          z-index: 100;
          font-family: 'Syne', sans-serif;
        }

        /* ── Desktop/Mobile Visibility ── */
        .mobile-only { display: none; }
        .desktop-only { display: flex; }

        @media (max-width: 767px) {
          .sidebar {
            transform: translateX(-100%);
            width: var(--sidebar-width) !important; /* Always wide on mobile when open */
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .mobile-only { display: flex; }
          .desktop-only { display: none; }
          
          .mobile-nav-trigger {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 90;
            background: white;
            color: black;
            border: none;
            padding: 10px 16px;
            border-radius: 99px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .sidebar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(2px);
            z-index: 95;
          }
        }

        @media (min-width: 768px) {
          .mobile-nav-trigger { display: none; }
          .sidebar.collapsed { width: var(--sidebar-collapsed-width); }
        }

        /* ── Inner Styles ── */
        .sidebar-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 14px;
          border-bottom: 1px solid #e2e8f0;
          min-height: 52px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }

        .logo-text {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          white-space: nowrap;
        }

        .sidebar.collapsed .logo-text { opacity: 0; }

        .sidebar-scroll-area {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sidebar-scroll-area::-webkit-scrollbar { display: none; }

        .sidebar-content {
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          transition: opacity 0.2s;
        }

        .sidebar.collapsed .sidebar-content {
          opacity: 0;
          pointer-events: none;
          position: absolute;
        }

        /* ── Collapsed State Icons ── */
        .collapsed-icons {
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 0;
        }
        .sidebar.collapsed .collapsed-icons { display: flex; }

        /* ... Your existing model-btn, style-btn, and typography CSS remains the same ... */
        /* Copying core styles from your original code below for functionality */

        .section-label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; }
        .model-group { display: flex; flex-direction: column; gap: 6px; }
        .model-btn { position: relative; background: transparent; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: left; cursor: pointer; }
        .model-btn.active { background: #f1f5f9; border-color: #cbd5e1; }
        .model-name { font-size: 13px; font-weight: 700; color: #334155; }
        .model-tag { font-family: 'Space Mono', monospace; font-size: 9px; background: #f1f5f9; padding: 1px 5px; border-radius: 4px; margin-left: 6px; }
        .model-detail { font-family: 'Space Mono', monospace; font-size: 9px; color: #64748b; margin: 4px 0; }
        .stat-row { display: flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase; color: #94a3b8; }
        
        .style-btn { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; border: 1px solid transparent; background: none; cursor: pointer; width: 100%; }
        .style-btn.active { background: #eff6ff; border-color: #bfdbfe; }
        .style-label { font-size: 12px; font-weight: 600; color: #475569; display: block; text-align: left;}
        .style-desc { font-family: 'Space Mono', monospace; font-size: 8.5px; color: #94a3b8; display: block; text-align: left;}

        .icon-pill { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; background: white; }
        .icon-pill.active { border-color: #10b981; color: #10b981; }
        .icon-divider { width: 20px; height: 1px; background: #e2e8f0; margin: 4px 0; }
        .close-btn { background: none; border: none; font-size: 18px; color: #94a3b8; cursor: pointer; }
        .collapse-btn { color: #94a3b8; background: transparent; border: none; cursor: pointer; padding: 4px; border-radius: 6px; }
      `}</style>
    </>
  );
}

