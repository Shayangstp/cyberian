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
  expectNoPublicPiiAt(value);
}

function expectNoPublicPiiAt(value: unknown, key = ''): void {
  if (Array.isArray(value)) return void value.forEach(expectNoPublicPii);
  if (typeof value === 'string') {
    if (key === 'id' || key === 'linkedinurl') return;
    expect(value).not.toMatch(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    expect(value).not.toMatch(/(?:^|\D)(?:\+?\d[\s().-]*){7,15}(?:$|\D)/);
    expect(value).not.toMatch(
      /\b\d{1,6}\s+[^,;]+\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?)\b/i,
    );
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    expect(forbiddenKeys).not.toContain(key.toLowerCase());
    expectNoPublicPiiAt(child, key.toLowerCase());
  }
}
