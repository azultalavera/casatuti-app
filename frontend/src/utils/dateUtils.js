/**
 * Utilities for formatting and handling dates uniformly across the application.
 */

/**
 * Formats any date input into a strict 'DD/MM/YYYY' string.
 * @param {string | Date | null | undefined} inputDate - The date to format.
 * @returns {string} The formatted date, or '' if invalid.
 */
export function formatDateDDMMYYYY(inputDate) {
  if (!inputDate) return '';

  let dateObj;

  if (inputDate instanceof Date) {
    dateObj = inputDate;
  } else if (typeof inputDate === 'string') {
    // Check if it's already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate.trim())) {
      const parts = inputDate.trim().split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    // Check if it's an ISO string or similar with time
    if (inputDate.includes('T')) {
      dateObj = new Date(inputDate);
    } else {
      // For strings like "2026-05-30" or other formats, try parsing directly,
      // but append T00:00:00 if it's just a date to avoid timezone shift.
      const sanitizedDate = inputDate.length === 10 ? `${inputDate}T00:00:00` : inputDate;
      dateObj = new Date(sanitizedDate);
    }
  } else {
    return '';
  }

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}
