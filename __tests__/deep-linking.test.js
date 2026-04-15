import { getStateFromPath } from '@react-navigation/native';
import { createAppLinking, DEEP_LINKING_CONFIG } from '../src/navigation/navigationConfig';

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

describe('deep linking', () => {
  it('maps readiness path to InspectionReadiness route', () => {
    const state = getStateFromPath('/readiness', DEEP_LINKING_CONFIG.config);
    const routeNames = flattenRouteNames(state);

    expect(routeNames).toContain('InspectionReadiness');
  });

  it('maps login/dashboard/documents list paths', () => {
    const loginState = getStateFromPath('/login', DEEP_LINKING_CONFIG.config);
    const dashboardState = getStateFromPath('/dashboard', DEEP_LINKING_CONFIG.config);
    const documentsListState = getStateFromPath('/documents/list', DEEP_LINKING_CONFIG.config);

    expect(flattenRouteNames(loginState)).toContain('Login');
    expect(flattenRouteNames(dashboardState)).toContain('Dashboard');
    expect(flattenRouteNames(documentsListState)).toContain('DocumentsList');
  });

  it('maps phone-login and documents/detail', () => {
    const phoneState = getStateFromPath('phone-login', DEEP_LINKING_CONFIG.config);
    const detailState = getStateFromPath('documents/detail/doc-123', DEEP_LINKING_CONFIG.config);
    expect(flattenRouteNames(phoneState)).toContain('PhoneLogin');
    expect(flattenRouteNames(detailState)).toContain('DocumentDetail');
  });

  it('createAppLinking sends unknown paths to Dashboard when signed in', () => {
    const linking = createAppLinking({ user: { uid: 'u1' }, needsOwnerOnboarding: false });
    const state = linking.getStateFromPath('totally/unknown', DEEP_LINKING_CONFIG.config);
    expect(flattenRouteNames(state)).toContain('Dashboard');
  });

  it('createAppLinking sends unknown paths to Login when signed out', () => {
    const linking = createAppLinking({ user: null, needsOwnerOnboarding: false });
    const state = linking.getStateFromPath('totally/unknown', DEEP_LINKING_CONFIG.config);
    expect(flattenRouteNames(state)).toContain('Login');
  });
});
