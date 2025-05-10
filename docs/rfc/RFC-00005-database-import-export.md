# RFC-00005: Database Import/Export Functionality

## Summary

This RFC proposes implementing import/export functionality for the FlashCards application, allowing users to backup their data, transfer it between devices, and share card collections with other users. The implementation will build on the existing DatabaseService to add user-friendly export and import capabilities.

## Motivation

Users need the ability to:
1. Back up their data to prevent loss
2. Transfer their flashcards and progress between different devices
3. Share collections of cards with other users for collaborative learning
4. Restore from backups in case of database corruption or system failures

This feature enhances data portability and adds significant value to the user experience by addressing these key needs.

## Detailed Design

### File Format

The export will use a standard JSON format with a defined schema for compatibility:

```json
{
  "version": "1.0",
  "exportDate": "2023-05-10T12:34:56.789Z",
  "appInfo": {
    "name": "FlashCards Desktop",
    "version": "0.1.0"
  },
  "data": {
    "flashcards": [...],
    "sessions": [...],
    "settings": {...}
  }
}
```

### Core Components

#### 1. Export Functionality

The export functionality will:
- Retrieve all database content using the existing `exportData()` method in DatabaseService
- Add metadata (version, export date, app info)
- Save to a user-specified location as a JSON file
- Support selective exports (all data, flashcards only, specific tags)

#### 2. Import Functionality

The import functionality will:
- Open and validate a previously exported JSON file
- Present the user with import options (merge or replace)
- Handle version differences for forward/backward compatibility
- Import the data using the existing `importData()` method in DatabaseService
- Provide user feedback on the import results

#### 3. UI Components

The UI will include:
- Export button in the settings screen
- Import button in the settings screen
- Import dialog with options (merge/replace)
- Success/error feedback
- Progress indicator for large imports/exports

### Database Service Enhancements

The existing DatabaseService already has the core `importData()` and `exportData()` methods, but we'll extend them with additional features:

```javascript
// New selective export method
exportDataWithOptions(options = {}) {
  // Filter by various criteria (date range, tags, card types)
  // Returns filtered data for export
}

// Enhanced import method with merge options
importDataWithOptions(data, options = {}) {
  // Handle merging vs. replacing
  // Conflict resolution for duplicate entries
  // Returns detailed import results
}
```

### IPC Communication

Add new IPC handlers for the renderer process to trigger imports and exports:

```javascript
// In main.js or preload.js
ipcMain.handle('export-data', async (event, options) => {
  const data = dbService.exportDataWithOptions(options);
  const savePath = await showSaveDialog();
  if (savePath) {
    await fs.promises.writeFile(savePath, JSON.stringify(data, null, 2));
    return { success: true, path: savePath };
  }
  return { success: false };
});

ipcMain.handle('import-data', async (event, options) => {
  const openPath = await showOpenDialog();
  if (openPath) {
    const fileData = await fs.promises.readFile(openPath, 'utf-8');
    const data = JSON.parse(fileData);
    return dbService.importDataWithOptions(data, options);
  }
  return { success: false };
});
```

### UI Flow

#### Export Flow

1. User clicks "Export" in the settings
2. User is presented with export options (all data, flashcards only, etc.)
3. System shows save dialog for file location
4. User selects location and filename
5. Export processes and saves the file
6. User receives confirmation

#### Import Flow

1. User clicks "Import" in the settings
2. User is presented with a file open dialog
3. User selects the import file
4. System validates the file format
5. User is presented with import options (merge/replace)
6. Import processes with progress indication
7. User receives success/error feedback with details

## Implementation Strategy

1. **Phase 1: Core Import/Export**
   - Enhance DatabaseService with selective export and merge import
   - Add file dialog handling
   - Implement basic IPC handlers

2. **Phase 2: UI Integration**
   - Add import/export buttons to settings screen
   - Create import options dialog
   - Implement progress indicators

3. **Phase 3: Advanced Features**
   - Add selective export by tags, date ranges
   - Add conflict resolution options
   - Implement validation and error handling

## Test Plan

1. **Unit Testing**
   - Tests for the enhanced DatabaseService methods
   - Validation of export format
   - Import conflict resolution

2. **Integration Testing**
   - End-to-end tests for export and import flows
   - Test with various data combinations
   - Test merge vs. replace scenarios

3. **Edge Cases**
   - Empty database exports
   - Corrupt import files
   - Version compatibility
   - Very large datasets

## Alternatives Considered

### Alternative File Formats

We considered several file formats:
- **JSON** (chosen): Human-readable, standard, easy to process
- **SQLite file**: Direct database copy, but less portable and more prone to compatibility issues
- **CSV**: Simple for flashcards only, but difficult for relational data like sessions
- **Custom binary format**: Better space efficiency but added complexity and less transparency

### Cloud Sync vs. File-Based Import/Export

We considered cloud synchronization but chose file-based import/export because:
- Simpler implementation for our first release
- No dependency on external services
- Privacy-focused approach with user control
- Cloud sync can be added in a future update without disrupting this functionality

### Database Reset Options

We considered adding a full database reset feature alongside import/export but decided to:
- Include this as part of the import flow with a "replace" option
- Add a separate database management feature in a future update for more granular control

## Security Considerations

1. The import/export feature has potential security implications:
   - Exported files may contain sensitive user data (API keys in settings)
   - Malicious import files could potentially corrupt the database

2. Mitigations:
   - Exclude sensitive data like API keys during export by default
   - Add strong validation of import files before processing
   - Implement a backup before import to allow recovery
   - Add integrity checks to ensure data consistency