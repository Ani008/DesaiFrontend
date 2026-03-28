import React from "react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DonorTable from "../Components/SurgeryTable.jsx";
import SurgeryProgressChart from "../Components/SurgeryProgressChart";

const HospitalDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [selectedFY, setSelectedFY] = useState("2026-2027");

  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchDashboardData = async (signal) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || token === "undefined" || token === "null") {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL;
      const [projectsRes, surgeriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/projects`, { signal, headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/surgeries`, { signal, headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setSurgeries(Array.isArray(surgeriesRes.data) ? surgeriesRes.data : []);
      setError(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") return;
      setError(error.response?.data?.message || error.message || "Failed to load dashboard data.");
    }
  };

  const getFinancialYear = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const year = localDate.getFullYear();
    const month = localDate.getMonth();
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  // --- STATS LOGIC (STATIC / LIFETIME) ---
  // These use the full 'projects' and 'surgeries' arrays and never change based on dropdown
  const stats = useMemo(() => {
    let totalTarget = 0;
    let totalCompleted = 0;
    let totalIncomplete = 0;

    projects.forEach((project) => {
      if (!project) return;
      const completed = surgeries.filter((s) => s.projectId === project.id).length;
      const target = (project.balanceSurgery || 0) + completed;
      const incomplete = Math.max(target - completed, 0);

      totalTarget += target;
      totalCompleted += completed;
      totalIncomplete += incomplete;
    });

    const completedProjectsCount = projects.filter(p => Number(p.balanceSurgery) === 0).length;

    return {
      totalDonors: projects.length,
      totalTarget,
      completedTarget: totalCompleted,
      incompleteTarget: totalIncomplete,
      completedProjects: completedProjectsCount,
      incompleteProjects: projects.length - completedProjectsCount,
    };
  }, [projects, surgeries]);

  // --- DYNAMIC FILTERING (FOR TABLE & CHART ONLY) ---

  const fyFilteredSurgeries = useMemo(() => {
    return surgeries.filter((s) => getFinancialYear(s.dateOfSurgery) === selectedFY);
  }, [surgeries, selectedFY]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Show project if it has surgeries in this FY
      const hasSurgeriesInYear = fyFilteredSurgeries.some(s => s.projectId === p.id);
      if (!hasSurgeriesInYear) return false;

      // Apply the Status Filter (All/Completed/Incomplete)
      if (projectFilter === "COMPLETED") return Number(p.balanceSurgery) === 0;
      if (projectFilter === "INCOMPLETE") return Number(p.balanceSurgery) > 0;
      return true;
    });
  }, [projects, fyFilteredSurgeries, projectFilter]);

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  if (loading) return <div className="p-6 animate-pulse">Loading...</div>;

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Project Management Dashboard</h1>
        <div className="flex gap-3 items-center">
          <select 
            value={selectedFY} 
            onChange={(e) => setSelectedFY(e.target.value)} 
            className="border px-3 py-2 rounded-lg bg-white shadow-sm"
          >
            <option value="2023-2024">2023-2024</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg">Logout</button>
        </div>
      </div>

      {/* STAT CARDS - These are now STATIC/LIFETIME */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="All Projects" value={stats.totalDonors} color="text-gray-800" onClick={() => setProjectFilter("ALL")} active={projectFilter === "ALL"} />
        <StatCard title="Total Target" value={stats.totalTarget} color="text-indigo-600" />
        <StatCard title="Completed Surgeries" value={stats.completedTarget} color="text-green-600" />
        <StatCard title="Incomplete Surgeries" value={stats.incompleteTarget} color="text-red-600" />
        <StatCard title="Completed Project" value={stats.completedProjects} color="text-purple-600" onClick={() => setProjectFilter("COMPLETED")} active={projectFilter === "COMPLETED"} />
        <StatCard title="Incomplete Project" value={stats.incompleteProjects} color="text-blue-600" onClick={() => setProjectFilter("INCOMPLETE")} active={projectFilter === "INCOMPLETE"} />
      </div>

      {/* TABLE - This is DYNAMIC (Filtered by Year) */}
      <div className="bg-white rounded-xl shadow p-6">
        <DonorTable projects={filteredProjects} surgeries={fyFilteredSurgeries} />
      </div>

      {/* CHART - This is DYNAMIC (Filtered by Year) */}
      <div className="bg-white rounded-xl shadow p-6">
        <SurgeryProgressChart surgeries={fyFilteredSurgeries} />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, onClick, active }) => (
  <div onClick={onClick} className={`cursor-pointer bg-white rounded-2xl shadow-sm p-5 border transition ${active ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}>
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <h2 className={`text-3xl font-bold mt-1 ${color}`}>{value}</h2>
  </div>
);

export default HospitalDashboard;