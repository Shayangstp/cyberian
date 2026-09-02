const forbiddenKeys = new Set([
  'phone',
  'mobile',
  'email',
  'address',
  'street',
  'postalcode',
  'birthdate',
  'birthyear',
  'birthinfo',
  'dateofbirth',
  'facebook',
  'twitter',
  'github',
  'sourcekey',
  'linkedinid',
  'linkedininternalid',
  '_source',
  '_index',
  '_score',
]);

export function expectNoPublicPii(value: unknown): void {
  if (Array.isArray(value)) return void value.forEach(expectNoPublicPii);
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    expect(forbiddenKeys).not.toContain(key.toLowerCase());
    expectNoPublicPii(child);
  }
}
