import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react"; // optional icons

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "My Projects", path: "/projects", icon: BarChart3 },
  { name: "Surgeries", path: "/surgeries", icon: Stethoscope },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white flex flex-col">
      {/* Top Logo Section */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <img
            src="https://www.hvdeh.org/logo.jpg"
            alt="Desai Eye Hospital Logo"
            className="h-10 w-auto"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 space-y-1 px-4 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const baseClasses =
            "flex items-center p-3 rounded-xl text-sm font-medium transition-colors";
          const activeClasses =
            "bg-indigo-600 text-white shadow-md shadow-indigo-300";
          const inactiveClasses =
            "text-gray-600 hover:bg-gray-100 hover:text-indigo-600";

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`${baseClasses} w-full text-left ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              {item.icon && <item.icon className="mr-3 h-5 w-5" />}
              {item.name}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
