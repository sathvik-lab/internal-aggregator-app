import { updateDocument } from './firestore';
import { CHECKLIST_STATUS } from '../constants/constants';

/**
 * Truth table for completion state:
 * - completed=true  => status=completed, completedAt=ISO timestamp
 * - completed=false + dueDate in past => status=overdue, completedAt=null
 * - completed=false + dueDate today/future/invalid => status=pending, completedAt=null
 */
export const updateChecklistItemCompletion = async ({ itemId, completed, userId, dueDate }) => {
  if (!itemId) {
    return {
      data: null,
      error: { code: 'invalid-argument', message: 'itemId is required' },
    };
  }

  const nowIso = new Date().toISOString();
  let status = CHECKLIST_STATUS.PENDING;
  let completedAt = null;

  if (completed) {
    status = CHECKLIST_STATUS.COMPLETED;
    completedAt = nowIso;
  } else if (dueDate) {
    const due = new Date(dueDate);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
      status = CHECKLIST_STATUS.OVERDUE;
    }
  }

  const payload = {
    completed: Boolean(completed),
    status,
    completedAt,
    updatedAt: nowIso,
    ...(userId ? { lastUpdatedBy: userId } : {}),
    ...(completed && userId ? { completedBy: userId } : { completedBy: null }),
  };

  return updateDocument('checklistItems', itemId, payload);
};

export default {
  updateChecklistItemCompletion,
};
