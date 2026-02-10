// src/pages/Users.jsx
import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { EyeIcon, TrashIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../Central_Store/app_context.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Users() {
  const { fetchedData, deleteData, postData, patchData, putData, getServicesData } = useAppContext();

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const pageSize = 10;
  const STATIC_URL = import.meta?.env?.DEV ? "http://127.0.0.1:8000" : "https://celebstalks.pythonanywhere.com";

  useEffect(() => {
    setUsers(fetchedData.users || []);
  }, [fetchedData.users]);

  const filtered = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    if (!query) return safeUsers;
    const q = query.toLowerCase();
    return safeUsers.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.toLowerCase().includes(q)
    );
  }, [users, query]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (row) => {
    const identifier = row?.user_id ?? row?.mobile ?? row?.email ?? row?.id;
    const encodedId = encodeURIComponent(String(identifier ?? "").trim());
    if (!window.confirm("Delete this user?")) return;
    try {
      try {
        await deleteData(`/user/${encodedId}/`, { skipConfirm: true });
      } catch (e1) {
        try {
          await deleteData(`/user/${encodedId}`, { skipConfirm: true });
        } catch (e2) {
          await deleteData(`/user/pass/${encodedId}/`, { skipConfirm: true });
        }
      }
      await getServicesData("users");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const handleAdd = () => {
    setEditData({
      full_name: "",
      email: "",
      mobile: "",
      gender: "",
      date_of_birth: "",
      image: null,
      is_active: "Active",
      is_staff: "No",
    });
    setOpen(true);
  };

  const handleEdit = (row) => {
    const normalizeDobForInput = (value) => {
      if (!value) return "";
      if (typeof value !== "string") return "";
      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const [, yyyy, mm, dd] = isoMatch;
        return `${yyyy}-${mm}-${dd}`;
      }
      const m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (m) {
        const [, dd, mm, yyyy] = m;
        return `${yyyy}-${mm}-${dd}`;
      }
      return value;
    };

    setEditData({
      id: row.id,
      full_name: row.full_name || "",
      email: row.email || "",
      user_id: row.user_id || row.mobile || row.email || "",
      mobile: row.mobile || "",
      gender: row.gender || "",
      date_of_birth: normalizeDobForInput(row.date_of_birth),
      image: row.image
        ? String(row.image).startsWith("http")
          ? String(row.image)
          : STATIC_URL + String(row.image)
        : "",
      is_active: row.is_active ? "Active" : "Inactive",
      is_staff: row.is_staff ? "Yes" : "No",
    });
    setOpen(true);
  };

  const handleSubmit = async (formValues) => {
    const normalizeDobForApi = (value) => {
      if (!value) return "";
      if (typeof value !== "string") return "";
      return value;
    };

    const fd = new FormData();
    fd.append("full_name", (formValues.full_name || "").trim());
    const email = (formValues.email || "").trim();
    fd.append("email", email);
    const userId = String(formValues.user_id || formValues.mobile || formValues.email || "").trim();
    if (userId) fd.append("user_id", userId);
    fd.append("mobile", (formValues.mobile || "").trim());
    fd.append("gender", formValues.gender || "");
    fd.append("date_of_birth", normalizeDobForApi((formValues.date_of_birth || "").trim()));
    fd.append("is_active", formValues.is_active === "Active" ? "true" : "false");
    fd.append("is_staff", formValues.is_staff === "Yes" ? "true" : "false");

    if (formValues.image && formValues.image instanceof File) {
      fd.append("image", formValues.image);
    }

    try {
      const isEdit = Boolean(editData?.id || editData?.user_id);
      if (isEdit) {
        const identifier = String(editData?.user_id || editData?.mobile || editData?.email || editData?.id || "").trim();
        const encodedId = encodeURIComponent(identifier);
        if (!identifier) throw new Error("Missing user_id for update");

        try {
          await patchData(`/user/${encodedId}/`, fd, "User");
        } catch (e1) {
          try {
            await patchData(`/user/${encodedId}`, fd, "User");
          } catch (e2) {
            try {
              await patchData(`/user/pass/${encodedId}/`, fd, "User");
            } catch (e3) {
              try {
                await putData(`/user/${encodedId}/`, fd, "User");
              } catch (e4) {
                await putData(`/user/${encodedId}`, fd, "User");
              }
            }
          }
        }
      } else {
        await postData("/user/", fd, "User");
      }

      await getServicesData("users");
      setOpen(false);
      setEditData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const baseFields = [
    { label: "Full Name", name: "full_name", type: "text", required: true },
    { label: "Email", name: "email", type: "text", required: false },
    { label: "Mobile", name: "mobile", type: "text", required: true },
    {
      label: "Gender",
      name: "gender",
      type: "select",
      options: ["Male", "Female", "Other"],
      required: false,
    },
    { label: "Date Of Birth", name: "date_of_birth", type: "date" },
    { label: "Image", name: "image", type: "image" },
    {
      label: "Active Status",
      name: "is_active",
      type: "select",
      options: ["Active", "Inactive"],
      required: true,
    },
    {
      label: "Staff",
      name: "is_staff",
      type: "select",
      options: ["Yes", "No"],
      required: true,
    },
  ];
  const fields = editData?.id
    ? [
        { label: "User ID", name: "user_id", type: "text", required: true, readOnly: true },
        ...baseFields,
      ]
    : baseFields;

  const columns = [
    { label: "Name", key: "full_name", type: "text" },
    { label: "User ID", key: "user_id", type: "text" },
    { label: "DB ID", key: "id", type: "text" },
    {
      label: "Email",
      key: "email",
      render: (row) => row.email || row.user_id || row.username || "--",
    },
    { label: "Mobile", key: "mobile", type: "text" },
    { label: "Gender", key: "gender", type: "text" },
    {
      label: "Active",
      key: "is_active",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      label: "Staff",
      key: "is_staff",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.is_staff ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.is_staff ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center py-10 border-b border-gray-200 bg-gradient-to-b from-purple-50 to-white">
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
          Users Management
        </h1>
      </div>

      {/* Search + Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8">
        <input
          type="text"
          placeholder="Search by name, email or mobile..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="w-full sm:max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 lg:px-8">
        <DataTable
          columns={columns}
          data={current}
          actions={(row) => (
            <div className="flex gap-3">
              <Link to={`/dashboard/user-detail/${row.id}`}>
                <EyeIcon className="h-5 w-5 text-gray-600 hover:text-gray-800 cursor-pointer transition" />
              </Link>
              <PencilIcon
                className="h-5 w-5 text-indigo-600 hover:text-indigo-900 cursor-pointer transition"
                onClick={() => handleEdit(row)}
              />
              <TrashIcon
                className="h-5 w-5 text-red-600 hover:text-red-800 cursor-pointer transition"
                onClick={() => handleDelete(row)}
              />
            </div>
          )}
        />
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
        title={editData ? "Edit User" : "Add New User"}
      >
        <Form
          fields={fields}
          initialData={editData || {}}
          onSubmit={handleSubmit}
          submitLabel={editData ? "Update User" : "Create User"}
          onCancel={() => {
            setOpen(false);
            setEditData(null);
          }}
        />
      </Modal>
    </div>
  );
}
