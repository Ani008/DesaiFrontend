import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar stays fixed on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-50 px-6 py-6">
        {/* This is where Dashboard or other pages will render */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;