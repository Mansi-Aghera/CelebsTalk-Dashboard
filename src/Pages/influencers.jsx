import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../Central_Store/app_context.jsx";
import { useEffect, useMemo, useState } from "react";

export default function Influencers() {
  const { fetchedData, deleteData, postData, patchData, getServicesData, baseUrl } = useAppContext();

  const [influencers, setInfluencers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState("");
  const [txnRows, setTxnRows] = useState([]);

  const pageSize = 10;
  const STATIC_URL = import.meta?.env?.DEV ? "http://127.0.0.1:8000" : "https://celebstalks.pythonanywhere.com";

  useEffect(() => {
    setInfluencers(Array.isArray(fetchedData.influencers) ? fetchedData.influencers : []);
  }, [fetchedData.influencers]);

  const categoryOptions = useMemo(() => {
    const cats = Array.isArray(fetchedData.categories) ? fetchedData.categories : [];
    return cats
      .filter((c) => c && c.id != null)
      .map((c) => ({ value: String(c.id), label: c.name || `Category #${c.id}` }));
  }, [fetchedData.categories]);

  const filtered = useMemo(() => {
    const safe = Array.isArray(influencers) ? influencers : [];
    if (!query) return safe;

    const q = query.toLowerCase();
    return safe.filter((i) => {
      return (
        String(i?.influencer_id || "").toLowerCase().includes(q) ||
        String(i?.full_name || "").toLowerCase().includes(q) ||
        String(i?.mobile || "").toLowerCase().includes(q) ||
        String(i?.email || "").toLowerCase().includes(q)
      );
    });
  }, [influencers, query]);

  const pageCount = Math.ceil(filtered.length / pageSize) || 1;
  const current = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize).map((row, idx) => ({
      ...row,
      index: startIndex + idx + 1,
    }));
  }, [filtered, page]);

  const normalizeLanguagesToText = (value) => {
    if (Array.isArray(value)) {
      const parts = value.filter((v) => v != null).map((v) => String(v));

      // Handles API returning split JSON fragments like: ["[\"Hindi\"", "\"English\"]"]
      const joined = parts.join(",");
      if (joined.includes("[") && joined.includes("]")) {
        try {
          const parsed = JSON.parse(joined);
          if (Array.isArray(parsed)) return parsed.filter(Boolean).join(", ");
        } catch (e) {}
      }

      return parts.filter(Boolean).join(", ");
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean).join(", ");
        } catch (e) {}
      }
      return value;
    }
    return "";
  };

  const normalizeList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  const getHistoryInfluencerKey = (row) => {
    const candidates = [
      row?.influencer_id,
      row?.influencer,
      row?.influencer_data,
      row?.influencer_data?.influencer_id,
      row?.influencer_data?.email,
      row?.user,
      row?.user_id,
    ];
    for (const c of candidates) {
      if (c == null) continue;
      if (typeof c === "string" || typeof c === "number") {
        const k = String(c).trim();
        if (k) return k;
      }
      if (typeof c === "object") {
        const k =
          (c.influencer_id != null ? String(c.influencer_id) : "") ||
          (c.id != null ? String(c.id) : "") ||
          (c.email != null ? String(c.email) : "") ||
          (c.mobile != null ? String(c.mobile) : "");
        if (k.trim()) return k.trim();
      }
    }
    return "";
  };

  const fetchTransactionHistory = async (influencerId) => {
    const id = String(influencerId || "").trim();
    if (!id) return [];

    const doFetch = async (scheme, allowRetry) => {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        "";

      const headers = {};
      if (token) headers["Authorization"] = `${scheme} ${token}`;

      const res = await fetch(`${baseUrl}/influencer_transaction_history/influencer/${encodeURIComponent(id)}/`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if ((res.status === 401 || res.status === 403) && allowRetry && token) {
        const altScheme = scheme === "Bearer" ? "Token" : "Bearer";
        return doFetch(altScheme, false);
      }

      return res;
    };

    const res = await doFetch("Bearer", true);

    if (res.ok) {
      const json = await res.json();
      return normalizeList(json);
    }

    // Fallback: GET all and filter client-side (some backends may not support per-influencer endpoint)
    try {
      const doFetchAll = async (scheme, allowRetry) => {
        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("access") ||
          localStorage.getItem("token") ||
          "";

        const headers = {};
        if (token) headers["Authorization"] = `${scheme} ${token}`;

        const resAll = await fetch(`${baseUrl}/influencer_transaction_history/`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if ((resAll.status === 401 || resAll.status === 403) && allowRetry && token) {
          const altScheme = scheme === "Bearer" ? "Token" : "Bearer";
          return doFetchAll(altScheme, false);
        }

        return resAll;
      };

      const resAll = await doFetchAll("Bearer", true);
      if (!resAll.ok) throw new Error("Fetch failed");
      const jsonAll = await resAll.json();
      const listAll = normalizeList(jsonAll);
      return listAll.filter((r) => {
        const key = getHistoryInfluencerKey(r);
        return key && id && key === id;
      });
    } catch (e) {
      let data = {};
      let rawText = "";
      try {
        data = await res.clone().json();
      } catch (e2) {
        try {
          rawText = await res.text();
        } catch (e3) {}
      }
      const errMsg = data.message || data.detail || "Fetch failed";
      const extra =
        data && Object.keys(data).length
          ? ` | ${JSON.stringify(data)}`
          : rawText
            ? ` | ${rawText.slice(0, 500)}`
            : "";
      throw new Error(`${res.status} ${errMsg}${extra}`);
    }
  };

  useEffect(() => {
    const influencerId = String(
      viewData?.email || viewData?.influencer_id || viewData?.id || viewData?.mobile || ""
    ).trim();
    if (!viewOpen || !influencerId) {
      setTxnLoading(false);
      setTxnError("");
      setTxnRows([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setTxnLoading(true);
      setTxnError("");
      try {
        const rows = await fetchTransactionHistory(influencerId);
        if (!cancelled) setTxnRows(rows);
      } catch (e) {
        if (!cancelled) setTxnError(e?.message || "Failed to fetch transaction history");
      } finally {
        if (!cancelled) setTxnLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewOpen, viewData?.influencer_id]);

  const formatTxnDate = (row) => {
    const raw = row?.created_at || row?.date || row?.created || row?.updated_at || row?.timestamp;
    if (!raw) return "--";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleString();
  };

  const normalizeSocialLinksToText = (value) => {
    if (!value) return "{}";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return "{}";
    }
  };

  const safePrettyJson = (value) => {
    if (value == null) return "";
    if (typeof value === "string") {
      const t = value.trim();
      if (!t) return "";
      if (t.startsWith("{") || t.startsWith("[")) {
        try {
          return JSON.stringify(JSON.parse(t), null, 2);
        } catch (e) {
          return value;
        }
      }
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  };

  const handleAdd = () => {
    setEditData({
      influencer_id: "",
      full_name: "",
      category_id: "",
      dob: "",
      email: "",
      mobile: "",
      gender: "",
      bio: "",
      languages: "",
      social_links: "{}",
      price_per_min_chat: "",
      price_per_min_audio: "",
      price_per_min_video: "",
      status: "pending",
      image: "",
      verification_video: "",
    });
    setOpen(true);
  };

  const handleView = (row) => {
    setViewData(row || null);
    setViewOpen(true);
  };

  const handleEdit = (row) => {
    const firstCategoryId =
      Array.isArray(row?.categories) && row.categories[0]?.id != null
        ? String(row.categories[0].id)
        : "";

    setEditData({
      id: row.id,
      influencer_id: row.influencer_id || "",
      full_name: row.full_name || row.name || "",
      category_id: firstCategoryId,
      dob: row.dob || "",
      email: row.email || "",
      mobile: row.mobile || "",
      gender: row.gender || "",
      bio: row.bio || "",
      languages: normalizeLanguagesToText(row.languages),
      social_links: normalizeSocialLinksToText(row.social_links),
      price_per_min_chat: row.price_per_min_chat ?? "",
      price_per_min_audio: row.price_per_min_audio ?? "",
      price_per_min_video: row.price_per_min_video ?? "",
      status: row.status ?? "",
      image: row.image ? STATIC_URL + row.image : "",
      verification_video: row.verification_video ? STATIC_URL + row.verification_video : "",
    });
    setOpen(true);
  };

  const handleDelete = async (row) => {
    const influencerId = row?.influencer_id;
    if (!influencerId) return;

    if (!window.confirm("Delete this influencer?")) return;
    try {
      await deleteData(`/influencers/pass/${influencerId}/`);
    } catch (e1) {
      await deleteData(`/influencers/${influencerId}/`);
    }
    await getServicesData("influencers");
  };

  const handleInlineStatusChange = async (row, nextStatusRaw) => {
    const influencerId = String(row?.influencer_id || "").trim();
    const nextStatus = String(nextStatusRaw || "").trim();
    if (!influencerId || !nextStatus) return;

    try {
      const fd = new FormData();
      fd.append("status", nextStatus);

      try {
        await patchData(`/influencers/pass/${influencerId}/`, fd, "Influencer");
      } catch (e1) {
        await patchData(`/influencers/${influencerId}/`, fd, "Influencer");
      }

      await getServicesData("influencers");
    } catch (e) {
      console.error("Inline status update failed:", e);
      alert("Failed: " + (e?.message || "Unable to update status"));
    }
  };

  const parseLanguages = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) return text;

    return String(text)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const safeParseJson = (text) => {
    if (text == null || text === "") return {};
    if (typeof text === "object") return text;
    try {
      return JSON.parse(text);
    } catch (e) {
      return {};
    }
  };

  const buildInfluencerFormData = (formValues, { isEdit }) => {
    const fd = new FormData();

    const influencer_id = String(formValues.influencer_id || "").trim();
    if (!isEdit) {
      fd.append("influencer_id", influencer_id);
    }

    fd.append("full_name", String(formValues.full_name || "").trim());

    const categoryId = String(formValues.category_id || "").trim();
    if (categoryId) {
      fd.append("categories", categoryId);
    }

    if (formValues.dob) fd.append("dob", String(formValues.dob));
    if (formValues.email) fd.append("email", String(formValues.email).trim());
    if (formValues.mobile) fd.append("mobile", String(formValues.mobile).trim());
    if (formValues.gender) fd.append("gender", String(formValues.gender).trim());
    if (formValues.bio) fd.append("bio", String(formValues.bio || ""));

    const languages = parseLanguages(formValues.languages);
    languages.forEach((lang) => {
      fd.append("languages", String(lang));
    });

    const socialLinksObj = safeParseJson(formValues.social_links);
    if (socialLinksObj && typeof socialLinksObj === "object") {
      fd.append("social_links", JSON.stringify(socialLinksObj));
      Object.entries(socialLinksObj)
        .filter(([k, v]) => k && v != null && String(v).trim() !== "")
        .forEach(([k, v]) => {
          fd.append(`social_links.${k}`, String(v));
          fd.append(`social_links[${k}]`, String(v));
        });
    }

    if (formValues.price_per_min_chat !== "") {
      fd.append("price_per_min_chat", String(formValues.price_per_min_chat));
    }
    if (formValues.price_per_min_audio !== "") {
      fd.append("price_per_min_audio", String(formValues.price_per_min_audio));
    }
    if (formValues.price_per_min_video !== "") {
      fd.append("price_per_min_video", String(formValues.price_per_min_video));
    }

    if (formValues.status !== "") {
      const rawStatus = String(formValues.status).trim();
      const normalizedStatus =
        rawStatus === "Approved" || rawStatus === "approved"
          ? "approved"
          : rawStatus === "Pending" || rawStatus === "pending"
            ? "pending"
          : rawStatus === "Reject" || rawStatus === "Rejected" || rawStatus === "rejected"
            ? "rejected"
            : rawStatus;
      fd.append("status", normalizedStatus);
    }

    if (formValues.image && formValues.image instanceof File) {
      fd.append("image", formValues.image);
    }

    if (formValues.verification_video && formValues.verification_video instanceof File) {
      fd.append("verification_video", formValues.verification_video);
    }

    return fd;
  };

  const handleSubmit = async (formValues) => {
    try {
      const influencerId = String(formValues.influencer_id || "").trim();

      const fd = buildInfluencerFormData(formValues, { isEdit: Boolean(editData?.id) });
      const desiredStatusRaw = String(formValues.status || "").trim();

      if (editData?.id) {
        if (!influencerId) throw new Error("Missing influencer_id");
        try {
          const res = await patchData(`/influencers/pass/${influencerId}/`, fd, "Influencer");
          if (desiredStatusRaw && (res?.status == null || String(res.status).trim() === "")) {
            alert(
              "Update succeeded but server did not save status (still null). Backend must allow updating the status field."
            );
          }
        } catch (e1) {
          const res = await patchData(`/influencers/${influencerId}/`, fd, "Influencer");
          if (desiredStatusRaw && (res?.status == null || String(res.status).trim() === "")) {
            alert(
              "Update succeeded but server did not save status (still null). Backend must allow updating the status field."
            );
          }
        }
      } else {
        if (!influencerId) throw new Error("influencer_id is required");
        const res = await postData("/influencers/", fd, "Influencer");
        if (desiredStatusRaw && (res?.status == null || String(res.status).trim() === "")) {
          alert(
            "Create succeeded but server did not save status (still null). Backend must allow updating the status field."
          );
        }
      }

      await getServicesData("influencers");
      setOpen(false);
      setEditData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const fields = [
    { label: "Influencer ID", name: "influencer_id", type: "text", required: true },
    { label: "Full Name", name: "full_name", type: "text", required: true },
    {
      label: "Category",
      name: "category_id",
      type: "select",
      options: categoryOptions,
      required: true,
    },
    { label: "DOB", name: "dob", type: "date" },
    { label: "Email", name: "email", type: "text" },
    { label: "Mobile", name: "mobile", type: "text" },
    { label: "Gender", name: "gender", type: "select", options: ["Male", "Female", "Other"] },
    { label: "Bio", name: "bio", type: "textarea" },
    {
      label: "Languages (comma separated)",
      name: "languages",
      type: "text",
      placeholder: "Hindi, English",
    },
    {
      label: "Social Links (JSON)",
      name: "social_links",
      type: "textarea",
      rows: 6,
      placeholder: '{"instagram": "https://...", "youtube": "https://..."}',
    },
    { label: "Price/Min Chat", name: "price_per_min_chat", type: "text" },
    { label: "Price/Min Audio", name: "price_per_min_audio", type: "text" },
    { label: "Price/Min Video", name: "price_per_min_video", type: "text" },
    {
      label: "Status",
      name: "status",
      type: "select",
      required: false,
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Reject" },
      ],
    },
    { label: "Image", name: "image", type: "image" },
    { label: "Verification Video", name: "verification_video", type: "file", accept: "video/*" },
  ];

  const columns = [
    { label: "#", key: "index", type: "text" },
    {
      label: "Image",
      key: "image",
      render: (row) =>
        row.image ? (
          <img
            src={STATIC_URL + row.image}
            alt="influencer"
            className="h-16 w-16 object-cover rounded-full shadow"
          />
        ) : (
          <div className="h-16 w-16 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center text-xs text-gray-500">
            No Image
          </div>
        ),
    },
    { label: "Influencer ID", key: "influencer_id", type: "text" },
    { label: "Name", key: "full_name", type: "text" },
    { label: "Mobile", key: "mobile", type: "text" },
    { label: "Gender", key: "gender", type: "text" },
    {
      label: "Languages",
      key: "languages",
      render: (row) => normalizeLanguagesToText(row.languages) || "--",
    },
    {
      label: "Categories",
      key: "categories",
      render: (row) =>
        Array.isArray(row.categories) && row.categories.length
          ? row.categories.map((c) => c?.name).filter(Boolean).join(", ")
          : "--",
    },
    {
      label: "Status",
      key: "status",
      render: (row) => {
        const currentStatus = String(row?.status || "").trim();
        const isApproved = currentStatus === "approved";
        const isRejected = currentStatus === "rejected";
        const isPending = currentStatus === "pending";
        const colorClass = isApproved
          ? "bg-green-50 text-green-700 border-green-300"
          : isRejected
            ? "bg-red-50 text-red-700 border-red-300"
            : isPending
              ? "bg-yellow-50 text-yellow-800 border-yellow-300"
            : "bg-gray-50 text-gray-700 border-gray-300";

        return (
          <div className="relative inline-block">
            <select
              value={currentStatus}
              onChange={(e) => handleInlineStatusChange(row, e.target.value)}
              className={`text-xs px-3 py-2 pr-8 border rounded-md outline-none ${colorClass}`}
              style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
            >
              <option value="">--</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Reject</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        );
      },
    },
    {
      label: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex gap-3">
          <button onClick={() => handleView(row)} className="text-slate-600 hover:text-slate-900">
            <EyeIcon className="h-5 w-5" />
          </button>
          <button onClick={() => handleEdit(row)} className="text-indigo-600 hover:text-indigo-900">
            <PencilIcon className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(row)} className="text-red-600 hover:text-red-900">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center py-10 border-b border-gray-200 bg-gradient-to-b from-purple-50 to-white">
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">Influencers</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8">
        <input
          type="text"
          placeholder="Search by influencer id, name, mobile or email..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="w-full sm:max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add Influencer
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <DataTable columns={columns} data={current} />
      </div>

      {pageCount > 1 && (
        <div className="px-4 sm:px-6 lg:px-8">
          <Pagination page={page} setPage={setPage} pageCount={pageCount} />
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditData(null);
        }}
        title={editData?.id ? "Edit Influencer" : "Add New Influencer"}
      >
        <Form
          fields={fields}
          initialData={editData || { social_links: "{}" }}
          onSubmit={handleSubmit}
          submitLabel={editData?.id ? "Update Influencer" : "Create Influencer"}
          onCancel={() => {
            setOpen(false);
            setEditData(null);
          }}
        />
      </Modal>

      <Modal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
          setTxnLoading(false);
          setTxnError("");
          setTxnRows([]);
        }}
        title="Influencer Details"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Influencer ID</div>
              <div className="font-medium">{viewData?.influencer_id || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Full Name</div>
              <div className="font-medium">{viewData?.full_name || viewData?.name || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="font-medium">{viewData?.email || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Mobile</div>
              <div className="font-medium">{viewData?.mobile || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Gender</div>
              <div className="font-medium">{viewData?.gender || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">DOB</div>
              <div className="font-medium">{viewData?.dob || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="font-medium">{viewData?.status ?? "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Wallet</div>
              <div className="font-medium">{viewData?.wallet_current_amount ?? "--"}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Categories</div>
            <div className="font-medium">
              {Array.isArray(viewData?.categories) && viewData.categories.length
                ? viewData.categories.map((c) => c?.name).filter(Boolean).join(", ")
                : "--"}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Languages</div>
            <div className="font-medium">{normalizeLanguagesToText(viewData?.languages) || "--"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Bio</div>
            <div className="whitespace-pre-wrap">{viewData?.bio || "--"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Social Links</div>
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto">
              {safePrettyJson(viewData?.social_links) || "--"}
            </pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Price/Min Chat</div>
              <div className="font-medium">{viewData?.price_per_min_chat ?? "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Price/Min Audio</div>
              <div className="font-medium">{viewData?.price_per_min_audio ?? "--"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Price/Min Video</div>
              <div className="font-medium">{viewData?.price_per_min_video ?? "--"}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Image</div>
              {viewData?.image ? (
                <img
                  src={STATIC_URL + viewData.image}
                  alt="influencer"
                  className="mt-2 max-h-56 w-auto rounded border border-gray-200"
                />
              ) : (
                <div className="mt-2 text-sm">--</div>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500">Verification Video</div>
              {viewData?.verification_video ? (
                <video
                  className="mt-2 max-h-56 w-full rounded border border-gray-200"
                  controls
                  src={STATIC_URL + viewData.verification_video}
                />
              ) : (
                <div className="mt-2 text-sm">--</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Transaction History</div>
            {txnLoading ? (
              <div className="mt-2 text-sm">Loading...</div>
            ) : txnError ? (
              <div className="mt-2 text-sm text-red-600">{txnError}</div>
            ) : txnRows.length ? (
              <div className="mt-2 overflow-auto border border-gray-200 rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 border-b">Type</th>
                      <th className="text-left px-3 py-2 border-b">Method</th>
                      <th className="text-left px-3 py-2 border-b">Purpose</th>
                      <th className="text-left px-3 py-2 border-b">Title</th>
                      <th className="text-left px-3 py-2 border-b">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txnRows.map((r, idx) => (
                      <tr key={r?.id ?? idx} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2 border-b whitespace-nowrap">
                          {r?.transaction_type || r?.type || r?.action || "--"}
                        </td>
                        <td className="px-3 py-2 border-b whitespace-nowrap">
                          {r?.payment_method || r?.method || "--"}
                        </td>
                        <td className="px-3 py-2 border-b whitespace-nowrap">
                          {r?.payment_purpose || r?.purpose || "--"}
                        </td>
                        <td className="px-3 py-2 border-b whitespace-nowrap">
                          {r?.transaction_title || r?.title || "--"}
                        </td>
                        <td className="px-3 py-2 border-b whitespace-nowrap">
                          {r?.amount ?? r?.transaction_amount ?? r?.wallet_amount ?? "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-2 text-sm">No transaction history found.</div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setViewOpen(false);
                setViewData(null);
                setTxnLoading(false);
                setTxnError("");
                setTxnRows([]);
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
