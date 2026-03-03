import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDate = (date) => {
  const d = new Date(date);
  if (isNaN(d)) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

const DonorTable = ({ projects = [], surgeries = [] }) => {
  const [filter, setFilter] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [appliedFilter, setAppliedFilter] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const now = new Date();

  const isWithinFilter = (dateString) => {
    if (!dateString) return false;

    // Convert DB format to ISO format
    const formattedDate = dateString.replace(" ", "T");
    const d = new Date(formattedDate);

    if (isNaN(d)) return false;

    return (
      d.getFullYear() === appliedFilter.year &&
      d.getMonth() + 1 === appliedFilter.month
    );
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

    // Header
    doc.setFontSize(14);
    doc.text("Donor Contribution Report", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Month: ${appliedFilter.month} | Year: ${appliedFilter.year}`,
      14,
      22,
    );
    doc.text(`Generated on: ${formatDate(new Date())}`, 14, 28);

    // Prepare table data (IMPORTANT: reuse same filter)
    const tableData = projects.map((project) => {
      const completed = surgeries.filter(
        (s) => s.projectId === project.id && isWithinFilter(s.dateOfSurgery),
      ).length;

      const remaining = project.balanceSurgery;
      const target = completed + remaining;

      return [
        project.projectName,
        target,
        completed,
        remaining,
        project.status,
      ];
    });

    autoTable(doc, {
      startY: 35,

      head: [["Donor / Project", "Target", "Completed", "Remaining", "Status"]],

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
        valign: "middle",
      },

      bodyStyles: {
        halign: "center",
      },

      columnStyles: {
        0: {
          halign: "left",
          cellWidth: 70, // Donor name needs space
        },
        1: {
          cellWidth: 25,
        },
        2: {
          cellWidth: 25,
        },
        3: {
          cellWidth: 25,
        },
        4: {
          cellWidth: 30, // Status column
          halign: "center",
        },
      },

      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },

      didParseCell: function (data) {
        // Prevent word breaking in headers & status
        data.cell.styles.minCellHeight = 10;
      },
    });

    doc.save(`donor-report-${filter}.pdf`);
  };

  const handleFind = () => {
    setAppliedFilter({
      year: selectedYear,
      month: selectedMonth,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Donor Contributions</h3>

        <div className="flex items-center gap-3 relative">
          {/* YEAR DROPDOWN */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded-md px-3 py-1 text-sm"
          >
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* MONTH DROPDOWN */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border rounded-md px-3 py-1 text-sm"
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

          {/* FIND BUTTON */}
          <button
            onClick={handleFind}
            className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-green-700"
          >
            Find
          </button>

          {/* PRINT BUTTON */}
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-3 text-left">Donor</th>
              <th className="border px-4 py-3 text-center">Target</th>
              <th className="border px-4 py-3 text-center">Completed</th>
              <th className="border px-4 py-3 text-center">Incomplete</th>
              <th className="border px-4 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => {
              const target = project.balanceSurgery;

              const completed = surgeries.filter(
                (s) =>
                  s.projectId === project.id && isWithinFilter(s.dateOfSurgery),
              ).length;

              const incomplete = Math.max(target - completed, 0);

              const isCompleted = completed >= target;

              // Accumulate totals
              totalTarget += target;
              totalCompleted += completed;
              totalIncomplete += incomplete;

              return (
                <tr key={project.id}>
                  <td className="border px-4 py-3">{project.projectName}</td>

                  <td className="border px-4 py-3 text-center font-semibold">
                    {target}
                  </td>

                  <td className="border px-4 py-3 text-center text-black-600 font-semibold">
                    {completed}
                  </td>

                  <td className="border px-4 py-3 text-center text-black-600 font-semibold">
                    {incomplete}
                  </td>

                  <td className="border px-4 py-3 text-center">
                    {isCompleted ? "✔" : "—"}
                  </td>
                </tr>
              );
            })}

            {/* TOTAL ROW */}
            <tr className="bg-gray-100 font-bold">
              <td className="border px-4 py-3">TOTAL</td>
              <td className="border px-4 py-3 text-center">{totalTarget}</td>
              <td className="border px-4 py-3 text-center text-black-600">
                {totalCompleted}
              </td>
              <td className="border px-4 py-3 text-center text-black-600">
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
