
import React, { useEffect, useRef } from 'react';
import { Task } from '../types';
import { AlarmClock, PlayCircle, X } from 'lucide-react';

interface ReminderProps {
  task: Task;
  onStart: (taskId: string) => void;
}

export const Reminder: React.FC<ReminderProps> = ({ task, onStart }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create an audio element that's not in the DOM
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    audioRef.current.loop = true;
    
    // Play the audio
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Autoplay was prevented.
        console.warn("Audio autoplay was prevented. User interaction is needed.", error);
      });
    }

    // Cleanup: stop the audio when the component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleStartTask = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onStart(task.id);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-indigo-500/50 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-pulse">
        <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto flex items-center justify-center mb-4">
          <AlarmClock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Reminder</h2>
        <p className="text-lg text-gray-300 mb-6">It's time to start:</p>
        <div className="bg-gray-700/50 p-4 rounded-lg mb-8">
            <p className="text-xl font-semibold text-white">{task.title}</p>
        </div>
        <button
          onClick={handleStartTask}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-lg transition-transform transform hover:scale-105"
        >
          <PlayCircle className="w-6 h-6" />
          <span>Mark as Started</span>
        </button>
      </div>
    </div>
  );
};
