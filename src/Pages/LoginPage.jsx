import React, { useState } from "react";
import axios from "axios";

import { RiUserSettingsLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import AbstractBgImage from "../assets/10130.jpg";

const LoginPage = () => {
  const [role, setRole] = useState("Admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!password) {
      alert("Password is required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          role: role.toUpperCase(),
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      localStorage.setItem("token", res.data.token);

      navigate("/dashboard");

      alert(res.data.message);

      // later: navigate based on role
      // if (role === "Admin") navigate("/admin");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Page Background - Neutral light gray
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 md:p-10">
      {/* Main Card */}
      <div className="bg-white w-full max-w-[1000px] min-h-[600px] rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-xl border border-gray-100">
        {/* LEFT SIDE - Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center order-2 md:order-1">
          <div className="max-w-sm mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
                Welcome !
              </h2>
              <p className="text-gray-400 text-sm font-medium">
                Please enter your details.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Role Selection Dropdown */}
              <div className="relative">
                <label className="text-xs font-semibold text-gray-500 ml-4 mb-1 block">
                  Login as
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full py-3 px-10 bg-gray-50 border border-gray-200 rounded-full text-sm appearance-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Admin">ADMIN</option>
                    <option value="User">USER</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <RiUserSettingsLine size={18} />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all peer pr-10"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A237E] hover:bg-[#0D145A] text-white font-semibold py-3.5 rounded-full transition duration-300 mt-4 shadow-lg active:scale-[0.98]"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE - Image Section */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative order-1 md:order-2 bg-white flex items-center justify-center">
          {/* Hospital SVG */}
          <img
            src={AbstractBgImage} // your imported svg from assets
            alt="Hospital"
            className="w-4/5 max-w-lg"
          />

          {/* Centered HVD Logo on top */}
          <div className="absolute inset-0 flex items-center justify-center -translate-y-2/12">
            <img
              src="https://www.hvdeh.org/logo.jpg"
              alt="HVD Logo"
              className="w-24 md:w-36 drop-shadow-2xl bg-white p-3 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
