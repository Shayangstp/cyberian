export type PublicFieldKind =
  | 'name'
  | 'job_title'
  | 'company'
  | 'country'
  | 'location'
  | 'summary'
  | 'industry'
  | 'skill';

export type PublicValueIssue =
  | 'structured_value'
  | 'email'
  | 'telephone'
  | 'url'
  | 'date'
  | 'company_size'
  | 'street_address'
  | 'coordinates'
  | 'postal_code'
  | 'country_name'
  | 'birth_information'
  | 'private_social_identifier';

export function publicValueIssue(
  value: string,
  field: PublicFieldKind,
): PublicValueIssue | null {
  const text = value.trim();
  if (isStructured(text)) return 'structured_value';
  if (isEmail(text)) return 'email';
  if (isTelephone(text)) return 'telephone';
  if (isBirthInformation(text)) return 'birth_information';
  if (isPrivateSocialIdentifier(text)) return 'private_social_identifier';
  if (isUrl(text)) return 'url';
  if (
    ['job_title', 'company', 'country', 'location', 'name'].includes(field) &&
    isDateLike(text)
  )
    return 'date';
  if ((field === 'job_title' || field === 'company') && isCompanySize(text))
    return 'company_size';
  if (
    ['company', 'country', 'location'].includes(field) &&
    isStreetAddress(text)
  )
    return 'street_address';
  if ((field === 'country' || field === 'location') && isCoordinates(text))
    return 'coordinates';
  if (field === 'country' && isPostalCode(text)) return 'postal_code';
  if (
    (field === 'job_title' || field === 'company' || field === 'skill') &&
    isCountryName(text)
  )
    return 'country_name';
  if (
    (field === 'summary' ||
      field === 'industry' ||
      field === 'name' ||
      field === 'skill') &&
    isStreetAddress(text)
  )
    return 'street_address';
  return null;
}

export function hasPossiblePii(value: string): boolean {
  return (
    isEmail(value) ||
    isTelephone(value) ||
    isStreetAddress(value) ||
    isBirthInformation(value) ||
    isPrivateSocialIdentifier(value)
  );
}

export function isCountryName(value: string): boolean {
  return COUNTRY_NAMES.has(normalize(value));
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z]/g, '');
}

function isStructured(value: string): boolean {
  return (
    /^(?:\[|\{)/.test(value) ||
    /(?:'|")?(?:school|education|experience)(?:'|")?\s*:/i.test(value)
  );
}

function isEmail(value: string): boolean {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);
}

function isTelephone(value: string): boolean {
  return /(?:^|\D)(?:\+?\d[\s().-]*){7,15}(?:$|\D)/.test(value);
}

function isUrl(value: string): boolean {
  return /(?:https?:\/\/|www\.)/i.test(value);
}

function isDateLike(value: string): boolean {
  return /^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[T\s].*)?$/.test(value);
}

function isCompanySize(value: string): boolean {
  return /^(?:\d+[\s]*(?:-|–|to)[\s]*\d+|\d+\+)\s*(?:employees?)?$/i.test(
    value,
  );
}

function isStreetAddress(value: string): boolean {
  return /\b\d{1,6}\s+[^,;]+\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|parkway|pkwy\.?)\b/i.test(
    value,
  );
}

function isCoordinates(value: string): boolean {
  return /^[-+]?\d{1,3}(?:\.\d+)?\s*,\s*[-+]?\d{1,3}(?:\.\d+)?$/.test(value);
}

function isPostalCode(value: string): boolean {
  return /^\d{5}(?:-\d{4})?$/.test(value);
}

function isBirthInformation(value: string): boolean {
  return (
    /\b(?:born|birth(?:day|date|year)?|date of birth|dob)\b\s*[:=-]?\s*(?:\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/i.test(
      value,
    ) || /\b(?:19|20)\d{2}\s+(?:birth|born)\b/i.test(value)
  );
}

function isPrivateSocialIdentifier(value: string): boolean {
  return /\b(?:facebook|twitter|github)\s*(?:id|identifier|username|handle)?\s*[:=@]\s*[a-z0-9_.-]+/i.test(
    value,
  );
}

const COUNTRY_NAMES = buildCountryNames();

function buildCountryNames(): Set<string> {
  const names = [
    'united states',
    'united states of america',
    'usa',
    'canada',
    'mexico',
    'united kingdom',
    'great britain',
    'england',
    'scotland',
    'wales',
    'ireland',
    'france',
    'germany',
    'spain',
    'italy',
    'portugal',
    'netherlands',
    'belgium',
    'switzerland',
    'austria',
    'sweden',
    'norway',
    'denmark',
    'finland',
    'poland',
    'india',
    'china',
    'japan',
    'south korea',
    'singapore',
    'australia',
    'new zealand',
    'brazil',
    'argentina',
    'south africa',
    'israel',
    'united arab emirates',
  ];
  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const name = displayNames.of(code);
      if (name && name !== code) names.push(name);
    }
  }
  return new Set(names.map(normalize));
}
