import React from 'react';
import { Network, Users, GitBranch, Layers, BarChart2 } from 'lucide-react';
import UploadArea from './UploadArea';
import SearchBar from './SearchBar';
import RoleBadge from './RoleBadge';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { getOrgStats } from '../utils/hierarchyBuilder';
import { Employee } from '../types/employee';

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function RecentCard({ employee, onClick }: { employee: Employee; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700
                 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500
                 hover:shadow-md transition-all text-left group"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {employee.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {employee.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{employee.team || employee.group}</p>
      </div>
      <RoleBadge role={employee.role} size="sm" />
    </button>
  );
}

export default function HomePage() {
  const { employees, fileName, selectEmployee } = useEmployeeStore(s => ({
    employees: s.employees,
    fileName: s.fileName,
    selectEmployee: s.selectEmployee,
  }));

  const hasData = employees.length > 0;
  const stats = hasData ? getOrgStats(employees) : null;

  // Pick a few interesting employees to show as suggestions
  const featuredEmployees = employees
    .filter(e => e.role === 'Division Manager' || e.role === 'Department Manager' || e.role === 'GM')
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-start pt-16 px-4 pb-16">

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-4 animate-fade-in">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-500/30">
            <Network className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Dynamic Org Chart Explorer
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Search employees and explore organizational hierarchy visually
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-16 h-1 rounded-full bg-blue-500 mb-10" />

        {/* Search (if data loaded) */}
        {hasData && (
          <div className="w-full max-w-2xl mb-8 animate-fade-in">
            <SearchBar employees={employees} onSelect={selectEmployee} />
          </div>
        )}

        {/* Upload */}
        {!hasData && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="mb-6 text-center">
              <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                Get started by uploading your organization's Excel file
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                The file should contain employee data with hierarchy columns
              </p>
            </div>
            <UploadArea />
          </div>
        )}

        {/* Stats bar */}
        {hasData && stats && (
          <div className="w-full max-w-2xl mt-2 animate-fade-in">
            {/* File name badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400 truncate max-w-[200px]">
                  {fileName}
                </span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              <StatCard icon={Users} label="Total Employees" value={stats.totalEmployees} color="bg-blue-500" />
              <StatCard icon={GitBranch} label="Teams" value={stats.totalTeams} color="bg-purple-500" />
              <StatCard icon={Layers} label="Groups" value={stats.totalGroups} color="bg-emerald-500" />
              <StatCard icon={BarChart2} label="Group Managers" value={stats.groupManagers} color="bg-red-500" />
              <StatCard icon={Network} label="Team Managers" value={stats.teamManagers} color="bg-orange-500" />
              <StatCard icon={Users} label="Dept Managers" value={stats.departmentManagers} color="bg-indigo-500" />
            </div>

            {/* Featured employees */}
            {featuredEmployees.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Leadership
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {featuredEmployees.map(emp => (
                    <RecentCard key={emp.id} employee={emp} onClick={() => selectEmployee(emp)} />
                  ))}
                </div>
              </div>
            )}

            {/* Replace file link */}
            <div className="mt-8 text-center">
              <UploadArea />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
