import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Building2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import Topbar from "@/components/Topbar";
import { PanelHeader, EmptyState } from "@/components/common/UI";

export default function CompaniesPage() {
  const [params] = useSearchParams();
  const { setCompanyId } = useAppStore();
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [form, setForm] = useState({ name: "", industry: "SaaS", stage: "Seed", starting_cash: 500000, monthly_burn: 60000 });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
  setLoading(true);

  try {
    const res = await api.listCompanies();

    console.log("Companies API:", res);

    setItems(Array.isArray(res) ? res : []);
  } catch (err) {
    console.error("Companies Error:", err);

    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Data:", err.response.data);
    }

    setItems([]);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
  const submit = async (e) => {
  e.preventDefault();

  console.log("Submitting:", form);

  try {
    const c = await api.createCompany({
      ...form,
      starting_cash: Number(form.starting_cash),
      monthly_burn: Number(form.monthly_burn),
    });

    console.log("Create response:", c);

    setForm({
      name: "",
      industry: "SaaS",
      stage: "Seed",
      starting_cash: 500000,
      monthly_burn: 60000,
    });

    setCreating(false);
    await refresh();

    if (c?.id) {
      setCompanyId(c.id);
    }
  } catch (err) {
    console.error("Create Company Error:", err);
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
};
console.log("Items state:", items);
  return (
    <>
      <Topbar
  title="Companies"
  subtitle={`${Array.isArray(items) ? items.length : 0} portfolio companies`}
  right={
    <button
      onClick={() => setCreating(v => !v)}
      className="btn-primary btn"
      data-testid="new-company-button"
    >
      <Plus size={13} />
      {creating ? "Cancel" : "New Company"}
    </button>
  }
/>

      <div className="flex flex-col gap-4">
        {creating && (
          <motion.form
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={submit} className="glass-strong p-5"
            data-testid="create-company-form"
          >
            <PanelHeader title="Create Company" subtitle="Seed strategic mandate-ready company" />
            <div className="grid md:grid-cols-2 gap-3 p-4">
              {[
                ["name", "Company name", "text", true],
                ["industry", "Industry", "text"],
                ["stage", "Stage (e.g. Seed, Series A)", "text"],
                ["starting_cash", "Starting cash ($)", "number"],
                ["monthly_burn", "Monthly burn ($)", "number"],
              ].map(([k, label, type, required]) => (
                <label key={k} className="flex flex-col gap-1.5">
                  <span className="label-mono">{label}</span>
                  <input
                    data-testid={k === "name" ? "company-name-input" : `field-${k}`}
                    className="input" type={type} required={required}
                    value={form[k]} onChange={(e) => setForm(f => ({ ...f, [k]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <div className="p-4 pt-0">
              <button type="submit" className="btn-primary btn" data-testid="create-company-submit">
                <Plus size={13} /> Create
              </button>
            </div>
          </motion.form>
        )}

        <div className="glass">
          <PanelHeader title="Portfolio" subtitle="All companies created in this workspace" />
          {loading && <div className="p-6 label-mono">Loading…</div>}
          {!loading && items.length === 0 && (
            <EmptyState icon={Building2} title="No companies yet" hint="Create your first company to start a simulation." />
          )}
          {!loading && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCompanyId(c.id)}
                  className="glass-soft p-4 text-left transition-all hover:bg-white/5"
                  data-testid={`company-card-${c.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-md grid place-items-center font-display font-bold text-sm"
                         style={{ background: "linear-gradient(135deg,#5B8DEF,#8B5CF6)", color: "#0a0a0f" }}>
                      {c.name.slice(0,1).toUpperCase()}
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-3)" }} />
                  </div>
                  <div className="font-display text-[16px] font-semibold tracking-tight">{c.name}</div>
                  <div className="font-mono text-[10.5px] mt-1" style={{ color: "var(--text-3)" }}>
                    {c.industry} · {c.stage}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="glass-soft p-2">
                      <div className="label-mono">Cash</div>
                      <div className="text-[12.5px] mt-1">${((c.starting_cash ?? 0) / 1000).toFixed(0)}k</div>
                    </div>
                    <div className="glass-soft p-2">
                      <div className="label-mono">Burn / mo</div>
                      <div className="text-[12.5px] mt-1" style={{ color: "var(--danger)" }}>${((c.monthly_burn ?? 0) / 1000).toFixed(0)}k</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
