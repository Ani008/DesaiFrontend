import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function Surgeries() {
  const [projects, setProjects] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [batches, setBatches] = useState({});
  const [openProjectId, setOpenProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState("surgeries");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("ALL");

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusFind = () => {
    setAppliedStatusFilter(statusFilter);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [projectRes, surgeryRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/surgeries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProjects(projectRes.data);
      setSurgeries(surgeryRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async (projectId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/batches/project/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setBatches((prev) => ({
        ...prev,
        [projectId]: res.data,
      }));
    } catch (err) {
      console.error("Failed to load batches");
    }
  };

  const toggleProject = (id) => {
    if (openProjectId === id) {
      setOpenProjectId(null);
      return;
    }

    setOpenProjectId(id);
    setActiveTab("surgeries");
    fetchBatches(id);
  };

  const exportProjectPDF = (project, projectSurgeries) => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.text(`Project Report: ${project.projectName}`, 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [
        [
          "MRD No",
          "Patient",
          "Eye",
          "Age",
          "Contact",
          "Surgery",
          "Category",
          "Date",
          "Donor",
        ],
      ],
      body: projectSurgeries.map((s) => [
        s.mrdNo,
        s.patientName,
        s.operatedEye,
        s.age,
        s.contactNo || "-",
        s.surgeryName,
        s.surgeryCategory || "-",
        new Date(s.dateOfSurgery).toLocaleDateString(),
        s.donorName || "-",
      ]),
    });

    doc.save(`${project.projectName}-surgeries.pdf`);
  };

  const handleDeleteSurgeries = async (projectId) => {
    if (!window.confirm("Delete all surgeries for this project?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/surgeries/project/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      fetchData();
    } catch {
      alert("Failed to delete surgeries");
    }
  };

  const handleDeleteBatch = async (batchId, projectId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this batch?",
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/batches/${batchId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // refresh batches
      fetchBatches(projectId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete batch");
    }
  };

  const downloadExcel = async (batchId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/batches/${batchId}/download-excel`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "batch-records.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download Excel");
    }
  };

  const downloadZip = async (batchId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/batches/${batchId}/download-zip`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "batch-photos.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download ZIP");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Surgeries</h1>

        <button
          onClick={() => navigate("/uploadexcel")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          Upload Excel
        </button>
      </div>

      {/* FILTER SECTION */}
      <div className="flex items-center gap-3 mt-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm"
        >
          <option value="ALL">All Projects</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <button
          onClick={handleStatusFind}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Find
        </button>
      </div>

      {projects
        .filter((project) => {
          if (appliedStatusFilter === "ALL") return true;
          return project.status === appliedStatusFilter;
        })
        .map((project) => {
          const projectSurgeries = surgeries.filter(
            (s) => s.projectId === project.id,
          );

          const completed = projectSurgeries.length;
          const remaining = project.balanceSurgery;
          const target = completed + remaining;

          return (
            <div key={project.id} className="bg-white rounded-xl shadow border">
              {/* CARD HEADER */}
              <div
                onClick={() => toggleProject(project.id)}
                className="cursor-pointer p-5"
              >
                <div className="grid grid-cols-6 gap-5">
                  <div>
                    <p className="text-sm text-gray-500">Project</p>
                    <p className="font-semibold">{project.projectName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="font-semibold">{target}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Project ID</p>
                    <p className="font-semibold">{project.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="font-semibold text-orange-600">{completed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="font-semibold text-red-600">{remaining}</p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        project.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* EXPANDED */}
              {openProjectId === project.id && (
                <div className="border-t px-5 pb-5">
                  {/* TOGGLE */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setActiveTab("surgeries")}
                      className={`px-4 py-2 rounded-full text-sm ${
                        activeTab === "surgeries"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      All Surgeries
                    </button>
                    <button
                      onClick={() => setActiveTab("batches")}
                      className={`px-4 py-2 rounded-full text-sm ${
                        activeTab === "batches"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      Batches
                    </button>
                  </div>

                  {/* SURGERIES TAB (RESTORED) */}
                  {activeTab === "surgeries" && (
                    <>
                      {projectSurgeries.length === 0 ? (
                        <p className="text-gray-500 py-4">No surgeries found</p>
                      ) : (
                        <>
                          <table className="w-full text-sm mt-4 border">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border px-3 py-2">MRD No</th>
                                <th className="border px-3 py-2">Eye</th>
                                <th className="border px-3 py-2">Surgery</th>
                                <th className="border px-3 py-2">Category</th>
                                <th className="border px-3 py-2">Date</th>
                                <th className="border px-3 py-2">Contact</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectSurgeries.slice(0, 5).map((s) => (
                                <tr key={s.id}>
                                  <td className="border px-3 py-2">
                                    {s.mrdNo}
                                  </td>
                                  <td className="border px-3 py-2">
                                    {s.operatedEye}
                                  </td>
                                  <td className="border px-3 py-2">
                                    {s.surgeryName}
                                  </td>
                                  <td className="border px-3 py-2">
                                    {s.surgeryCategory}
                                  </td>
                                  <td className="border px-3 py-2">
                                    {new Date(
                                      s.dateOfSurgery,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="border px-3 py-2">
                                    {s.contactNo}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="flex justify-between mt-4">
                            <p className="text-sm text-gray-500">
                              Showing latest 5 of {projectSurgeries.length}
                            </p>

                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  exportProjectPDF(project, projectSurgeries)
                                }
                                className="bg-indigo-600 text-white px-4 py-2 rounded"
                              >
                                Export PDF
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteSurgeries(project.id)
                                }
                                className="bg-red-600 text-white px-4 py-2 rounded"
                              >
                                Delete All
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* BATCHES TAB (UNCHANGED) */}
                  {activeTab === "batches" && (
                    <>
                      {!batches[project.id]?.length ? (
                        <p className="text-gray-500 py-4">
                          No batches found for this project
                        </p>
                      ) : (
                        <table className="w-full text-sm mt-4 border">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border px-3 py-2">Date</th>
                              <th className="border px-3 py-2">Completed</th>
                              <th className="border px-3 py-2">Excel</th>
                              <th className="border px-3 py-2">Photos</th>
                              <th className="border px-3 py-2">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batches[project.id].map((b) => (
                              <tr key={b.id}>
                                <td className="border px-3 py-2">
                                  {new Date(b.batchDate).toLocaleDateString()}
                                </td>
                                <td className="border px-3 py-2">
                                  {b.completedCount}
                                </td>
                                <td className="border px-3 py-2">
                                  <button
                                    onClick={() => downloadExcel(b.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs"
                                  >
                                    Download
                                  </button>
                                </td>
                                <td className="border px-3 py-2">
                                  <button
                                    onClick={() => downloadZip(b.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs"
                                  >
                                    Download
                                  </button>
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  <button
                                    onClick={() =>
                                      handleDeleteBatch(b.id, project.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
