/*
================================================================================
IMPORTANT: MOCK DATA FOR DEMONSTRATION ONLY
================================================================================

This service provides hardcoded, mock data to simulate interactions with
Notion, Google Calendar, and Outlook for development and demonstration purposes.

In a live, production-ready application, you would replace the functions in this
file with actual API calls to the respective services.

This would involve:
1.  Using the access tokens obtained via the OAuth flow (managed by your backend)
    to authenticate your requests.
2.  Making authenticated calls to the relevant API endpoints:
    - Notion API (https://developers.notion.com/reference/intro)
    - Google Calendar API (https://developers.google.com/calendar/api/guides/overview)
    - Microsoft Graph API for Outlook (https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview)
3.  Handling data fetching, creation, updates, and error management for each service.

The data structures (Task, CalendarEvent, etc.) in `types.ts` are designed to be
a generic representation that you would map the API responses to.
*/
import { Task, CalendarEvent, EmailThread } from '../types';

const now = new Date();

const getISOTime = (offsetMinutes: number) => new Date(now.getTime() + offsetMinutes * 60000).toISOString();

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design Halloween promo poster',
    description: 'Create a visually appealing poster for the upcoming Halloween event.',
    source: 'notion',
    notion_page_id: 'np_1',
    priority: 'Urgent',
    status: 'To Do',
    due_at: getISOTime(120), // 2 hours from now
    start_at: null,
    estimated_minutes: 180,
    stakeholders: [{ name: 'Marketing Team', email: 'marketing@example.com' }],
    related_emails: [],
    related_events: [],
    reminders: [{
        type: 'audible',
        start_at: getISOTime(-2), // 2 minutes ago to trigger reminder
        repeat: 'every_2_min',
        stop_condition: 'status>=Started'
    }],
    last_briefed_at: null,
    created_at: getISOTime(-1440), // 1 day ago
    updated_at: getISOTime(-60), // 1 hour ago
  },
  {
    id: '2',
    title: 'Reorder Casamigos inventory',
    description: 'Check current stock and place an order for 20 cases of Casamigos Blanco.',
    source: 'notion',
    notion_page_id: 'np_2',
    priority: 'High',
    status: 'In Progress',
    due_at: getISOTime(2880), // 2 days from now
    start_at: getISOTime(-120), // Started 2 hours ago
    estimated_minutes: 60,
    stakeholders: [{ name: 'Bar Manager', email: 'bar@example.com' }],
    related_emails: ['outlook_msg_123'],
    related_events: [],
    reminders: [],
    last_briefed_at: getISOTime(-180), // 3 hours ago
    created_at: getISOTime(-2880), // 2 days ago
    updated_at: getISOTime(-120),
  },
  {
    id: '3',
    title: 'Finalize Q4 budget report',
    description: 'Review all department submissions and finalize the budget for the next quarter.',
    source: 'outlook',
    notion_page_id: 'np_3',
    priority: 'High',
    status: 'To Do',
    due_at: getISOTime(10080), // 1 week from now
    start_at: null,
    estimated_minutes: 240,
    stakeholders: [{ name: 'Finance Dept', email: 'finance@example.com' }],
    related_emails: ['outlook_msg_456'],
    related_events: ['gcal_evt_abc'],
    reminders: [],
    last_briefed_at: null,
    created_at: getISOTime(-4320), // 3 days ago
    updated_at: getISOTime(-1440),
  },
    {
    id: '4',
    title: 'Prep for VIP Night',
    description: 'Coordinate with security and staff for the upcoming VIP event.',
    source: 'gcal',
    notion_page_id: 'np_4',
    priority: 'Normal',
    status: 'Finished',
    due_at: getISOTime(-1440), // Yesterday
    start_at: getISOTime(-2880),
    estimated_minutes: 120,
    stakeholders: [],
    related_emails: [],
    related_events: ['gcal_evt_def'],
    reminders: [],
    last_briefed_at: getISOTime(-2000),
    created_at: getISOTime(-10080), // 1 week ago
    updated_at: getISOTime(-1400),
  },
  {
    id: '5',
    title: 'Follow up on Casamigos delivery',
    description: 'Inbound SMS: "Need 20 cases Casamigos Blanco by Friday noon."',
    source: 'sms',
    notion_page_id: 'np_5',
    priority: 'High',
    status: 'To Do',
    due_at: getISOTime(4320), // 3 days from now
    start_at: null,
    estimated_minutes: 15,
    stakeholders: [],
    related_emails: [],
    related_events: [],
    reminders: [],
    last_briefed_at: null,
    created_at: getISOTime(-10),
    updated_at: getISOTime(-10),
    // Receptionist fields
    channel: 'SMS',
    source_id: 'sms_sim_12345',
    contactName: 'Unknown',
    phone: '+15551234567',
    autoSummary: 'Customer requires 20 cases of Casamigos Blanco by Friday at noon.',
    confidence: 0.95,
    tags: ['Delivery', 'Inventory'],
  },
];

const mockEvents: CalendarEvent[] = [
  {
    id: 'gcal_evt_abc',
    title: 'Q4 Budget Review',
    start_at: getISOTime(15), // 15 mins from now
    end_at: getISOTime(75),
    attendees: ['user@example.com', 'finance@example.com'],
    description: '1. Review department submissions.\n2. Finalize projections for Q1.\n3. Discuss new tooling costs.',
    location: 'Virtual / Google Meet'
  },
  {
    id: 'gcal_evt_def',
    title: 'VIP Night Post-Mortem',
    start_at: getISOTime(1440), // tomorrow
    end_at: getISOTime(1485),
    attendees: ['user@example.com', 'bar@example.com'],
    description: 'Discuss what went well and what could be improved for future VIP events.',
    location: 'Main Office, Conference Room B'
  }
];

const mockEmailThreads: Record<string, Omit<EmailThread, 'id'>> = {
  'outlook_msg_123': {
    subject: 'FW: Casamigos Order Confirmation',
    snippet: 'Hey, just confirming we have received the order for 20 cases. The estimated delivery is this Thursday. Let me know if you need anything else.'
  },
  'outlook_msg_456': {
    subject: 'Re: Draft Q4 Budget',
    snippet: 'Hi team, please find the attached draft for the Q4 budget. I need everyone to review their department sections by EOD Tuesday...'
  }
};

export const getMockTasks = (): Task[] => JSON.parse(JSON.stringify(mockTasks));

export const getMockEvents = (): CalendarEvent[] => JSON.parse(JSON.stringify(mockEvents));

export const getMockEmailById = (id: string): EmailThread | null => {
  if (mockEmailThreads[id]) {
    return { id, ...mockEmailThreads[id] };
  }
  return null;
};
