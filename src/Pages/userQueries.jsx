import { useAppContext } from "../Central_Store/app_context.jsx";
import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { useEffect, useMemo, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";

export default function UserQueries() {
  const { fetchedData, postData, patchData, deleteData, getServicesData } = useAppContext();
  const [queries, setQueries] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [openAnswer, setOpenAnswer] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [answerText, setAnswerText] = useState("");

  const pageSize = 10;

  useEffect(() => {
    if (Array.isArray(fetchedData.userQueries)) {
      setQueries(fetchedData.userQueries);
    }
  }, [fetchedData.userQueries]);

  useEffect(() => {
    getServicesData("userQueries");
  }, []);

  const filteredQueries = useMemo(() => {
    const safeList = Array.isArray(queries) ? queries : [];
    if (!searchText) return safeList;
    const q = searchText.toLowerCase();
    return safeList.filter((item) => {
      return (
        String(item.user_data || "").toLowerCase().includes(q) ||
        String(item.query || "").toLowerCase().includes(q) ||
        String(item.answer || "").toLowerCase().includes(q)
      );
    });
  }, [queries, searchText]);

  const pageCount = Math.max(1, Math.ceil(filteredQueries.length / pageSize));
  const currentData = filteredQueries.slice((page - 1) * pageSize, page * pageSize);

  const refreshQueries = async () => {
    await getServicesData("userQueries");
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddSubmit = async (values) => {
    const payload = {
      user_data: String(values.user_data || "").trim(),
      query: String(values.query || "").trim(),
    };

    if (!payload.user_data || !payload.query) {
      alert("Please provide both User ID and query.");
      return;
    }

    try {
      await postData("/user_query/", payload, "User Query");
      setOpenAdd(false);
      setSearchText("");
      setPage(1);
      await refreshQueries();
    } catch (error) {
      console.error(error);
      alert("Failed to create query. " + (error.message || "Please try again."));
    }
  };

  const safePatchQuery = async (id, payload) => {
    const endpoints = [
      `/user_query/pass/${id}/`,
      `/user_query/pass/${id}`,
      `/user_query/${id}/`,
      `/user_query/${id}`,
    ];

    for (const endpoint of endpoints) {
      try {
        return await patchData(endpoint, payload, "User Query");
      } catch (err) {
        console.warn(`PATCH failed for ${endpoint}, trying next`, err);
      }
    }
    throw new Error("All PATCH endpoints failed");
  };

  const safeDeleteQuery = async (id) => {
    const endpoints = [
      `/user_query/pass/${id}/`,
      `/user_query/pass/${id}`,
      `/user_query/${id}/`,
      `/user_query/${id}`,
    ];

    for (const endpoint of endpoints) {
      try {
        return await deleteData(endpoint, { skipConfirm: true });
      } catch (err) {
        console.warn(`DELETE failed for ${endpoint}, trying next`, err);
      }
    }
    throw new Error("All DELETE endpoints failed");
  };

  const handleAnswerSave = async () => {
    if (!selectedQuery?.id) return;
    const payload = { answer: String(answerText || "").trim() };

    try {
      await safePatchQuery(selectedQuery.id, payload);
      setOpenAnswer(false);
      setSelectedQuery(null);
      setAnswerText("");
      await refreshQueries();
    } catch (error) {
      console.error(error);
      alert("Failed to save answer. " + (error.message || "Please try again."));
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!window.confirm("Delete this query?")) return;

    try {
      await safeDeleteQuery(row.id);
      await refreshQueries();
    } catch (error) {
      console.error(error);
      alert("Failed to delete query. " + (error.message || "Please try again."));
    }
  };

  const openAnswerModal = (row) => {
    setSelectedQuery(row);
    setAnswerText(row.answer || "");
    setOpenAnswer(true);
  };

  const openViewModal = (row) => {
    setSelectedQuery(row);
    setOpenView(true);
  };

  const columns = [
    { label: "User ID", key: "user_data", type: "text" },
    {
      label: "Query",
      key: "query",
      render: (row) => (
        <p className="max-w-[20rem] break-words text-sm text-gray-700">{row.query || "--"}</p>
      ),
    },
    {
      label: "Answer",
      key: "answer",
      render: (row) => (
        <p className="max-w-[20rem] break-words text-sm text-gray-700">{row.answer || "Pending"}</p>
      ),
    },
  ];

  return (
    <div className="space-y-5 px-2 pb-4 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">User Queries</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Manage user queries from the API and reply directly from the dashboard.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user, query, or answer"
            className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#940aea] focus:ring-2 focus:ring-[#940aea]/20 sm:w-80"
          />
          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#940aea] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7d07c2] sm:w-auto"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Query</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <DataTable
          columns={columns}
          data={currentData}
          actions={(row) => (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openViewModal(row)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 sm:px-3 sm:py-2 sm:text-sm"
                title="View"
              >
                <EyeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
              </button>
              <button
                type="button"
                onClick={() => openAnswerModal(row)}
                className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-2 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100 sm:px-3 sm:py-2 sm:text-sm"
                title="Answer"
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Answer</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(row)}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 sm:px-3 sm:py-2 sm:text-sm"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}
        />

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
          <Pagination page={page} setPage={setPage} pageCount={pageCount} />
        </div>
      </div>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add User Query">
        <Form
          initialData={{ user_data: "", query: "" }}
          fields={[
            { label: "User ID", name: "user_data", type: "text", required: true },
            { label: "Query", name: "query", type: "textarea", required: true },
          ]}
          onSubmit={handleAddSubmit}
          submitLabel="Create Query"
          onCancel={() => setOpenAdd(false)}
        />
      </Modal>

      <Modal open={openAnswer} onClose={() => setOpenAnswer(false)} title="Answer Query">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700">User ID</p>
            <p className="mt-2 text-sm text-gray-900">{selectedQuery?.user_data || "--"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Query</p>
            <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
              {selectedQuery?.query || "--"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Answer</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={6}
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#940aea] focus:ring-2 focus:ring-[#940aea]/20"
              placeholder="Type your answer here"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpenAnswer(false)}
              className="rounded-2xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAnswerSave}
              className="rounded-2xl bg-[#940aea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7d07c2]"
            >
              Save Answer
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={openView} onClose={() => setOpenView(false)} title="View Query">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedQuery?.user_data || "--"}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700">Query</p>
            <div className="mt-3 rounded-2xl border border-gray-100 bg-slate-50 p-4 text-sm leading-6 text-gray-800 whitespace-pre-wrap">
              {selectedQuery?.query || "--"}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700">Answer</p>
            <div className="mt-3 rounded-2xl border border-gray-100 bg-slate-50 p-4 text-sm leading-6 text-gray-800 whitespace-pre-wrap min-h-[100px]">
              {selectedQuery?.answer || "No answer yet."}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {selectedQuery?.created_at && (
              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-800">Created At</p>
                <p className="mt-2">{formatDateTime(selectedQuery.created_at)}</p>
              </div>
            )}
            {selectedQuery?.answered_at && (
              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-800">Answered At</p>
                <p className="mt-2">{formatDateTime(selectedQuery.answered_at)}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenView(false)}
              className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
