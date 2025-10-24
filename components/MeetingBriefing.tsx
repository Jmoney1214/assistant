import React from 'react';
import { BriefingData } from '../types';
import { Calendar, Clock, ListChecks, Mail, MapPin, Users, X } from 'lucide-react';

interface MeetingBriefingProps {
  briefing: BriefingData;
  onDismiss: () => void;
}

export const MeetingBriefing: React.FC<MeetingBriefingProps> = ({ briefing, onDismiss }) => {
    const { event, relatedTasks, relatedEmails } = briefing;

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
            <div 
                className="bg-gray-800 border border-indigo-500/50 rounded-2xl shadow-2xl max-w-2xl w-full p-6 m-4 flex flex-col max-h-[90vh] animate-fade-in"
            >
                <header className="flex items-center justify-between pb-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Meeting Briefing</h2>
                            <p className="text-sm text-gray-400">Your pre-meeting hot sheet</p>
                        </div>
                    </div>
                    <button onClick={onDismiss} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto pt-6 pr-2 space-y-6">
                    {/* Event Details */}
                    <section>
                        <h3 className="text-xl font-semibold mb-3">{event.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                            <div className="flex items-center space-x-2"><Clock className="w-4 h-4 text-gray-500"/><span>{formatTime(event.start_at)} - {formatTime(event.end_at)}</span></div>
                            {event.location && <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-gray-500"/><span>{event.location}</span></div>}
                            <div className="flex items-center space-x-2 col-span-full"><Users className="w-4 h-4 text-gray-500"/><span>Attendees: {event.attendees.join(', ')}</span></div>
                        </div>
                    </section>

                    {/* Agenda */}
                    {event.description && (
                        <section>
                            <h4 className="font-semibold text-lg text-gray-200 mb-2">Agenda</h4>
                            <div className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
                                {event.description}
                            </div>
                        </section>
                    )}

                    {/* Related Tasks */}
                    {relatedTasks.length > 0 && (
                        <section>
                            <h4 className="font-semibold text-lg text-gray-200 mb-2">Related Tasks</h4>
                            <ul className="space-y-2">
                                {relatedTasks.map(task => (
                                    <li key={task.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center space-x-3 text-sm">
                                        <ListChecks className="w-5 h-5 text-indigo-400" />
                                        <span>{task.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Related Emails */}
                    {relatedEmails.length > 0 && (
                        <section>
                            <h4 className="font-semibold text-lg text-gray-200 mb-2">Last Relevant Email</h4>
                            <div className="bg-gray-700/50 p-3 rounded-lg text-sm">
                                <p className="font-semibold text-gray-300 flex items-center space-x-2 mb-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{relatedEmails[0].subject}</span>
                                </p>
                                <p className="text-gray-400 italic">"{relatedEmails[0].snippet}"</p>
                            </div>
                        </section>
                    )}
                </div>
                 <footer className="pt-4 mt-auto border-t border-gray-700 text-right">
                    <button onClick={onDismiss} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Dismiss
                    </button>
                </footer>
            </div>
        </div>
    );
};
