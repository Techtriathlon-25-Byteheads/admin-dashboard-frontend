import React from 'react';
import { Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Officers: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  console.log('Officers component rendering...');
  console.log('User:', user);
  console.log('Is Admin:', isAdmin);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Officers Management</h1>
          <p className="text-gray-600">Manage and monitor officers across all departments</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold">Officers List</h2>
        </div>
        
        <p className="text-gray-600 mb-4">User Role: {user?.role || 'No user'}</p>
        <p className="text-gray-600 mb-4">Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
        
        {isAdmin ? (
          <div className="space-y-4">
            <p className="text-green-600">✅ Admin access confirmed - showing full interface</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Active Officers</h3>
                <p className="text-2xl font-bold text-green-600">5</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total Appointments</h3>
                <p className="text-2xl font-bold text-blue-600">560</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800">Average Rating</h3>
                <p className="text-2xl font-bold text-yellow-600">4.6</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Sample Officers</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span>Nimal Silva - Immigration & Emigration</span>
                  <span className="text-green-600 text-sm">Active</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span>Sumana Wickramasinghe - Motor Traffic</span>
                  <span className="text-green-600 text-sm">Active</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span>Kamala Dissanayake - Registrar General</span>
                  <span className="text-green-600 text-sm">Active</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600">❌ Admin access required to view officers</p>
            <p className="text-gray-500 mt-2">Current role: {user?.role || 'Not logged in'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
