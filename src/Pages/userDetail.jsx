// src/pages/UserDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppContext } from "../Central_Store/app_context.jsx";

export default function UserDetail() {
  const { id } = useParams();
  const numericId = Number(id);
  const { fetchedData, baseUrl } = useAppContext();
  const STATIC_URL = import.meta?.env?.DEV ? "http://127.0.0.1:8000" : "https://celebstalks.pythonanywhere.com";

  const [categoriesData, setCategoriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = useMemo(
    () => fetchedData.users?.find((u) => u.id === numericId),
    [fetchedData.users, numericId]
  );

  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        const res = await fetch(`${baseUrl}/user-categories/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch user categories");
        const data = await res.json();

        // API shape: { count, results: [ { user_id, category_... } ] }
        const all = Array.isArray(data) ? data : data.results || [];
        const match = all.filter((item) => item.user_id === numericId);
        setCategoriesData(match);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchUserCategories();
  }, [baseUrl, numericId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Detail</h1>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>
        <Link
          to="/dashboard/users"
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Users
        </Link>
      </div>

      {user ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold mb-2">Basic Info</h2>
              {user.image ? (
                <img
                  src={String(user.image).startsWith("http") ? String(user.image) : STATIC_URL + String(user.image)}
                  alt={user.full_name || "user"}
                  className="h-32 w-32 object-cover rounded-full border"
                />
              ) : null}
              <p><span className="font-medium">Full Name:</span> {user.full_name}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Mobile:</span> {user.mobile}</p>
              <p><span className="font-medium">Gender:</span> {user.gender}</p>
              <p><span className="font-medium">Interests:</span> {user.interests}</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold mb-2">Account</h2>
              <p><span className="font-medium">Referral Code:</span> {user.referral_code}</p>
              <p>
                <span className="font-medium">Active:</span>{" "}
                {user.is_active ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-medium">Staff:</span>{" "}
                {user.is_staff ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-medium">Created At:</span>{" "}
                {user.created_at}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">User Categories</h2>

            {loading && (
              <p className="text-gray-500 text-sm">Loading categories...</p>
            )}

            {error && !loading && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {!loading && !error && categoriesData.length === 0 && (
              <p className="text-gray-500 text-sm">
                No categories found for this user.
              </p>
            )}

            {!loading && !error && categoriesData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesData.map((cat) => (
                  <div
                    key={cat.id}
                    className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 bg-gray-50"
                  >
                    {cat.category_image && (
                      <img
                        src={cat.category_image}
                        alt={cat.category_name}
                        className="h-16 w-16 object-cover rounded-full border"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{cat.category_name}</p>
                      <p className="text-xs text-gray-500">ID: {cat.category_id}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          cat.category_status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cat.category_status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">User not found.</p>
      )}
    </div>
  );
}
