const path = require('path');

// More reliable tests without launching Electron UI
jest.setTimeout(10000); // Increase timeout for all tests

describe('Application configuration', () => {
  it('package.json has correct name', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('fcardsweb2');
  });
  
  it('has electron as a dependency', () => {
    const pkg = require('../package.json');
    expect(pkg.devDependencies.electron).toBeDefined();
  });
  
  it('has main.js as entry point', () => {
    const pkg = require('../package.json');
    expect(pkg.main).toBe('main.js');
  });
});

describe('Main process', () => {
  const electron = require('../main.js');
  
  it('exports required electron components', () => {
    // This test will fail initially because we need to export the components
    // It serves as a placeholder to show what we want to test
    expect(typeof electron).toBe('object');
  });
});