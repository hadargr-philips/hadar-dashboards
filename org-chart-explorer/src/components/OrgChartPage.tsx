import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Search,
  Info,
} from 'lucide-react';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { getFullHierarchy, getDirectReportsPositioned, normalizeRole } from '../utils/hierarchyBuilder';
import { ROLE_STYLES, PositionedEmployee } from '../types/employee';
import { Employee, Role } from '../types/employee';
import RoleBadge from './RoleBadge';
import OrgChartFlow from './OrgChartFlow';
import SearchBar from './SearchBar';

function HierarchyPill({
  positioned,
  isSelected,
  onClick,
}: {
  positioned: PositionedEmployee & { name?: string; role?: Role };
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const style = ROLE_STYLES[positioned.effectiveRole] ?? ROLE_STYLES[''];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-left
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:shadow-sm'
        }`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: style.badge }}
      />
      <span className={`text-xs font-medium truncate max-w-[140px] ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
        {positioned.employee.name}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{positioned.effectiveRole || '—'}</span>
    </button>
  );
}

export default function OrgChartPage() {
  const { employees, selectedEmployee, selectedEffectiveRole, selectEmployee, goHome, darkMode } = useEmployeeStore(s => ({
    employees: s.employees,
    selectedEmployee: s.selectedEmployee,
    selectedEffectiveRole: s.selectedEffectiveRole,
    selectEmployee: s.selectEmployee,
    goHome: s.goHome,
    darkMode: s.darkMode,
  }));

  const [showSidebar, setShowSidebar] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  if (!selectedEmployee) return null;

  const hierarchy = getFullHierarchy(selectedEmployee, selectedEffectiveRole, employees);
  const style = ROLE_STYLES[selectedEffectiveRole] ?? ROLE_STYLES[''];

  // Count total subordinates (recursive)
  const countTeamSize = (emp: Employee, role: Role, depth = 0): number => {
    if (depth > 6) return 0; // Guard deep recursion
    const reports = getDirectReportsPositioned(emp, role, employees);
    if (reports.length === 0) return 0;
    return reports.length + reports.reduce(
      (sum, r) => sum + countTeamSize(r.employee, r.effectiveRole, depth + 1),
      0,
    );
  };
  const teamSize = countTeamSize(selectedEmployee, selectedEffectiveRole);

  // Positioned version of the selected employee for the pill display
  const selectedPositioned: PositionedEmployee = {
    employee: selectedEmployee,
    effectiveRole: selectedEffectiveRole,
    positionId: `${selectedEmployee.id}::${selectedEffectiveRole}`,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* Top Bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0">
        {/* Back */}
        <button
          onClick={goHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Back</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Selected employee info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${style.badge}cc, ${style.badge})` }}
          >
            {selectedEmployee.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {selectedEmployee.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <RoleBadge role={selectedEffectiveRole} size="sm" />
              {selectedEmployee.team && (
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:block">
                  · {selectedEmployee.team}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowSearch(s => !s)}
            className={`p-2 rounded-lg transition-colors ${showSearch
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            title="Search another employee"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSidebar(s => !s)}
            className={`p-2 rounded-lg transition-colors ${showSidebar
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            title="Toggle sidebar"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Search panel (collapsible) */}
      {showSearch && (
        <div className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 animate-slide-down">
          <SearchBar employees={employees} onSelect={(emp) => { selectEmployee(emp); setShowSearch(false); }} />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Org Chart Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <OrgChartFlow
            key={`${selectedEmployee.id}::${selectedEffectiveRole}`}
            employees={employees}
            selectedEmployee={selectedEmployee}
            selectedEffectiveRole={selectedEffectiveRole}
            onEmployeeClick={selectEmployee}
            darkMode={darkMode}
          />

          {/* Hierarchy level labels overlay */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="flex flex-col gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Legend</p>
              {[
                { label: 'Division Manager', color: '#0F172A' },
                { label: 'Dept. Manager', color: '#1E40AF' },
                { label: 'Group Manager', color: '#EF4444' },
                { label: 'Group Lead', color: '#A855F7' },
                { label: 'Team Manager', color: '#F97316' },
                { label: 'Dev / QA', color: '#3B82F6' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto animate-fade-in">
            <div className="p-4 space-y-5">

              {/* Employee Card */}
              <div
                className="rounded-2xl border-2 p-4"
                style={{ borderColor: style.border, backgroundColor: style.bg }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold"
                    style={{ background: `linear-gradient(135deg, ${style.badge}cc, ${style.badge})` }}
                  >
                    {selectedEmployee.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900" style={{ color: style.text }}>
                      {selectedEmployee.name}
                    </p>
                    <RoleBadge role={selectedEffectiveRole} size="md" />
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {selectedEmployee.team && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-12 flex-shrink-0">Team</span>
                      <span className="font-medium truncate" style={{ color: style.text }}>{selectedEmployee.team}</span>
                    </div>
                  )}
                  {selectedEmployee.group && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-12 flex-shrink-0">Group</span>
                      <span className="font-medium truncate" style={{ color: style.text }}>{selectedEmployee.group}</span>
                    </div>
                  )}
                  {teamSize > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-12 flex-shrink-0">Team</span>
                      <span className="font-medium" style={{ color: style.text }}>{teamSize} people</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reporting chain */}
              {hierarchy.managersChain.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reports to
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    {/* Vertical line */}
                    <div className="absolute left-3 top-4 bottom-4 w-px bg-gray-100 dark:bg-gray-800" />
                    {hierarchy.managersChain.map((positioned) => (
                      <div key={positioned.positionId} className="flex items-center gap-2 relative z-10">
                        <div
                          className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: ROLE_STYLES[positioned.effectiveRole]?.badge ?? '#94A3B8' }}
                        >
                          {positioned.employee.name.charAt(0).toUpperCase()}
                        </div>
                        <HierarchyPill
                          positioned={positioned}
                          onClick={() => selectEmployee(positioned.employee, positioned.effectiveRole)}
                        />
                      </div>
                    ))}
                    {/* Connect to selected */}
                    <div className="flex items-center gap-2 relative z-10">
                      <div
                        className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-blue-500"
                        style={{ backgroundColor: style.badge }}
                      >
                        {selectedEmployee.name.charAt(0).toUpperCase()}
                      </div>
                      <HierarchyPill positioned={selectedPositioned} isSelected />
                    </div>
                  </div>
                </div>
              )}

              {/* Direct reports */}
              {hierarchy.directReports.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Direct reports ({hierarchy.directReports.length})
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {hierarchy.directReports.map(positioned => (
                      <HierarchyPill
                        key={positioned.positionId}
                        positioned={positioned}
                        onClick={() => selectEmployee(positioned.employee, positioned.effectiveRole)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No reports */}
              {hierarchy.directReports.length === 0 && selectedEffectiveRole !== 'Division Manager' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <Users className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">No direct reports found</p>
                </div>
              )}

              {/* Manager info */}
              {selectedEmployee.teamManager && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Manager fields</p>
                  <div className="space-y-1.5 text-xs">
                    {selectedEmployee.teamManager && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 flex-shrink-0">Team Mgr (SM)</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate text-right font-medium">{selectedEmployee.teamManager || '—'}</span>
                      </div>
                    )}
                    {selectedEmployee.groupLead && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 flex-shrink-0">Group Lead (GL)</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate text-right font-medium">{selectedEmployee.groupLead || '—'}</span>
                      </div>
                    )}
                    {selectedEmployee.groupManager && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 flex-shrink-0">Group Mgr (GM)</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate text-right font-medium">{selectedEmployee.groupManager || '—'}</span>
                      </div>
                    )}
                    {selectedEmployee.departmentManager && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 flex-shrink-0">Dept Manager</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate text-right font-medium">{selectedEmployee.departmentManager || '—'}</span>
                      </div>
                    )}
                    {selectedEmployee.divisionManager && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 flex-shrink-0">Division Mgr</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate text-right font-medium">{selectedEmployee.divisionManager || '—'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
