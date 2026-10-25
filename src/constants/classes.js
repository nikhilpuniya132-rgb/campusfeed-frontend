/**
 * Master Demographic Class Options for CenterInsider (Slick Model - Streams Removed)
 */
export const CLASS_OPTIONS = [
  "Class 12",
  "Class 11",
  "Class 10",
  "Class 9",
  "Class 8",
  "Class 7",
  "Class 6"
];

export const SENIOR_CLASS_OPTIONS = [
  "Class 12",
  "Class 11",
  "Class 10"
];

export const JUNIOR_CLASS_OPTIONS = [
  "Class 9",
  "Class 8",
  "Class 7",
  "Class 6"
];

export const MASTER_CLASS_OPTIONS = CLASS_OPTIONS;

/**
 * Checks if a class, stream, or grade belongs to the Junior cohort (Classes 6-9)
 */
export const isJuniorClass = (val) => {
  if (val === null || val === undefined) return false;
  const str = String(val).trim().toLowerCase();
  if (['6', '7', '8', '9', 6, 7, 8, 9].includes(val)) return true;
  if (str === 'class 6' || str === 'class 7' || str === 'class 8' || str === 'class 9') return true;
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
  const match = String(streamStr).match(/\b(6|7|8|9|10|11|12)\b/);
  if (match) return match[1];
  return '11';
};
