/**
 * Calculate age from birthdate
 * @param birthdate - The birthdate as a Date object or string
 * @returns The calculated age in years
 */
export function calculateAge(birthdate: Date | string | null | undefined): number {
  if (!birthdate) return 0;
  
  const birth = new Date(birthdate);
  const today = new Date();
  
  // Check if the birthdate is valid
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age); // Ensure age is never negative
}

/**
 * Format birthdate for display
 * @param birthdate - The birthdate as a Date object or string
 * @returns Formatted date string
 */
export function formatBirthdate(birthdate: Date | string | null | undefined): string {
  if (!birthdate) return '';
  
  const date = new Date(birthdate);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString();
}

/**
 * Format birthdate for HTML date input
 * @param birthdate - The birthdate as a Date object or string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatBirthdateForInput(birthdate: Date | string | null | undefined): string {
  if (!birthdate) return '';
  
  const date = new Date(birthdate);
  if (isNaN(date.getTime())) return '';
  
  return date.toISOString().split('T')[0];
}
