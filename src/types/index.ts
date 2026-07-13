export type Role = 'parent' | 'teacher' | 'student' | 'counselor' | 'admin' | 'super_admin';

export type SchoolType = 'SK' | 'SJKC' | 'SJKT' | 'SMK' | 'SMJK' | 'MRSM' | 'SBP' | 'PRIVATE' | 'INTERNATIONAL';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type SchoolStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export interface School {
  id: string;
  school_code: string;
  school_name: string;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  state: string;
  postcode: string | null;
  school_type: SchoolType;
  email: string | null;
  phone: string | null;
  fax: string | null;
  website: string | null;
  principal_name: string | null;
  enrollment_count: number;
  subscription_tier: SubscriptionTier;
  status: SchoolStatus;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  phone: string | null;
  school_id: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  school_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  class_name: string | null;
  grade_level: string | null;
  avatar_url: string | null;
  student_id_number: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  color: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
  created_at: string;
}

export interface Homework {
  id: string;
  title: string;
  description: string | null;
  subject_name: string | null;
  due_date: string | null;
  teacher_id: string | null;
  attachment_url: string | null;
  created_at: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  parent_id: string;
  status: 'pending' | 'completed' | 'late';
  submission_url: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_name: string;
  score: number | null;
  max_score: number;
  grade_letter: string | null;
  term: string | null;
  exam_type: string;
  recorded_at: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author_id: string;
  author_name: string | null;
  published_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'homework' | 'attendance' | 'exam' | 'announcement';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  session_id: string;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  type: 'pdf' | 'video' | 'quiz' | 'practice';
  url: string | null;
  uploaded_by: string | null;
  downloads: number;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  type: 'homework' | 'exam' | 'meeting' | 'holiday' | 'general';
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  color: string;
  created_by: string;
  created_at: string;
}
