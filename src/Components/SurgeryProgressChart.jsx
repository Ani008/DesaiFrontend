import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ✅ Fixed surgery types
const SURGERY_TYPES = [
  "Cataract",
  "Glaucoma",
  "Retina",
  "Cornea",
  "Pediatric",
  "Oculoplasty",
  "Refractive",
];

const SurgeryProgressChart = ({ surgeries = [] }) => {
  const [filter, setFilter] = useState("monthly");
  const now = new Date();

  const isWithinFilter = (date) => {
    const d = new Date(date);

    if (filter === "daily") {
      return d.toDateString() === now.toDateString();
    }

    if (filter === "weekly") {
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }

    if (filter === "monthly") {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    return true; // yearly
  };

  // ✅ Build chart data with fixed X-axis
  const chartData = useMemo(() => {
    const countMap = {};

    // Initialize all types with 0
    SURGERY_TYPES.forEach((type) => {
      countMap[type] = 0;
    });

    // Count real surgeries
    surgeries.forEach((s) => {
      if (!isWithinFilter(s.dateOfSurgery)) return;

      if (SURGERY_TYPES.includes(s.surgeryName)) {
        countMap[s.surgeryName]++;
      }
    });

    return SURGERY_TYPES.map((type) => ({
      name: type,
      completed: countMap[type],
    }));
  }, [surgeries, filter]);

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Surgery Progress Overview
        </h3>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="completed"
            fill="#6366F1"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SurgeryProgressChart;
