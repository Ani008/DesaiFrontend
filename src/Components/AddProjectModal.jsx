import { useState, useEffect } from "react";
import axios from "axios";

export default function AddProjectModal({ onClose, onSave, editData, isEdit }) {
  const [form, setForm] = useState({
    projectName: "",
    projectCode: "",
    receiptNo: "",
    perSurgeryAmount: "",
    balanceSurgery: "",
    totalAmount: "",
  });

  const [isManualTotal, setIsManualTotal] = useState(false);

  // 🟢 Load edit data
  useEffect(() => {
    if (isEdit && editData) {
      setForm({
        projectName: editData.projectName || "",
        projectCode: editData.projectCode || "",
        receiptNo: editData.receiptNo || "",
        perSurgeryAmount: editData.perSurgeryAmount || "",
        balanceSurgery: editData.balanceSurgery || "",
        totalAmount: editData.totalAmount || "",
      });
    }
  }, [isEdit, editData]);

  // 🟢 Auto calculate (only if user has not manually edited total)
  useEffect(() => {
    if (!isManualTotal && form.perSurgeryAmount && form.balanceSurgery) {
      const calculated =
        Number(form.perSurgeryAmount) * Number(form.balanceSurgery);

      setForm((prev) => ({
        ...prev,
        totalAmount: calculated,
      }));
    }
  }, [form.perSurgeryAmount, form.balanceSurgery, isManualTotal]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If user edits total manually → stop auto override
    if (name === "totalAmount") {
      setIsManualTotal(true);
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const url = isEdit
        ? `${import.meta.env.VITE_API_URL}/api/projects/${editData.id}`
        : `${import.meta.env.VITE_API_URL}/api/projects`;

      const method = isEdit ? "put" : "post";

      await axios[method](
        url,
        {
          projectName: form.projectName,
          projectCode: form.projectCode,
          receiptNo: form.receiptNo,
          perSurgeryAmount: Number(form.perSurgeryAmount),
          balanceSurgery: Number(form.balanceSurgery),
          totalAmount: Number(form.totalAmount), // ✅ IMPORTANT
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSave();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? "Update Project" : "Add Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <input
            name="projectName"
            placeholder="Project Name"
            value={form.projectName}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="projectCode"
            placeholder="Project Code"
            value={form.projectCode}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="receiptNo"
            type="text"
            placeholder="Receipt No"
            value={form.receiptNo}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="perSurgeryAmount"
            type="number"
            placeholder="Per Surgery Amount"
            value={form.perSurgeryAmount}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="balanceSurgery"
            type="number"
            placeholder="Balance Surgeries"
            value={form.balanceSurgery}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg"
          />

          <input
            name="totalAmount"
            type="number"
            placeholder="Total Amount"
            value={form.totalAmount}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-orange-500 text-white"
          >
            {isEdit ? "Update Project" : "Add Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
