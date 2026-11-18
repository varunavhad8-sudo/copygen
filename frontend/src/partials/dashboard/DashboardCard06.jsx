import React from 'react';
import DoughnutChart from '../../charts/DoughnutChart';

// Import utilities
import { getCssVariable } from '../../utils/dashboard/Utils';

function DashboardCard06({ title }) {

  const chartData = {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Top Formats',
        data: [100],
        backgroundColor: [
          getCssVariable('--color-gray-200'),
        ],
        hoverBackgroundColor: [
          getCssVariable('--color-gray-300'),
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      </header>
      <div className="grow flex flex-col justify-center">
        <div>
          <DoughnutChart data={chartData} width={389} height={260} />
        </div>
      </div>
    </div>
  );
}

export default DashboardCard06;
