import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';

export const Officers: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Officers Management</h1>
          <p className="text-gray-600">Manage and monitor officers across all departments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Officers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Officers Management</h3>
            <p className="text-gray-500">
              Officers management functionality is being implemented.
              {isAdmin ? ' You have admin access.' : ' Officer view enabled.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
