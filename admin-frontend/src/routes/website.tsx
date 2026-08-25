import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Globe,
  HelpCircle,
  Inbox,
  Layers,
  MessageSquare,
  PenTool,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "../components/AdminShell";
import {
  fetchCMSDashboard,
  fetchLegalDocs,
  fetchLegalDocDetail,
  saveLegalDraft,
  publishLegalDoc,
  fetchAdminFaqs,
  createAdminFaq,
  updateAdminFaq,
  deleteAdminFaq,
  fetchContactMessages,
  updateContactStatus,
  fetchWebsiteSettings,
  updateWebsiteSettings,
  type CMSDashboardData,
  type LegalDocSummary,
  type LegalDocDetail,
  type WebsiteFaq,
  type ContactMessage,
  type WebsiteSettings,
} from "../api/cms";

export const Route = createFileRoute("/website")({
  head: () => ({
    meta: [
      { title: "Website & CMS Console — QuickPress Admin" },
      {
        name: "description",
        content: "Manage public website content, legal versioning, FAQs, and customer inquiries.",
      },
    ],
  }),
  component: WebsiteCMSPage,
});

type TabType = "legal" | "faqs" | "inbox" | "settings";

function WebsiteCMSPage() {
  const [activeTab, setActiveTab] = useState<TabType>("legal");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CMSDashboardData | null>(null);

  // Legal state
  const [legalDocs, setLegalDocs] = useState<LegalDocSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("privacy-policy");
  const [selectedDoc, setSelectedDoc] = useState<LegalDocDetail | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState("");
  const [changeLog, setChangeLog] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [legalMessage, setLegalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

  // FAQs state
  const [faqs, setFaqs] = useState<WebsiteFaq[]>([]);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState("all");
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<WebsiteFaq | null>(null);
  const [faqForm, setFaqForm] = useState({ category: "General", question: "", answer: "", sortOrder: 1, isPublished: true });

  // Inbound Messages state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [msgStatusFilter, setMsgStatusFilter] = useState("all");

  // Brand Settings state
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [dashData, docsData, faqsData, msgsData, setsData] = await Promise.all([
        fetchCMSDashboard(),
        fetchLegalDocs(),
        fetchAdminFaqs(),
        fetchContactMessages(),
        fetchWebsiteSettings(),
      ]);
      setDashboard(dashData);
      setLegalDocs(docsData);
      setFaqs(faqsData);
      setMessages(msgsData);
      setSettings(setsData);
      if (docsData.length > 0) {
        setSelectedSlug(docsData[0].slug);
      }
    } catch (e) {
      console.error("Failed to load CMS data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load single legal document detail when selection changes
  useEffect(() => {
    if (!selectedSlug) return;
    setDocLoading(true);
    fetchLegalDocDetail(selectedSlug)
      .then((doc) => {
        setSelectedDoc(doc);
        const source = doc.draft || doc;
        setEditTitle(source.title || "");
        setEditSummary(source.summary || "");
        setEditContent(source.content || "");
      })
      .catch((e) => console.error("Failed to fetch legal doc detail:", e))
      .finally(() => setDocLoading(false));
  }, [selectedSlug]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (!selectedSlug) return;
    setIsSavingDraft(true);
    setLegalMessage(null);
    try {
      await saveLegalDraft(selectedSlug, {
        title: editTitle,
        summary: editSummary,
        content: editContent,
      });
      setLegalMessage({ type: "success", text: "Draft saved successfully. Live users will continue to see the current published version until you publish." });
      // Refresh
      const [updatedDoc, updatedDocs] = await Promise.all([
        fetchLegalDocDetail(selectedSlug),
        fetchLegalDocs(),
      ]);
      setSelectedDoc(updatedDoc);
      setLegalDocs(updatedDocs);
    } catch (e: any) {
      setLegalMessage({ type: "error", text: e.message || "Failed to save draft." });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Publish
  const handlePublish = async () => {
    if (!selectedSlug) return;
    setIsPublishing(true);
    setLegalMessage(null);
    try {
      // First ensure draft is saved
      await saveLegalDraft(selectedSlug, {
        title: editTitle,
        summary: editSummary,
        content: editContent,
      });
      const res = await publishLegalDoc(selectedSlug, changeLog || "Admin update");
      setLegalMessage({ type: "success", text: `Published version ${res.version} successfully! It is now live across the customer platform.` });
      setChangeLog("");
      const [updatedDoc, updatedDocs] = await Promise.all([
        fetchLegalDocDetail(selectedSlug),
        fetchLegalDocs(),
      ]);
      setSelectedDoc(updatedDoc);
      setLegalDocs(updatedDocs);
    } catch (e: any) {
      setLegalMessage({ type: "error", text: e.message || "Failed to publish document." });
    } finally {
      setIsPublishing(false);
    }
  };

  // FAQ CRUD
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await updateAdminFaq(editingFaq.id, faqForm);
      } else {
        await createAdminFaq(faqForm);
      }
      setIsFaqModalOpen(false);
      setEditingFaq(null);
      setFaqForm({ category: "General", question: "", answer: "", sortOrder: faqs.length + 1, isPublished: true });
      const refreshed = await fetchAdminFaqs();
      setFaqs(refreshed);
    } catch (e: any) {
      alert(e.message || "Failed to save FAQ");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await deleteAdminFaq(id);
      setFaqs(faqs.filter((f) => f.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete FAQ");
    }
  };

  // Message Status update
  const handleMessageStatus = async (id: string, status: ContactMessage["status"]) => {
    try {
      await updateContactStatus(id, status);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    } catch (e: any) {
      alert(e.message || "Failed to update inquiry status");
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      await updateWebsiteSettings(settings);
      alert("Website brand and compliance settings saved successfully!");
    } catch (e: any) {
      alert(e.message || "Failed to save website settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered lists
  const filteredFaqs = useMemo(() => {
    if (faqCategoryFilter === "all") return faqs;
    return faqs.filter((f) => f.category === faqCategoryFilter);
  }, [faqs, faqCategoryFilter]);

  const filteredMessages = useMemo(() => {
    if (msgStatusFilter === "all") return messages;
    return messages.filter((m) => m.status === msgStatusFilter);
  }, [messages, msgStatusFilter]);

  const categories = useMemo(() => {
    const set = new Set(faqs.map((f) => f.category));
    return ["all", ...Array.from(set)];
  }, [faqs]);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Website & Compliance CMS
            </h1>
            <p className="text-sm text-slate-500">
              Manage public website legal policies, version histories, FAQs, and inbound inquiries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadInitialData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <a
              href="https://quickpress.online"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
            >
              <ArrowUpRight className="h-4 w-4" />
              View Live Website
            </a>
          </div>
        </div>

        {/* Overview Stat Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal Documents</span>
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{dashboard.legalDocsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Version controlled policies</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published FAQs</span>
                <HelpCircle className="h-5 w-5 text-sky-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{dashboard.faqsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Self-service help topics</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Inquiries</span>
                <Inbox className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{dashboard.totalInquiries}</p>
              <p className="text-xs text-slate-500 mt-1">Direct website messages</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Leads</span>
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-3 text-2xl font-bold text-amber-600">{dashboard.newInquiries}</p>
              <p className="text-xs text-slate-500 mt-1">Awaiting response</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("legal")}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition ${
                activeTab === "legal"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Legal Policies & Versioning
            </button>
            <button
              onClick={() => setActiveTab("faqs")}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition ${
                activeTab === "faqs"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              FAQs & Self Service ({faqs.length})
            </button>
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition ${
                activeTab === "inbox"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Inbox className="h-4 w-4" />
              Inbound Inquiries
              {dashboard && dashboard.newInquiries > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {dashboard.newInquiries}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Settings className="h-4 w-4" />
              Brand & Compliance Settings
            </button>
          </nav>
        </div>

        {/* Tab 1: Legal Policies & Versioning */}
        {activeTab === "legal" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Sidebar with document list */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Legal Policy</h3>
              <div className="space-y-2">
                {legalDocs.map((doc) => {
                  const isSelected = doc.slug === selectedSlug;
                  return (
                    <button
                      key={doc.slug}
                      onClick={() => setSelectedSlug(doc.slug)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">{doc.title}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          v{doc.currentVersion}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Slug: /{doc.slug}</span>
                        {doc.hasDraft ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                            <Clock className="h-3 w-3" /> Draft Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Published
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Version History Card */}
              {selectedDoc && selectedDoc.history && selectedDoc.history.length > 0 && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-slate-400" />
                    Revision History ({selectedDoc.history.length})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {selectedDoc.history.map((rev, i) => (
                      <div key={i} className="border-l-2 border-primary/40 pl-3 py-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Version {rev.version}</span>
                          <span className="text-slate-400">{rev.effectiveDate}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{rev.changeLog || "Published revision"}</p>
                        {rev.publishedBy && <p className="text-[10px] text-slate-400 mt-0.5">By {rev.publishedBy}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document Editor & Publisher */}
            <div className="lg:col-span-8 space-y-4">
              {legalMessage && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                    legalMessage.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {legalMessage.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{legalMessage.type === "success" ? "Success" : "Error"}</p>
                    <p>{legalMessage.text}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{selectedDoc?.title || "Legal Document"}</h2>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        v{selectedDoc?.currentVersion || "1.0"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Public route: <code className="bg-slate-100 px-1 py-0.5 rounded">/api/public/legal/{selectedSlug}</code>
                    </p>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                    <button
                      onClick={() => setPreviewMode("edit")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition ${
                        previewMode === "edit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <FileEdit className="h-3.5 w-3.5" /> Edit Markdown
                    </button>
                    <button
                      onClick={() => setPreviewMode("preview")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition ${
                        previewMode === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Live Preview
                    </button>
                  </div>
                </div>

                {docLoading ? (
                  <div className="py-20 text-center text-slate-400">Loading document content...</div>
                ) : previewMode === "edit" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Policy Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Document Title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Executive Summary
                      </label>
                      <input
                        type="text"
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Brief summary explaining what this policy governs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Full Legal Content (Markdown Supported)
                      </label>
                      <textarea
                        rows={16}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-3.5 font-mono text-xs leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="# Policy Title&#10;&#10;Write markdown content..."
                      />
                    </div>

                    {/* Changelog & Publishing actions */}
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Publication Changelog
                        </label>
                        <input
                          type="text"
                          value={changeLog}
                          onChange={(e) => setChangeLog(e.target.value)}
                          placeholder="e.g. Updated Refund terms per consumer guidelines"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <p className="text-xs text-slate-500">
                          Saving a draft will NOT affect the live app. Publishing immediately bumps version and updates customer apps.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={isSavingDraft || isPublishing}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition shadow-sm"
                          >
                            <Save className="h-4 w-4" />
                            {isSavingDraft ? "Saving..." : "Save Draft"}
                          </button>
                          <button
                            type="button"
                            onClick={handlePublish}
                            disabled={isPublishing || isSavingDraft}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow"
                          >
                            <UploadCloud className="h-4 w-4" />
                            {isPublishing ? "Publishing..." : "Publish to Production"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Preview Mode */
                  <div className="prose max-w-none text-slate-800 space-y-4">
                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preview Summary</p>
                      <p className="text-sm text-slate-700 mt-1">{editSummary}</p>
                    </div>
                    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed border border-slate-100 rounded-lg p-6 bg-white">
                      {editContent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: FAQs */}
        {activeTab === "faqs" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category:</span>
                <select
                  value={faqCategoryFilter}
                  onChange={(e) => setFaqCategoryFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingFaq(null);
                  setFaqForm({ category: "General", question: "", answer: "", sortOrder: faqs.length + 1, isPublished: true });
                  setIsFaqModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
              >
                <Plus className="h-4 w-4" /> Add FAQ Topic
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {faq.category}
                      </span>
                      {faq.isPublished ? (
                        <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                          Live
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 text-slate-400 px-2 py-0.5 text-[10px] font-semibold">
                          Draft
                        </span>
                      )}
                      <span className="text-xs text-slate-400">Order #{faq.sortOrder}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingFaq(faq);
                        setFaqForm({
                          category: faq.category,
                          question: faq.question,
                          answer: faq.answer,
                          sortOrder: faq.sortOrder,
                          isPublished: faq.isPublished,
                        });
                        setIsFaqModalOpen(true);
                      }}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                      title="Edit FAQ"
                    >
                      <PenTool className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 transition"
                      title="Delete FAQ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Create/Edit Modal */}
            {isFaqModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingFaq ? "Edit FAQ Topic" : "Create New FAQ"}
                    </h3>
                    <button
                      onClick={() => setIsFaqModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveFaq} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          required
                          value={faqForm.category}
                          onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          placeholder="e.g. Services, Pricing, Orders"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          required
                          value={faqForm.sortOrder}
                          onChange={(e) => setFaqForm({ ...faqForm, sortOrder: parseInt(e.target.value) || 1 })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        required
                        value={faqForm.question}
                        onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        placeholder="e.g. How does door-to-door pickup work?"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Answer
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={faqForm.answer}
                        onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-primary focus:outline-none"
                        placeholder="Write clear, customer-friendly answer..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        checked={faqForm.isPublished}
                        onChange={(e) => setFaqForm({ ...faqForm, isPublished: e.target.checked })}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="isPublished" className="text-sm font-medium text-slate-700">
                        Publish immediately to website & app
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsFaqModalOpen(false)}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow"
                      >
                        Save FAQ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Inbound Contact Inquiries */}
        {activeTab === "inbox" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
                <select
                  value={msgStatusFilter}
                  onChange={(e) => setMsgStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none"
                >
                  <option value="all">ALL STATUSES</option>
                  <option value="new">NEW ONLY</option>
                  <option value="in-progress">IN PROGRESS</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="archived">ARCHIVED</option>
                </select>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredMessages.length} message(s)
              </span>
            </div>

            {filteredMessages.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <Inbox className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">No inquiries found in this category</p>
                <p className="text-xs text-slate-400 mt-1">Inbound messages from the website contact form will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl border p-5 bg-white shadow-sm transition ${
                      msg.status === "new" ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{msg.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              msg.status === "new"
                                ? "bg-amber-100 text-amber-800"
                                : msg.status === "resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {msg.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>📧 {msg.email}</span>
                          <span>📞 {msg.phone}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject: {msg.subject}</p>
                      <p className="text-sm text-slate-700 mt-1.5 whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <a
                        href={`mailto:${msg.email}?subject=Re: QuickPress inquiry - ${msg.subject}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <Send className="h-3.5 w-3.5" /> Reply via Email
                      </a>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Mark as:</span>
                        <button
                          onClick={() => handleMessageStatus(msg.id, "in-progress")}
                          className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleMessageStatus(msg.id, "resolved")}
                          className="rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Resolved
                        </button>
                        <button
                          onClick={() => handleMessageStatus(msg.id, "archived")}
                          className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-500 hover:bg-slate-200"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Brand & Compliance Settings */}
        {activeTab === "settings" && settings && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-3xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Company & Brand Compliance Settings</h2>
            <p className="text-xs text-slate-500 mb-6">
              These details are automatically displayed across the public footer, legal policy documents, and customer invoices.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={settings.brandName}
                    onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Support Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={settings.gstin || ""}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="09AAACQ1234F1Z5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Corporate CIN Number
                  </label>
                  <input
                    type="text"
                    value={settings.cin || ""}
                    onChange={(e) => setSettings({ ...settings, cin: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="U74999UP2026PTC123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Registered Office Address
                </label>
                <textarea
                  rows={2}
                  value={settings.registeredOffice}
                  onChange={(e) => setSettings({ ...settings, registeredOffice: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {savingSettings ? "Saving Settings..." : "Save Brand Settings"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
