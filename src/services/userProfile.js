import { createDocument, getDocument, updateDocument } from './firestore';
import { USER_ROLES } from '../constants/constants';

const getStringValue = (value) => (typeof value === 'string' ? value.trim() : '');
const toSlug = (value) => (
  getStringValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
};

export const normalizeBusinessProfile = (profile = {}) => {
  const normalizedState = getStringValue(profile.location?.state || profile.state).toUpperCase();
  const normalizedCity = getStringValue(profile.location?.city || profile.city);

  return {
    truckType: profile.truckType || null,
    location: {
      state: normalizedState || '',
      city: normalizedCity || null,
    },
    foodTypes: normalizeStringArray(profile.foodTypes),
    businessType: profile.businessType || null,
    complianceAreas: normalizeStringArray(profile.complianceAreas),
    lastTemplateSync: profile.lastTemplateSync || null,
  };
};

export const isBusinessProfileComplete = (profile = null) => {
  if (!profile) {
    return false;
  }

  const normalizedProfile = normalizeBusinessProfile(profile);

  return (
    normalizedProfile.location.state.length === 2 &&
    normalizedProfile.foodTypes.length > 0 &&
    normalizedProfile.complianceAreas.length > 0
  );
};

export const getUserProfileDocument = async (userId) => {
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  return getDocument('users', userId);
};

export const getDefaultBusinessId = async (userId) => {
  const result = await getUserProfileDocument(userId);
  if (result.error) {
    return { businessId: null, error: result.error };
  }
  return { businessId: result.data?.defaultBusinessId || null, error: null };
};

export const createBusinessForOwner = async ({ user, businessProfile = {}, businessName = null }) => {
  const userId = user?.uid;
  if (!userId) {
    return {
      businessId: null,
      error: {
        code: 'auth/unauthenticated',
        message: 'You must be signed in to create a business.',
      },
    };
  }

  const existingResult = await getUserProfileDocument(userId);
  if (existingResult.error && existingResult.error.code !== 'not-found') {
    return { businessId: null, error: existingResult.error };
  }

  const existingBusinessId = existingResult.data?.defaultBusinessId || null;
  if (existingBusinessId) {
    return { businessId: existingBusinessId, error: null };
  }

  const normalizedProfile = normalizeBusinessProfile(businessProfile);
  const nowIso = new Date().toISOString();
  const slugBase = toSlug(businessName || user?.displayName || 'food-truck');
  const slug = `${slugBase || 'food-truck'}-${userId.slice(0, 6)}`;

  const businessPayload = {
    name: businessName || user?.displayName || 'My Food Truck',
    owner: userId,
    state: normalizedProfile.location.state || '',
    businessType: normalizedProfile.businessType || null,
    foodTypes: normalizedProfile.foodTypes || [],
    slug,
    publicProfileEnabled: false,
    publicScoreEnabled: false,
    status: 'active',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const businessResult = await createDocument('businesses', businessPayload);
  if (businessResult.error || !businessResult.id) {
    return { businessId: null, error: businessResult.error || { code: 'internal', message: 'Failed to create business.' } };
  }

  const businessId = businessResult.id;
  const memberPath = `businessMembers/${businessId}/members`;
  const memberResult = await createDocument(
    memberPath,
    {
      role: 'owner',
      status: 'active',
      joinedAt: nowIso,
      invitedAt: null,
      invitedBy: null,
      userId,
      businessId,
    },
    userId,
  );

  if (memberResult.error) {
    return { businessId: null, error: memberResult.error };
  }

  const profileUpdateResult = await updateDocument('users', userId, {
    defaultBusinessId: businessId,
    updatedAt: nowIso,
  });

  if (profileUpdateResult.error) {
    return { businessId: null, error: profileUpdateResult.error };
  }

  return { businessId, error: null };
};

export const ensureOwnerBusinessSetup = async ({ user, businessProfile = {}, businessName = null }) => {
  const userId = user?.uid;
  if (!userId) {
    return {
      businessId: null,
      error: {
        code: 'auth/unauthenticated',
        message: 'You must be signed in to continue.',
      },
    };
  }

  const profileResult = await getUserProfileDocument(userId);
  if (profileResult.error && profileResult.error.code !== 'not-found') {
    return { businessId: null, error: profileResult.error };
  }

  if (profileResult.data?.defaultBusinessId) {
    return { businessId: profileResult.data.defaultBusinessId, error: null };
  }

  return createBusinessForOwner({ user, businessProfile, businessName });
};

export const saveBusinessProfile = async ({
  user,
  businessProfile,
}) => {
  const userId = user?.uid;

  if (!userId) {
    return {
      error: {
        code: 'auth/unauthenticated',
        message: 'You must be signed in to update your business profile.',
      },
    };
  }

  const normalizedProfile = normalizeBusinessProfile(businessProfile);
  const existingResult = await getUserProfileDocument(userId);

  if (existingResult.error && existingResult.error.code !== 'not-found') {
    return { error: existingResult.error };
  }

  if (!existingResult.data) {
    const createResult = await createDocument(
      'users',
      {
        userId,
        displayName: user.displayName || null,
        email: user.email || null,
        role: USER_ROLES.OWNER,
        businessProfile: normalizedProfile,
        defaultBusinessId: null,
        publicProfileEnabled: false,
        publicScoreEnabled: false,
      },
      userId
    );

    return createResult.error ? { error: createResult.error } : { error: null };
  }

  const updateResult = await updateDocument('users', userId, {
    businessProfile: normalizedProfile,
  });

  if (updateResult.error) {
    return { error: updateResult.error };
  }

  const businessSetupResult = await ensureOwnerBusinessSetup({
    user,
    businessProfile: normalizedProfile,
    businessName: user?.displayName || null,
  });

  return businessSetupResult.error ? { error: businessSetupResult.error } : { error: null };
};

export const shouldShowOwnerOnboarding = (user, userProfile) => {
  if (!user?.uid) {
    return false;
  }

  const role = userProfile?.role;
  const isOwner = !role || role === USER_ROLES.OWNER;

  return isOwner && !isBusinessProfileComplete(userProfile?.businessProfile);
};

export const updateUserVisibilitySettings = async (
  userId,
  { publicProfileEnabled, publicScoreEnabled } = {},
) => {
  if (!userId) {
    return {
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  const payload = {};
  if (typeof publicProfileEnabled === 'boolean') payload.publicProfileEnabled = publicProfileEnabled;
  if (typeof publicScoreEnabled === 'boolean') payload.publicScoreEnabled = publicScoreEnabled;
  if (Object.keys(payload).length === 0) {
    return { data: null, error: null };
  }
  payload.updatedAt = new Date().toISOString();
  return updateDocument('users', userId, payload);
};

export const updateBusinessVisibilitySettings = async (
  businessId,
  { publicProfileEnabled, publicScoreEnabled } = {},
) => {
  if (!businessId) {
    return {
      error: {
        code: 'invalid-argument',
        message: 'Business ID is required.',
      },
    };
  }

  const payload = {};
  if (typeof publicProfileEnabled === 'boolean') payload.publicProfileEnabled = publicProfileEnabled;
  if (typeof publicScoreEnabled === 'boolean') payload.publicScoreEnabled = publicScoreEnabled;
  if (Object.keys(payload).length === 0) {
    return { data: null, error: null };
  }
  payload.updatedAt = new Date().toISOString();
  return updateDocument('businesses', businessId, payload);
};

