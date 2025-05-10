# RFC-00007: Error Notification System

## Summary

Implement a notification system that displays errors to users in a user-friendly manner, starting with translation service errors. This will improve user experience by providing clear feedback when things go wrong and offering ways to copy error details or dismiss notifications.

## Motivation

Currently, when errors occur in the application (such as translation API failures), they are logged to the console but not displayed to the user. This creates a poor user experience as users don't understand why a feature isn't working as expected. 

By implementing a notification system for errors:
- Users will be informed when something goes wrong
- Error messages can be copied for support or troubleshooting
- The application can suggest potential actions to resolve the issue

## Detailed Design

### Notification Component

Create a reusable notification component with the following features:
- Different notification types (error, warning, info, success)
- Ability to display a message with details
- A "Copy" button to copy the error message to clipboard
- A "Dismiss" button to close the notification
- Auto-dismiss option for non-critical messages
- Positioning (top, bottom) with smooth animations

### Error Handling for Translation Service

Update the TranslationService's error handling to:
1. Log the error to console (already implemented)
2. Capture structured error information (type, message, details)
3. Emit an event that the UI can listen for
4. Trigger the notification component with appropriate error details

### Integration with Session Flow

During practice sessions:
1. When a translation API error occurs, show a notification
2. Inform the user that the application is falling back to baseline evaluation
3. Provide guidance on API key setup if the error is related to missing/invalid keys

### UI Design

The notification will appear as a modal overlay or toast message:

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Translation API Error                         │
│                                                 │
│ Unable to evaluate translation with Gemini API. │
│ Falling back to basic evaluation.               │
│                                                 │
│ Details: API key not valid                      │
│                                                 │
│ [Copy Error]                [Dismiss]           │
└─────────────────────────────────────────────────┘
```

### Implementation Details

1. **Notification Service/Component:**
   - Create a notification service to manage notifications
   - Implement the UI component in React
   - Support different severity levels and styles

2. **Error Handling:**
   - Enhance TranslationService's error handling
   - Add event emitter for error events
   - Create helper functions for common error types

3. **IPC Integration:**
   - Add IPC handlers for error events in main.js
   - Pass error information to the renderer process

## Alternatives Considered

1. **Toast-only notifications:** Simpler but may not have enough space for detailed errors
2. **Modal dialogs:** More interruptive to user flow
3. **Status bar errors:** Less visible but less disruptive

## Compatibility

This feature will build on the existing error handling in the TranslationService and won't break existing functionality. It will enhance user experience by making errors visible and actionable.

## Implementation Timeline

1. Create the notification component (1-2 days)
2. Update TranslationService error handling (1 day)
3. Integrate with the practice session flow (1 day)
4. Test for different error scenarios (1 day)

Total: 4-5 days

## Future Extensions

- Apply the notification system to other error types (database, session, etc.)
- Add user preferences for notification behavior
- Implement retry functionality for transient errors
- Create a notification history/log that users can review