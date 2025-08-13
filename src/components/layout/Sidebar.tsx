import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Calendar, 
  MessageSquare, 
  Bot, 
  Bell, 
  Shield,
  FileText,
  UserCheck,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  roles: ('admin' | 'officer')[];
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'officer'] },
  { icon: Building2, label: 'Departments', path: '/departments', roles: ['admin'] },
  { icon: FileText, label: 'Services', path: '/services', roles: ['admin'] },
  { icon: UserCheck, label: 'Officers', path: '/officers', roles: ['admin'] },
  { icon: Users, label: 'Citizens', path: '/citizens', roles: ['admin'] },
  { icon: Calendar, label: 'Appointments', path: '/appointments', roles: ['admin', 'officer'] },
  { icon: MessageSquare, label: 'Feedback', path: '/feedback', roles: ['admin', 'officer'] },
  { icon: Bot, label: 'AI Chatbot', path: '/chatbot', roles: ['admin'] },
  { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['admin'] },
  { icon: Shield, label: 'Security', path: '/security', roles: ['admin'] },
];

export const Sidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const filteredItems = sidebarItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-600">Gov Portal</h1>
            <p className="text-xs text-gray-600">{user?.role === 'admin' ? 'Admin Panel' : 'Officer Portal'}</p>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-4">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-700 hover:bg-accent-light hover:text-primary-600'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};