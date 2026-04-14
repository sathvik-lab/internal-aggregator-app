import { getStateFromPath } from '@react-navigation/native';
import { DEEP_LINKING_CONFIG } from '../src/navigation/navigationConfig';

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
});
