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
        axios.get(`${API_URL}/api/projects`, {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/surgeries`, {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setSurgeries(Array.isArray(surgeriesRes.data) ? surgeriesRes.data : []);

      setError(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);

      if (error.name === "AbortError" || error.code === "ERR_CANCELED") return;

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load dashboard data.",
      );

      console.error("Dashboard fetch error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  /*
  =====================================
  STAT CALCULATIONS
  =====================================
  
  */

  const isWithinFilter = (date) => {
    if (!date) return false;

    const surgeryDate = new Date(date);
    const now = new Date();

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return surgeryDate >= startOfMonth && surgeryDate <= now;
  };

  const stats = useMemo(() => {
    let totalTarget = 0;
    let totalCompleted = 0;
    let totalIncomplete = 0;

    projects.forEach((project) => {
      if (!project) return;

      // Lifetime completed surgeries
      const lifetimeCompleted = surgeries.filter(
        (s) => s.projectId === project.id,
      ).length;

      // FIXED TARGET
      const target = (project.balanceSurgery || 0) + lifetimeCompleted;

      // Completed surgeries
      const completed = surgeries.filter(
        (s) => s.projectId === project.id,
      ).length;

      // Remaining
      const incomplete = Math.max(target - completed, 0);

      totalTarget += target;
      totalCompleted += completed;
      totalIncomplete += incomplete;
    });

    // ✅ Project completion logic
    const completedProjects = projects.filter(
      (p) => Number(p.balanceSurgery) === 0,
    ).length;

    const incompleteProjects = projects.length - completedProjects;

    return {
      totalDonors: projects.length,
      totalTarget: totalTarget,
      completedTarget: totalCompleted,
      incompleteTarget: totalIncomplete,
      completedProjects,
      incompleteProjects,
    };
  }, [projects, surgeries]);

  const filteredProjects = projects.filter((p) => {
    if (projectFilter === "COMPLETED") {
      return Number(p.balanceSurgery) === 0;
    }

    if (projectFilter === "INCOMPLETE") {
      return Number(p.balanceSurgery) > 0;
    }

    return true; // ALL
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* ERROR */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
          <button
            onClick={() => {
              setError(null);
              fetchDashboardData(new AbortController().signal);
            }}
            className="ml-4 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Project Management Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* STAT CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="All Projects"
          value={stats.totalDonors}
          color="text-gray-800"
          onClick={() => setProjectFilter("ALL")}
          active={projectFilter === "ALL"}
        />

        <StatCard
          title="Total Target"
          value={stats.totalTarget}
          color="text-indigo-600"
        />

        <StatCard
          title="Completed Surgeries"
          value={stats.completedTarget}
          color="text-green-600"
        />

        <StatCard
          title="Incomplete"
          value={stats.incompleteTarget}
          color="text-red-600"
        />

        <StatCard
          title="Completed Project"
          value={stats.completedProjects}
          color="text-purple-600"
          onClick={() => setProjectFilter("COMPLETED")}
          active={projectFilter === "COMPLETED"}
        />

        <StatCard
          title="Incomplete Project"
          value={stats.incompleteProjects}
          color="text-blue-600"
          onClick={() => setProjectFilter("INCOMPLETE")}
          active={projectFilter === "INCOMPLETE"}
        />
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow p-6">
        <DonorTable projects={filteredProjects} surgeries={surgeries} />
      </div>

      {/* CHART */}

      <div className="bg-white rounded-xl shadow p-6">
        <SurgeryProgressChart surgeries={surgeries} />
      </div>
    </div>
  );
};

export default HospitalDashboard;

const StatCard = ({ title, value, color, onClick, active }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-md transition p-5
        ${active ? "border-2 border-blue-500" : "border border-gray-200"}
      `}
    >
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h2 className={`text-3xl font-bold mt-1 ${color}`}>{value}</h2>
    </div>
  );
};
