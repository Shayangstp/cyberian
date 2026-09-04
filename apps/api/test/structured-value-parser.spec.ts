import { parseStructuredValue } from '../src/data/structured-value-parser';

describe('parseStructuredValue', () => {
  it.each([
    [
      'strict JSON',
      '{"name":"Example","active":true}',
      { name: 'Example', active: true },
    ],
    ['JSON5 single quotes', "{'name':'Example'}", { name: 'Example' }],
    ['trailing commas', "['one', 'two',]", ['one', 'two']],
    ['Python None', "{'value':None}", { value: null }],
    ['Python True', "{'value':True}", { value: true }],
    ['Python False', "{'value':False}", { value: false }],
    [
      'nested arrays and objects',
      "[{'values':[None, True, {'enabled':False}]}]",
      [{ values: [null, true, { enabled: false }] }],
    ],
    [
      'escaped apostrophes',
      "{'description':'It\\'s None'}",
      { description: "It's None" },
    ],
    [
      'escaped double quotes',
      '{"description":"A \\"True\\" story"}',
      { description: 'A "True" story' },
    ],
  ])('parses %s', (_description, value, expected) => {
    expect(parseStructuredValue(value)).toEqual({
      success: true,
      value: expected,
    });
  });

  it('does not transform text inside strings or identifiers', () => {
    const result = parseStructuredValue(
      "{'none':'None','description':'True story','identifier':'NoneType'}",
    );

    expect(result).toEqual({
      success: true,
      value: {
        none: 'None',
        description: 'True story',
        identifier: 'NoneType',
      },
    });
  });

  it('returns failure for malformed or executable-looking input without executing it', () => {
    expect(parseStructuredValue("{'value':None")).toEqual({ success: false });
    expect(parseStructuredValue('process.exit(1)')).toEqual({ success: false });
  });
});
