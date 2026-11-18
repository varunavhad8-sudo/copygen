import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles } from 'lucide-react';

function RecentGenerationsTable() {
  const generations = []; // Empty state for now

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Recent Generations</h2>
        <Link to="/app/outputs" className="text-sm font-medium text-violet-500 hover:text-violet-600 transition-colors">
          View All
        </Link>
      </header>
      <div className="p-3">
        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-500/10 mb-4">
              <FileText className="size-8 text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No generations yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Start generating high-converting copy for your clients using our AI templates.
            </p>
            <Link 
              to="/app/generate" 
              className="btn bg-violet-500 hover:bg-violet-600 text-white"
            >
              <Sparkles className="size-4 mr-2" />
              Generate Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full dark:text-gray-300">
              <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
                <tr>
                  <th className="p-2"><div className="font-semibold text-left">Client</div></th>
                  <th className="p-2"><div className="font-semibold text-left">Format</div></th>
                  <th className="p-2"><div className="font-semibold text-left">Brief</div></th>
                  <th className="p-2"><div className="font-semibold text-left">Generated At</div></th>
                  <th className="p-2"><div className="font-semibold text-right">Actions</div></th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700/60">
                {/* Rows would go here */}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentGenerationsTable;
