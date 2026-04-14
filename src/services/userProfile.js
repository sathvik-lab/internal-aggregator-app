import { createDocument, getDocument, updateDocument } from './firestore';
import { USER_ROLES } from '../constants/constants';

const getStringValue = (value) => (typeof value === 'string' ? value.trim() : '');

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
      },
      userId
    );

    return createResult.error ? { error: createResult.error } : { error: null };
  }

  const updateResult = await updateDocument('users', userId, {
    businessProfile: normalizedProfile,
  });

  return updateResult.error ? { error: updateResult.error } : { error: null };
};

export const shouldShowOwnerOnboarding = (user, userProfile) => {
  if (!user?.uid) {
    return false;
  }

  const role = userProfile?.role;
  const isOwner = !role || role === USER_ROLES.OWNER;

  return isOwner && !isBusinessProfileComplete(userProfile?.businessProfile);
};

