import React from 'react';
import { Task, TaskStatus, SimulationData } from '../types';
import { TaskList } from './TaskList';
import { ReceptionistPanel } from './ReceptionistPanel';

interface DashboardProps {
    tasks: Task[];
    updateTaskStatus: (taskId: string, status: TaskStatus) => void;
    handleSimulation: (data: SimulationData) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, updateTaskStatus, handleSimulation }) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold">Good morning!</h2>
                <p className="text-gray-400">{formattedDate}</p>
            </div>
            
            {/* Summary cards would go here */}

            <div>
                <h3 className="text-2xl font-bold mb-4">Your Hot Sheet</h3>
                <TaskList tasks={tasks} updateTaskStatus={updateTaskStatus} />
            </div>

            <ReceptionistPanel onSimulate={handleSimulation} />
        </div>
    );
};
