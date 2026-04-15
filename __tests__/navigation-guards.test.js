import { getStateFromPath } from '@react-navigation/native';
import {
  ROUTES,
  createAppLinking,
  DEEP_LINKING_CONFIG,
  NavigationGuards,
} from '../src/navigation/navigationConfig';

const flattenRouteNames = (state) => {
  if (!state || !Array.isArray(state.routes)) return [];
  const names = [];
  state.routes.forEach((route) => {
    names.push(route.name);
    if (route.state) {
      names.push(...flattenRouteNames(route.state));
    }
  });
  return names;
};

describe('createAppLinking guard fallbacks (unknown path)', () => {
  it('sends signed-in user with onboarding needed to OwnerOnboarding', () => {
    const linking = createAppLinking({ user: { uid: 'u1' }, needsOwnerOnboarding: true });
    const state = linking.getStateFromPath('unknown/path/here', DEEP_LINKING_CONFIG.config);
    expect(flattenRouteNames(state)).toContain('OwnerOnboarding');
  });

  it('sends signed-in user without onboarding to Dashboard', () => {
    const linking = createAppLinking({ user: { uid: 'u1' }, needsOwnerOnboarding: false });
    const state = linking.getStateFromPath('unknown/path/here', DEEP_LINKING_CONFIG.config);
    expect(flattenRouteNames(state)).toContain('Dashboard');
  });

  it('sends signed-out user to Login', () => {
    const linking = createAppLinking({ user: null, needsOwnerOnboarding: false });
    const state = linking.getStateFromPath('unknown/path/here', DEEP_LINKING_CONFIG.config);
    expect(flattenRouteNames(state)).toContain('Login');
  });
});

describe('NavigationGuards', () => {
  const user = { uid: 'u1' };

  it('blocks protected main routes when logged out', () => {
    expect(NavigationGuards.canNavigateToProtectedRoute(null, ROUTES.MAIN.DASHBOARD)).toBe(false);
    expect(NavigationGuards.canNavigateToProtectedRoute(null, ROUTES.MAIN.DOCUMENTS)).toBe(false);
  });

  it('allows protected routes when logged in', () => {
    expect(NavigationGuards.canNavigateToProtectedRoute(user, ROUTES.MAIN.DASHBOARD)).toBe(true);
  });

  it('blocks auth routes when logged in', () => {
    expect(NavigationGuards.canNavigateToAuthRoute(user, ROUTES.AUTH.LOGIN)).toBe(false);
  });

  it('allows auth routes when logged out', () => {
    expect(NavigationGuards.canNavigateToAuthRoute(null, ROUTES.AUTH.LOGIN)).toBe(true);
  });
});

describe('known path still resolves (smoke)', () => {
  it('dashboard path not overridden by guard', () => {
    const state = getStateFromPath('/dashboard', DEEP_LINKING_CONFIG.config);
    expect(flattenRouteNames(state)).toContain('Dashboard');
  });
});
