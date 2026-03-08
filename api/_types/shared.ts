/**
 * Shared TypeScript Types for Mental Health Sentiment Analysis Platform
 *
 * This file contains type definitions used across both frontend and backend.
 * Ensures type safety and prevents API contract mismatches.
 */

// ====================================================================================
// ENUMS & CONSTANTS
// ====================================================================================

export enum Sentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
}

export enum Language {
  ENGLISH = 'english',
  PIDGIN = 'pidgin',
  MIXED = 'mixed',
}

export enum UserRole {
  STUDENT = 'student',
  PENDING_COUNSELOR = 'pending_counselor',
  COUNSELOR = 'counselor',
  ADMIN = 'admin',
}

export enum CounselorRequestStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  RESOLVED = 'resolved',
}

export enum BibleVerseSentimentMatch {
  POSITIVE = 'positive',
  NEGATIVE_ANXIOUS = 'negative_anxious',
  NEGATIVE_SAD = 'negative_sad',
  NEGATIVE_ANGRY = 'negative_angry',
  NEGATIVE_STRUGGLE = 'negative_struggle',
  NEUTRAL_ENCOURAGEMENT = 'neutral_encouragement',
  AT_RISK = 'at_risk',
}

// Allowed Nigerian university email domains
export const ALLOWED_SCHOOL_DOMAINS = [
  'student.babcock.edu.ng', // Babcock University (students)
  'babcock.edu.ng',         // Babcock University (staff/counselors)
  'unilag.edu.ng',          // University of Lagos
  'ui.edu.ng',              // University of Ibadan
  'uniben.edu',             // University of Benin
  'unn.edu.ng',             // University of Nigeria, Nsukka
  'abu.edu.ng',             // Ahmadu Bello University
  'oauife.edu.ng',          // Obafemi Awolowo University
  'unilorin.edu.ng',        // University of Ilorin
  'unical.edu.ng',          // University of Calabar
  'uniport.edu.ng',         // University of Port Harcourt
  'futa.edu.ng',            // Federal University of Technology, Akure
  // Add more universities as needed
] as const;

// Staff-only domains (non-student domains that require approval)
export const STAFF_DOMAINS = [
  'babcock.edu.ng',
] as const;

export type DomainType = 'student' | 'staff';

// Classify domain as student or staff
export function classifyDomain(domain: string): DomainType {
  // If domain starts with 'student.', it's a student domain
  if (domain.startsWith('student.')) {
    return 'student';
  }

  // If domain is in staff domains list, it's staff
  if (STAFF_DOMAINS.includes(domain as typeof STAFF_DOMAINS[number])) {
    return 'staff';
  }

  // Default to student for other university domains
  return 'student';
}

export type SchoolDomain = typeof ALLOWED_SCHOOL_DOMAINS[number];

// ====================================================================================
// DATABASE ENTITY TYPES
// ====================================================================================

export interface Student {
  id: string; // UUID
  email: string;
  email_verified: boolean;
  school_domain: string;
  role: UserRole;
  created_at: string; // ISO timestamp
  last_active: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Submission {
  id: string; // UUID
  student_id: string; // UUID
  text_encrypted: string;
  sentiment: Sentiment;
  risk_level: RiskLevel;
  dominant_emotion: string | null; // Top emotion from GoEmotions (e.g. 'confusion', 'sadness')
  confidence: number; // 0.0 - 1.0
  language_detected: Language | null;
  empathetic_message: string;
  bible_verse_reference: string | null;
  bible_verse_text: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  text_expires_at: string; // ISO timestamp
}

export interface EmotionalTrend {
  id: string; // UUID
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  low_risk_count: number;
  moderate_risk_count: number;
  high_risk_count: number;
  total_submissions: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CounselorRequest {
  id: string; // UUID
  student_id: string; // UUID
  message: string | null;
  status: CounselorRequestStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  resolved_at: string | null; // ISO timestamp
}

export interface CounselorApproval {
  id: string; // UUID
  user_id: string; // UUID
  approved_by: string | null; // UUID
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string; // ISO timestamp
  reviewed_at: string | null; // ISO timestamp
  rejection_reason: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface BibleVerse {
  id: string; // UUID
  verse_reference: string;
  verse_text: string;
  sentiment_match: BibleVerseSentimentMatch;
  language: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ====================================================================================
// API REQUEST TYPES
// ====================================================================================

// Auth API
export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Submission API
export interface CreateSubmissionRequest {
  text: string; // Student's text input (English or Pidgin)
}

export interface GetSubmissionHistoryRequest {
  limit?: number; // Max number of submissions to return (default: 20)
  offset?: number; // Pagination offset (default: 0)
}

// Trends API (Counselor)
export interface GetAggregateTrendsRequest {
  start_date?: string; // YYYY-MM-DD (default: 7 days ago)
  end_date?: string; // YYYY-MM-DD (default: today)
}

// Counselor Request API
export interface CreateCounselorRequestRequest {
  message?: string; // Optional message from student
}

// Counselor Approval API
export interface ApproveCounselorRequest {
  user_id: string;
  approve: boolean;
  rejection_reason?: string;
}

// Account Deletion API
// No request body needed (uses authenticated user ID)

// ====================================================================================
// API RESPONSE TYPES
// ====================================================================================

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth API Responses
export interface SignupResponse {
  message: string;
  user_id?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Submission API Responses
export interface CreateSubmissionResponse {
  id: string; // UUID of created submission
  sentiment: Sentiment;
  risk_level: RiskLevel;
  dominant_emotion: string; // Top emotion from GoEmotions (e.g. 'confusion', 'sadness')
  confidence: number;
  empathetic_message: string;
  bible_verse: {
    reference: string;
    text: string;
  } | null;
  show_counselor_option: boolean; // true if risk_level is moderate or high
  created_at: string; // ISO timestamp
}

export interface SubmissionHistoryItem {
  id: string;
  text: string; // The student's original entry text
  sentiment: Sentiment;
  risk_level: RiskLevel;
  dominant_emotion: string | null; // Top emotion from GoEmotions
  confidence: number;
  empathetic_message: string | null; // The response they received
  bible_verse_reference: string | null;
  bible_verse_text: string | null;
  created_at: string; // ISO timestamp
}

export interface GetSubmissionHistoryResponse {
  submissions: SubmissionHistoryItem[];
  total_count: number;
  has_more: boolean;
}

export interface DeleteSubmissionResponse {
  deleted_id: string;
}

// Trends API Responses (Counselor)
export interface DailyTrendSummary {
  date: string; // YYYY-MM-DD
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
  low_risk_percentage: number;
  moderate_risk_percentage: number;
  high_risk_percentage: number;
  total_submissions: number; // Rounded to nearest 5 for privacy
}

export interface HourlyTrendDetail {
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  low_risk_count: number;
  moderate_risk_count: number;
  high_risk_count: number;
  total_submissions: number;
}

export interface GetAggregateTrendsResponse {
  daily_summary: DailyTrendSummary[];
  hourly_details: HourlyTrendDetail[];
  overall_stats: {
    total_students_contributing: number; // Estimated (rounded for privacy)
    most_common_sentiment: Sentiment;
    average_risk_level: number; // 1.0 = low, 2.0 = moderate, 3.0 = high
  };
}

// Counselor Request API Responses
export interface CreateCounselorRequestResponse {
  id: string; // UUID of created request
  status: CounselorRequestStatus;
  created_at: string; // ISO timestamp
  message: string; // Confirmation message for student
}

export interface GetCounselorRequestsResponse {
  requests: CounselorRequest[];
  total_count: number;
}

// Account Deletion API Response
export interface DeleteAccountResponse {
  message: string;
  deleted_at: string; // ISO timestamp
}

// Counselor Approval API Responses
export interface PendingApprovalItem {
  id: string;
  user_id: string;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

export interface GetPendingApprovalsResponse {
  approvals: PendingApprovalItem[];
  total_count: number;
}

export interface ApproveCounselorResponse {
  success: boolean;
  message: string;
}

// Admin API Types
export interface AdminUserItem {
  id: string;
  email: string;
  role: UserRole;
  school_domain: string;
  created_at: string;
  last_active: string | null;
}

export interface GetAdminUsersResponse {
  users: AdminUserItem[];
  total_count: number;
}

export interface UpdateUserRoleRequest {
  user_id: string;
  role: UserRole;
}

export interface UpdateUserRoleResponse {
  message: string;
  user_id: string;
  new_role: UserRole;
}

// Assignments API Types
export interface CounselorStudentAssignment {
  id: string;
  counselor_id: string;
  student_id: string;
  assigned_by: string;
  assigned_at: string;
  status: 'active' | 'inactive';
}

export interface AssignmentWithDetails {
  id: string;
  counselor_id: string;
  counselor_email: string;
  student_id: string;
  student_email: string;
  assigned_by: string;
  assigned_at: string;
  status: 'active' | 'inactive';
}

export interface CreateAssignmentRequest {
  counselor_id: string;
  student_ids: string[];
}

export interface CreateAssignmentResponse {
  created: number;
  skipped: number;
  message: string;
}

export interface GetAssignmentsResponse {
  assignments: AssignmentWithDetails[];
  total_count: number;
}

export interface AssignedStudentInfo {
  id: string;
  email: string;
  last_active: string | null;
  total_submissions: number;
  latest_sentiment: string | null;
  latest_risk_level: string | null;
}

export interface MyStudentsTrendsResponse {
  daily_summary: {
    date: string;
    positive_count: number;
    neutral_count: number;
    negative_count: number;
    low_risk_count: number;
    moderate_risk_count: number;
    high_risk_count: number;
    total_submissions: number;
  }[];
  assigned_students: AssignedStudentInfo[];
  total_assigned_students: number;
}

export interface AdminStatsResponse {
  total_students: number;
  total_counselors: number;
  total_pending_counselors: number;
  total_submissions: number;
  high_risk_submissions: number;
  submissions_last_7_days: number;
  submissions_last_30_days: number;
}

// Alert API Types
export interface AtRiskAlert {
  id: string;
  student_id: string;
  counselor_id: string | null;
  submission_id: string | null;
  risk_level: 'moderate' | 'high';
  status: 'pending' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface AlertWithDetails extends AtRiskAlert {
  student_email: string;
  counselor_email: string | null;
  submission_text: string | null;  // The flagged entry text (only for assigned counselors)
}

export interface GetAlertsResponse {
  alerts: AlertWithDetails[];
  total_count: number;
  pending_count: number;
}

// ====================================================================================
// ML SERVICE TYPES
// ====================================================================================

// HuggingFace API response types

export interface AfriBERTaResponse {
  label: Sentiment; // 'positive', 'neutral', 'negative'
  score: number; // Confidence score (0.0 - 1.0)
}

export interface MentalBERTResponse {
  risk_category: RiskLevel; // 'low', 'moderate', 'high'
  score: number; // Mental health risk score (0.0 - 1.0)
}

export interface MLAnalysisResult {
  sentiment: Sentiment;
  risk_level: RiskLevel;
  dominant_emotion: string; // Top emotion from GoEmotions (e.g. 'confusion', 'sadness')
  confidence: number; // Average of both model confidences
  language_detected: Language;
  afriberta_score: number;
  mentalbert_score: number;
  has_concern_language?: boolean; // true if addiction/abuse/neglect phrases detected
  concern_type?: 'substance_abuse' | 'abuse' | 'eating_disorder' | 'isolation' | null; // specific concern for AI verse matching
}

// ====================================================================================
// FRONTEND-SPECIFIC TYPES
// ====================================================================================

// Form validation types
export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SubmissionFormData {
  text: string;
}

// Chart data types (for Recharts)
export interface TrendChartDataPoint {
  date: string; // Display format: "Jan 15"
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface RiskChartDataPoint {
  date: string;
  low: number;
  moderate: number;
  high: number;
}

// UI State types
export interface SubmissionState {
  isLoading: boolean;
  error: string | null;
  result: CreateSubmissionResponse | null;
}

export interface AuthState {
  user: Student | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ====================================================================================
// UTILITY TYPES
// ====================================================================================

// Extract sentiment category for Bible verse matching
export type BibleVerseCategory =
  | 'positive'
  | 'negative_anxious'
  | 'negative_sad'
  | 'negative_angry'
  | 'negative_struggle'
  | 'neutral_encouragement'
  | 'at_risk';

// Emotions that indicate anger/conflict (from GoEmotions labels)
const ANGRY_EMOTIONS = ['anger', 'annoyance', 'disapproval', 'disgust'];

// Determine Bible verse category based on sentiment, risk level, dominant emotion,
// and whether concern language (addiction, abuse, etc.) was detected.
export function getBibleVerseCategory(
  sentiment: Sentiment,
  risk_level: RiskLevel,
  dominantEmotion?: string,
  hasConcernLanguage?: boolean
): BibleVerseCategory {
  if (risk_level === RiskLevel.HIGH) {
    return 'at_risk';
  }

  // Concern language (addiction, abuse, eating disorders) → deliverance/freedom verses
  if (hasConcernLanguage) {
    return 'negative_struggle';
  }

  // Angry emotions get anger-specific verses regardless of sentiment classification
  // (ML models sometimes classify anger as "neutral" sentiment, e.g. "I hate my father")
  if (dominantEmotion && ANGRY_EMOTIONS.includes(dominantEmotion.toLowerCase())) {
    return 'negative_angry';
  }

  if (sentiment === Sentiment.NEGATIVE) {
    if (risk_level === RiskLevel.MODERATE) {
      return 'negative_anxious';
    }
    return 'negative_sad';
  }

  if (sentiment === Sentiment.POSITIVE) {
    return 'positive';
  }

  return 'neutral_encouragement';
}

// Validate school email domain
export function isValidSchoolEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_SCHOOL_DOMAINS.includes(domain as SchoolDomain);
}

// Extract school domain from email
export function extractSchoolDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain || null;
}

// Calculate sentiment percentages
export function calculateSentimentPercentages(trend: EmotionalTrend): {
  positive: number;
  neutral: number;
  negative: number;
} {
  const total = trend.total_submissions || 1; // Avoid division by zero
  return {
    positive: Math.round((trend.positive_count / total) * 100),
    neutral: Math.round((trend.neutral_count / total) * 100),
    negative: Math.round((trend.negative_count / total) * 100),
  };
}

// Calculate risk percentages
export function calculateRiskPercentages(trend: EmotionalTrend): {
  low: number;
  moderate: number;
  high: number;
} {
  const total = trend.total_submissions || 1;
  return {
    low: Math.round((trend.low_risk_count / total) * 100),
    moderate: Math.round((trend.moderate_risk_count / total) * 100),
    high: Math.round((trend.high_risk_count / total) * 100),
  };
}

// Determine if counselor option should be shown
export function shouldShowCounselorOption(risk_level: RiskLevel): boolean {
  return risk_level === RiskLevel.MODERATE || risk_level === RiskLevel.HIGH;
}

// Format date for display
export function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format date for chart (short format)
export function formatDateForChart(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ====================================================================================
// ERROR CODES
// ====================================================================================

export enum ErrorCode {
  // Auth errors
  INVALID_EMAIL_DOMAIN = 'INVALID_EMAIL_DOMAIN',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Submission errors
  TEXT_TOO_SHORT = 'TEXT_TOO_SHORT',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  GIBBERISH_DETECTED = 'GIBBERISH_DETECTED',
  ML_SERVICE_TIMEOUT = 'ML_SERVICE_TIMEOUT',
  ML_SERVICE_ERROR = 'ML_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',

  // Account deletion errors
  DELETION_FAILED = 'DELETION_FAILED',
  DELETION_INCOMPLETE = 'DELETION_INCOMPLETE',

  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FORBIDDEN = 'FORBIDDEN',
}

// Error messages (user-friendly)
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_EMAIL_DOMAIN]: 'Please use your school email address to sign up.',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email before logging in.',
  [ErrorCode.UNAUTHORIZED]: 'You must be logged in to access this resource.',
  [ErrorCode.TEXT_TOO_SHORT]: 'Please enter at least 10 characters.',
  [ErrorCode.TEXT_TOO_LONG]: 'Text is too long. Maximum 2000 characters.',
  [ErrorCode.GIBBERISH_DETECTED]: 'Please enter a meaningful reflection about your day or feelings.',
  [ErrorCode.ML_SERVICE_TIMEOUT]: "We're having trouble processing your submission. Please try again.",
  [ErrorCode.ML_SERVICE_ERROR]: 'Unable to analyze your submission right now. Please try again later.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many submissions. Please wait a moment before trying again.',
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
  [ErrorCode.RECORD_NOT_FOUND]: 'The requested record was not found.',
  [ErrorCode.DELETION_FAILED]: 'Failed to delete your account. Please try again or contact support.',
  [ErrorCode.DELETION_INCOMPLETE]: 'Account deletion was incomplete. Please contact support.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid input. Please check your data and try again.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
};

// ====================================================================================
// VALIDATION CONSTANTS
// ====================================================================================

export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  TEXT_SUBMISSION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
  },
  COUNSELOR_MESSAGE: {
    MAX_LENGTH: 500,
  },
} as const;
