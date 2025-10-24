
import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, updateTaskStatus }) => {
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.priority === b.priority) {
            const dateA = a.due_at ? new Date(a.due_at).getTime() : Infinity;
            const dateB = b.due_at ? new Date(b.due_at).getTime() : Infinity;
            return dateA - dateB;
        }
        const priorities = { 'Urgent': 0, 'High': 1, 'Normal': 2, 'Low': 3 };
        return priorities[a.priority] - priorities[b.priority];
    });

  return (
    <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl">
      <div className="divide-y divide-gray-700/50">
        {sortedTasks.map(task => (
          <TaskItem key={task.id} task={task} onStatusChange={updateTaskStatus} />
        ))}
      </div>
    </div>
  );
};
