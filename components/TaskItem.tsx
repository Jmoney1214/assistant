import React from 'react';
import { Task, TaskStatus, Priority, ChannelType } from '../types';
import { Clock, Flag, MoreVertical, MessageSquare, Phone } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const priorityStyles: Record<Priority, { icon: string; text: string }> = {
    Urgent: { icon: 'border-red-500', text: 'text-red-400' },
    High: { icon: 'border-orange-500', text: 'text-orange-400' },
    Normal: { icon: 'border-blue-500', text: 'text-blue-400' },
    Low: { icon: 'border-gray-500', text: 'text-gray-400' },
};

const statusColors: Record<TaskStatus, string> = {
    'To Do': 'bg-gray-500',
    'Started': 'bg-blue-500',
    'In Progress': 'bg-yellow-500',
    'Finished': 'bg-green-500',
};

const ChannelIcon: React.FC<{ channel?: ChannelType }> = ({ channel }) => {
    if (!channel) return null;
    switch (channel) {
        case 'SMS':
            return <MessageSquare className="w-3 h-3 text-gray-400" />;
        case 'Voice':
        case 'Voicemail':
            return <Phone className="w-3 h-3 text-gray-400" />;
        default:
            return null;
    }
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange }) => {
    const { icon: priorityIconColor, text: priorityTextColor } = priorityStyles[task.priority];

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No due date';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onStatusChange(task.id, e.target.value as TaskStatus);
    }

  return (
    <div className="p-4 flex items-center justify-between hover:bg-gray-700/20 transition-colors">
        <div className="flex items-center space-x-4">
            <div className={`w-3 h-10 rounded-full border-2 ${priorityIconColor}`}></div>
            <div>
                <p className="font-semibold">{task.title}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                    <span className={`flex items-center space-x-1 font-medium ${priorityTextColor}`}>
                        <Flag className="w-3 h-3" />
                        <span>{task.priority}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(task.due_at)}</span>
                    </span>
                    {task.channel && (
                        <span className="flex items-center space-x-1">
                            <ChannelIcon channel={task.channel} />
                            <span>{task.contactName || task.phone || task.channel}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="relative">
                 <select 
                    value={task.status}
                    onChange={handleStatusChange}
                    className="text-xs font-semibold py-1 pl-2 pr-7 rounded-md appearance-none bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 >
                    <option value="To Do">To Do</option>
                    <option value="Started">Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Finished">Finished</option>
                 </select>
                 <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md ${statusColors[task.status]}`}></div>
            </div>
            <button className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
            </button>
        </div>
    </div>
  );
};