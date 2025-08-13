import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  color?: 'green' | 'blue' | 'orange' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  change,
  color = 'green'
}) => {
  const colorClasses = {
    green: 'bg-primary-500 text-white',
    blue: 'bg-secondary-600 text-white',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white',
  };

  return (
    <Card>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
              {change.type === 'increase' ? '+' : '-'}{change.value}% from last month
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};