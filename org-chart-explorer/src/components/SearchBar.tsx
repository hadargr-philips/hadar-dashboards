import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Users } from 'lucide-react';
import { Employee, Role } from '../types/employee';
import { searchEmployees, searchTeams, findTeamSM } from '../utils/hierarchyBuilder';
import { useEmployeeStore } from '../store/useEmployeeStore';
import RoleBadge from './RoleBadge';

interface SearchBarProps {
  employees: Employee[];
  onSelect: (employee: Employee, effectiveRole?: Role) => void;
}

type ResultItem =
  | { kind: 'employee'; employee: Employee }
  | { kind: 'team'; teamName: string };

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchBar({ employees, onSelect }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useEmployeeStore(s => ({
    searchQuery: s.searchQuery,
    setSearchQuery: s.setSearchQuery,
  }));

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const employeeResults = searchEmployees(searchQuery, employees);
  const teamResults = searchTeams(searchQuery, employees);
  const allResults: ResultItem[] = [
    ...employeeResults.map(e => ({ kind: 'employee' as const, employee: e })),
    ...teamResults.map(t => ({ kind: 'team' as const, teamName: t })),
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleSelectEmployee = useCallback((employee: Employee) => {
    setOpen(false);
    setActiveIndex(-1);
    onSelect(employee);
  }, [onSelect]);

  const handleSelectTeam = useCallback((teamName: string) => {
    setOpen(false);
    setActiveIndex(-1);
    setSearchQuery('');
    const sm = findTeamSM(teamName, employees);
    if (sm) onSelect(sm, 'SM');
  }, [employees, onSelect, setSearchQuery]);

  const handleSelectItem = useCallback((item: ResultItem) => {
    if (item.kind === 'employee') handleSelectEmployee(item.employee);
    else handleSelectTeam(item.teamName);
  }, [handleSelectEmployee, handleSelectTeam]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || allResults.length === 0) {
      if (e.key === 'Enter' && allResults.length > 0) setOpen(true);
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, allResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && allResults[activeIndex]) {
          handleSelectItem(allResults[activeIndex]);
        } else if (allResults.length === 1) {
          handleSelectItem(allResults[0]);
        }
        break;
      case 'Escape':
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const showDropdown = open && searchQuery.trim().length > 0;
  const hasResults = allResults.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setOpen(true)}
          placeholder="Search by employee name or team…"
          aria-label="Search employees or teams"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     text-base transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          role="listbox"
          className="absolute top-full mt-2 w-full z-50 rounded-2xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 shadow-2xl overflow-hidden animate-slide-down"
        >
          {!hasResults ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No employees or teams found matching &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {employeeResults.length > 0 && `${employeeResults.length} employee${employeeResults.length !== 1 ? 's' : ''}`}
                  {employeeResults.length > 0 && teamResults.length > 0 && ' · '}
                  {teamResults.length > 0 && `${teamResults.length} team${teamResults.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                {/* Employee results */}
                {employeeResults.length > 0 && (
                  <>
                    {employeeResults.length > 0 && teamResults.length > 0 && (
                      <li className="px-4 py-1.5 bg-gray-50 dark:bg-gray-700/30">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Employees</span>
                      </li>
                    )}
                    {employeeResults.map((employee, index) => {
                      const flatIndex = index;
                      return (
                        <li
                          key={employee.id}
                          role="option"
                          aria-selected={flatIndex === activeIndex}
                          onClick={() => handleSelectEmployee(employee)}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors
                            ${flatIndex === activeIndex
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: '#3B82F6' }}
                          >
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {highlightMatch(employee.name, searchQuery)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {employee.team && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                  {employee.team}
                                </span>
                              )}
                              {employee.team && employee.group && (
                                <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                              )}
                              {employee.group && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                                  {employee.group}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <RoleBadge role={employee.role} size="sm" />
                          </div>
                        </li>
                      );
                    })}
                  </>
                )}

                {/* Team results */}
                {teamResults.length > 0 && (
                  <>
                    {employeeResults.length > 0 && (
                      <li className="px-4 py-1.5 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Teams</span>
                      </li>
                    )}
                    {teamResults.length > 0 && employeeResults.length === 0 && (
                      <li className="px-4 py-1.5 bg-gray-50 dark:bg-gray-700/30">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Teams</span>
                      </li>
                    )}
                    {teamResults.map((teamName, index) => {
                      const flatIndex = employeeResults.length + index;
                      return (
                        <li
                          key={`team-${teamName}`}
                          role="option"
                          aria-selected={flatIndex === activeIndex}
                          onClick={() => handleSelectTeam(teamName)}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors
                            ${flatIndex === activeIndex
                              ? 'bg-purple-50 dark:bg-purple-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 flex-shrink-0">
                            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {highlightMatch(teamName, searchQuery)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Team · view from Team Manager
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                            Team
                          </span>
                        </li>
                      );
                    })}
                  </>
                )}
              </ul>

              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Press <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-xs">↑↓</kbd> to navigate ·{' '}
                  <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-xs">Enter</kbd> to select
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
