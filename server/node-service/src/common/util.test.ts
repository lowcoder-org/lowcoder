import { specsToOptions, version2spec } from "./util";

describe('version2spec', () => {
  test('should return the spec for the given version', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, 'v2')).toBe('spec for version 2');
  });

  test('should return the first spec if version is undefined', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, undefined)).toBe('spec for version 1');
  });

  test('should return the first spec if version is an empty string', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, "")).toBe('spec for version 1');
  });

  test('should return undefined if specs is an empty object and version is undefined', () => {
    const specs = {};

    expect(version2spec(specs, undefined)).toBeUndefined();
  });

  test('should return undefined if specs is an empty object and version is an empty string', () => {
    const specs = {};

    expect(version2spec(specs, "")).toBeUndefined();
  });

  test('should return undefined if the specified version does not exist in specs', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, 'v4')).toBeUndefined();
  });
});

describe('specsToOptions', () => {
  test('should convert specs object to options array', () => {
    const specs = {
      color: 'red',
      size: 'large',
      weight: 'light'
    };

    const expectedOptions = [
      { value: 'color', label: 'color' },
      { value: 'size', label: 'size' },
      { value: 'weight', label: 'weight' }
    ];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });

  test('should return an empty array if specs object is empty', () => {
    const specs = {};
    const expectedOptions: any[] = [];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });

  test('should handle specs object with non-string values', () => {
    const specs = {
      color: 'red',
      size: 42,
      available: true
    };

    const expectedOptions = [
      { value: 'color', label: 'color' },
      { value: 'size', label: 'size' },
      { value: 'available', label: 'available' }
    ];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });

  test('should handle specs object with numeric keys', () => {
    const specs = {
      1: 'one',
      2: 'two',
      3: 'three'
    };

    const expectedOptions = [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' }
    ];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });
});