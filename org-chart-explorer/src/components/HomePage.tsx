import React, { useState } from 'react';
import { Network, Users, GitBranch, Layers, BarChart2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import UploadArea from './UploadArea';
import SearchBar from './SearchBar';
import RoleBadge from './RoleBadge';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { getOrgStats, findTeamSM, findGroupGM } from '../utils/hierarchyBuilder';
import { Employee, Role } from '../types/employee';

function StatCard({ icon: Icon, label, value, color, onClick, active }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border px-4 py-3 shadow-sm
        transition-all text-left w-full
        ${onClick
          ? `cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-100
             ${active
               ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30'
               : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'}`
          : 'cursor-default border-gray-200 dark:border-gray-700'
        }`}
    >
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
      {onClick && (
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
          {active ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      )}
    </button>
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
  const { employees, fileName, fileDate, selectEmployee } = useEmployeeStore(s => ({
    employees: s.employees,
    fileName: s.fileName,
    fileDate: s.fileDate,
    selectEmployee: s.selectEmployee,
  }));

  const [expandedStat, setExpandedStat] = useState<'teams' | 'groups' | null>(null);

  const toggleStat = (which: 'teams' | 'groups') =>
    setExpandedStat(prev => (prev === which ? null : which));

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
              Philips R&amp;D Dynamic Org Chart Explorer
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Search employees or teams and explore organizational hierarchy visually
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
                {fileDate && (
                  <>
                    <span className="text-green-400 dark:text-green-700 text-xs">·</span>
                    <span className="text-xs text-green-600 dark:text-green-500 whitespace-nowrap">
                      Last updated {fileDate}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <StatCard icon={Users} label="Total Employees" value={stats.totalEmployees} color="bg-blue-500" />
              <StatCard
                icon={GitBranch}
                label="Teams"
                value={stats.totalTeams}
                color="bg-purple-500"
                onClick={() => toggleStat('teams')}
                active={expandedStat === 'teams'}
              />
              <StatCard
                icon={Layers}
                label="Groups"
                value={stats.totalGroups}
                color="bg-emerald-500"
                onClick={() => toggleStat('groups')}
                active={expandedStat === 'groups'}
              />
              <StatCard icon={BarChart2} label="Group Managers" value={stats.groupManagers} color="bg-red-500" />
              <StatCard icon={Network} label="Team Managers" value={stats.teamManagers} color="bg-orange-500" />
              <StatCard icon={Users} label="Dept Managers" value={stats.departmentManagers} color="bg-indigo-500" />
            </div>

            {/* Expandable: Teams list */}
            {expandedStat === 'teams' && (() => {
              const teams = [...new Set(employees.map(e => e.team).filter(Boolean))].sort();
              return (
                <div className="mb-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/10 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-purple-200 dark:border-purple-800 bg-purple-100/60 dark:bg-purple-900/20">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                      All Teams ({teams.length})
                    </p>
                  </div>
                  <ul className="max-h-64 overflow-y-auto divide-y divide-purple-100 dark:divide-purple-800/40">
                    {teams.map(teamName => {
                      const sm = findTeamSM(teamName, employees);
                      return (
                        <li key={teamName}>
                          <button
                            onClick={() => { if (sm) selectEmployee(sm, 'SM'); setExpandedStat(null); }}
                            disabled={!sm}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors
                              ${sm
                                ? 'hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer'
                                : 'opacity-50 cursor-default'}`}
                          >
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{teamName}</span>
                            {sm
                              ? <ArrowRight className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              : <span className="text-xs text-gray-400">No SM</span>
                            }
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()}

            {/* Expandable: Groups list */}
            {expandedStat === 'groups' && (() => {
              const groups = [...new Set(employees.map(e => e.group).filter(Boolean))].sort();
              return (
                <div className="mb-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-emerald-200 dark:border-emerald-800 bg-emerald-100/60 dark:bg-emerald-900/20">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      All Groups ({groups.length})
                    </p>
                  </div>
                  <ul className="max-h-64 overflow-y-auto divide-y divide-emerald-100 dark:divide-emerald-800/40">
                    {groups.map(groupName => {
                      const gm = findGroupGM(groupName, employees);
                      return (
                        <li key={groupName}>
                          <button
                            onClick={() => { if (gm) selectEmployee(gm, 'GM'); setExpandedStat(null); }}
                            disabled={!gm}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors
                              ${gm
                                ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer'
                                : 'opacity-50 cursor-default'}`}
                          >
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{groupName}</span>
                            {gm
                              ? <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              : <span className="text-xs text-gray-400">No GM</span>
                            }
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()}

            {/* Featured employees */}
            {featuredEmployees.length > 0 && (
              <div className="mt-4">
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
