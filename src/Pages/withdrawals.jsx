import DataTable from "../Components/DataTable.jsx";
import Pagination from "../Components/Pagination.jsx";
import Form from "../Components/Form.jsx";
import Modal from "../Components/Modal.jsx";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../Central_Store/app_context.jsx";
import { useEffect, useMemo, useState } from "react";

export default function Withdrawals() {
  const { fetchedData, deleteData, postData, patchData, getServicesData } = useAppContext();

  const [withdrawals, setWithdrawals] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const pageSize = 10;

  useEffect(() => {
    setWithdrawals(Array.isArray(fetchedData.withdrawals) ? fetchedData.withdrawals : []);
  }, [fetchedData.withdrawals]);

  // ---- Influencer lookup (id/mobile/email/etc -> influencer record) ----
  const influencerLookup = useMemo(() => {
    const list = Array.isArray(fetchedData.influencers) ? fetchedData.influencers : [];
    const map = new Map();

    const addKey = (key, inf) => {
      const k = key != null ? String(key).trim() : "";
      if (!k) return;
      if (!map.has(k)) map.set(k, inf);
    };

    list.forEach((inf) => {
      addKey(inf?.influencer_id, inf);
      addKey(inf?.id, inf);
      addKey(inf?.email, inf);
      addKey(inf?.mobile, inf);
    });

    return map;
  }, [fetchedData.influencers]);

  // ---- Helpers ----
  const getInfluencerLabel = (row) => {
    const v = row?.influencer_data;
    if (!v) return "--";
    if (typeof v === "string") return v;
    return v.email || v.influencer_id || v.full_name || v.name || String(v.id || "--");
  };

  const getInfluencerKeyFromRow = (row) => {
    if (row?.influencer_id != null) return String(row.influencer_id).trim();

    const v = row?.influencer_data;
    if (typeof v === "string") return v.trim();

    if (v && typeof v === "object") {
      return (
        (v.influencer_id != null ? String(v.influencer_id) : "") ||
        (v.email != null ? String(v.email) : "") ||
        (v.mobile != null ? String(v.mobile) : "") ||
        (v.id != null ? String(v.id) : "")
      ).trim();
    }

    return "";
  };

  const getTransactionMethodLabel = (row) => {
    const v = row?.transaction_method_data;
    if (v == null) return "--";
    if (typeof v === "string" || typeof v === "number") return String(v);
    return v.name || v.method || v.title || String(v.id || "--");
  };

  const getWalletFromRow = (row) => {
    // if your withdrawals API already sends wallet on row, it will be picked here
    const candidates = [
      row?.wallet_current_amount,
      row?.wallet_amount,
      row?.wallet,
      row?.wallet_current,
      row?.influencer_wallet,
    ];
    for (const c of candidates) {
      const n = Number(c);
      if (Number.isFinite(n)) return n;
    }
    return null;
  };

  const resolveInfluencerWallet = (row) => {
    // prefer wallet coming directly with row
    const direct = getWalletFromRow(row);
    if (direct != null) return direct;

    // else fallback to influencers list
    const key = getInfluencerKeyFromRow(row);
    if (!key) return null;

    const inf = influencerLookup.get(key);
    const wallet = Number(inf?.wallet_current_amount);
    return Number.isFinite(wallet) ? wallet : null;
  };

  // ==========================================================
  // REQUIRED: Total withdrawn (Approved) + Remaining wallet
  // - totalWallet: influencer wallet_current_amount
  // - totalApprovedWithdrawals: sum of all APPROVED withdrawals of that influencer
  // - availableWallet = totalWallet - totalApprovedWithdrawals
  // ==========================================================
  const sumApprovedWithdrawalsForInfluencer = (influencerKey) => {
    if (!influencerKey) return 0;

    const safe = Array.isArray(withdrawals) ? withdrawals : [];
    return safe.reduce((sum, w) => {
      const key = getInfluencerKeyFromRow(w);
      if (key !== influencerKey) return sum;
      if (String(w?.withdrawal_status || "").toLowerCase() !== "approved") return sum;

      const amt = Number(w?.withdrawal_amount);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);
  };

  const resolveAvailableWallet = (row) => {
    const influencerKey = getInfluencerKeyFromRow(row);
    const totalWallet = resolveInfluencerWallet(row);
    if (totalWallet == null) return null;

    const totalApprovedWithdrawals = sumApprovedWithdrawalsForInfluencer(influencerKey);
    return totalWallet - totalApprovedWithdrawals;
  };

  // ---- Search ----
  const filtered = useMemo(() => {
    const safe = Array.isArray(withdrawals) ? withdrawals : [];
    if (!query) return safe;
    const q = query.toLowerCase();

    return safe.filter((w) => {
      return (
        String(w?.id ?? "").toLowerCase().includes(q) ||
        getInfluencerLabel(w).toLowerCase().includes(q) ||
        String(w?.withdrawal_status ?? "").toLowerCase().includes(q)
      );
    });
  }, [withdrawals, query]);

  const pageCount = Math.ceil(filtered.length / pageSize) || 1;

  const current = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize).map((row, idx) => ({
      ...row,
      index: startIndex + idx + 1,
    }));
  }, [filtered, page]);

  // ---- CRUD UI ----
  const handleAdd = () => {
    setEditData({
      influencer_data: "",
      transaction_method_data: "",
      withdrawal_amount: "",
      withdrawal_status: "Pending",
    });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditData({
      id: row.id,
      influencer_data: typeof row.influencer_data === "string" ? row.influencer_data : getInfluencerKeyFromRow(row),
      transaction_method_data:
        typeof row.transaction_method_data === "number" || typeof row.transaction_method_data === "string"
          ? String(row.transaction_method_data)
          : row.transaction_method_data?.id != null
            ? String(row.transaction_method_data.id)
            : "",
      withdrawal_amount: row.withdrawal_amount ?? "",
      withdrawal_status: row.withdrawal_status || "Pending",
    });
    setOpen(true);
  };

  const handleDelete = async (row) => {
    const id = row?.id;
    if (id == null) return;
    if (!window.confirm("Delete this withdrawal?")) return;
    await deleteData(`/withdrawals/${id}/`);
    await getServicesData(["withdrawals", "influencers"]);
  };

  const handleSubmit = async (formValues) => {
    const payload = {
      influencer_data: String(formValues.influencer_data || "").trim(), // expects id/email based on your backend
      transaction_method_data: Number(formValues.transaction_method_data),
      withdrawal_amount: Number(formValues.withdrawal_amount),
      withdrawal_status: String(formValues.withdrawal_status || "Pending"),
    };

    const wantsApprove = payload.withdrawal_status === "Approved";
    const wasApproved = editData?.withdrawal_status === "Approved";

    const validateWalletForApproval = () => {
      const influencerKey = String(payload.influencer_data || "").trim();
      const inf = influencerLookup.get(influencerKey);

      const totalWallet = Number(inf?.wallet_current_amount ?? NaN);
      const amount = Number(payload.withdrawal_amount ?? NaN);

      if (!Number.isFinite(totalWallet)) {
        throw new Error("Influencer wallet not found. Please refresh influencers data.");
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid withdrawal amount");
      }

      // IMPORTANT: validate against available wallet = wallet - total approved withdrawals
      const alreadyApproved = sumApprovedWithdrawalsForInfluencer(influencerKey);
      const available = totalWallet - alreadyApproved;

      if (available < amount) {
        throw new Error(
          `Insufficient balance. Wallet: ${totalWallet}, Already Approved Withdrawals: ${alreadyApproved}, Available: ${available}, New Withdrawal: ${amount}`
        );
      }
    };

    // If you still want to PATCH influencer wallet_current_amount after approval, keep this.
    // But note: if your backend already handles wallet deduction, remove this to avoid double deduction.
    const deductWalletAfterApproval = async () => {
      const influencerKey = String(payload.influencer_data || "").trim();
      const inf = influencerLookup.get(influencerKey);

      const totalWallet = Number(inf?.wallet_current_amount ?? 0);
      const alreadyApproved = sumApprovedWithdrawalsForInfluencer(influencerKey);
      const amount = Number(payload.withdrawal_amount ?? 0);

      // new wallet after this approval = current wallet - this amount
      // (wallet already reflects previous deductions? If not, use: totalWallet - (alreadyApproved + amount))
      const newWallet = totalWallet - amount;

      const fd = new FormData();
      fd.append("wallet_current_amount", String(newWallet));
      await patchData(`/influencers/${encodeURIComponent(influencerKey)}/`, fd, "Wallet");

      return newWallet;
    };

    const createTxnHistoryAfterApproval = async (balanceAfter) => {
      const influencerKey = String(payload.influencer_data || "").trim();
      const methodLabel = String(formValues.transaction_method_data || "").trim();
      const amount = Number(payload.withdrawal_amount);

      const txPayload = {
        influencer_data: influencerKey,
        transaction_type: "Credited",
        payment_method: methodLabel || "Bank Transfer",
        payment_purpose: "Withdrawal",
        transaction_title: "Withdrawal Request",
        transaction_amount: Number.isFinite(amount) ? amount : 0,
        amount: Number.isFinite(amount) ? amount : 0,
        wallet_current_amount: Number.isFinite(Number(balanceAfter)) ? Number(balanceAfter) : undefined,
        balance: Number.isFinite(Number(balanceAfter)) ? Number(balanceAfter) : undefined,
        remaining_balance: Number.isFinite(Number(balanceAfter)) ? Number(balanceAfter) : undefined,
        note: "Withdrawal approved",
      };

      await postData("/influencer_transaction_history/", txPayload, "Transaction History");
    };

    try {
      if (editData?.id) {
        if (wantsApprove && !wasApproved) validateWalletForApproval();

        // patch withdrawal
        await patchData(`/withdrawals/${encodeURIComponent(editData.id)}/`, payload, "Withdrawal");

        // deduct wallet only when moving to Approved first time
        if (wantsApprove && !wasApproved) {
          const newWallet = await deductWalletAfterApproval();
          await createTxnHistoryAfterApproval(newWallet);
        }
      } else {
        if (wantsApprove) validateWalletForApproval();

        await postData("/withdrawals/", payload, "Withdrawal");

        if (wantsApprove) {
          const newWallet = await deductWalletAfterApproval();
          await createTxnHistoryAfterApproval(newWallet);
        }
      }

      await getServicesData(["withdrawals", "influencers"]);
      setOpen(false);
      setEditData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  const fields = [
    { label: "Influencer (email or id)", name: "influencer_data", type: "text", required: true },
    {
      label: "Transaction Method ID",
      name: "transaction_method_data",
      type: "text",
      required: true,
      placeholder: "1",
    },
    {
      label: "Withdrawal Amount",
      name: "withdrawal_amount",
      type: "text",
      required: true,
      placeholder: "5000",
    },
    {
      label: "Withdrawal Status",
      name: "withdrawal_status",
      type: "select",
      options: ["Pending", "Approved", "Rejected"],
      required: true,
    },
  ];

  // ---- Table columns (NOW includes total withdrawn + available wallet) ----
  const columns = [
    { label: "#", key: "index", type: "text" },
    { label: "ID", key: "id", type: "text" },
    { label: "Influencer", key: "influencer_data", render: (row) => getInfluencerLabel(row) },

    {
      label: "Total Wallet",
      key: "total_wallet",
      render: (row) => {
        const wallet = resolveInfluencerWallet(row);
        return wallet != null ? String(wallet) : "--";
      },
    },

    {
      label: "Total Withdrawn (Approved)",
      key: "total_withdrawn",
      render: (row) => {
        const influencerKey = getInfluencerKeyFromRow(row);
        const total = sumApprovedWithdrawalsForInfluencer(influencerKey);
        return String(total);
      },
    },

    {
      label: "Available Wallet",
      key: "available_wallet",
      render: (row) => {
        const available = resolveAvailableWallet(row);
        return available != null ? String(available) : "--";
      },
    },

    {
      label: "Transaction Method",
      key: "transaction_method_data",
      render: (row) => getTransactionMethodLabel(row),
    },
    { label: "Amount", key: "withdrawal_amount", type: "text" },
    { label: "Status", key: "withdrawal_status", type: "text" },
    {
      label: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex gap-3">
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
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">Influencer Withdrawals</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8">
        <input
          type="text"
          placeholder="Search by id, influencer, or status..."
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
          Add Withdrawal
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px--8">
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
        title={editData?.id ? "Edit Withdrawal" : "Add New Withdrawal"}
      >
        <Form
          fields={fields}
          initialData={editData || { withdrawal_status: "Pending" }}
          onSubmit={handleSubmit}
          submitLabel={editData?.id ? "Update Withdrawal" : "Create Withdrawal"}
          onCancel={() => {
            setOpen(false);
            setEditData(null);
          }}
        />
      </Modal>
    </div>
  );
}