import { create } from 'zustand';
import { Department, Service, Officer, Citizen, Appointment, Analytics } from '../types';

interface AppState {
  departments: Department[];
  services: Service[];
  officers: Officer[];
  citizens: Citizen[];
  appointments: Appointment[];
  analytics: Analytics | null;
  loading: boolean;
  setDepartments: (departments: Department[]) => void;
  setServices: (services: Service[]) => void;
  setOfficers: (officers: Officer[]) => void;
  setCitizens: (citizens: Citizen[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setAnalytics: (analytics: Analytics) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  departments: [],
  services: [],
  officers: [],
  citizens: [],
  appointments: [],
  analytics: null,
  loading: false,
  setDepartments: (departments) => set({ departments }),
  setServices: (services) => set({ services }),
  setOfficers: (officers) => set({ officers }),
  setCitizens: (citizens) => set({ citizens }),
  setAppointments: (appointments) => set({ appointments }),
  setAnalytics: (analytics) => set({ analytics }),
  setLoading: (loading) => set({ loading }),
}));