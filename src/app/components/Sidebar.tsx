import { memo } from 'react';
import { LayoutList, Users, FolderOpen, BarChart3, Settings, Bell, Workflow, Puzzle } from 'lucide-react';
import { StarsIcon } from './StarsIcon';
import logoImage from '@/app/assets/logo.png';

interface SidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const Sidebar = memo(function Sidebar({ activeTool, onToolChange }: SidebarProps) {
  const tools = [
    { id: 'studio', icon: StarsIcon, label: 'AI Studio' },
    { id: 'audiences', icon: Users, label: 'Audiences' },
    { id: 'content', icon: FolderOpen, label: 'Content Library' },
    { id: 'automations', icon: Workflow, label: 'Automations' },
    { id: 'integrations', icon: Puzzle, label: 'Integrations' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const bottomTools = [
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-[64px] bg-white border-r border-slate-200 flex flex-col items-center pt-0 pb-5 fixed left-0 top-0 h-screen z-50">
      {/* Logo */}
      <div className="w-[156px] h-[156px] flex items-center justify-center mb-2 -mt-8">
        <img src={logoImage} alt="TrustEye" className="w-[156px] h-[156px] object-contain" />
      </div>

      {/* Main Tools */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`relative w-full h-11 flex items-center justify-center rounded-xl transition-all group ${
                isActive
                  ? 'bg-[#1E5ECC] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-50">
                {tool.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Tools */}
      <div className="flex flex-col gap-1 w-full px-2 pt-2 border-t border-slate-200">
        {bottomTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`relative w-full h-11 flex items-center justify-center rounded-xl transition-all group ${
                isActive
                  ? 'bg-[#1E5ECC] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
              
              <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-50">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});