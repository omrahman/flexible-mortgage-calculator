import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// --- helpers ---
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number.isFinite(n) ? n : 0
  );

const round2 = (n: number) => Math.round(n * 100) / 100;

const parseMonthInput = (txt: string): number[] => {
  // Accept comma-separated numbers and ranges like 12-18
  if (!txt.trim()) return [];
  const parts = txt
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const months: number[] = [];
  for (const p of parts) {
    if (/^\d+-\d+$/.test(p)) {
      const [a, b] = p.split("-").map((x) => parseInt(x, 10));
      if (a > 0 && b >= a) {
        for (let i = a; i <= b; i++) months.push(i);
      }
    } else if (/^\d+$/.test(p)) {
      const v = parseInt(p, 10);
      if (v > 0) months.push(v);
    }
  }
  return Array.from(new Set(months)).sort((a, b) => a - b);
};

function calcPayment(principal: number, rMonthly: number, nMonths: number): number {
  if (nMonths <= 0) return 0;
  if (Math.abs(rMonthly) < 1e-12) return round2(principal / nMonths);
  const pmt = (principal * rMonthly) / (1 - Math.pow(1 + rMonthly, -nMonths));
  return round2(pmt);
}

function addMonths(ymStr: string, plus: number): string {
  // ymStr: "YYYY-MM"
  const [Y, M] = ymStr.split("-").map((x) => parseInt(x, 10));
  const d = new Date(Date.UTC(Y, (M - 1) + plus, 1));
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

// --- core schedule builder ---
interface ExtraMap {
  [monthIndex: number]: number; // 1-based month index -> extra amount
}

interface Row {
  idx: number;
  date: string; // YYYY-MM
  payment: number; // scheduled P&I this month (capped to payoff)
  interest: number;
  principal: number;
  extra: number; // extra paid this month
  total: number; // total cash out this month
  balance: number; // ending balance after this month
  recast?: boolean; // did a recast trigger at end of this month
  newPayment?: number; // if recast, new scheduled P&I
}

interface ScheduleResult {
  rows: Row[];
  totalInterest: number;
  totalPaid: number;
  payoffMonth: number; // 1-based index of final month
  segments: { start: number; payment: number }[]; // payment changes over time
  chart: { name: string; balance: number }[];
}

function buildSchedule({
  principal,
  annualRatePct,
  termMonths,
  startYM,
  extras,
  recastMonths,
  autoRecastOnExtra,
}: {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  startYM: string;
  extras: ExtraMap;
  recastMonths: Set<number>;
  autoRecastOnExtra: boolean;
}): ScheduleResult {
  const r = annualRatePct / 100 / 12;
  let bal = round2(principal);
  let payment = calcPayment(bal, r, termMonths);
  const rows: Row[] = [];
  const segments: { start: number; payment: number }[] = [{ start: 1, payment }];
  let totalInterest = 0;
  let totalPaid = 0;

  // Safety: guard against pathological loops.
  const maxIters = termMonths + 600; // allows for recasts/rounding edge cases

  for (let m = 1; m <= maxIters && bal > 0.001; m++) {
    const monthsRemaining = Math.max(0, termMonths - (m - 1));
    const date = addMonths(startYM, m - 1);
    const interest = round2(bal * r);

    // Scheduled payment cannot exceed payoff amount (bal + interest)
    const scheduled = Math.min(payment, round2(bal + interest));
    let principalPart = round2(scheduled - interest);
    if (principalPart < 0) principalPart = 0; // paranoia guard

    const plannedExtra = round2(extras[m] || 0);
    const maxExtra = round2(bal - principalPart);
    const extra = Math.max(0, Math.min(plannedExtra, maxExtra));

    const cashThisMonth = round2(scheduled + extra);

    totalInterest = round2(totalInterest + interest);
    totalPaid = round2(totalPaid + cashThisMonth);

    bal = round2(bal - principalPart - extra);

    let didRecast = false;
    let newPayment: number | undefined;

    const shouldRecast =
      (recastMonths.has(m) || (autoRecastOnExtra && extra > 0)) && monthsRemaining > 0 && bal > 0;

    if (shouldRecast) {
      didRecast = true;
      const remaining = monthsRemaining; // keep the original maturity date
      newPayment = calcPayment(bal, r, remaining);
      if (Math.abs(newPayment - payment) > 0.005) {
        payment = newPayment;
        segments.push({ start: m + 1, payment });
      }
    }

    rows.push({
      idx: m,
      date,
      payment: scheduled,
      interest,
      principal: principalPart,
      extra,
      total: cashThisMonth,
      balance: bal,
      recast: didRecast || undefined,
      newPayment,
    });

    // If we've reached the contractual maturity but tiny balance remains due to rounding,
    // tack on one last payoff row.
    if (m === termMonths && bal > 0.001) {
      const payoffInterest = round2(bal * r);
      const payoffTotal = round2(bal + payoffInterest);
      totalInterest = round2(totalInterest + payoffInterest);
      totalPaid = round2(totalPaid + payoffTotal);
      bal = 0;
      rows.push({
        idx: m + 1,
        date: addMonths(startYM, m),
        payment: payoffTotal,
        interest: payoffInterest,
        principal: round2(payoffTotal - payoffInterest),
        extra: 0,
        total: payoffTotal,
        balance: 0,
      });
      break;
    }
  }

  const chart = rows.map((r) => ({ name: `${r.idx}\n${r.date}`, balance: r.balance }));

  return {
    rows,
    totalInterest,
    totalPaid,
    payoffMonth: rows[rows.length - 1]?.idx ?? 0,
    segments,
    chart,
  };
}

function csvFor(rows: Row[]) {
  const header = [
    "Month",
    "Date",
    "Scheduled Payment",
    "Interest",
    "Principal",
    "Extra",
    "Total Paid",
    "Ending Balance",
    "Recast?",
    "New Payment",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.idx,
        r.date,
        r.payment.toFixed(2),
        r.interest.toFixed(2),
        r.principal.toFixed(2),
        r.extra.toFixed(2),
        r.total.toFixed(2),
        r.balance.toFixed(2),
        r.recast ? "YES" : "",
        r.newPayment ? r.newPayment.toFixed(2) : "",
      ].join(",")
    );
  }
  return lines.join("\n");
}

// --- UI ---
export default function MortgageRecastCalculator() {
  const [principal, setPrincipal] = useState("550000");
  const [rate, setRate] = useState("6.75");
  const [termYears, setTermYears] = useState("30");
  const [startYM, setStartYM] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${y}-${m}`;
  });

  type ExtraItem = { id: string; month: number; amount: number };
  const [extras, setExtras] = useState<ExtraItem[]>([
    { id: crypto.randomUUID(), month: 6, amount: 10000 },
    { id: crypto.randomUUID(), month: 12, amount: 5000 },
  ]);

  const [autoRecast, setAutoRecast] = useState(true);
  const [recastMonthsText, setRecastMonthsText] = useState("");
  const [showAll, setShowAll] = useState(false);

  const termMonths = Math.max(1, Math.round(Number(termYears) * 12));

  const extrasMap = useMemo(() => {
    const map: ExtraMap = {};
    for (const e of extras) {
      if (!Number.isFinite(e.month) || e.month < 1) continue;
      const m = Math.min(termMonths, Math.round(e.month));
      map[m] = round2((map[m] || 0) + Math.max(0, e.amount));
    }
    return map;
  }, [extras, termMonths]);

  const recastSet = useMemo(() => {
    const set = new Set<number>();
    for (const m of parseMonthInput(recastMonthsText)) set.add(m);
    return set;
  }, [recastMonthsText]);

  const params = useMemo(
    () => ({
      principal: Number(principal) || 0,
      annualRatePct: Number(rate) || 0,
      termMonths,
      startYM,
      extras: extrasMap,
      recastMonths: recastSet,
      autoRecastOnExtra: autoRecast,
    }),
    [principal, rate, termMonths, startYM, extrasMap, recastSet, autoRecast]
  );

  const result = useMemo(() => buildSchedule(params), [params]);

  const baseline = useMemo(
    () =>
      buildSchedule({
        principal: params.principal,
        annualRatePct: params.annualRatePct,
        termMonths: params.termMonths,
        startYM: params.startYM,
        extras: {},
        recastMonths: new Set<number>(),
        autoRecastOnExtra: false,
      }),
    [params.principal, params.annualRatePct, params.termMonths, params.startYM]
  );

  const interestSaved = round2(baseline.totalInterest - result.totalInterest);
  const monthsSaved = Math.max(0, baseline.payoffMonth - result.payoffMonth);

  const handleAddExtra = () => {
    setExtras((xs) => [
      ...xs,
      { id: crypto.randomUUID(), month: 1, amount: 1000 },
    ]);
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([csvFor(result.rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "amortization_recast_schedule.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-xl font-semibold mb-4">Loan</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2">
                <span className="text-sm text-gray-600">Principal</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="number"
                  min={0}
                  step="1000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                />
              </label>
              <label>
                <span className="text-sm text-gray-600">Rate (APR %)</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="number"
                  min={0}
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </label>
              <label>
                <span className="text-sm text-gray-600">Term (years)</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="number"
                  min={1}
                  step="1"
                  value={termYears}
                  onChange={(e) => setTermYears(e.target.value)}
                />
              </label>
              <label className="col-span-2">
                <span className="text-sm text-gray-600">Start (YYYY-MM)</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="month"
                  value={startYM}
                  onChange={(e) => setStartYM(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow space-y-4">
            <h2 className="text-xl font-semibold">Extra Payments</h2>
            <p className="text-sm text-gray-600">Add lump sums by month number (1 = first month). If multiple extras land on the same month, they aggregate.</p>
            <div className="space-y-2">
              {extras.map((e, i) => (
                <div key={e.id} className="grid grid-cols-7 gap-2 items-end">
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">Month #</span>
                    <input
                      className="mt-1 w-full rounded-xl border p-2"
                      type="number"
                      min={1}
                      max={termMonths}
                      step="1"
                      value={e.month}
                      onChange={(ev) => {
                        const v = parseInt(ev.target.value || "0", 10);
                        setExtras((xs) => xs.map((x) => (x.id === e.id ? { ...x, month: v } : x)));
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs text-gray-500">Amount</span>
                    <input
                      className="mt-1 w-full rounded-xl border p-2"
                      type="number"
                      min={0}
                      step="100"
                      value={e.amount}
                      onChange={(ev) => {
                        const v = parseFloat(ev.target.value || "0");
                        setExtras((xs) => xs.map((x) => (x.id === e.id ? { ...x, amount: v } : x)));
                      }}
                    />
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <button
                      className="mt-6 flex-1 rounded-xl border px-3 py-2 hover:bg-gray-50"
                      onClick={() =>
                        setExtras((xs) => xs.filter((x) => x.id !== e.id))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <button
                  className="rounded-xl bg-black text-white px-4 py-2"
                  onClick={handleAddExtra}
                >
                  + Add Extra
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRecast}
                  onChange={(e) => setAutoRecast(e.target.checked)}
                />
                <span>Recast automatically after any month with an extra payment</span>
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Additionally recast on these months (e.g. 24, 60-72)</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  placeholder=""
                  value={recastMonthsText}
                  onChange={(e) => setRecastMonthsText(e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Original Payment" value={fmtUSD(baseline.segments[0]?.payment || 0)} />
              <SummaryCard label="Current Payment" value={fmtUSD(result.segments[result.segments.length - 1]?.payment || 0)} />
              <SummaryCard label="Total Interest (baseline)" value={fmtUSD(baseline.totalInterest)} />
              <SummaryCard label="Total Interest (this plan)" value={fmtUSD(result.totalInterest)} />
              <SummaryCard label="Interest Saved" value={fmtUSD(interestSaved)} highlight={interestSaved > 0} />
              <SummaryCard label="Payoff (baseline)" value={`${baseline.payoffMonth} mo`} />
              <SummaryCard label="Payoff (this plan)" value={`${result.payoffMonth} mo`} />
              <SummaryCard label="Months Saved" value={`${monthsSaved}`} highlight={monthsSaved > 0} />
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Payment segments</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {result.segments.map((s, i) => (
                  <span key={i} className="rounded-full border px-3 py-1">
                    from m{s.start}: {fmtUSD(s.payment)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-xl font-semibold mb-4">Balance Over Time</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chart} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} domain={[0, 'dataMax']} />
                  <Tooltip formatter={(v: any) => fmtUSD(v as number)} labelFormatter={(l) => `Month ${l.split("\n")[0]}`} />
                  <Line type="monotone" dataKey="balance" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Amortization Schedule</h2>
              <div className="flex gap-2">
                <button className="rounded-xl border px-3 py-2" onClick={() => setShowAll((s) => !s)}>
                  {showAll ? "Show first 24" : "Show all"}
                </button>
                <button className="rounded-xl bg-black text-white px-3 py-2" onClick={handleDownloadCSV}>
                  Download CSV
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <Th>Mo</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Payment</Th>
                    <Th className="text-right">Interest</Th>
                    <Th className="text-right">Principal</Th>
                    <Th className="text-right">Extra</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-right">Balance</Th>
                    <Th>Recast</Th>
                    <Th className="text-right">New Pmt</Th>
                  </tr>
                </thead>
                <tbody>
                  {(showAll ? result.rows : result.rows.slice(0, 24)).map((r) => (
                    <tr key={r.idx} className="border-t">
                      <Td>{r.idx}</Td>
                      <Td>{r.date}</Td>
                      <Td className="text-right">{fmtUSD(r.payment)}</Td>
                      <Td className="text-right">{fmtUSD(r.interest)}</Td>
                      <Td className="text-right">{fmtUSD(r.principal)}</Td>
                      <Td className="text-right">{fmtUSD(r.extra)}</Td>
                      <Td className="text-right">{fmtUSD(r.total)}</Td>
                      <Td className="text-right">{fmtUSD(r.balance)}</Td>
                      <Td>{r.recast ? <span className="text-green-700 font-medium">Yes</span> : ""}</Td>
                      <Td className="text-right">{r.newPayment ? fmtUSD(r.newPayment) : ""}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Notes: This sim assumes monthly compounding, level-payment mortgage. Recast keeps the original maturity date, recalculating P&I on the remaining balance. Lenders may charge a fee and have rules; this is a planning tool, not advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-3 py-2 text-xs font-semibold text-gray-600 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 whitespace-nowrap ${className}`}>{children}</td>;
}