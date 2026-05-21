import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../Central_Store/app_context.jsx";
import { useEffect, useMemo, useState } from "react";

export default function Services() {
  const { fetchedData, deleteData, postData, patchData, getServicesData } = useAppContext();

  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const pageSize = 10;
  const STATIC_URL = "https://adminapi.celebstalk.in";

  useEffect(() => {
    setServices(fetchedData.services || []);
  }, [fetchedData.services]);

  const filtered = useMemo(() => {
    const safeServices = Array.isArray(services) ? services : [];
    if (!query) return safeServices;
    const q = query.toLowerCase();
    return safeServices.filter((s) => s.name?.toLowerCase().includes(q));
  }, [services, query]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    await deleteData(`/services/${id}/`);
    await getServicesData("services");
  };

  const handleAdd = () => {
    setEditData(null);
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditData({
      id: row.id,
      name: row.name || "",
      status:
        typeof row.status === "boolean" ? (row.status ? "Active" : "Inactive") : row.status || "Active",
      image: row.image ? STATIC_URL + row.image : "",
    });
    setOpen(true);
  };

  const handleSubmit = async (formValues) => {
    const fd = new FormData();
    fd.append("name", (formValues.name || "").trim());
    fd.append("status", formValues.status || "Active");

    if (formValues.image && formValues.image instanceof File) {
      fd.append("image", formValues.image);
    }

    try {
      if (editData?.id) {
        await patchData(`/services/${editData.id}/`, fd, "Service");
      } else {
        await postData("/services/", fd, "Service");
      }

      await getServicesData("services");
      setOpen(false);
      setEditData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const fields = [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Status", name: "status", type: "select", options: ["Active", "Inactive"], required: true },
    { label: "Service Image", name: "image", type: "image" },
  ];

  const columns = [
    {
      label: "Image",
      key: "image",
      render: (row) =>
        row.image ? (
          <img
            src={STATIC_URL + row.image}
            alt="service"
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
      render: (row) => {
        const normalized =
          typeof row.status === "boolean" ? (row.status ? "Active" : "Inactive") : row.status || "Inactive";
        const isActive = normalized === "Active";

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {normalized}
          </span>
        );
      },
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
      <div className="text-center py-10 border-b border-gray-200 bg-gradient-to-b from-purple-50 to-white">
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">Services Management</h1>
      </div>

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
          Add Service
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
        title={editData ? "Edit Service" : "Add New Service"}
      >
        <Form
          fields={fields}
          initialData={editData || { status: "Active" }}
          onSubmit={handleSubmit}
          submitLabel={editData ? "Update Service" : "Create Service"}
          onCancel={() => {
            setOpen(false);
            setEditData(null);
          }}
        />
      </Modal>
    </div>
  );
}
