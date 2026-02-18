import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging Tailwind CSS classes
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Allowed Nigerian university email domains
 */
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
] as const

/**
 * Staff-only domains (non-student domains that require approval)
 */
export const STAFF_DOMAINS = [
  'babcock.edu.ng',
] as const

export type DomainType = 'student' | 'staff'

/**
 * Classify domain as student or staff
 * Staff domains require counselor approval
 */
export function classifyDomain(domain: string): DomainType {
  // If domain starts with 'student.', it's a student domain
  if (domain.startsWith('student.')) {
    return 'student'
  }

  // If domain is in staff domains list, it's staff
  if (STAFF_DOMAINS.includes(domain as typeof STAFF_DOMAINS[number])) {
    return 'staff'
  }

  // Default to student for other university domains
  return 'student'
}

/**
 * Validates if an email belongs to an allowed school domain
 */
export function isValidSchoolEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return ALLOWED_SCHOOL_DOMAINS.includes(domain as typeof ALLOWED_SCHOOL_DOMAINS[number])
}

/**
 * Extracts the domain from an email address
 */
export function extractSchoolDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain || null
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Validation rules for forms
 */
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
} as const
