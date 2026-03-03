import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DonorTable from "../Components/SurgeryTable.jsx";
import SurgeryProgressChart from "../Components/SurgeryProgressChart";

import { Users, Target, CheckCircle, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);

    return () => {
      controller.abort(); // 👈 prevents memory leak
    };
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
      if (!API_URL) {
        setError(
          "Configuration error: API URL is not defined. Please contact support."
        );
        setLoading(false);
        return;
      }

      const [projectsRes, surgeriesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/surgeries`, {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setLoading(false);
      setError(null); // Clear previous errors
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setSurgeries(Array.isArray(surgeriesRes.data) ? surgeriesRes.data : []);
    } catch (error) {
      setLoading(false);

      // Don't show error for aborted requests
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
        return;
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      // Set error for user display
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load dashboard data. Please try again."
      );
      console.error("Dashboard fetch error:", error);
    }
  };

  {
    error && (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
    );
  }

  const totalDonors = projects.length;

  const totalTarget = projects.reduce((sum, p) => {
    if (!p || p.balanceSurgery == null) return sum;

    const value = Number(p.balanceSurgery);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  const completedTarget = surgeries.length;

  const incompleteTarget = Math.max(totalTarget - completedTarget, 0);

  const handleLogout = () => {
    localStorage.removeItem("token"); // 🔥 logout
    navigate("/"); // redirect
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
          <button
            onClick={() => {
              setError(null);
              fetchDashboardData(new AbortController().signal);
            }}
            className="ml-4 text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Project Dashboard
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Donors */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Users className="text-indigo-600" />
          </div>
          <div>
            <p className="text-gray-500">Total Donors</p>
            <h2 className="text-3xl font-bold text-indigo-600">
              {totalDonors}
            </h2>
          </div>
        </div>

        {/* Total Target */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Target className="text-orange-600" />
          </div>
          <div>
            <p className="text-gray-500">Total Target</p>
            <h2 className="text-3xl font-bold text-orange-600">{totalTarget}</h2>
          </div>
        </div>

        {/* Completed Target */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="text-green-500" />
          </div>
          <div>
            <p className="text-gray-500">Completed Target</p>
            <h2 className="text-3xl font-bold text-green-500">
              {completedTarget}
            </h2>
          </div>
        </div>

        {/* Incomplete Target */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="text-red-500" />
          </div>
          <div>
            <p className="text-gray-500">Incomplete Target</p>
            <h2 className="text-3xl font-bold text-red-500">
              {incompleteTarget}
            </h2>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART PLACEHOLDER */}
        <div className="lg:col-span-3">
          <SurgeryProgressChart surgeries={surgeries} />
        </div>
      </div>

      {/* DONOR TABLE */}
      <div className="bg-white rounded-xl shadow p-6">
        <DonorTable projects={projects} surgeries={surgeries} />
      </div>
    </div>
  );
};

export default Dashboard;
