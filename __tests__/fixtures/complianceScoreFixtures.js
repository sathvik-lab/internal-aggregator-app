/** Minimal shapes for `calculateComplianceScore` tests */

export const fiveItemChecklistAllComplete = [
  { id: '1', completed: true },
  { id: '2', completed: true },
  { id: '3', completed: true },
  { id: '4', completed: true },
  { id: '5', completed: true },
];

export const fiveItemChecklistHalfComplete = [
  { id: '1', completed: true },
  { id: '2', completed: true },
  { id: '3', completed: false },
  { id: '4', completed: false },
  { id: '5', completed: false },
];

export const completeOwnerBusinessProfile = {
  location: { state: 'CA', city: 'Oakland' },
  foodTypes: ['Mexican'],
  complianceAreas: ['Health'],
};
