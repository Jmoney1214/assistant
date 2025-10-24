import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { VoiceInterface } from './components/VoiceInterface';
import { Reminder } from './components/Reminder';
import { MeetingBriefing } from './components/MeetingBriefing';
import { Task, Integration, IntegrationStatus, TaskStatus, CalendarEvent, BriefingData, EmailThread, Priority, SimulationData } from './types';
import { getMockEmailById } from './services/mockApiService';
import { signInWithOutlook, signInWithGoogleCalendar, signInWithNotion, handleAuthCallback } from './services/authService';
import { processInboundMessage } from './services/receptionistService';
import { Bell, MessageSquare, Mic } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeBriefing, setActiveBriefing] = useState<BriefingData | null>(null);
  
  const [integrations, setIntegrations] = useState<Record<Integration, IntegrationStatus>>(() => {
    try {
      const savedIntegrations = localStorage.getItem('integrations');
      return savedIntegrations ? JSON.parse(savedIntegrations) : {
          outlook: 'disconnected',
          gcal: 'disconnected',
          notion: 'disconnected',
      };
    } catch (error) {
      console.error("Failed to parse integrations from localStorage", error);
      return {
          outlook: 'disconnected',
          gcal: 'disconnected',
          notion: 'disconnected',
      };
    }
  });

  const [activeTaskForReminder, setActiveTaskForReminder] = useState<Task | null>(null);
  const [activeInterface, setActiveInterface] = useState<'chat' | 'voice'>('chat');

  useEffect(() => {
    localStorage.setItem('integrations', JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    const processCallback = async () => {
      const result = await handleAuthCallback();
      if (result) {
        setIntegrations(prev => ({ ...prev, [result.service]: result.status }));
      }
    };
    processCallback();
  }, []);

  useEffect(() => {
    // In a live application, you would fetch initial data from a persistent source
    // or wait for an integration to be connected. For now, we start with an empty state.
    setTasks([]);
    setEvents([]);
  }, []);
  
  // TODO: In a live application, add a useEffect hook to fetch data when an integration status changes to 'connected'.
  // For example:
  // useEffect(() => {
  //   if (integrations.notion === 'connected') {
  //     // fetchNotionTasks().then(setTasks);
  //   }
  //   if (integrations.gcal === 'connected') {
  //     // fetchGoogleCalendarEvents().then(setEvents);
  //   }
  // }, [integrations]);

  // Proactive meeting briefing logic
  useEffect(() => {
    const BRIEFING_WINDOW_MINUTES = 15;

    const briefingInterval = setInterval(() => {
      if (activeBriefing) return; // Don't show a new briefing if one is already active

      const now = new Date();
      const upcomingEvent = events.find(event => {
        const eventStart = new Date(event.start_at);
        const diffMinutes = (eventStart.getTime() - now.getTime()) / (1000 * 60);
        return diffMinutes > 0 && diffMinutes <= BRIEFING_WINDOW_MINUTES;
      });

      if (upcomingEvent) {
        const relatedTasks = tasks.filter(task => task.related_events.includes(upcomingEvent.id));
        
        const emailIds = relatedTasks.flatMap(task => task.related_emails);
        // Fix: Explicitly type 'id' as a string in the map function to resolve a type inference issue.
        const relatedEmails = [...new Set(emailIds)] // Remove duplicates
          .map((id: string) => getMockEmailById(id))
          .filter((email): email is EmailThread => email !== null);

        setActiveBriefing({
          event: upcomingEvent,
          relatedTasks,
          relatedEmails,
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(briefingInterval);
  }, [events, tasks, activeBriefing]);

  const handleConnect = useCallback((integration: Integration) => {
    if (integration === 'outlook') {
        console.log('Redirecting to Outlook for authentication...');
        signInWithOutlook();
    } else if (integration === 'gcal') {
        console.log('Redirecting to Google for authentication...');
        signInWithGoogleCalendar();
    } else if (integration === 'notion') {
        console.log('Redirecting to Notion for authentication...');
        signInWithNotion();
    }
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status, start_at: status === 'Started' ? new Date().toISOString() : task.start_at } : task
      )
    );
  }, []);
  
  useEffect(() => {
    const reminderInterval = setInterval(() => {
      const now = new Date();
      const upcomingTask = tasks.find(task => {
        if (task.status !== 'Started' && task.status !== 'Finished' && task.reminders.length > 0) {
          const reminderTime = new Date(task.reminders[0].start_at);
          return now >= reminderTime;
        }
        return false;
      });

      if (upcomingTask) {
        setActiveTaskForReminder(upcomingTask);
      } else {
        setActiveTaskForReminder(null);
      }
    }, 5000);

    return () => clearInterval(reminderInterval);
  }, [tasks]);

  const stopReminder = (taskId: string) => {
      updateTaskStatus(taskId, 'Started');
      setActiveTaskForReminder(null);
  };
  
  const addTask = useCallback((newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const task: Task = {
          ...newTask,
          id: `task_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
      };
      setTasks(prev => [task, ...prev]);
  }, []);

  const addEvent = useCallback((newEventData: Omit<CalendarEvent, 'id'>) => {
      const event: CalendarEvent = {
          ...newEventData,
          id: `gcal_evt_${Date.now()}`,
      };
      setEvents(prev => [...prev, event]);
      console.log("New event created:", event);
  }, []);

  const handleSimulation = async (data: SimulationData) => {
    try {
        let prompt: string;
        let source: 'sms' | 'outlook';
        let channel: 'SMS' | 'Email';
        let from: string;

        if (data.type === 'sms') {
            prompt = `Parse the following SMS message from ${data.from} and generate the appropriate action: "${data.message}"`;
            source = 'sms';
            channel = 'SMS';
            from = data.from;
        } else {
            prompt = `Parse the following email from ${data.from} with subject "${data.subject}" and body "${data.message}" and generate the appropriate action.`;
            source = 'outlook';
            channel = 'Email';
            from = data.from;
        }

        const result = await processInboundMessage(prompt);

        if (result.action === 'create_task' && result.task) {
            const { title, priority = 'Normal', due_at = null, tags = [] } = result.task;
            const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
                title,
                description: data.type === 'sms' 
                    ? `From: ${data.from}\nMessage: "${data.message}"` 
                    : `From: ${data.from}\nSubject: ${data.subject}\n\n${data.message}`,
                priority: priority as Priority,
                due_at,
                status: 'To Do' as TaskStatus,
                source,
                notion_page_id: `notion_${source}_${Date.now()}`,
                start_at: null,
                estimated_minutes: null,
                stakeholders: [],
                related_emails: [],
                related_events: [],
                reminders: due_at ? [{
                    type: 'audible',
                    start_at: new Date(new Date(due_at).getTime() - 30 * 60000).toISOString(),
                    repeat: 'every_2_min',
                    stop_condition: 'status>=Started'
                }] : [],
                last_briefed_at: null,
                channel,
                source_id: `${source}_sim_${Date.now()}`,
                phone: data.type === 'sms' ? from : undefined,
                email: data.type === 'email' ? from : undefined,
                autoSummary: result.autoSummary,
                confidence: result.confidence,
                tags,
            };
            addTask(newTask);
        } else if (result.action === 'create_calendar_event' && result.event) {
            const { title, start_at, end_at, attendees = [] } = result.event;
            const newEvent: Omit<CalendarEvent, 'id'> = {
                title,
                start_at,
                end_at,
                attendees: [...attendees, from], // Add sender to attendees
            };
            addEvent(newEvent);
        } else if (result.action === 'clarify_request') {
            console.log("Clarification needed:", result.clarification);
            alert(`Assistant needs clarification: ${result.clarification}`);
        } else {
             throw new Error('Unknown action returned from AI.');
        }
    } catch (error) {
        console.error("Failed to handle inbound simulation:", error);
        throw error;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
      {activeBriefing && (
        <MeetingBriefing briefing={activeBriefing} onDismiss={() => setActiveBriefing(null)} />
      )}
      {activeTaskForReminder && (
        <Reminder task={activeTaskForReminder} onStart={stopReminder} />
      )}
      
      <Sidebar integrations={integrations} onConnect={handleConnect} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Executive AI Assistant</h1>
          <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
              <img src={`https://picsum.photos/40`} alt="User Avatar" className="w-8 h-8 rounded-full" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Dashboard tasks={tasks} updateTaskStatus={updateTaskStatus} handleSimulation={handleSimulation} />
        </div>

        <footer className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-2">
                <div className="bg-gray-700 p-1 rounded-full flex space-x-1">
                    <button onClick={() => setActiveInterface('chat')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeInterface === 'chat' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                        <MessageSquare className="w-5 h-5 inline-block mr-1" /> Chat
                    </button>
                    <button onClick={() => setActiveInterface('voice')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeInterface === 'voice' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                         <Mic className="w-5 h-5 inline-block mr-1" /> Voice
                    </button>
                </div>
            </div>
            {activeInterface === 'chat' ? <ChatInterface addTask={addTask} addEvent={addEvent} /> : <VoiceInterface addTask={addTask} addEvent={addEvent} />}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
