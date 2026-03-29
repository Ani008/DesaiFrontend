import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const formatDate = (date) => {
  const d = new Date(date);
  if (isNaN(d)) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

const DonorTable = ({ projects = [], surgeries = [] }) => {
  const [filterType, setFilterType] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [appliedFilter, setAppliedFilter] = useState(null);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const now = new Date();

  const isWithinFilter = (dateString) => {
    if (!appliedFilter) return true;
    if (!dateString) return false;

    const formattedDate = dateString.replace(" ", "T");
    const d = new Date(formattedDate);

    if (isNaN(d)) return false;
    d.setHours(0, 0, 0, 0);

    if (appliedFilter.type === "weekly") {
      const start = new Date(appliedFilter.startDate);
      const end = new Date(appliedFilter.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }

    if (appliedFilter.type === "monthly") {
      return (
        d.getFullYear() === appliedFilter.year &&
        d.getMonth() + 1 === appliedFilter.month
      );
    }

    if (appliedFilter.type === "yearly") {
      return d.getFullYear() === appliedFilter.year;
    }

    return true;
  };

  // Totals
  let totalTarget = 0;
  let totalCompleted = 0;
  let totalIncomplete = 0;

  const handlePrint = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text("Donor Contribution Report", 14, 15);

    doc.setFontSize(10);
    const filterInfo = appliedFilter
      ? appliedFilter.type === "weekly"
        ? `${formatDate(appliedFilter.startDate)} to ${formatDate(appliedFilter.endDate)}`
        : `Month: ${appliedFilter.month || "-"} | Year: ${appliedFilter.year}`
      : "All Records";

    doc.text(filterInfo, 14, 22);
    doc.text(`Generated on: ${formatDate(new Date())}`, 14, 28);

    const tableData = projects.map((project) => {
      const completed = surgeries.filter(
        (s) => s.projectId === project.id && isWithinFilter(s.dateOfSurgery),
      ).length;

      const lifetimeCompleted = surgeries.filter(
        (s) => s.projectId === project.id,
      ).length;
      const target = (project.balanceSurgery || 0) + lifetimeCompleted;

      return [
        project.id, // Changed from index + 1 to project.id
        project.projectName,
        project.projectCode || "-",
        target,
        completed,
        target - completed,
        project.status,
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [
        ["ID", "Project", "Code", "Target", "Completed", "Remaining", "Status"],
      ],
      body: tableData,
      styles: {
        fontSize: 6,
        cellPadding: 2,
        valign: "middle",
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: { halign: "center" },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { halign: "left", cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`donor-report.pdf`);
  };

  const handleFind = () => {
    if (filterType === "weekly") {
      setAppliedFilter({ type: "weekly", startDate, endDate });
    } else if (filterType === "monthly") {
      setAppliedFilter({
        type: "monthly",
        year: selectedYear,
        month: selectedMonth,
      });
    } else if (filterType === "yearly") {
      setAppliedFilter({ type: "yearly", year: selectedYear });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xl font-semibold text-gray-800">
            Donor Contributions
          </h3>
          <div className="flex gap-2">
            {["weekly", "monthly", "yearly"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  filterType === type
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start date"
            dateFormat="dd/MM/yyyy"
            disabled={filterType !== "weekly"}
            className={`border px-3 py-1.5 rounded-md text-sm ${filterType !== "weekly" ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End date"
            dateFormat="dd/MM/yyyy"
            disabled={filterType !== "weekly"}
            className={`border px-3 py-1.5 rounded-md text-sm ${filterType !== "weekly" ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            disabled={filterType === "weekly"}
            className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm ${filterType === "weekly" ? "bg-gray-100 cursor-not-allowed" : ""}`}
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            disabled={filterType === "weekly" || filterType === "yearly"}
            className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm ${filterType === "weekly" || filterType === "yearly" ? "bg-gray-100 cursor-not-allowed" : ""}`}
          >
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <button
            onClick={handleFind}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium"
          >
            Search
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium"
          >
            Print
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-3 text-center">ID</th>
              <th className="border px-4 py-3 text-left">Project</th>
              <th className="border px-4 py-3 text-center">Project Code</th>
              <th className="border px-4 py-3 text-center">Target</th>
              <th className="border px-4 py-3 text-center">Completed</th>
              <th className="border px-4 py-3 text-center">Incomplete</th>
              <th className="border px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const lifetimeCompleted = surgeries.filter(
                (s) => s.projectId === project.id,
              ).length;
              const target = (project.balanceSurgery || 0) + lifetimeCompleted;
              const completed = surgeries.filter(
                (s) =>
                  s.projectId === project.id && isWithinFilter(s.dateOfSurgery),
              ).length;
              const incomplete = Math.max(target - completed, 0);
              const isCompleted = completed >= target;

              totalTarget += target;
              totalCompleted += completed;
              totalIncomplete += incomplete;

              return (
                <tr key={project.id}>
                  {/* Use the actual database ID here */}
                  <td className="border px-2 py-3 text-center">{project.id}</td>
                  <td className="border px-4 py-3">{project.projectName}</td>
                  <td className="border px-4 py-3 text-center">
                    {project.projectCode || "-"}
                  </td>
                  <td className="border px-4 py-3 text-center font-semibold">
                    {target}
                  </td>
                  <td className="border px-4 py-3 text-center font-semibold">
                    {completed}
                  </td>
                  <td className="border px-4 py-3 text-center font-semibold">
                    {incomplete}
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {isCompleted ? "✔" : "—"}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold">
              <td className="border px-4 py-3" colSpan="3">
                TOTAL
              </td>
              <td className="border px-4 py-3 text-center">{totalTarget}</td>
              <td className="border px-4 py-3 text-center">{totalCompleted}</td>
              <td className="border px-4 py-3 text-center">
                {totalIncomplete}
              </td>
              <td className="border px-4 py-3 text-center">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DonorTable;
