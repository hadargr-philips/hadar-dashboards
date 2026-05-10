import { create } from 'zustand';
import { Employee, Role } from '../types/employee';
import { normalizeRole } from '../utils/hierarchyBuilder';

type Page = 'home' | 'orgchart';

interface EmployeeStore {
  // Data
  employees: Employee[];
  fileName: string;
  fileDate: string;

  // Navigation
  currentPage: Page;
  selectedEmployee: Employee | null;
  selectedEffectiveRole: Role;

  // UI
  darkMode: boolean;
  searchQuery: string;

  // Actions
  setEmployees: (employees: Employee[], fileName: string, fileDate?: string) => void;
  selectEmployee: (employee: Employee, effectiveRole?: Role) => void;
  goHome: () => void;
  toggleDarkMode: () => void;
  setSearchQuery: (query: string) => void;
  clearData: () => void;
}

// Persist dark mode preference
const savedDark = localStorage.getItem('org-chart-dark-mode') === 'true';
if (savedDark) document.documentElement.classList.add('dark');

export const useEmployeeStore = create<EmployeeStore>((set) => ({
  employees: [],
  fileName: '',
  fileDate: '',
  currentPage: 'home',
  selectedEmployee: null,
  selectedEffectiveRole: '',
  darkMode: savedDark,
  searchQuery: '',

  setEmployees: (employees, fileName, fileDate) =>
    set({ employees, fileName, fileDate: fileDate ?? '', currentPage: 'home', selectedEmployee: null, selectedEffectiveRole: '' }),

  selectEmployee: (employee, effectiveRole) =>
    set({
      selectedEmployee: employee,
      selectedEffectiveRole: effectiveRole ?? normalizeRole(employee.role),
      currentPage: 'orgchart',
      searchQuery: '',
    }),

  goHome: () =>
    set({ currentPage: 'home', selectedEmployee: null, selectedEffectiveRole: '', searchQuery: '' }),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('org-chart-dark-mode', String(next));
      return { darkMode: next };
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearData: () =>
    set({ employees: [], fileName: '', fileDate: '', currentPage: 'home', selectedEmployee: null }),
}));
