/* global Chart */

const fmtUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fmtPct = (n) => {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
};

let allRows = [];
let chart = null;
let sortKey = "date";
let sortDir = "desc";
let rangeDays = "30";

function sliceByRange(rows, days) {
  if (days === "all") return rows.slice();
  const n = Number(days);
  return rows.slice(-n);
}

function sumVolume(rows) {
  return rows.reduce((s, r) => s + r.volumeUsd, 0);
}

function updateStats(rows) {
  const last = rows.length ? rows[rows.length - 1] : null;
  const last7 = rows.slice(-7);
  const last30 = rows.slice(-30);
  document.getElementById("stat-last").textContent = last
    ? fmtUsd.format(last.volumeUsd)
    : "—";
  document.getElementById("stat-7d").textContent = fmtUsd.format(sumVolume(last7));
  document.getElementById("stat-30d").textContent = fmtUsd.format(sumVolume(last30));
  document.getElementById("stat-rows").textContent = String(rows.length);
}

function compare(a, b, key) {
  if (key === "date") return a.date.localeCompare(b.date);
  if (key === "volumeUsd") return a.volumeUsd - b.volumeUsd;
  if (key === "dodPct") {
    const av = a.dodPct == null ? -Infinity : a.dodPct;
    const bv = b.dodPct == null ? -Infinity : b.dodPct;
    return av - bv;
  }
  return 0;
}

function sortedRows(rows) {
  const copy = rows.slice();
  copy.sort((a, b) => {
    const c = compare(a, b, sortKey);
    return sortDir === "asc" ? c : -c;
  });
  return copy;
}

function renderTable(rows) {
  const q = document.getElementById("filter-q").value.trim().toLowerCase();
  let filtered = rows;
  if (q) {
    filtered = rows.filter((r) => r.date.includes(q));
  }
  const body = document.getElementById("tbody");
  body.innerHTML = "";
  const sorted = sortedRows(filtered);
  for (const r of sorted) {
    const tr = document.createElement("tr");
    const pct = r.dodPct;
    let pctClass = "pct-na";
    if (pct != null) pctClass = pct >= 0 ? "pct-up" : "pct-down";
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${fmtUsd.format(r.volumeUsd)}</td>
      <td class="${pctClass}">${fmtPct(pct)}</td>`;
    body.appendChild(tr);
  }
  document.getElementById("table-count").textContent = `${sorted.length} 行`;
}

function renderChart(rows) {
  const labels = rows.map((r) => r.date);
  const data = rows.map((r) => r.volumeUsd);
  const ctx = document.getElementById("vol-chart").getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, "rgba(94, 234, 212, 0.35)");
  gradient.addColorStop(1, "rgba(94, 234, 212, 0)");

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "DEX volume (USD)",
          data,
          borderColor: "#5eead4",
          backgroundColor: gradient,
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => fmtUsd.format(ctx.raw),
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: {
            color: "#8b93a7",
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: {
            color: "#8b93a7",
            callback: (v) => {
              if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
              if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
              if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
              return `$${v}`;
            },
          },
        },
      },
    },
  });
}

function updateSortHints() {
  document.querySelectorAll("th[data-sort]").forEach((h) => {
    const hint = h.querySelector(".hint");
    hint.textContent =
      h.dataset.sort === sortKey ? (sortDir === "asc" ? "▲" : "▼") : "";
  });
}

function refresh() {
  const rows = sliceByRange(allRows, rangeDays);
  updateStats(allRows);
  renderChart(rows);
  renderTable(rows);
  updateSortHints();
}

function setRange(days, btn) {
  rangeDays = days;
  document.querySelectorAll(".segmented button[data-range]").forEach((b) => {
    b.classList.toggle("active", b === btn);
  });
  refresh();
}

function toggleSort(key) {
  if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
  else {
    sortKey = key;
    sortDir = "desc";
  }
  refresh();
}

function exportCsv() {
  const rows = sliceByRange(allRows, rangeDays);
  const sorted = sortedRows(rows);
  const lines = ["date_utc,dex_volume_usd,dod_change_pct"];
  for (const r of sorted) {
    const dod =
      r.dodPct == null ? "" : String(Number(r.dodPct.toFixed(4)));
    lines.push(`${r.date},${r.volumeUsd},${dod}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `project-x-dex-volume-${rangeDays}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function loadData() {
  const banner = document.getElementById("err-banner");
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    const embed = document.getElementById("embed-data");
    if (embed) {
      try {
        return JSON.parse(embed.textContent);
      } catch {
        /* fallthrough */
      }
    }
    banner.textContent =
      "无法加载 data.json。请在目录下运行本地服务器：python3 -m http.server 8765，然后打开 http://localhost:8765";
    banner.classList.add("visible");
    throw e;
  }
}

async function main() {
  const payload = await loadData();
  allRows = payload.rows || [];
  document.getElementById("src-line").textContent = payload.source || "—";

  document.querySelectorAll(".segmented button[data-range]").forEach((btn) => {
    btn.addEventListener("click", () => setRange(btn.dataset.range, btn));
  });

  document.getElementById("filter-q").addEventListener("input", () => refresh());

  document.getElementById("btn-export").addEventListener("click", exportCsv);

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => toggleSort(th.dataset.sort));
  });

  const activeBtn = document.querySelector('.segmented button[data-range="30"]');
  if (activeBtn) activeBtn.classList.add("active");

  refresh();
}

main().catch(() => {});
