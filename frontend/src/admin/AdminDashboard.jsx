import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  Layers,
  Package,
  Users,
  Star,
  Mail,
  Settings2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Download,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  Upload,
  Sparkles,
  Code2,
  Server,
  Smartphone,
  Cloud,
  Brain,
  Shield,
  Database,
  Cpu,
  Globe,
  Rocket,
  Building,
} from "lucide-react";
import api from "../lib/api";

const ICON_OPTIONS = [
  { name: "Code2", icon: Code2 },
  { name: "Server", icon: Server },
  { name: "Smartphone", icon: Smartphone },
  { name: "Cloud", icon: Cloud },
  { name: "Brain", icon: Brain },
  { name: "Shield", icon: Shield },
  { name: "Database", icon: Database },
  { name: "Cpu", icon: Cpu },
  { name: "Globe", icon: Globe },
  { name: "Rocket", icon: Rocket },
];

const TABS = [
  { id: "overview", label: "Dashboard & KPIs", icon: LayoutDashboard },
  { id: "contacts", label: "Inquiries & Leads", icon: Inbox, endpoint: "/api/admin/company/contacts" },
  { id: "services", label: "Services", icon: Briefcase, endpoint: "/api/admin/company/services" },
  { id: "solutions", label: "Solutions & Industries", icon: Layers, endpoint: "/api/admin/company/solutions" },
  { id: "products", label: "Products & Platforms", icon: Package, endpoint: "/api/admin/company/products" },
  { id: "leaders", label: "Leadership Team", icon: Users, endpoint: "/api/admin/company/leaders" },
  { id: "testimonials", label: "Testimonials", icon: Star, endpoint: "/api/admin/company/testimonials" },
  { id: "newsletters", label: "Subscribers", icon: Mail, endpoint: "/api/admin/company/newsletters" },
  { id: "settings", label: "Site Configuration", icon: Settings2, endpoint: "/api/admin/company/settings" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [summaryData, setSummaryData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [toast, setToast] = useState(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Detail view for contact inquiries
  const [viewingContact, setViewingContact] = useState(null);

  // Site settings key-value map
  const [settingsMap, setSettingsMap] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch summary KPI counts
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/summary");
      setSummaryData(res);
    } catch (err) {
      console.error("Summary fetch error:", err);
    }
  }, []);

  // Fetch items for current active tab
  const fetchTabItems = useCallback(async () => {
    const currentTabObj = TABS.find((t) => t.id === activeTab);
    if (!currentTabObj || !currentTabObj.endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(currentTabObj.endpoint);
      const list = Array.isArray(res) ? res : res.results || res.data || [];
      setItems(list);

      if (activeTab === "settings") {
        const map = {};
        list.forEach((s) => {
          map[s.key] = s.value;
        });
        setSettingsMap(map);
      }
    } catch (err) {
      console.error(`Error loading ${activeTab}:`, err);
      showToast(err.message || `Failed to load ${currentTabObj.label}`, "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setSearchQuery("");
    setFilterCategory("ALL");
    if (activeTab === "overview") {
      fetchSummary();
      setLoading(false);
    } else {
      fetchTabItems();
    }
  }, [activeTab, fetchSummary, fetchTabItems]);

  // Filtered items based on search query
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    let res = items;

    if (activeTab === "solutions" && filterCategory !== "ALL") {
      res = res.filter((i) => i.category === filterCategory);
    }

    if (activeTab === "contacts" && filterCategory !== "ALL") {
      res = res.filter((i) => i.interest === filterCategory);
    }

    if (!searchQuery.trim()) return res;
    const q = searchQuery.toLowerCase();

    return res.filter((item) => {
      const text = JSON.stringify(item).toLowerCase();
      return text.includes(q);
    });
  }, [items, searchQuery, activeTab, filterCategory]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingItem(null);
    setPhotoFile(null);
    setPhotoPreview(null);

    let initial = {};
    if (activeTab === "services") {
      initial = {
        service_id: `service-${Date.now()}`,
        title: "",
        desc: "",
        icon: "Code2",
        image: "",
        tags: [],
        items: [],
        is_active: true,
      };
    } else if (activeTab === "solutions") {
      initial = {
        name: "",
        category: "Enterprise Software",
        desc: "",
        display_order: 0,
        is_active: true,
      };
    } else if (activeTab === "products") {
      initial = {
        product_id: `prod-${Date.now()}`,
        title: "",
        desc: "",
        icon: "Package",
        link: "",
        is_active: true,
      };
    } else if (activeTab === "leaders") {
      initial = {
        name: "",
        title: "",
        bio: "",
        email: "",
        linkedin: "",
        twitter: "",
        display_order: 0,
        is_active: true,
      };
    } else if (activeTab === "testimonials") {
      initial = {
        name: "",
        role: "",
        text: "",
        avatar: "",
        is_active: true,
      };
    } else if (activeTab === "settings") {
      initial = {
        key: "",
        value: "",
        description: "",
      };
    }

    setFormData(initial);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setPhotoFile(null);
    setPhotoPreview(item.photo_url || item.photo || null);
    setIsModalOpen(true);
  };

  // Save Modal (POST or PUT/PATCH)
  const handleSaveItem = async (e) => {
    e?.preventDefault();
    setSaving(true);
    const currentTabObj = TABS.find((t) => t.id === activeTab);

    try {
      if (activeTab === "leaders" && photoFile) {
        // Multipart upload
        const data = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
          if (k !== "id" && k !== "photo_url" && k !== "photo" && v !== undefined && v !== null) {
            data.append(k, v);
          }
        });
        data.append("photo", photoFile);

        if (editingItem) {
          await api.patch(`${currentTabObj.endpoint}/${editingItem.id}`, data);
        } else {
          await api.post(currentTabObj.endpoint, data);
        }
      } else {
        // Standard JSON payload
        const payload = { ...formData };
        delete payload.id;
        delete payload.created_at;
        delete payload.updated_at;
        delete payload.photo_url;

        if (editingItem) {
          await api.put(`${currentTabObj.endpoint}/${editingItem.id}`, payload);
        } else {
          await api.post(currentTabObj.endpoint, payload);
        }
      }

      showToast(
        `${currentTabObj.label.slice(0, -1)} ${editingItem ? "updated" : "created"} successfully!`
      );
      setIsModalOpen(false);
      fetchTabItems();
      fetchSummary();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save item.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id, name = "item") => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${name}?`)) return;
    const currentTabObj = TABS.find((t) => t.id === activeTab);

    try {
      await api.delete(`${currentTabObj.endpoint}/${id}`);
      showToast("Item deleted successfully!");
      fetchTabItems();
      fetchSummary();
    } catch (err) {
      showToast(err.message || "Failed to delete item", "error");
    }
  };

  // Toggle Item Active State
  const handleToggleActive = async (item) => {
    const currentTabObj = TABS.find((t) => t.id === activeTab);
    const updatedStatus = !item.is_active;

    try {
      await api.patch(`${currentTabObj.endpoint}/${item.id}`, { is_active: updatedStatus });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: updatedStatus } : i))
      );
      showToast(`Status updated to ${updatedStatus ? "Active" : "Inactive"}`);
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  // Export items to CSV (Inquiries or Newsletters)
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported successfully!");
  };

  // Save site setting batch
  const handleSaveAllSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settingsMap)) {
        const existing = items.find((s) => s.key === key);
        if (existing) {
          await api.put(`/api/admin/settings/${existing.id}`, { key, value, description: existing.description || "" });
        } else {
          await api.post(`/api/admin/settings`, { key, value, description: `Website setting for ${key}` });
        }
      }
      showToast("Website configuration saved successfully!");
      fetchTabItems();
    } catch (err) {
      showToast("Failed to save configuration: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-xl border transition-all animate-bounce-short ${
            toast.type === "error"
              ? "bg-red-500/20 text-red-200 border-red-500/30"
              : "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Primary Tab Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-white/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "contacts"
              ? summaryData?.stats?.contacts_total
              : tab.id === "services"
              ? summaryData?.stats?.services_total
              : tab.id === "solutions"
              ? summaryData?.stats?.solutions_total
              : tab.id === "products"
              ? summaryData?.stats?.products_total
              : tab.id === "leaders"
              ? summaryData?.stats?.leaders_total
              : tab.id === "testimonials"
              ? summaryData?.stats?.testimonials_total
              : tab.id === "newsletters"
              ? summaryData?.stats?.newsletters_total
              : null;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm tracking-wide whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(17,168,49,0.2)]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
            >
              <Icon size={16} className={isActive ? "text-emerald-400" : "text-slate-500"} />
              <span>{tab.label}</span>
              {count !== undefined && count !== null && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive ? "bg-emerald-500/30 text-emerald-200" : "bg-white/10 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW & KPIS */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Client Inquiries</span>
                <Inbox size={18} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">{summaryData?.stats?.contacts_total || 0}</div>
              <p className="text-xs text-slate-500 mt-2">Prospective project leads</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Active Services</span>
                <Briefcase size={18} className="text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {summaryData?.stats?.services_active || 0}
                <span className="text-sm font-normal text-slate-500"> / {summaryData?.stats?.services_total || 0}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Public enterprise offerings</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Solutions & Tech</span>
                <Layers size={18} className="text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-white">{summaryData?.stats?.solutions_total || 0}</div>
              <p className="text-xs text-slate-500 mt-2">Industry solution modules</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Subscribers</span>
                <Mail size={18} className="text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white">{summaryData?.stats?.newsletters_total || 0}</div>
              <p className="text-xs text-slate-500 mt-2">Tech briefing subscribers</p>
            </div>
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Sparkles size={16} /> Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setActiveTab("services");
                  setTimeout(openCreateModal, 150);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Plus size={14} /> Add Service
              </button>
              <button
                onClick={() => {
                  setActiveTab("solutions");
                  setTimeout(openCreateModal, 150);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Plus size={14} /> Add Solution
              </button>
              <button
                onClick={() => {
                  setActiveTab("leaders");
                  setTimeout(openCreateModal, 150);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Plus size={14} /> Add Team Member
              </button>
              <button
                onClick={() => setActiveTab("contacts")}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Inbox size={14} /> Review Inquiries
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Settings2 size={14} /> Edit Company Info & SEO
              </button>
            </div>
          </div>

          {/* Recent Inquiries Feed */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Customer Inquiries</h2>
                <p className="text-xs text-slate-400">Latest business inquiries submitted from the website</p>
              </div>
              <button
                onClick={() => setActiveTab("contacts")}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View All <ExternalLink size={12} />
              </button>
            </div>

            {summaryData?.recent_contacts && summaryData.recent_contacts.length > 0 ? (
              <div className="divide-y divide-white/5">
                {summaryData.recent_contacts.map((c) => (
                  <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        {c.company && (
                          <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400">
                            {c.company}
                          </span>
                        )}
                        {c.interest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            {c.interest}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{c.message}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                      <a
                        href={`mailto:${c.email}?subject=RE: 3CAPSTECH Inquiry&body=Hi ${encodeURIComponent(c.name)},%0D%0A%0D%0AThank you for contacting 3CAPSTECH.`}
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <Mail size={12} /> Reply
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">No recent inquiries found.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. CLIENT INQUIRIES */}
      {activeTab === "contacts" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Client Inquiries & Leads</h2>
              <p className="text-xs text-slate-400">Manage all prospective enterprise clients and inquiries</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportToCSV(items, "3capstech_inquiries")}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all text-slate-200"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by client name, email, company, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL" className="bg-[#060D1A]">All Interests</option>
              <option value="Enterprise Architecture" className="bg-[#060D1A]">Enterprise Architecture</option>
              <option value="Web & Mobile SaaS" className="bg-[#060D1A]">Web & Mobile SaaS</option>
              <option value="AI & Automation" className="bg-[#060D1A]">AI & Automation</option>
              <option value="Cloud Migration" className="bg-[#060D1A]">Cloud Migration</option>
            </select>
          </div>

          {/* Inquiries List */}
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading inquiries...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-500">
              No inquiries match your criteria.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base text-white">{c.name}</h3>
                      {c.company && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {c.company}
                        </span>
                      )}
                      {c.interest && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                          {c.interest}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-400 font-mono">{c.email}</div>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1">{c.message}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingContact(c)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
                    >
                      <Eye size={14} /> View
                    </button>
                    <a
                      href={`mailto:${c.email}?subject=RE: 3CAPSTECH Inquiry&body=Hi ${encodeURIComponent(c.name)},%0D%0A%0D%0AThank you for contacting 3CAPSTECH.`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Mail size={14} /> Reply
                    </a>
                    <button
                      onClick={() => handleDeleteItem(c.id, "inquiry")}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                      title="Delete inquiry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. SERVICES */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Services & Capabilities</h2>
              <p className="text-xs text-slate-400">Manage technical services displayed on the public portal</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Plus size={16} /> Add Service
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading services...</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((s) => (
                <div
                  key={s.id}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Code2 size={20} />
                      </div>
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase transition-all ${
                          s.is_active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {s.is_active ? "Active" : "Hidden"}
                      </button>
                    </div>

                    <h3 className="font-bold text-lg text-white mb-2">{s.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4">{s.desc}</p>

                    {s.tags && s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {s.tags.slice(0, 4).map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 transition-all"
                      title="Edit Service"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(s.id, "service")}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all"
                      title="Delete Service"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. SOLUTIONS & INDUSTRIES */}
      {activeTab === "solutions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Solutions & Industry Modules</h2>
              <p className="text-xs text-slate-400">Industry-specific enterprise solutions</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Plus size={16} /> Add Solution
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((sol) => (
              <div
                key={sol.id}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold uppercase text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                      {sol.category}
                    </span>
                    <button
                      onClick={() => handleToggleActive(sol)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        sol.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {sol.is_active ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white mb-2">{sol.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{sol.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                  <span className="text-[10px] font-mono text-slate-500">Order: {sol.display_order}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(sol)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(sol.id, "solution")}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. PRODUCTS & PLATFORMS */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Products & Platforms</h2>
              <p className="text-xs text-slate-400">Proprietary products engineered by 3CAPSTECH</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Package size={20} />
                    </div>
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        p.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {p.is_active ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white mb-1.5">{p.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mb-3">{p.desc}</p>
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <ExternalLink size={12} /> Launch Platform
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/5">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 transition-all"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(p.id, "product")}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. LEADERSHIP TEAM */}
      {activeTab === "leaders" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Leadership Profiles</h2>
              <p className="text-xs text-slate-400">Executive team members featured on the about page</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Plus size={16} /> Add Leader Profile
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((ldr) => (
              <div
                key={ldr.id}
                className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 bg-slate-900/80 relative overflow-hidden flex items-center justify-center">
                    {ldr.photo_url || ldr.photo ? (
                      <img
                        src={ldr.photo_url || ldr.photo}
                        alt={ldr.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={48} className="text-slate-700" />
                    )}
                    <button
                      onClick={() => handleToggleActive(ldr)}
                      className={`absolute top-3 right-3 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase backdrop-blur-md ${
                        ldr.is_active
                          ? "bg-emerald-500/25 text-emerald-200 border border-emerald-500/40"
                          : "bg-red-500/25 text-red-200 border border-red-500/40"
                      }`}
                    >
                      {ldr.is_active ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-lg text-white">{ldr.name}</h3>
                    <p className="text-xs font-mono text-emerald-400 font-semibold">{ldr.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{ldr.bio}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                  <span className="text-[10px] font-mono text-slate-500">Order: {ldr.display_order}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(ldr)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(ldr.id, "leader profile")}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. TESTIMONIALS */}
      {activeTab === "testimonials" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Client Testimonials</h2>
              <p className="text-xs text-slate-400">Reviews & endorsements from partners and clients</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Plus size={16} /> Add Testimonial
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((t) => (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-emerald-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <button
                      onClick={() => handleToggleActive(t)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {t.is_active ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 italic mb-4">"{t.text}"</p>
                  <div>
                    <h4 className="font-bold text-sm text-white">{t.name}</h4>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/5">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 transition-all"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(t.id, "testimonial")}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. NEWSLETTER SUBSCRIBERS */}
      {activeTab === "newsletters" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Newsletter Subscribers</h2>
              <p className="text-xs text-slate-400">Verified email subscribers to technology updates</p>
            </div>
            <button
              onClick={() => exportToCSV(items, "3capstech_subscribers")}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-2 text-slate-200"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Subscribed Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredItems.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-mono text-emerald-400">{sub.email}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(sub.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(sub.id, "subscriber")}
                        className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. WEBSITE SETTINGS & CONFIGURATION */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Global Website Configuration</h2>
              <p className="text-xs text-slate-400">
                Configure company brand parameters, contact details, social channels, and counters
              </p>
            </div>
            <button
              onClick={handleSaveAllSettings}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save All Configuration"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact & Organization Details */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
                <Building size={16} /> Company & Contact Coordinates
              </h3>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Official Brand Name</label>
                <input
                  type="text"
                  value={settingsMap.brand_name || "3CAPSTECH Software Private Limited"}
                  onChange={(e) => setSettingsMap({ ...settingsMap, brand_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Support & Inquiry Email</label>
                <input
                  type="email"
                  value={settingsMap.email || "md.3capstech@gmail.com"}
                  onChange={(e) => setSettingsMap({ ...settingsMap, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Direct Phone / Hotline</label>
                <input
                  type="text"
                  value={settingsMap.phone || "+91 94409 99908"}
                  onChange={(e) => setSettingsMap({ ...settingsMap, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Physical Registered Address</label>
                <textarea
                  rows={3}
                  value={
                    settingsMap.address ||
                    "Phase 2, Shanthi Nilayam, 15-25/648, Kukatpally Housing Board Colony, KPHB Phase 2, Kukatpally, Hyderabad, Telangana 500085"
                  }
                  onChange={(e) => setSettingsMap({ ...settingsMap, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Social & SEO / Live Stats */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
                <Globe size={16} /> Social Channels & Impact Metrics
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Projects Delivered</label>
                  <input
                    type="text"
                    value={settingsMap.stat_projects || "240+"}
                    onChange={(e) => setSettingsMap({ ...settingsMap, stat_projects: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Client Retention</label>
                  <input
                    type="text"
                    value={settingsMap.stat_satisfaction || "98%"}
                    onChange={(e) => setSettingsMap({ ...settingsMap, stat_satisfaction: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Engineers Count</label>
                  <input
                    type="text"
                    value={settingsMap.stat_engineers || "50+"}
                    onChange={(e) => setSettingsMap({ ...settingsMap, stat_engineers: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Active Clients</label>
                  <input
                    type="text"
                    value={settingsMap.stat_clients || "120+"}
                    onChange={(e) => setSettingsMap({ ...settingsMap, stat_clients: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={settingsMap.linkedin || "https://linkedin.com/company/3capstech"}
                  onChange={(e) => setSettingsMap({ ...settingsMap, linkedin: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">WhatsApp Direct Link</label>
                <input
                  type="text"
                  value={settingsMap.whatsapp || "https://wa.me/919440999908"}
                  onChange={(e) => setSettingsMap({ ...settingsMap, whatsapp: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: CONTACT INQUIRY */}
      {viewingContact && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#060D1A] border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{viewingContact.name}</h3>
                <p className="text-xs text-emerald-400 font-mono">{viewingContact.email}</p>
              </div>
              <button
                onClick={() => setViewingContact(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block">Company</span>
                  <span className="text-slate-200 font-semibold">{viewingContact.company || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Service of Interest</span>
                  <span className="text-emerald-300 font-semibold">{viewingContact.interest || "General"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Received At</span>
                  <span className="text-slate-200 font-mono">
                    {new Date(viewingContact.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Full Message</span>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {viewingContact.message}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setViewingContact(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
              >
                Close
              </button>
              <a
                href={`mailto:${viewingContact.email}?subject=RE: 3CAPSTECH Inquiry&body=Hi ${encodeURIComponent(viewingContact.name)},%0D%0A%0D%0AThank you for contacting 3CAPSTECH.`}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-2"
              >
                <Mail size={14} /> Send Email Reply
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#060D1A] border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-emerald-400">
                {editingItem ? "Edit" : "Create New"}{" "}
                {TABS.find((t) => t.id === activeTab)?.label.slice(0, -1) || "Item"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Leader Photo Upload */}
              {activeTab === "leaders" && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={28} className="text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200">
                        <Upload size={14} /> Choose Image File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPhotoFile(file);
                              setPhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1">PNG, JPG or WEBP recommended</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Fields Based on Tab */}
              {activeTab === "services" && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Service Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.desc || ""}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Icon Style</label>
                      <select
                        value={formData.icon || "Code2"}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full bg-[#060D1A] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.name} value={opt.name}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Hero Image URL</label>
                      <input
                        type="url"
                        value={formData.image || ""}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.tags) ? formData.tags.join(", ") : formData.tags || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. React, Node.js, Python, AWS"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                </>
              )}

              {activeTab === "solutions" && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Solution Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Industry / Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Healthcare, Education, FinTech"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.display_order ?? 0}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.desc || ""}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                </>
              )}

              {activeTab === "products" && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Product Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.desc || ""}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Launch / Demo URL</label>
                      <input
                        type="url"
                        value={formData.link || ""}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        placeholder="https://product.3capstech.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Icon Style</label>
                      <select
                        value={formData.icon || "Package"}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full bg-[#060D1A] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.name} value={opt.name}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "leaders" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Executive Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Founder & CEO"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Professional Bio</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.bio || ""}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">LinkedIn</label>
                      <input
                        type="url"
                        value={formData.linkedin || ""}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.display_order ?? 0}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "testimonials" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Author Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Role & Company</label>
                      <input
                        type="text"
                        required
                        value={formData.role || ""}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. CTO, FinTech Corp"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Client Quote / Review</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.text || ""}
                      onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                </>
              )}

              {/* Status checkbox for active */}
              {formData.hasOwnProperty("is_active") && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_check"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <label htmlFor="is_active_check" className="text-xs font-semibold text-slate-200">
                    Visible on live website (Active)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-900/40"
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
