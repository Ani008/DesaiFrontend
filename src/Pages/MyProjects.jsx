import { useEffect, useState } from "react";
import axios from "axios";
import AddProjectModal from "../Components/AddProjectModal";
import { getUserRole } from "../utils/auth";

import editIcon from "../assets/edit-icon.svg";
import trash from "../assets/trash.svg";

export default function MyProjects() {
  const userRole = getUserRole();

  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [projectFilter, setProjectFilter] = useState("ALL");

  const filteredProjects = projects.filter((p) => {
    if (projectFilter === "COMPLETED") {
      return Number(p.balanceSurgery) === 0;
    }

    if (projectFilter === "INCOMPLETE") {
      return Number(p.balanceSurgery) > 0;
    }

    return true; // ALL
  });

  const handleEditClick = (project) => {
    setSelectedProject(project);
    setIsEditMode(true);
    setShowModal(true);
  };

  // 🔹 Fetch projects on load
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, skipping fetch");
        return;
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setProjects(res.data);
    } catch (error) {
      console.error("Fetch projects error:", error);
    }
  };

  // 🔹 Add project after save
  const handleAddProject = (project) => {
    setProjects((prev) => [...prev, project]);
  };

  // 🔹 Cards logic (based on real data)
  const totalProjects = projects.length;

  const totalSurgeries = projects.reduce(
    (sum, p) => sum + Number(p.balanceSurgery || 0),
    0,
  );

  const totalAmount = projects.reduce(
    (sum, p) => sum + Number(p.totalAmount || 0),
    0,
  );

  const formatINR = (amount) => {
    if (amount === null || amount === undefined) return "-";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const displayTotalAmount =
    userRole === "ADMIN" ? formatINR(totalAmount) : "-";

  const displayAmountByRole = (amount) => {
    if (userRole !== "ADMIN") return "-";
    return `₹ ${amount}`;
  };

  //NEW CARDS :
  const completedProjects = projects.filter(
    (p) => Number(p.balanceSurgery) === 0,
  ).length;

  const incompleteProjects = projects.filter(
    (p) => Number(p.balanceSurgery) > 0,
  ).length;

  function StatCard({ title, value, onClick, active }) {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer rounded-lg p-4 shadow transition ${active ? "bg-blue-100 border border-blue-500" : "bg-white"}`}
      >
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    );
  }

  //DELETE ROUTE
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?",
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      alert("Failed to delete project");
    }
  };

  const handleSubmissionChange = async (projectId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/submission`,
        { submitted: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, submitted: newStatus } : p,
        ),
      );
    } catch (error) {
      console.error("Submission status update error:", error);
      alert("Failed to update submission status");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-700">My Projects</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium"
        >
          + Add Record
        </button>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          onClick={() => setProjectFilter("ALL")}
          active={projectFilter === "ALL"}
        />

        <StatCard title="Total Balance Surgeries" value={totalSurgeries} />

        <StatCard title="Total Amount (₹)" value={displayTotalAmount} />

        <StatCard
          title="Completed Projects"
          value={completedProjects}
          onClick={() => setProjectFilter("COMPLETED")}
          active={projectFilter === "COMPLETED"}
        />

        <StatCard
          title="Incomplete Projects"
          value={incompleteProjects}
          onClick={() => setProjectFilter("INCOMPLETE")}
          active={projectFilter === "INCOMPLETE"}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 text-white">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Project Name</th>
              <th className="p-3 text-left">Project Code</th>
              <th className="p-3 text-left">Receipt No</th>
              <th className="p-3 text-left">Total Amount</th>
              <th className="p-3 text-left">Per Surgery</th>
              <th className="p-3 text-left">Balance Surgery</th>
              <th className="p-3 text-left">Submit</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td className="text-center p-4 text-gray-500" colSpan="9">
                  No projects found
                </td>
              </tr>
            ) : null}

            {filteredProjects.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.id}</td>
                <td className="p-3 font-medium">{p.projectName}</td>
                <td className="p-3">{p.projectCode}</td>
                <td className="p-3">{p.receiptNo}</td>
                <td className="p-3">{displayAmountByRole(p.totalAmount)}</td>
                <td className="p-3">
                  {displayAmountByRole(p.perSurgeryAmount)}
                </td>
                <td className="p-3 font-semibold">{p.balanceSurgery}</td>
                <td className="p-3">
                  <select
                    value={p.submitted || "NOTSUBMITTED"}
                    onChange={(e) =>
                      handleSubmissionChange(p.id, e.target.value)
                    }
                    className={`border rounded-md px-2 py-1 text-sm bg-white
                        ${
                          p.submitted === "SUBMITTED"
                            ? "border-green-500 text-green-700"
                            : "border-gray-300 text-gray-600"
                        }
                    `}
                  >
                    <option value="NOTSUBMITTED">Not Submitted</option>
                    <option value="SUBMITTED">Submitted</option>
                  </select>
                </td>
                <td className="p-3 flex gap-3 items-center">
                  {/* Edit */}
                  <img
                    src={editIcon}
                    alt="Edit"
                    onClick={() => handleEditClick(p)}
                    className="h-5 w-5 cursor-pointer hover:scale-110"
                  />

                  {/* Delete */}
                  <img
                    src={trash}
                    alt="Delete"
                    onClick={() => handleDelete(p.id)}
                    className="h-5 w-5 cursor-pointer hover:scale-110"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <AddProjectModal
          onClose={() => {
            setShowModal(false);
            setIsEditMode(false);
            setSelectedProject(null);
          }}
          onSave={fetchProjects}
          editData={selectedProject}
          isEdit={isEditMode}
        />
      )}
    </div>
  );
}
