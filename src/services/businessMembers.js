import { createDocument, getDocument, queryDocuments } from './firestore';
import { getDefaultBusinessId } from './userProfile';

const getInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const getBusinessContext = async (userId) => {
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  const { businessId, error } = await getDefaultBusinessId(userId);
  if (error) {
    return { data: null, error };
  }

  if (!businessId) {
    return {
      data: null,
      error: {
        code: 'not-found',
        message: 'No business is associated with this account yet.',
      },
    };
  }

  const businessResult = await getDocument('businesses', businessId);
  if (businessResult.error) {
    return { data: null, error: businessResult.error };
  }

  return {
    data: {
      businessId,
      business: businessResult.data,
    },
    error: null,
  };
};

export const listBusinessMembers = async ({ userId, businessId = null }) => {
  if (!userId) {
    return {
      data: [],
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  let resolvedBusinessId = businessId;
  if (!resolvedBusinessId) {
    const context = await getBusinessContext(userId);
    if (context.error) {
      return { data: [], error: context.error };
    }
    resolvedBusinessId = context.data.businessId;
  }

  const collectionPath = `businessMembers/${resolvedBusinessId}/members`;
  const result = await queryDocuments(collectionPath, []);
  if (result.error) {
    return { data: [], error: result.error };
  }

  const members = [...(result.data || [])].sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (a.role !== 'owner' && b.role === 'owner') return 1;
    const aJoined = new Date(a.joinedAt || a.createdAt || 0).getTime();
    const bJoined = new Date(b.joinedAt || b.createdAt || 0).getTime();
    return bJoined - aJoined;
  });

  return { data: members, error: null };
};

export const getCurrentMemberRole = async ({ userId, businessId = null }) => {
  if (!userId) {
    return {
      role: null,
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  let resolvedBusinessId = businessId;
  if (!resolvedBusinessId) {
    const context = await getBusinessContext(userId);
    if (context.error) {
      return { role: null, error: context.error };
    }
    resolvedBusinessId = context.data.businessId;
  }

  const memberResult = await getDocument(`businessMembers/${resolvedBusinessId}/members`, userId);
  if (memberResult.error) {
    if (memberResult.error.code === 'not-found') {
      return { role: null, error: null };
    }
    return { role: null, error: memberResult.error };
  }

  return { role: memberResult.data?.role || null, error: null };
};

export const createInviteCode = async ({ userId, businessId = null, role = 'staff', ttlHours = 72 }) => {
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  let resolvedBusinessId = businessId;
  if (!resolvedBusinessId) {
    const context = await getBusinessContext(userId);
    if (context.error) {
      return { data: null, error: context.error };
    }
    resolvedBusinessId = context.data.businessId;
  }

  const now = Date.now();
  const expiresAt = new Date(now + Math.max(1, ttlHours) * 60 * 60 * 1000).toISOString();
  const code = getInviteCode();
  const inviteId = `${Date.now()}-${code.toLowerCase()}`;
  const collectionPath = `businessMembers/${resolvedBusinessId}/inviteCodes`;

  const payload = {
    businessId: resolvedBusinessId,
    code,
    role,
    status: 'active',
    createdBy: userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  const result = await createDocument(collectionPath, payload, inviteId);
  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      id: result.id,
      ...payload,
    },
    error: null,
  };
};

export default {
  getBusinessContext,
  listBusinessMembers,
  createInviteCode,
  getCurrentMemberRole,
};
