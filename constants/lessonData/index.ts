import { ELEMENTARY_LESSONS } from './elementary';
import { MIDDLE_LESSONS } from './middle';
import { HIGH_LESSONS } from './high';
import { AP_LESSONS } from './ap';
import { COLLEGE_LESSONS } from './college';
import { ADVANCED_LESSONS } from './advanced';

/**
 * All pre-authored lesson content, bundled with the app.
 * Key format: "courseId_topicId"  (matches CURRICULUM in mathCurriculum.ts)
 */
export const ALL_LESSONS = {
  ...ELEMENTARY_LESSONS,
  ...MIDDLE_LESSONS,
  ...HIGH_LESSONS,
  ...AP_LESSONS,
  ...COLLEGE_LESSONS,
  ...ADVANCED_LESSONS,
};
