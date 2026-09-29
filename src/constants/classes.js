/**
 * Master Demographic Class & Stream Options for CenterInsider
 */
export const MASTER_CLASS_OPTIONS = [
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

export const CLASS_OPTIONS = MASTER_CLASS_OPTIONS;

export const getGradeFromStream = (streamStr = '') => {
  if (!streamStr) return '11';
  if (streamStr.includes('10')) return '10';
  if (streamStr.includes('12')) return '12';
  return '11';
};
