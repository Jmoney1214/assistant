
import React from 'react';
import { Integration, IntegrationStatus } from '../types';
import { Mail, Calendar, CheckSquare, Settings, LifeBuoy, Zap } from 'lucide-react';

interface SidebarProps {
  integrations: Record<Integration, IntegrationStatus>;
  onConnect: (integration: Integration) => void;
}

const integrationDetails = {
  outlook: { name: 'Outlook', icon: <Mail className="w-5 h-5" /> },
  gcal: { name: 'Google Calendar', icon: <Calendar className="w-5 h-5" /> },
  notion: { name: 'Notion', icon: <CheckSquare className="w-5 h-5" /> },
};

const StatusIndicator: React.FC<{ status: IntegrationStatus }> = ({ status }) => {
  const color = status === 'connected' ? 'bg-green-500' : 'bg-gray-500';
  return <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>;
};


export const Sidebar: React.FC<SidebarProps> = ({ integrations, onConnect }) => {
  return (
    <aside className="w-64 bg-gray-800/30 backdrop-blur-lg border-r border-gray-700/50 flex flex-col p-4">
      <div className="flex items-center space-x-2 mb-8">
        <Zap className="w-8 h-8 text-indigo-500" />
        <span className="font-bold text-lg">Assistant</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {/* Main navigation can be added here */}
      </nav>

      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Integrations</h3>
        <div className="space-y-2">
          {Object.entries(integrations).map(([key, status]) => {
            const details = integrationDetails[key as Integration];
            return (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center space-x-3 text-sm">
                  {details.icon}
                  <span>{details.name}</span>
                </div>
                {status === 'disconnected' ? (
                  <button onClick={() => onConnect(key as Integration)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-2 rounded-md transition-colors">
                    Connect
                  </button>
                ) : (
                  <StatusIndicator status={status} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-8 border-t border-gray-700/50 pt-4 space-y-2">
         <a href="#" className="flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
         </a>
         <a href="#" className="flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors">
            <LifeBuoy className="w-5 h-5" />
            <span>Support</span>
         </a>
      </div>
    </aside>
  );
};
