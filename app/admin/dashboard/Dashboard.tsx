"use client";
import { useEffect, useState } from "react";
import type { Region } from "@/lib/auth";
import type { Submission } from "@/lib/storage";

const REGION_LABEL: Record<string, string> = {
  tokyo: "東京・神奈川", osaka: "大阪・神戸", nagoya: "名古屋",
  sapporo: "札幌", fukuoka: "福岡",
};
const REGION_COLOR: Record<string, string> = {
  tokyo: "#1F3A5F", osaka: "#B23838", nagoya: "#2D6B47",
  sapporo: "#1E5A9A", fukuoka: "#C04580",
};

type Filters = { type: "all" | "quote" | "partner"; region: "all" | string; status: "new" | "read" | "archived" };

export default function Dashboard({ session, sessionLabel }: { session: Region; sessionLabel: string }) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ type: "all", region: "all", status: "new" });
  const [selected, setSelected] = useState<Submission | null>(null);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("type", filters.type);
    qs.set("region", filters.region);
    qs.set("status", filters.status === "new" ? "new" : filters.status === "read" ? "read" : "archived");
    const res = await fetch(`/api/admin/submissions?${qs.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filters]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  async function toggle(id: string, patch: Partial<Submission>) {
    await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (selected?.id === id) setSelected({ ...selected, ...patch });
    load();
  }

  async function remove(id: string) {
    if (!confirm("この申込を削除しますか？")) return;
    await fetch("/api/admin/submissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSelected(null);
    load();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5F7" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1.5px solid #E4E9F3", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <strong style={{ color: "#0F3D6B", fontSize: 17 }}>リタウン 管理画面</strong>
          <span style={{ background: "#FFF1E5", color: "#F2822C", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>{sessionLabel}</span>
        </div>
        <button onClick={logout} style={{ background: "#fff", color: "#0F3D6B", border: "1.5px solid #E4E9F3", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13 }}>ログアウト</button>
      </header>

      {/* Filter bar */}
      <div style={{ padding: "18px 24px", background: "#fff", borderBottom: "1.5px solid #E4E9F3" }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>種別</label>
            <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value as any }))} style={selectStyle}>
              <option value="all">すべて</option>
              <option value="quote">無料見積もり</option>
              <option value="partner">加盟店募集</option>
            </select>
          </div>
          {session === "admin" && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>エリア</label>
              <select value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))} style={selectStyle}>
                <option value="all">全エリア</option>
                {Object.entries(REGION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>ステータス</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value as any }))} style={selectStyle}>
              <option value="new">未読</option>
              <option value="read">対応済み</option>
              <option value="archived">アーカイブ</option>
            </select>
          </div>
          <div style={{ marginLeft: "auto", color: "#6B7280", fontSize: 13 }}>
            合計: <strong style={{ color: "#0F3D6B", fontSize: 18 }}>{items.length}</strong> 件
          </div>
        </div>
      </div>

      {/* List + Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 1fr) minmax(380px, 1.5fr)", gap: 24, padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 0, boxShadow: "0 4px 18px rgba(15,61,107,.06)", maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 30, color: "#6B7280", textAlign: "center" }}>読み込み中…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 50, color: "#9CA3AF", textAlign: "center" }}>該当する申込がありません</div>
          ) : (
            items.map(s => (
              <div
                key={s.id}
                onClick={() => { setSelected(s); if (!s.read) toggle(s.id, { read: true }); }}
                style={{
                  padding: "14px 18px", borderBottom: "1px solid #F1F3F8", cursor: "pointer",
                  background: selected?.id === s.id ? "#FFF1E5" : !s.read ? "#FFFBEB" : "#fff",
                  borderLeft: `4px solid ${REGION_COLOR[s.region] ?? "#9CA3AF"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ background: s.type === "quote" ? "#1F3A5F" : "#F2822C", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                    {s.type === "quote" ? "見積" : "加盟店"}
                  </span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{new Date(s.createdAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ fontWeight: 700, color: "#0F3D6B", fontSize: 14.5, marginBottom: 3 }}>
                  {s.name} {s.company && <span style={{ color: "#6B7280", fontWeight: 500, fontSize: 12 }}>（{s.company}）</span>}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {s.email}{s.tel ? ` / ${s.tel}` : ""}
                </div>
                <div style={{ fontSize: 11, color: REGION_COLOR[s.region], marginTop: 4, fontWeight: 700 }}>
                  {REGION_LABEL[s.region] ?? s.region}
                  {!s.read && <span style={{ marginLeft: 8, background: "#DC2626", color: "#fff", padding: "1px 7px", borderRadius: 4, fontSize: 10 }}>NEW</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div style={{ background: "#fff", borderRadius: 14, padding: selected ? 30 : 50, boxShadow: "0 4px 18px rgba(15,61,107,.06)", maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
          {!selected ? (
            <div style={{ color: "#9CA3AF", textAlign: "center", padding: "60px 0" }}>左の一覧から申込を選択してください</div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <span style={{ background: selected.type === "quote" ? "#1F3A5F" : "#F2822C", color: "#fff", fontSize: 11, padding: "3px 12px", borderRadius: 4, fontWeight: 700 }}>
                    {selected.type === "quote" ? "無料見積もり" : "加盟店募集"}
                  </span>
                  <span style={{ background: REGION_COLOR[selected.region], color: "#fff", fontSize: 11, padding: "3px 12px", borderRadius: 4, fontWeight: 700, marginLeft: 8 }}>
                    {REGION_LABEL[selected.region] ?? selected.region}
                  </span>
                  <h2 style={{ marginTop: 12, marginBottom: 4, fontSize: 22, color: "#0F3D6B" }}>{selected.name}</h2>
                  {selected.company && <div style={{ color: "#6B7280", fontSize: 14 }}>{selected.company}</div>}
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>受付: {new Date(selected.createdAt).toLocaleString("ja-JP")}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => toggle(selected.id, { read: !selected.read })} style={btnSecondary}>{selected.read ? "未読に戻す" : "対応済みにする"}</button>
                  <button onClick={() => toggle(selected.id, { archived: !selected.archived })} style={btnSecondary}>{selected.archived ? "復元" : "アーカイブ"}</button>
                  {session === "admin" && <button onClick={() => remove(selected.id)} style={btnDanger}>削除</button>}
                </div>
              </div>

              <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                <tbody>
                  <Row label="メール" value={<a href={`mailto:${selected.email}`}>{selected.email}</a>} />
                  {selected.tel && <Row label="電話" value={selected.tel} />}
                  {selected.address && <Row label="住所" value={selected.address} />}
                  {selected.service && <Row label="サービス" value={selected.service} />}
                  {selected.items && selected.items.length > 0 && <Row label="品目" value={selected.items.join("、")} />}
                  {selected.kobutsushou && <Row label="古物商許可番号" value={selected.kobutsushou} />}
                  {selected.years && <Row label="事業年数" value={selected.years} />}
                  {selected.capacity && <Row label="対応可能件数" value={selected.capacity} />}
                  {selected.channels && selected.channels.length > 0 && <Row label="チャネル" value={selected.channels.join("、")} />}
                  {selected.desiredAreas && selected.desiredAreas.length > 0 && <Row label="希望エリア" value={selected.desiredAreas.join("、")} />}
                  {selected.website && <Row label="HP" value={<a href={selected.website} target="_blank" rel="noopener">{selected.website}</a>} />}
                  {selected.message && <Row label="お問い合わせ内容" value={<div style={{ whiteSpace: "pre-wrap" }}>{selected.message}</div>} />}
                </tbody>
              </table>

              <details style={{ marginTop: 26, background: "#FAFBFD", borderRadius: 8, padding: "12px 16px" }}>
                <summary style={{ cursor: "pointer", fontSize: 12, color: "#6B7280", fontWeight: 700 }}>▼ Raw データ（全項目）</summary>
                <pre style={{ marginTop: 12, fontSize: 11, color: "#374151", overflow: "auto", maxHeight: 250 }}>{JSON.stringify(selected.raw ?? selected, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: "1px solid #F1F3F8" }}>
      <th style={{ textAlign: "left", padding: "10px 0", color: "#6B7280", fontSize: 12, fontWeight: 700, width: 140, verticalAlign: "top" }}>{label}</th>
      <td style={{ padding: "10px 0", color: "#0F3D6B" }}>{value}</td>
    </tr>
  );
}

const selectStyle: React.CSSProperties = {
  border: "1.5px solid #E4E9F3", borderRadius: 8, padding: "8px 12px",
  fontSize: 13.5, color: "#0F3D6B", background: "#fff", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  background: "#fff", color: "#0F3D6B", border: "1.5px solid #E4E9F3",
  padding: "7px 14px", borderRadius: 7, fontWeight: 700, fontSize: 12,
};
const btnDanger: React.CSSProperties = {
  background: "#FEE2E2", color: "#DC2626", border: "1.5px solid #FCA5A5",
  padding: "7px 14px", borderRadius: 7, fontWeight: 700, fontSize: 12,
};
