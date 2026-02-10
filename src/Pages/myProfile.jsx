import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
  const navigate = useNavigate();

  const admin = useMemo(() => {
    try {
      const raw = localStorage.getItem("admin");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuth");
    if (!isAuth) navigate("/", { replace: true });
  }, [navigate]);

  const rows = useMemo(() => {
    if (!admin) return [];

    return [
      { label: "Admin ID", value: admin.id ?? "-" },
      { label: "Email", value: admin.email ?? "-" },
    ];
  }, [admin]);

  return (
    <div className="space-y-6">
      <div className="text-center py-10 border-b border-gray-200 bg-gradient-to-b from-purple-50 to-white">
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
          My Profile
        </h1>
      </div>

      {!admin ? ( 
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-gray-700 font-medium">Profile data not found.</p>
          <p className="text-gray-500 text-sm mt-1">
            Please login again to load your profile.  
          </p>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="mt-4 text-sm px-4 py-2 rounded-md bg-[#ff237c] text-white hover:bg-[#ea028b]"
          > 
            Go to Login
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="space-y-4">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between border-b border-gray-100 pb-3"
              >
                <span className="text-sm font-medium text-gray-600">
                  {r.label}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {String(r.value)}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4">
          </p>
        </div>
      )}
    </div>
  );
}
