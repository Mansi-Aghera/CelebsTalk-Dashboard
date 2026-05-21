import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../Central_Store/app_context.jsx";
import { useEffect, useMemo, useState } from "react";

export default function Expertise() {
  const { fetchedData, deleteData, postData, patchData, putData, getServicesData } = useAppContext();

  const [expertise, setExpertise] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const pageSize = 10;
  const STATIC_URL = "https://adminapi.celebstalk.in";

  useEffect(() => {
    setExpertise(Array.isArray(fetchedData.expertise) ? fetchedData.expertise : []);
  }, [fetchedData.expertise]);

  const categoryOptions = useMemo(() => {
    const cats = Array.isArray(fetchedData.categories) ? fetchedData.categories : [];
    return cats.map((c) => ({ value: String(c.id), label: c.name || `Category ${c.id}` }));
  }, [fetchedData.categories]);

  const categoryNameById = useMemo(() => {
    const map = new Map();
    (Array.isArray(fetchedData.categories) ? fetchedData.categories : []).forEach((c) => {
      map.set(String(c.id), c.name || String(c.id));
    });
    return map;
  }, [fetchedData.categories]);

  const filtered = useMemo(() => {
    const safe = Array.isArray(expertise) ? expertise : [];
    if (!query) return safe;
    const q = query.toLowerCase();
    return safe.filter((e) => {
      const name = (e.expertise_name || e.name || "").toLowerCase();
      const catId =
        e.category_data != null
          ? String(typeof e.category_data === "object" ? e.category_data.id : e.category_data)
          : "";
      const catName = (categoryNameById.get(catId) || "").toLowerCase();
      return name.includes(q) || catName.includes(q);
    });
  }, [expertise, query, categoryNameById]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expertise?")) return;
    try {
      try {
        await deleteData(`/expertise/pass/${id}/`, { skipConfirm: true });
      } catch (e1) {
        await deleteData(`/expertise/${id}/`, { skipConfirm: true });
      }
      await getServicesData("expertise");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setOpen(true);
  };

  const handleEdit = (row) => {
    const catId =
      row.category_data != null
        ? String(typeof row.category_data === "object" ? row.category_data.id : row.category_data)
        : "";

    setEditData({
      id: row.id,
      category_data: catId,
      expertise_name: row.expertise_name || "",
      image: row.image ? STATIC_URL + row.image : "",
    });
    setOpen(true);
  };

  const handleSubmit = async (formValues) => {
    const fd = new FormData();
    fd.append("category_data", String(formValues.category_data || "").trim());
    fd.append("expertise_name", (formValues.expertise_name || "").trim());

    if (formValues.image && formValues.image instanceof File) {
      fd.append("image", formValues.image);
    }

    const selectedCategoryId = String(formValues.category_data || "").trim();

    const activateSelectedCategory = async () => {
      if (!selectedCategoryId) return;
      const existing = (Array.isArray(fetchedData.categories) ? fetchedData.categories : []).find(
        (c) => String(c.id) === selectedCategoryId
      );

      const catFd = new FormData();
      if (existing?.name) catFd.append("name", String(existing.name));
      catFd.append("status", true);

      try {
        await patchData(`/category/${selectedCategoryId}/`, catFd, "Category");
      } catch (e) {
        console.error("Failed to activate category:", e);
      }
    };

    try {
      if (editData?.id) {
        try {
          await patchData(`/expertise/pass/${editData.id}/`, fd, "Expertise");
        } catch (e1) {
          try {
            await patchData(`/expertise/${editData.id}/`, fd, "Expertise");
          } catch (e2) {
            try {
              await putData(`/expertise/pass/${editData.id}/`, fd, "Expertise");
            } catch (e3) {
              await putData(`/expertise/${editData.id}/`, fd, "Expertise");
            }
          }
        }
      } else {
        await postData("/expertise/", fd, "Expertise");
      }

      await activateSelectedCategory();

      await getServicesData("expertise");
      await getServicesData("categories");
      setOpen(false);
      setEditData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const fields = [
    {
      label: "Category",
      name: "category_data",
      type: "select",
      options: categoryOptions,
      required: true,
    },
    { label: "Expertise Name", name: "expertise_name", type: "text", required: true },
    { label: "Image", name: "image", type: "image" },
  ];

  const columns = [
    {
      label: "Image",
      key: "image",
      render: (row) =>
        row.image ? (
          <img
            src={STATIC_URL + row.image}
            alt="expertise"
            className="h-16 w-16 object-cover rounded-full shadow"
          />
        ) : (
          <div className="h-16 w-16 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center text-xs text-gray-500">
            No Image
          </div>
        ),
    },
    {
      label: "Category",
      key: "category_data",
      render: (row) => {
        const catId =
          row.category_data != null
            ? String(typeof row.category_data === "object" ? row.category_data.id : row.category_data)
            : "";
        return categoryNameById.get(catId) || catId || "-";
      },
    },
    { label: "Expertise", key: "expertise_name", type: "text" },
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
      <div className="text-center py-10 border-b border-gray-200 bg-gradient-to-b from-purple-50 to-white">
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">Expertise Management</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8">
        <input
          type="text"
          placeholder="Search by expertise or category..."
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
          Add Expertise
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
        title={editData ? "Edit Expertise" : "Add New Expertise"}
      >
        <Form
          fields={fields}
          initialData={editData || {}}
          onSubmit={handleSubmit}
          submitLabel={editData ? "Update Expertise" : "Create Expertise"}
          onCancel={() => {
            setOpen(false);
            setEditData(null);
          }}
        />
      </Modal>
    </div>
  );
}
