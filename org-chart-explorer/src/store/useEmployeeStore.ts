import { create } from 'zustand';
import { Employee, Role } from '../types/employee';
import { normalizeRole } from '../utils/hierarchyBuilder';
import { loadOrgConfig } from '../lib/db';

type Page = 'home' | 'orgchart';

const DEFAULT_TITLE = 'Philips R&D Dynamic Org Chart Explorer';

interface EmployeeStore {
  // Data
  employees: Employee[];
  fileName: string;
  fileDate: string;
  siteTitle: string;
  isLoading: boolean;
  lastUpdated: string;

  // Navigation
  currentPage: Page;
  selectedEmployee: Employee | null;
  selectedEffectiveRole: Role;

  // UI
  darkMode: boolean;
  searchQuery: string;

  // Actions
  setEmployees: (employees: Employee[], fileName: string, fileDate?: string) => void;
  setSiteTitle: (title: string) => void;
  loadFromDb: () => Promise<void>;
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
  siteTitle: DEFAULT_TITLE,
  isLoading: false,
  lastUpdated: '',
  currentPage: 'home',
  selectedEmployee: null,
  selectedEffectiveRole: '',
  darkMode: savedDark,
  searchQuery: '',

  setEmployees: (employees, fileName, fileDate) =>
    set({ employees, fileName, fileDate: fileDate ?? '', currentPage: 'home', selectedEmployee: null, selectedEffectiveRole: '' }),

  setSiteTitle: (title) => set({ siteTitle: title || DEFAULT_TITLE }),

  loadFromDb: async () => {
    set({ isLoading: true });
    const config = await loadOrgConfig();
    if (config) {
      set({
        employees: Array.isArray(config.employees) ? config.employees : [],
        fileName: config.file_name ?? '',
        fileDate: config.file_date ?? '',
        siteTitle: config.title || DEFAULT_TITLE,
        lastUpdated: config.updated_at ?? '',
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

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
    set({ employees: [], fileName: '', fileDate: '', lastUpdated: '', currentPage: 'home', selectedEmployee: null }),
}));
