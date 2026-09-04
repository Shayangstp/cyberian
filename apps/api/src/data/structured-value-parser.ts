import JSON5 from 'json5';

export type StructuredValueParseResult =
  { success: true; value: unknown } | { success: false };

/**
 * Parses JSON, JSON5, and the limited Python-literal variants present in the
 * source dataset. This intentionally does not evaluate or otherwise execute
 * source content.
 */
export function parseStructuredValue(
  value: string,
): StructuredValueParseResult {
  try {
    return { success: true, value: JSON.parse(value) as unknown };
  } catch {
    try {
      return { success: true, value: JSON5.parse(value) };
    } catch {
      try {
        return {
          success: true,
          value: JSON5.parse(convertPythonLiteralTokens(value)),
        };
      } catch {
        return { success: false };
      }
    }
  }
}

function convertPythonLiteralTokens(value: string): string {
  let converted = '';
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < value.length;) {
    const character = value[index];
    if (character === undefined) {
      break;
    }

    if (quote) {
      converted += character;
      if (character === '\\') {
        const escapedCharacter = value[index + 1];
        if (escapedCharacter !== undefined) {
          converted += escapedCharacter;
          index += 2;
          continue;
        }
      } else if (character === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      converted += character;
      index += 1;
      continue;
    }

    if (isIdentifierCharacter(character)) {
      let end = index + 1;
      while (end < value.length) {
        const nextCharacter = value[end];
        if (!nextCharacter || !isIdentifierCharacter(nextCharacter)) {
          break;
        }
        end += 1;
      }
      const token = value.slice(index, end);
      converted += pythonLiteralReplacement(token) ?? token;
      index = end;
      continue;
    }

    converted += character;
    index += 1;
  }

  return converted;
}

function isIdentifierCharacter(character: string): boolean {
  return /[A-Za-z0-9_$]/.test(character);
}

function pythonLiteralReplacement(token: string): string | null {
  switch (token) {
    case 'None':
      return 'null';
    case 'True':
      return 'true';
    case 'False':
      return 'false';
    default:
      return null;
  }
}
