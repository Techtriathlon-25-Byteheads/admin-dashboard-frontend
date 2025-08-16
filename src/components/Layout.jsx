import React from 'react';
import Navigation from './Navigation';

const Layout = ({ children, title, subtitle }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navigation />
      
      <div className="flex h-screen bg-gray-50">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            {/* Page Header */}
            {title && (
              <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
                  <div className="py-6">
                    <h1 className="text-2xl font-bold leading-7 text-slate-900">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Page Content */}
            <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;