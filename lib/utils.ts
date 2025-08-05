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

/**
 * Get timezone from location using a mapping of common cities
 * This is a simplified approach - in production you might want to use a geocoding API
 * @param location - City name or "City, State/Country" format
 * @returns IANA timezone identifier
 */
export function getTimezoneFromLocation(location: string): string {
  const locationLower = location.toLowerCase().trim();
  
  // Common US cities
  const cityTimezones: Record<string, string> = {
    // Eastern Time
    'new york': 'America/New_York',
    'new york city': 'America/New_York',
    'nyc': 'America/New_York',
    'boston': 'America/New_York',
    'philadelphia': 'America/New_York',
    'atlanta': 'America/New_York',
    'miami': 'America/New_York',
    'washington': 'America/New_York',
    'washington dc': 'America/New_York',
    'orlando': 'America/New_York',
    'tampa': 'America/New_York',
    'charlotte': 'America/New_York',
    'detroit': 'America/Detroit',
    
    // Central Time
    'chicago': 'America/Chicago',
    'houston': 'America/Chicago',
    'dallas': 'America/Chicago',
    'san antonio': 'America/Chicago',
    'austin': 'America/Chicago',
    'fort worth': 'America/Chicago',
    'oklahoma city': 'America/Chicago',
    'kansas city': 'America/Chicago',
    'st louis': 'America/Chicago',
    'milwaukee': 'America/Chicago',
    'minneapolis': 'America/Chicago',
    'new orleans': 'America/Chicago',
    'nashville': 'America/Chicago',
    'memphis': 'America/Chicago',
    
    // Mountain Time
    'denver': 'America/Denver',
    'phoenix': 'America/Phoenix', // Arizona doesn't observe DST
    'salt lake city': 'America/Denver',
    'albuquerque': 'America/Denver',
    'colorado springs': 'America/Denver',
    'boise': 'America/Boise',
    
    // Pacific Time
    'los angeles': 'America/Los_Angeles',
    'san francisco': 'America/Los_Angeles',
    'seattle': 'America/Los_Angeles',
    'portland': 'America/Los_Angeles',
    'san diego': 'America/Los_Angeles',
    'las vegas': 'America/Los_Angeles',
    'sacramento': 'America/Los_Angeles',
    'san jose': 'America/Los_Angeles',
    
    // Alaska & Hawaii
    'anchorage': 'America/Anchorage',
    'honolulu': 'Pacific/Honolulu',
    
    // International major cities
    'london': 'Europe/London',
    'paris': 'Europe/Paris',
    'berlin': 'Europe/Berlin',
    'rome': 'Europe/Rome',
    'madrid': 'Europe/Madrid',
    'amsterdam': 'Europe/Amsterdam',
    'brussels': 'Europe/Brussels',
    'zurich': 'Europe/Zurich',
    'vienna': 'Europe/Vienna',
    'stockholm': 'Europe/Stockholm',
    'oslo': 'Europe/Oslo',
    'copenhagen': 'Europe/Copenhagen',
    'helsinki': 'Europe/Helsinki',
    'moscow': 'Europe/Moscow',
    'tokyo': 'Asia/Tokyo',
    'beijing': 'Asia/Shanghai',
    'shanghai': 'Asia/Shanghai',
    'hong kong': 'Asia/Hong_Kong',
    'singapore': 'Asia/Singapore',
    'sydney': 'Australia/Sydney',
    'melbourne': 'Australia/Melbourne',
    'toronto': 'America/Toronto',
    'vancouver': 'America/Vancouver',
    'montreal': 'America/Toronto',
    'mexico city': 'America/Mexico_City',
    'sao paulo': 'America/Sao_Paulo',
    'buenos aires': 'America/Argentina/Buenos_Aires',
  };
  
  // Check for exact city match
  if (cityTimezones[locationLower]) {
    return cityTimezones[locationLower];
  }
  
  // Check if location contains a known city
  for (const [city, timezone] of Object.entries(cityTimezones)) {
    if (locationLower.includes(city)) {
      return timezone;
    }
  }
  
  // Check for state/country patterns
  if (locationLower.includes('california') || locationLower.includes('ca')) {
    return 'America/Los_Angeles';
  }
  if (locationLower.includes('texas') || locationLower.includes('tx')) {
    return 'America/Chicago';
  }
  if (locationLower.includes('florida') || locationLower.includes('fl')) {
    return 'America/New_York';
  }
  if (locationLower.includes('new york') || locationLower.includes('ny')) {
    return 'America/New_York';
  }
  if (locationLower.includes('illinois') || locationLower.includes('il')) {
    return 'America/Chicago';
  }
  if (locationLower.includes('washington') || locationLower.includes('wa')) {
    return 'America/Los_Angeles';
  }
  if (locationLower.includes('oregon') || locationLower.includes('or')) {
    return 'America/Los_Angeles';
  }
  if (locationLower.includes('colorado') || locationLower.includes('co')) {
    return 'America/Denver';
  }
  if (locationLower.includes('arizona') || locationLower.includes('az')) {
    return 'America/Phoenix';
  }
  
  // International countries
  if (locationLower.includes('uk') || locationLower.includes('united kingdom') || locationLower.includes('england')) {
    return 'Europe/London';
  }
  if (locationLower.includes('france')) {
    return 'Europe/Paris';
  }
  if (locationLower.includes('germany')) {
    return 'Europe/Berlin';
  }
  if (locationLower.includes('italy')) {
    return 'Europe/Rome';
  }
  if (locationLower.includes('spain')) {
    return 'Europe/Madrid';
  }
  if (locationLower.includes('canada')) {
    return 'America/Toronto'; // Default to Eastern Canada
  }
  if (locationLower.includes('australia')) {
    return 'Australia/Sydney'; // Default to Eastern Australia
  }
  if (locationLower.includes('japan')) {
    return 'Asia/Tokyo';
  }
  if (locationLower.includes('china')) {
    return 'Asia/Shanghai';
  }
  
  // Default to UTC if no match found
  return 'UTC';
}

/**
 * Format timezone for display
 * @param timezone - IANA timezone identifier
 * @returns Human-readable timezone string
 */
export function formatTimezone(timezone: string): string {
  if (!timezone) return '';
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone;
    
    return `${timezone.replace('_', ' ')} (${timeZoneName})`;
  } catch (error) {
    return timezone;
  }
}

/**
 * Get current time in a specific timezone
 * @param timezone - IANA timezone identifier
 * @returns Formatted time string
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  if (!timezone) return '';
  
  try {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return '';
  }
}
