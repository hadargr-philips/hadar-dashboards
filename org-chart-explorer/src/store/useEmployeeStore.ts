import { create } from 'zustand';
import { Employee } from '../types/employee';

type Page = 'home' | 'orgchart';

interface EmployeeStore {
  // Data
  employees: Employee[];
  fileName: string;

  // Navigation
  currentPage: Page;
  selectedEmployee: Employee | null;

  // UI
  darkMode: boolean;
  searchQuery: string;

  // Actions
  setEmployees: (employees: Employee[], fileName: string) => void;
  selectEmployee: (employee: Employee) => void;
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
  currentPage: 'home',
  selectedEmployee: null,
  darkMode: savedDark,
  searchQuery: '',

  setEmployees: (employees, fileName) =>
    set({ employees, fileName, currentPage: 'home', selectedEmployee: null }),

  selectEmployee: (employee) =>
    set({ selectedEmployee: employee, currentPage: 'orgchart', searchQuery: '' }),

  goHome: () =>
    set({ currentPage: 'home', selectedEmployee: null, searchQuery: '' }),

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
    set({ employees: [], fileName: '', currentPage: 'home', selectedEmployee: null }),
}));
