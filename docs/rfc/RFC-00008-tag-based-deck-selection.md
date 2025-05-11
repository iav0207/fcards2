# RFC-00008: Tag-Based Deck Selection

## Summary

Implement a tag-based deck selection system that allows users to filter flashcards by tags when creating a practice session. This feature will enable more focused practice by letting users select specific categories of cards to include in their sessions.

## Motivation

Currently, the application creates practice sessions by selecting random cards from the entire database, filtered only by language. However, users often organize their cards into categories using tags (e.g., "food", "travel", "grammar"). This enhancement will allow users to practice specific topics by selecting which tags to include in their session, creating a more focused learning experience.

Benefits include:
- More targeted practice sessions based on specific topics
- Better organization of learning material
- Enhanced user control over their learning journey
- More efficient learning by focusing on related vocabulary or concepts

## Detailed Design

### Tag Selection Interface

We'll extend the session setup screen to include a tag selection interface with the following components:

1. **Tag Selection Area**: Displayed after language selection and card count, but before the start button in the existing session setup screen
   - The area will be a fully accessible, keyboard-navigable, collapsible component labeled "Select Card Categories (Tags)"
   - The component will be collapsed by default to maintain a clean interface
   - When expanded, it will show the available tags
   - **If there is only one tag (or no tags) for the currently selected language pair, the tag selection area will not be shown** as it would provide no filtering benefit
   - When collapsed, the header will show a summary of selected tags (e.g., "5/12 tags selected")

2. **Tag Cloud/Grid**: When expanded, displays all available tags **specific to the selected language pair**
   - Only tags present on cards that match the current source language will be shown
   - Each tag is presented as a toggle button with the tag name and count (e.g., "Food (12)")
   - Tags will have clear visual states for selected/unselected
   - **An additional toggle button "Untagged cards (X)" will be included to represent cards without any tags**
   - Tags with no cards in the selected source language are not displayed
   - The tag cloud will update dynamically when the user changes the source language
   - Tags are arranged in a grid/flow layout for efficient use of space
   - Tags are sorted alphabetically, with the "Untagged cards" option at the bottom

3. **Selection Controls**:
   - "Select All" button (default state)
   - "Deselect All" button
   - These controls will be properly keyboard-accessible

4. **Visual Design**:
   - The tag cloud will use a grid or flex layout to fit multiple tags per row when space allows
   - Selected tags will have a visual indicator (different background color, border, etc.)
   - High contrast states for selected/unselected tags for better accessibility
   - The number of selected tags will be shown in the component header (e.g., "Select Card Categories (5/12 tags selected)")
   - Focus indicators will be clearly visible for keyboard navigation

5. **Accessibility Features**:
   - Full keyboard navigation support (Tab to cycle through tags, Space/Enter to toggle selection)
   - ARIA roles and states for screen reader compatibility
   - Focus management for keyboard users
   - Proper tab order that allows skipping the tag selection entirely if desired
   - Support for keyboard shortcuts to expand/collapse the tag area

### User Flow

1. User navigates to session setup screen
2. User selects source and target languages and card count (existing functionality)
3. By default, all tags for the selected source language (including the "Untagged cards" option) are pre-selected
4. User can expand the tag selection accordion if they want to customize their session
5. User selects/deselects tags according to their preference
6. User clicks "Start Session" to begin practice with the filtered card set
7. If no options are selected, a warning is shown, and the Start button is disabled

### Data Flow and Backend Changes

1. **Language-Specific Tag Retrieval**:
   - When the user selects a source language, the application will query the database for all tags used on cards with that source language
   - The tag selection interface will be populated with only these relevant tags
   - A count of untagged cards (cards with empty tags array) will be determined and included as a special selection option
   - If the user changes the source language, the tag list will be refreshed accordingly
   - If there is only one tag (or no tags) for the selected language, the tag selection section will be hidden

2. **Modified Session Creation**:
   - The `createSession` method in SessionService will be extended to accept a `tags` parameter and an `includeUntagged` boolean parameter
   - If tags are provided, cards will be filtered to include only those with at least one matching tag
   - If `includeUntagged` is true, cards with no tags will also be included
   - If no tags are specified (or empty array) and `includeUntagged` is false, all cards for the language will be included (current behavior)

3. **Database Query Extension**:
   - The `getAllFlashCards` method in DatabaseService already supports tag filtering, but will be enhanced to support multiple tags with an OR condition
   - Query will be modified to select cards that have at least one of the selected tags
   - An additional condition will be added to include untagged cards when requested

4. **Tag Availability Check**:
   - A new method `getAvailableTags(sourceLanguage)` will be added to DatabaseService to retrieve all tags with counts for the given source language
   - This method will also return the count of untagged cards in a special format
   - This will populate the tag selection interface with only relevant tags

### Tab Order

The tab order will be designed to prioritize the main flow:
1. Source Language dropdown
2. Target Language dropdown
3. Card Count input
4. Start Session button
5. Tag selection accordion (when expanded)
6. Individual tag checkboxes

This ensures users can quickly navigate through the main options without having to tab through all tag checkboxes.

## Implementation Strategy

### Phase 1: Backend Changes

1. Modify DatabaseService:
   - Add `getAvailableTags(sourceLanguage)` method to retrieve tags with counts for a specified source language, including count of untagged cards
   - Enhance `getAllFlashCards` method to support filtering by multiple tags (OR condition) and a special case for untagged cards
   - Implement a query to count cards with empty tags array for a given language

2. Modify SessionService:
   - Update `createSession` to accept and process a `tags` parameter and `includeUntagged` parameter
   - Implement tag-based card selection logic
   - Ensure language-specific tag filtering
   - Add special handling for untagged cards

### Phase 2: Frontend Changes

1. Update session setup screen:
   - Add accessible, keyboard-navigable collapsible component for tag selection (hidden when there's only one or no tags)
   - Implement tag cloud/grid with toggle buttons, including special "Untagged cards" option
   - Add keyboard-accessible Select All/Deselect All controls
   - Update UI to show selected tag count in both expanded and collapsed states
   - Add event listeners to update tag list when source language changes
   - Implement proper focus management and keyboard navigation
   - Add appropriate ARIA attributes for screen reader support

2. Update preload.js and IPC handlers:
   - Add handler for retrieving available tags by source language
   - Extend session creation handler to pass tag filters and untagged flag

### Phase 3: Testing and Refinement

1. Add tests for new functionality:
   - Language-specific tag retrieval, including untagged counts
   - Multiple tag filtering with and without untagged cards
   - Session creation with tag filters
   - Language change behavior
   - UI hiding behavior when there's only one tag

2. Add sample cards with various tags and some without tags for testing

## Compatibility

This change extends the existing session creation flow without breaking backward compatibility. The default behavior (all tags selected) maintains the current functionality.

## Alternatives Considered

1. **Category-based organization instead of tags**: Using fixed categories would be more structured but less flexible than the tag system. Since the tag system is already implemented, extending it is more efficient.

2. **Advanced filtering (AND vs OR logic)**: We could implement more complex filtering (require cards to have ALL selected tags instead of ANY). This would add complexity to both the UI and backend logic, and the current OR approach is more intuitive for most users.

3. **Separate deck management**: Instead of dynamic tag filtering, we could have users create and manage named decks. This would add significant complexity and overhead compared to leveraging the existing tag system.

4. **Global tag list regardless of language**: We could show all tags in the system regardless of the selected language. This would be simpler to implement but would confuse users by showing tags that won't produce any cards for their selected language.

5. **Not treating untagged cards as a separate category**: We could simply exclude untagged cards from tag-based filtering. However, this would make it impossible to practice specifically with untagged cards, which would be a limitation.

## Test Plan

1. **Unit Tests**:
   - Test `getAvailableTags` method returns correct tags and counts for specific languages, including untagged cards
   - Test `getAllFlashCards` with multiple tag filters, with and without untagged cards
   - Test `createSession` with various tag combinations
   - Test tag list updates when language selection changes
   - Test hiding the tag selection UI when there's only one tag

2. **Integration Tests**:
   - Test the full flow from UI selection to session creation
   - Verify correct cards are included based on tag selection
   - Verify tags are correctly filtered when switching languages
   - Verify untagged cards are properly included/excluded based on selection

3. **Manual Testing**:
   - Verify keyboard navigation works as expected (tab order, focus management)
   - Test keyboard interaction (Space/Enter to toggle tags, expand/collapse)
   - Verify accessible states are correctly conveyed to screen readers
   - Verify collapsible component behavior and state retention
   - Test with various tag selections using both mouse and keyboard
   - Test with different language combinations
   - Test selection of untagged cards only
   - Test selection of both tagged and untagged cards
   - Verify the behavior when no tags are selected
   - Verify the tag selection UI is hidden when there's only one tag in the language
   - Test accessibility across different screen sizes and zoom levels

## Implementation Timeline

1. Backend changes (2 days)
2. Frontend implementation (3 days)
3. Testing and refinement (1 day)

Total: Approximately 6 days

## Future Extensions

1. Support for more advanced filtering options (AND logic, exclusion filters)
2. Saved filter presets for quick session creation
3. Statistics showing performance by tag category
4. Tag management interface for adding, renaming, and merging tags
5. Visual tagging interface for organizing untagged cards