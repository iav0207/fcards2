# RFC-00011: UX Improvements for FlashCards Desktop

- **Status**: Draft
- **Author**: Claude
- **Created**: 2025-05-16

## Summary

This RFC proposes several user experience (UX) improvements to enhance usability and functionality of the FlashCards Desktop application. These improvements focus on better information organization, improved interaction flow during practice sessions, and additional user controls.

## Motivation

While the current application is functional, several minor UX enhancements can significantly improve the user experience. These changes are designed to address common friction points observed during use and align with standard UX best practices. The primary motivations are:

1. Improve the organization of screen elements to prioritize important information
2. Reduce unnecessary user interactions during practice sessions
3. Provide more context for flashcards during practice
4. Give users more control over their practice sessions

## Detailed Design

The proposed improvements are:

### 1. Reorganized Home Screen Layout

**Current situation**: The App Information section (displaying Node.js, Chromium, and Electron versions) is displayed prominently near the top of the home screen, taking attention away from more user-relevant information like database statistics.

**Proposed change**: Move the App Information section to the bottom of the home screen.

**Implementation details**:
- Reorder the sections in `index.html` to place the App Information section after the Database Management section
- Add a visual divider or more subtle styling to indicate it's secondary information
- No functional changes required, only repositioning of existing elements

**Benefits**:
- Prioritizes more relevant information like database statistics and action buttons
- Creates a more logical information hierarchy on the home screen
- Follows the pattern of placing technical/version information at the bottom of interfaces

### 2. Automatic Input Focus During Practice

**Current situation**: When a new flashcard is displayed during a practice session, the translation input field is not automatically focused, requiring the user to manually click or tab to it before typing.

**Proposed change**: Automatically focus the translation input field when a new card is displayed.

**Implementation details**:
- Modify the `loadCurrentCard` method in the practice screen component to set focus to the input field
- Use a slight delay (e.g., 100ms) after showing the card to ensure proper focus timing
- Add appropriate aria-live announcements for screen reader users to notify of the focus change

```javascript
// Add to loadCurrentCard method after the card is displayed
setTimeout(() => {
  document.getElementById('translation-input').focus();
}, 100);
```

**Benefits**:
- Reduces unnecessary user interaction (clicking/tabbing)
- Creates a smoother practice flow
- Allows users to begin typing immediately
- Follows expected behavior patterns for form-based interactions

### 3. Display Card Tags During Practice

**Current situation**: When practicing, users cannot see the tags associated with the current flashcard, removing potentially useful context.

**Proposed change**: Display the current card's tags in a subtle, non-distracting way on the card.

**Implementation details**:
- Add a new UI element to the practice screen to display tags
- Position tags in the bottom-right corner of the card with small font size and subtle styling
- Ensure tags are visually distinct from the main card content (different color, font size, etc.)
- Update the card display logic to include tags from the current card

```html
<!-- Add to practice screen card template -->
<div class="card-tags">
  {{#each currentCard.card.tags}}
    <span class="card-tag">{{this}}</span>
  {{/each}}
</div>
```

**CSS styles**:
```css
.card-tags {
  position: absolute;
  bottom: 8px;
  right: 12px;
  text-align: right;
  max-width: 80%;
}

.card-tag {
  display: inline-block;
  font-size: 0.8em;
  color: rgba(144, 202, 249, 0.8);
  background: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  padding: 2px 8px;
  margin: 0 2px;
}
```

**Benefits**:
- Provides context about the card's categories
- Helps users understand why certain cards appear in their practice session
- Reinforces the relationship between content and tags
- Enables users to better understand their card organization system

### 4. Session Cancellation Option

**Current situation**: Once a practice session is started, users must complete it or close the application - there's no way to gracefully cancel an in-progress session.

**Proposed change**: Add a "Cancel Session" button to the practice screen.

**Implementation details**:
- Add a cancel button to the practice screen UI, positioned after the "Submit Answer" button in the tab order
- Style the button to be less prominent than the submit button (secondary styling)
- Add confirmation dialog to prevent accidental cancellation
- Implement the cancellation logic to properly clean up the session state

```html
<!-- Add to practice screen -->
<div class="button-container">
  <button id="submit-answer-btn" class="primary-button">Submit Answer</button>
  <button id="cancel-session-btn" class="secondary-button">Cancel Session</button>
</div>
```

```javascript
// Event handler for cancel button
document.getElementById('cancel-session-btn').addEventListener('click', () => {
  // Show confirmation dialog
  if (confirm('Are you sure you want to cancel this practice session? Your progress will not be saved.')) {
    // Reset session state
    this.state.sessionId = null;
    this.state.currentCard = null;
    // Navigate back to home screen
    this.showScreen('home');
  }
});
```

**Benefits**:
- Provides users with a graceful exit option from sessions
- Follows standard UX patterns for multi-step processes
- Reduces frustration when users accidentally start a session or need to switch activities
- Maintains proper keyboard navigation flow

## Implementation Plan

The proposed changes are relatively small and self-contained, making them suitable for parallel implementation. The suggested order is:

1. Home screen reorganization (simplest change, only affects layout)
2. Automatic input focus (small functional change)
3. Display card tags (UI addition with minor data integration)
4. Session cancellation (new feature with interaction logic)

Each change should be implemented, tested, and committed separately to maintain clear tracking of modifications.

## Compatibility

These changes are backward compatible and don't require database schema changes. They modify only the UI layer and user interactions, with no impact on data storage or core application logic.

## Testing Plan

Each improvement should be tested as follows:

1. **Home Screen Reorganization**:
   - Visual inspection on various screen sizes
   - Verify all information remains visible and accessible

2. **Automatic Input Focus**:
   - Verify focus behavior when advancing to a new card
   - Test keyboard navigation sequences
   - Verify screen reader compatibility

3. **Card Tags Display**:
   - Test with cards having various numbers of tags (0, 1, many)
   - Verify visual appearance on various screen sizes
   - Ensure tags don't interfere with card content

4. **Session Cancellation**:
   - Verify confirmation dialog appears and works as expected
   - Confirm session state is properly reset on cancellation
   - Test keyboard navigation including the new button
   - Verify the application returns to the home screen correctly

## Future Considerations

While implementing these improvements, we may identify additional UX enhancements. Some potential future improvements to consider:

1. Keyboard shortcuts for common actions
2. Progress persistence (ability to resume interrupted sessions)
3. Session history and analytics
4. More detailed card statistics display

## Alternatives Considered

### Alternative for Card Tags Display

Instead of showing tags directly on the card, we considered adding them to a separate information panel. However, this would require additional UI elements and screen space, and might distract from the primary task of translation.

### Alternative for Session Cancellation

We considered adding the cancellation option to a menu or settings panel, but this would make it less discoverable and require more clicks to access when needed.

## Conclusion

These UX improvements address several friction points in the current application flow and follow established UX best practices. They are relatively low-effort changes that will provide immediate benefits to users while maintaining compatibility with the existing application architecture.