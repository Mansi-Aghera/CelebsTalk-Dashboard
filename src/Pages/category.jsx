// src/pages/Categories.jsx
import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../Central_Store/app_context.jsx";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Categories() {
  const { fetchedData, deleteData, postData, patchData, getServicesData } = useAppContext();

  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const warnedMissingExpertiseRef = useRef(new Set());

  const pageSize = 10;
  const STATIC_URL = "https://celebstalks.pythonanywhere.com";

  useEffect(() => {
    setCategories(fetchedData.categories || []);
  }, [fetchedData.categories]);

  const filtered = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    if (!query) return safeCategories;
    const q = query.toLowerCase();
    return safeCategories.filter((c) => c.name?.toLowerCase().includes(q));
  }, [categories, query]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    await deleteData(`/category/${id}/`);
    await getServicesData("categories");
  };

  const handleToggleStatus = async (row) => {
    try {
      const expertises = Array.isArray(fetchedData.expertise) ? fetchedData.expertise : [];
      const hasExpertise = expertises.some((e) => {
        const catId =
          e?.category_data != null
            ? String(typeof e.category_data === "object" ? e.category_data.id : e.category_data)
            : "";
        return catId && catId === String(row?.id);
      });

      if (!hasExpertise) {
        const id = String(row?.id || "");
        if (id && !warnedMissingExpertiseRef.current.has(id)) {
          warnedMissingExpertiseRef.current.add(id);
          alert("Add first expertise for this category.");
        }
        return;
      }

      const fd = new FormData();
      if (row?.name != null) fd.append("name", String(row.name));
      fd.append("status", !row?.status);
      await patchData(`/category/${row.id}/`, fd, "Category");
      await getServicesData("categories");
    } catch (error) {
      console.error("Toggle status error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditData({
      id: row.id,
      name: row.name || "",
      currentImage: row.image ? STATIC_URL + row.image : null,
    });
    setOpen(true);
  };

  const handleSubmit = async (formValues) => {
    const fd = new FormData();
    fd.append("name", (formValues.name || "").trim());
    if (!editData?.id) {
      fd.append("status", false);
    }

    if (formValues.image && formValues.image instanceof File) {
      fd.append("image", formValues.image);
    }

    try {
      if (editData?.id) {
        await patchData(`/category/${editData.id}/`, fd, "Category");
      } else {
        await postData("/category/", fd, "Category");
      }
      await getServicesData("categories");
      setOpen(false);
      setEditData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const fields = [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Category Image", name: "image", type: "image" },
  ];

  const columns = [
    {
      label: "Image",
      key: "image",
      render: (row) =>
        row.image ? (
          <img
            src={STATIC_URL + row.image}
            alt="category"
            className="h-16 w-16 object-cover rounded-full shadow"
          />
        ) : (
          <div className="h-16 w-16 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center text-xs text-gray-500">
            No Image
          </div>
        ),
    },
    { label: "Name", key: "name", type: "text" },
    {
      label: "Status",
      key: "status",
      render: (row) => (
        <span
          role="button"
          tabIndex={0}
          onClick={() => handleToggleStatus(row)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleToggleStatus(row);
          }}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
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

      {/* CENTERED + PURPLE + text-4xl TITLE */}
      <div className="text-center py-10 border-b border-gray-200 bg-gradient-to-b from-purple-50 to-white">
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
          Categories Management
        </h1>
      </div>

      {/* Search + Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8">
        <input
          type="text"
          placeholder="Search by name..."
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
          Add Category
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
        onClose={() => {
          setOpen(false);
          setEditData(null);
        }}
        title={editData ? "Edit Category" : "Add New Category"}
      >
        <Form
          fields={fields}
          initialData={editData || {}}
          onSubmit={handleSubmit}
          submitLabel={editData ? "Update Category" : "Create Category"}
          onCancel={() => {
            setOpen(false);
            setEditData(null);
          }}
        />
      </Modal>
    </div>
  );
}