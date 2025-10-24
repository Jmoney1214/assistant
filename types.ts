import { Channel } from "diagnostics_channel";

export type Priority = "Urgent" | "High" | "Normal" | "Low";
export type TaskStatus = "To Do" | "Started" | "In Progress" | "Finished";
export type Integration = 'outlook' | 'gcal' | 'notion';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';
export type ChannelType = 'SMS' | 'Voice' | 'Voicemail' | 'Email' | 'Manual';

export interface ReminderInfo {
  type: "audible" | "push";
  start_at: string; // ISO8601
  repeat: "every_2_min" | "every_5_min" | "every_10_min" | "custom";
  stop_condition: "status>=Started";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  source: "notion" | "outlook" | "gcal" | "sms" | "voice" | "voicemail";
  notion_page_id: string;
  priority: Priority;
  status: TaskStatus;
  due_at: string | null; // ISO8601
  start_at: string | null; // ISO8601
  estimated_minutes: number | null;
  stakeholders: { name: string; email: string }[];
  related_emails: string[]; // outlook_message_id
  related_events: string[]; // google_event_id
  reminders: ReminderInfo[];
  last_briefed_at: string | null; // ISO8601
  created_at: string; // ISO8601
  updated_at: string; // ISO8601

  // Receptionist Add-on fields
  channel?: ChannelType;
  source_id?: string; // e.g., sms_sid
  contactName?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  autoSummary?: string;
  confidence?: number; // 0-1
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_at: string; // ISO8601
  end_at: string; // ISO8601
  attendees: string[]; // emails
  description?: string;
  location?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
}

export interface BriefingData {
  event: CalendarEvent;
  relatedTasks: Task[];
  relatedEmails: EmailThread[];
}

export type SimulationData = 
    | { type: 'sms'; from: string; message: string }
    | { type: 'email'; from: string; subject: string; message: string };
