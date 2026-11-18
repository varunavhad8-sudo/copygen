import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from '../partials/dashboard/Sidebar';
import Header from '../partials/dashboard/Header';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900/30">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <Outlet context={[sidebarOpen, setSidebarOpen]} />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
