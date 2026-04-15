import { USER_ROLES } from '../src/constants/constants';
import { shouldShowOwnerOnboarding } from '../src/services/userProfile';
import { completeOwnerBusinessProfile } from './fixtures/complianceScoreFixtures';

jest.mock('../src/services/firestore', () => ({
  createDocument: jest.fn(),
  getDocument: jest.fn(),
  updateDocument: jest.fn(),
}));

describe('shouldShowOwnerOnboarding', () => {
  const ownerUser = { uid: 'owner-1', email: 'o@example.com' };

  it('returns false when no user', () => {
    expect(shouldShowOwnerOnboarding(null, null)).toBe(false);
    expect(shouldShowOwnerOnboarding(undefined, {})).toBe(false);
  });

  it('returns true for owner with missing business profile', () => {
    expect(shouldShowOwnerOnboarding(ownerUser, { role: USER_ROLES.OWNER })).toBe(true);
    expect(shouldShowOwnerOnboarding(ownerUser, { role: USER_ROLES.OWNER, businessProfile: null })).toBe(
      true,
    );
  });

  it('returns true for owner with incomplete profile (no food types)', () => {
    expect(
      shouldShowOwnerOnboarding(ownerUser, {
        role: USER_ROLES.OWNER,
        businessProfile: {
          location: { state: 'CA', city: 'X' },
          foodTypes: [],
          complianceAreas: ['Health'],
        },
      }),
    ).toBe(true);
  });

  it('returns false for owner with complete business profile', () => {
    expect(
      shouldShowOwnerOnboarding(ownerUser, {
        role: USER_ROLES.OWNER,
        businessProfile: completeOwnerBusinessProfile,
      }),
    ).toBe(false);
  });

  it('treats missing role as owner (backward compatible)', () => {
    expect(
      shouldShowOwnerOnboarding(ownerUser, {
        businessProfile: completeOwnerBusinessProfile,
      }),
    ).toBe(false);
    expect(
      shouldShowOwnerOnboarding(ownerUser, {
        businessProfile: null,
      }),
    ).toBe(true);
  });

  it('returns false for staff even if profile incomplete', () => {
    expect(
      shouldShowOwnerOnboarding(ownerUser, {
        role: USER_ROLES.STAFF,
        businessProfile: null,
      }),
    ).toBe(false);
  });
});
