import React, { useState } from 'react';
import { Bot, Loader, MessageSquare, Mail, Send } from 'lucide-react';
import { SimulationData } from '../types';

interface ReceptionistPanelProps {
    onSimulate: (data: SimulationData) => Promise<void>;
}

export const ReceptionistPanel: React.FC<ReceptionistPanelProps> = ({ onSimulate }) => {
    const [mode, setMode] = useState<'sms' | 'email'>('sms');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    // SMS state
    const [smsFrom, setSmsFrom] = useState('+15551234567');
    const [smsMessage, setSmsMessage] = useState('Need 20 cases Casamigos Blanco by Friday noon.');

    // Email state
    const [emailFrom, setEmailFrom] = useState('client@example.com');
    const [emailSubject, setEmailSubject] = useState('Urgent: Project Alpha Update');
    const [emailMessage, setEmailMessage] = useState('Hi there, can we schedule a 30-minute meeting tomorrow morning to discuss the latest roadblocks on Project Alpha? Thanks.');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        let data: SimulationData | null = null;
        if (mode === 'sms' && smsFrom.trim() && smsMessage.trim()) {
            data = { type: 'sms', from: smsFrom, message: smsMessage };
        } else if (mode === 'email' && emailFrom.trim() && emailSubject.trim() && emailMessage.trim()) {
            data = { type: 'email', from: emailFrom, subject: emailSubject, message: emailMessage };
        }

        if (!data) return;
        
        setIsLoading(true);
        setFeedback(null);
        try {
            await onSimulate(data);
            setFeedback('Message processed and action taken successfully!');
            if (mode === 'sms') setSmsMessage('');
            else setEmailMessage('');
        } catch (error) {
            console.error(error);
            setFeedback('Failed to process the message.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderSmsForm = () => (
        <>
            <div>
                <label htmlFor="from" className="block text-xs font-medium text-gray-300 mb-1">From (Phone Number)</label>
                <input
                    type="tel"
                    id="from"
                    value={smsFrom}
                    onChange={(e) => setSmsFrom(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+15551234567"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-xs font-medium text-gray-300 mb-1">Message</label>
                <textarea
                    id="message"
                    rows={3}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Can we meet Monday 3-5 PM to discuss Halloween promo?"
                    disabled={isLoading}
                />
            </div>
        </>
    );

    const renderEmailForm = () => (
         <>
            <div>
                <label htmlFor="emailFrom" className="block text-xs font-medium text-gray-300 mb-1">From (Email)</label>
                <input
                    type="email"
                    id="emailFrom"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="client@example.com"
                    disabled={isLoading}
                />
            </div>
             <div>
                <label htmlFor="emailSubject" className="block text-xs font-medium text-gray-300 mb-1">Subject</label>
                <input
                    type="text"
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Meeting Request"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="emailMessage" className="block text-xs font-medium text-gray-300 mb-1">Message Body</label>
                <textarea
                    id="emailMessage"
                    rows={3}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Hi team, let's connect tomorrow to sync on Q4 goals."
                    disabled={isLoading}
                />
            </div>
        </>
    );


    return (
        <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center"><Bot className="w-6 h-6 mr-2" /> Receptionist Autopilot</h3>
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-4">Simulate an inbound message to see the AI receptionist in action. The assistant will parse the message, extract intent, and automatically create a new task or calendar event.</p>
                
                <div className="mb-4 flex border-b border-gray-700">
                    <button onClick={() => setMode('sms')} className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${mode === 'sms' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                        <MessageSquare className="w-4 h-4" />
                        <span>SMS</span>
                    </button>
                    <button onClick={() => setMode('email')} className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${mode === 'email' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'sms' ? renderSmsForm() : renderEmailForm()}
                    <div className="flex items-center justify-between pt-2">
                         <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                        >
                            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            <span>{`Simulate Inbound ${mode === 'sms' ? 'SMS' : 'Email'}`}</span>
                        </button>
                        {feedback && <p className={`text-sm ${feedback.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}>{feedback}</p>}
                    </div>
                </form>
            </div>
        </div>
    );
};
