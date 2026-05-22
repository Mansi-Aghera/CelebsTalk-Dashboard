// Central_Store/app_context.jsx
import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import Swal from "sweetalert2";
import { Navigate, Outlet } from "react-router-dom";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // const [baseUrl] = useState(
  //   import.meta?.env?.DEV ? "/api" : "https://adminapi.celebstalk.in"
  // );
const [baseUrl] = useState(
  import.meta?.env?.DEV
    ? "https://adminapi.celebstalk.in"
    : "https://adminapi.celebstalk.in"
);
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const [fetchedData, setFetchedData] = useState({
    influencers: [],
    banners: [],
    categories: [],
    users: [],
    adminData: [],
    sponsoredContent: [],
    reviews: [],
    faqs: [],
    services: [],
    expertise: [],
    withdrawals: [],
    userQueries: [],
  });

  const inflightFetchRef = useRef({});
  const lastFetchAtRef = useRef({});
  const preferredAuthSchemeRef = useRef(null);

  const getAccessToken = () => {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  const getPreferredAuthScheme = () => {
    if (preferredAuthSchemeRef.current) return preferredAuthSchemeRef.current;
    const token = getAccessToken();
    if (!token) return "Bearer";
    const looksLikeJwt = token.split(".").length === 3;
    preferredAuthSchemeRef.current = looksLikeJwt ? "Bearer" : "Token";
    return preferredAuthSchemeRef.current;
  };

  const setAuthHeader = (headers, scheme) => {
    const token = getAccessToken();
    if (!token) return;
    headers["Authorization"] = `${scheme} ${token}`;
  };

  // Generic request for POST, PATCH, PUT
  const request = async (method, endpoint, payload = null, message = "Item") => {
    const isFormData = payload instanceof FormData;

    const body = isFormData ? payload : payload ? JSON.stringify(payload) : undefined;

    const doFetch = async (scheme, allowRetry) => {
      const headers = {};
      setAuthHeader(headers, scheme);

      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        body,
        headers,
        credentials: "include",
      });

      if (res.ok) {
        preferredAuthSchemeRef.current = scheme;
      }

      if ((res.status === 401 || res.status === 403) && allowRetry && getAccessToken()) {
        const altScheme = scheme === "Bearer" ? "Token" : "Bearer";
        return doFetch(altScheme, false);
      }

      return res;
    };

    const preferred = getPreferredAuthScheme();
    const res = await doFetch(preferred, true);

    let data = {};
    let rawText = "";
    try {
      data = await res.json();
    } catch (e) {
      try {
        rawText = await res.clone().text();
      } catch (e2) {}
    }

    if (!res.ok) {
      const errMsg =
        data.message ||
        data.detail ||
        data.image?.[0] ||
        data.non_field_errors?.[0] ||
        "Request failed";
      const extra =
        data && Object.keys(data).length
          ? ` | ${JSON.stringify(data)}`
          : rawText
            ? ` | ${rawText.slice(0, 500)}`
            : "";
      throw new Error(`${res.status} ${errMsg}${extra}`);
    }

    if (method !== "DELETE") {
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `${message} ${method === "PATCH" || method === "PUT" ? "Updated" : "Created"} Successfully!`,
        timer: 2000,
        showConfirmButton: false,
      });
    }

    return data;
  };

  const postData = (ep, payload, msg) => request("POST", ep, payload, msg);
  const patchData = (ep, payload, msg) => request("PATCH", ep, payload, msg); // ← Best for file updates
  const putData = (ep, payload, msg) => request("PUT", ep, payload, msg);
  const deleteData = async (endpoint, options = {}) => {
    if (!options?.skipConfirm) {
      const result = await Swal.fire({
        title: "Delete?",
        text: "This cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (!result.isConfirmed) return;
    }

    const doFetch = async (scheme, allowRetry) => {
      const headers = {};
      setAuthHeader(headers, scheme);

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      if (res.ok) {
        preferredAuthSchemeRef.current = scheme;
      }

      if ((res.status === 401 || res.status === 403) && allowRetry && getAccessToken()) {
        const altScheme = scheme === "Bearer" ? "Token" : "Bearer";
        return doFetch(altScheme, false);
      }

      return res;
    };

    const preferred = getPreferredAuthScheme();
    const res = await doFetch(preferred, true);

    if (!res.ok) {
      let data = {};
      let rawText = "";
      try {
        data = await res.clone().json();
      } catch (e) {
        try {
          rawText = await res.text();
        } catch (e2) {}
      }

      const errMsg =
        data.message ||
        data.detail ||
        data.non_field_errors?.[0] ||
        "Delete failed";

      const extra =
        data && Object.keys(data).length
          ? ` | ${JSON.stringify(data)}`
          : rawText
            ? ` | ${rawText.slice(0, 500)}`
            : "";

      throw new Error(`${res.status} ${errMsg}${extra}`);
    }

    Swal.fire("Deleted!", "Item removed.", "success");
  };

  const getData = async (endPoint) => {
    const doFetch = async (scheme, allowRetry) => {
      const headers = {};
      setAuthHeader(headers, scheme);

      const res = await fetch(`${baseUrl}${endPoint}`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (res.ok) {
        preferredAuthSchemeRef.current = scheme;
      }

      if ((res.status === 401 || res.status === 403) && allowRetry && getAccessToken()) {
        const altScheme = scheme === "Bearer" ? "Token" : "Bearer";
        return doFetch(altScheme, false);
      }

      return res;
    };

    const preferred = getPreferredAuthScheme();
    const res = await doFetch(preferred, true);

    if (!res.ok) {
      let data = {};
      let rawText = "";
      try {
        data = await res.clone().json();
      } catch (e) {
        try {
          rawText = await res.text();
        } catch (e2) {}
      }

      const errMsg =
        data.message ||
        data.detail ||
        data.non_field_errors?.[0] ||
        "Fetch failed";

      const extra =
        data && Object.keys(data).length
          ? ` | ${JSON.stringify(data)}`
          : rawText
            ? ` | ${rawText.slice(0, 500)}`
            : "";

      throw new Error(`${res.status} ${errMsg}${extra}`);
    }

    return res.json();
  };

  const getServicesData = async (keysToFetch) => {
    try {
      const endpoints = {
        influencers: "/influencers/",
        banners: "/banners/",
        categories: "/category/",
        users: "/user/",
        adminData: "/admin_data/",
        sponsoredContent: "/sponsored_content/",
        reviews: "/reviews/",
        faqs: "/faqs/",
        services: "/services/",
        expertise: "/expertise/",
        withdrawals: "/withdrawals/",
        userQueries: "/user_query/",
      };

      const normalizeList = (value) => {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.results)) return value.results;
        if (Array.isArray(value?.data)) return value.data;
        return [];
      };

      const allKeys = Object.keys(endpoints);
      const requestedKeys =
        keysToFetch == null
          ? allKeys
          : Array.isArray(keysToFetch)
            ? keysToFetch
            : [keysToFetch];

      const keys = requestedKeys.filter((k) => allKeys.includes(k));
      if (!keys.length) return;

      const COOLDOWN_MS = 500;

      const results = await Promise.allSettled(
        keys.map(async (k) => {
          const now = Date.now();
          const lastAt = lastFetchAtRef.current[k] || 0;

          if (inflightFetchRef.current[k]) {
            return inflightFetchRef.current[k];
          }

          if (now - lastAt < COOLDOWN_MS) {
            return null;
          }

          const p = getData(endpoints[k]);
          inflightFetchRef.current[k] = p;
          try {
            return await p;
          } finally {
            inflightFetchRef.current[k] = null;
            lastFetchAtRef.current[k] = Date.now();
          }
        })
      );

      setFetchedData((prev) => {
        const next = { ...prev };
        results.forEach((r, idx) => {
          const key = keys[idx];
          if (r.status === "fulfilled") {
            if (r.value !== null) next[key] = normalizeList(r.value);
          } else {
            console.error(`Fetch failed for ${endpoints[key]}:`, r.reason);
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getServicesData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        baseUrl,
        postData,
        patchData, // ← Use this for edit
        putData,
        deleteData,
        fetchedData,
        getServicesData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export const PrivateRoute = () => {
  const isAuth = localStorage.getItem("isAuth");
  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};