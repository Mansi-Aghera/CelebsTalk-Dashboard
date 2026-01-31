// src/Components/Form.jsx
import { useState, useEffect } from "react";

export default function Form({
  fields = [],
  initialData = {},
  onSubmit,
  submitLabel = "Submit",
  onCancel,
}) {
  const [formData, setFormData] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});

  // Initialize form data + previews
  useEffect(() => {
    const initial = {};
    const previews = {};

    fields.forEach((field) => {
      const value = initialData[field.name] ?? "";

      initial[field.name] = value;

      // If edit mode and image URL exists → show preview
      if (field.type === "image" && typeof value === "string" && value.startsWith("http")) {
        previews[field.name] = value;
      }
    });

    setFormData(initial);
    setImagePreviews(previews);
  }, [initialData, fields]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];

      setFormData((prev) => ({
        ...prev,
        [name]: file || null, // actual File object ya null
      }));

      if (file) {
        setImagePreviews((prev) => ({
          ...prev,
          [name]: URL.createObjectURL(file),
        }));
      } else {
        setImagePreviews((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedData = { ...formData };

    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">

            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>

            {/* Text */}
            {field.type === "text" && (
              <input
                type="text"
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
            )}

            {field.type === "password" && (
              <input
                type="password"
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
            )}

            {field.type === "date" && (
              <input
                type="date"
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
            )}

            {/* Textarea */}
            {field.type === "textarea" && (
              <textarea
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                rows={field.rows || 4}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
            )}

            {/* Select */}
            {(field.type === "select" || Array.isArray(field.options)) && (
              <div className="relative">
                <select
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  required={field.required}
                  style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                >
                  <option value="">-- Choose --</option>
                  {field.options?.map((opt) => {
                    const value = typeof opt === "object" && opt !== null ? opt.value : opt;
                    const label = typeof opt === "object" && opt !== null ? opt.label : opt;

                    return (
                      <option key={String(value)} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-gray-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Image Upload */}
            {field.type === "image" && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  name={field.name}
                  onChange={handleChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />

                {imagePreviews[field.name] && (
                  <div className="relative">
                    <p className="text-xs text-gray-500 mb-1">
                      {formData[field.name] instanceof File ? "New Image" : "Current Image"}
                    </p>
                    <img
                      src={imagePreviews[field.name]}
                      alt="preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-dashed border-gray-300"
                    />
                  </div>
                )}
              </div>
            )}

            {/* File Upload */}
            {field.type === "file" && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept={field.accept || "*/*"}
                  name={field.name}
                  onChange={handleChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500">
                  {formData[field.name] instanceof File ? formData[field.name].name : ""}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-8 py-2 bg-[#940aea] text-white rounded-lg hover:bg-[#7d07c2] font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}