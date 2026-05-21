// src/pages/Banners.jsx
import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../Central_Store/app_context.jsx";
import { useEffect, useMemo, useState } from "react";

export default function Banners() {
  const { fetchedData, deleteData, postData, patchData, getServicesData } = useAppContext();

  const [banners, setBanners] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const pageSize = 10;
  const STATIC_URL = "https://adminapi.celebstalk.in";

  useEffect(() => {
    setBanners(fetchedData.banners || []);
  }, [fetchedData.banners]);

  const filtered = useMemo(() => {
    const safeBanners = Array.isArray(banners) ? banners : [];
    if (!query) return safeBanners;
    const q = query.toLowerCase();
    return safeBanners.filter(
      (b) =>
        b.CTA_text?.toLowerCase().includes(q) ||
        b.CTA_link?.toLowerCase().includes(q)
    );
  }, [banners, query]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      try {
        await deleteData(`/banners/${id}/`);
      } catch (e) {
        await deleteData(`/banners/pass/${id}/`);
      }
      await getServicesData("banners");
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditData({
      id: row.id,
      CTA_text: row.CTA_text || "",
      CTA_link: row.CTA_link || "",
      order: row.order ?? "",
      banner_text: row.banner_text || "",
      status: row.status ? "Active" : "Inactive",
      currentImage: row.image ? STATIC_URL + row.image : null,
    });
    setOpen(true);
  };

  const handleSubmit = async (formValues) => {
    const fd = new FormData();
    fd.append("CTA_text", (formValues.CTA_text || "").trim());
    fd.append("CTA_link", (formValues.CTA_link || "").trim());
    fd.append("status", formValues.status === "Active" ? "true" : "false");
    fd.append("order", String(formValues.order ?? "").trim());
    fd.append("banner_text", (formValues.banner_text || "").trim());

    if (formValues.image && formValues.image instanceof File) {
      fd.append("image", formValues.image);
    }

    try {
      if (editData?.id) {
        try {
          await patchData(`/banners/${editData.id}/`, fd, "Banner");
        } catch (e) {
          await patchData(`/banners/pass/${editData.id}/`, fd, "Banner");
        }
      } else {
        await postData("/banners/", fd, "Banner");
      }
      await getServicesData("banners");
      setOpen(false);
      setEditData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const fields = [
    { label: "CTA Text", name: "CTA_text", type: "text", required: true },
    { label: "CTA Link", name: "CTA_link", type: "text" },
    { label: "Order", name: "order", type: "text" },
    { label: "Banner Text", name: "banner_text", type: "text" },
    { label: "Status", name: "status", type: "select", options: ["Active", "Inactive"], required: true },
    { label: "Banner Image", name: "image", type: "image" },
  ];

  const columns = [
    {
      label: "Image",
      key: "image",
      render: (row) => row.image ? (
        <img src={STATIC_URL + row.image} alt="banner" className="h-16 w-32 object-cover rounded-lg shadow" />
      ) : (
        <div className="h-16 w-32 bg-gray-200 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-gray-500">
          No Image
        </div>
      ),
    },
    { label: "CTA Text", key: "CTA_text", type: "text" },
    { label: "CTA Link", key: "CTA_link", type: "text" },
    { label: "Order", key: "order", type: "text" },
    { label: "Banner Text", key: "banner_text", type: "text" },
    {
      label: "Status",
      key: "status",
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {row.status ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      label: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex gap-3">
          <button onClick={() => handleEdit(row)} className="text-indigo-600 hover:text-indigo-900">
            <PencilIcon className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-900">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">

      {/* 100% CENTERED + PURPLE TITLE - FULLY WORKING */}
      <div className="text-center py-8 border-b border-gray-200">
        <h1 className="text-4xl font-extrabold text-purple-700">
          Banners Management
        </h1>
      </div>

      {/* Search + Add Button Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8">
        <input
          type="text"
          placeholder="Search by CTA text or link..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          className="w-full sm:max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add Banner
        </button>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 lg:px-8">
        <DataTable columns={columns} data={current} />
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="px-4 sm:px-6 lg:px-8">
          <Pagination currentPage={page} totalPages={pageCount} onPageChange={setPage} />
        </div>
      )}

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditData(null); }}
        title={editData ? "Edit Banner" : "Add New Banner"}
      >
        <Form
          fields={fields}
          initialData={editData || {}}
          onSubmit={handleSubmit}
          submitLabel={editData ? "Update Banner" : "Create Banner"}
          onCancel={() => { setOpen(false); setEditData(null); }}
        />
      </Modal>
    </div>
  );
}