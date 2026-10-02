/**
 * Master Demographic Class & Stream Options for CenterInsider
 */
export const JUNIOR_CLASS_OPTIONS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9"
];

export const SENIOR_CLASS_OPTIONS = [
  "Class 10",
  "Class 11 - Medical",
  "Class 11 - Non-Medical",
  "Class 11 - Commerce",
  "Class 11 - Arts",
  "Class 11 - JEE",
  "Class 11 - NEET",
  "Class 12 - Medical",
  "Class 12 - Non-Medical",
  "Class 12 - Commerce",
  "Class 12 - Arts",
  "Class 12 - JEE",
  "Class 12 - NEET"
];

export const MASTER_CLASS_OPTIONS = [
  ...JUNIOR_CLASS_OPTIONS,
  ...SENIOR_CLASS_OPTIONS
];

export const CLASS_OPTIONS = MASTER_CLASS_OPTIONS;

/**
 * Checks if a class, stream, or grade belongs to the Junior cohort (Classes 6-9)
 */
export const isJuniorClass = (val) => {
  if (val === null || val === undefined) return false;
  const str = String(val).trim().toLowerCase();
  if (['6', '7', '8', '9', 6, 7, 8, 9].includes(val)) return true;
  if (str.includes('class 6') || str.includes('class 7') || str.includes('class 8') || str.includes('class 9') ||
      str.includes('grade 6') || str.includes('grade 7') || str.includes('grade 8') || str.includes('grade 9')) {
    return true;
  }
  if (/^class\s*[6-9]\b/i.test(str) || /^[6-9]$/.test(str)) {
    return true;
  }
  return false;
};

/**
 * Checks if a user object is in the Junior cohort (Classes 6-9)
 */
export const isJuniorUser = (user) => {
  if (!user) return false;
  return (
    isJuniorClass(user.class) ||
    isJuniorClass(user.grade) ||
    isJuniorClass(user.stream) ||
    isJuniorClass(user.standard)
  );
};

export const getGradeFromStream = (streamStr = '') => {
  if (!streamStr) return '11';
  const match = streamStr.match(/\b(6|7|8|9|10|11|12)\b/);
  if (match) return match[1];
  if (streamStr.includes('6')) return '6';
  if (streamStr.includes('7')) return '7';
  if (streamStr.includes('8')) return '8';
  if (streamStr.includes('9')) return '9';
  if (streamStr.includes('10')) return '10';
  if (streamStr.includes('12')) return '12';
  return '11';
};
