import { useEffect, useState } from "react";
import axios from "axios";

export default function UploadExcel() {
  // ---------- PROJECT + BATCH STATE ----------
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [batchDate, setBatchDate] = useState("");
  const [completedCount, setCompletedCount] = useState("");
  const [batchId, setBatchId] = useState(null);

  // ---------- FILE STATE ----------
  const [excelFile, setExcelFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);

  // ---------- ERROR STATE (SEPARATE) ----------
  const [excelError, setExcelError] = useState("");
  const [zipError, setZipError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // ---------- FETCH PROJECTS ----------
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/projects`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setProjects(res.data || []);
      } catch {
        setGeneralError("Failed to load projects");
      }
    };
    fetchProjects();
  }, []);

  // ---------- CREATE BATCH ----------
  const handleCreateBatch = async () => {
    if (!selectedProject || !batchDate || !completedCount) {
      setGeneralError("Please fill all batch details.");
      return;
    }

    try {
      setLoading(true);
      setGeneralError("");
      setSuccessMessage("");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/batches/create`,
        {
          projectId: Number(selectedProject),
          batchDate,
          completedCount: Number(completedCount),
          createdBy: Number(userId),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setBatchId(res.data.batch.id);
      setSuccessMessage("Batch created successfully. Upload files below.");
    } catch (err) {
      setGeneralError(err.response?.data?.message || "Batch creation failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UPLOAD EXCEL ----------
  const handleUploadExcel = async () => {
    if (!excelFile) {
      setExcelError("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      setLoading(true);
      setExcelError("");
      setSuccessMessage("");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/excel/upload/${batchId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccessMessage(res.data.message || "Excel uploaded successfully.");
      setExcelFile(null);
    } catch (err) {
      setExcelError(err.response?.data?.message || "Excel upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UPLOAD ZIP ----------
  const handleUploadZip = async () => {
    if (!zipFile) {
      setZipError("Please select a ZIP file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", zipFile);

    try {
      setLoading(true);
      setZipError("");
      setSuccessMessage("");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/batches/upload-zip/${batchId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccessMessage(res.data.message || "ZIP uploaded successfully.");
      setZipFile(null);
    } catch (err) {
      setZipError(err.response?.data?.message || "ZIP upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">
        Create Batch to Upload Records
      </h1>

      {/* ---------- TEMPLATE CARD ---------- */}
      <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Download Excel Template</h2>
          <p className="text-sm text-gray-600">
            Use this template to upload surgery records
          </p>
        </div>
        <button
          onClick={() => window.open("/templates/Records.xlsx", "_blank")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded"
        >
          Download Template
        </button>
      </div>

      {/* ---------- CREATE BATCH ---------- */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Batch Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border rounded px-3 py-2 max-h-40 overflow-y-auto"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                (ID: {p.id}) {p.projectName} 
              </option>
            ))}
          </select>

          <input
            type="date"
            value={batchDate}
            onChange={(e) => setBatchDate(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <input
            type="number"
            placeholder="Completed Surgeries"
            value={completedCount}
            onChange={(e) => setCompletedCount(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={handleCreateBatch}
          disabled={loading}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded"
        >
          Create Batch
        </button>

        {generalError && (
          <div className="mt-3 bg-red-100 text-red-700 p-3 rounded">
            {generalError}
          </div>
        )}
      </div>

      {/* ---------- UPLOAD SECTION ---------- */}
      {batchId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EXCEL CARD */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Upload Excel</h2>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="block w-full border rounded px-3 py-2"
            />

            <button
              onClick={handleUploadExcel}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
            >
              Upload Excel
            </button>

            {excelError && (
              <div className="mt-3 bg-red-100 text-red-700 p-2 rounded">
                {excelError}
              </div>
            )}
          </div>

          {/* ZIP CARD */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Upload ZIP</h2>

            <input
              type="file"
              accept=".zip"
              onChange={(e) => setZipFile(e.target.files[0])}
              className="block w-full border rounded px-3 py-2"
            />

            <button
              onClick={handleUploadZip}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Upload ZIP
            </button>

            {zipError && (
              <div className="mt-3 bg-red-100 text-red-700 p-2 rounded">
                {zipError}
              </div>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          {successMessage}
        </div>
      )}
    </div>
  );
}
