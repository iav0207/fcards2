# RFC-00013: Incorrect Flashcards Retry Feature

- **Status**: Draft
- **Author**: Claude
- **Created**: 2025-05-18

## Summary

This RFC proposes a feature for FlashCards Desktop that re-queues incorrectly answered flashcards to be shown again later in the same practice session. This gives users another chance to answer difficult cards without creating a separate review phase.

## Motivation

Learning is reinforced through repeated attempts, especially for challenging content. Currently, the FlashCards Desktop application proceeds through cards in a session without revisiting failed cards. This creates several issues:

1. Users only get one chance per card within a session
2. Difficult translations don't receive immediate reinforcement
3. Users can't demonstrate their understanding once they've realized their mistake
4. Learning efficiency is reduced without a retry mechanism

By re-queueing incorrectly answered cards within the same session, we can:
- Provide a second chance on difficult translations
- Reinforce learning through immediate practice
- Give users the satisfaction of correcting their mistakes
- Maintain natural session flow without adding separate modes

## Detailed Design

The proposed feature consists of two main components:

### 1. Incorrect Card Re-queueing

**Implementation details**:
- Modify the `SessionCardSelector` to maintain a queue of incorrectly answered cards
- When a card is evaluated as incorrect, add it to this queue
- When selecting the next card, give priority to regular cards until all have been shown
- After all regular cards are processed, begin serving cards from the incorrect queue
- Limit each incorrect card to one retry (do not re-queue repeatedly)

```javascript
// In SessionCardSelector.js
class SessionCardSelector {
  constructor(cards) {
    this.originalCards = [...cards];
    this.remainingCards = [...cards];
    this.incorrectQueue = []; // New queue for incorrect cards
    this.seenCardIds = new Set(); // Track card IDs that have been shown
  }
  
  selectNextCard() {
    // First try to get a card from the regular queue
    if (this.remainingCards.length > 0) {
      return this.remainingCards.shift();
    }
    
    // If no regular cards remain, try to get a card from the incorrect queue
    if (this.incorrectQueue.length > 0) {
      return this.incorrectQueue.shift();
    }
    
    // No cards remaining in either queue
    return null;
  }
  
  addIncorrectCard(card) {
    // Only add the card if it hasn't been retried already
    if (!this.incorrectQueue.some(c => c.id === card.id)) {
      this.incorrectQueue.push(card);
    }
  }
  
  getRemainingCount() {
    return this.remainingCards.length + this.incorrectQueue.length;
  }
}
```

### 2. Session Flow Integration

**Implementation details**:
- Modify the `SessionManager` to handle the re-queueing logic
- Update the practice screen to handle transitions between regular and retry cards
- Track and display total card count including potential retries
- Update the progress indicator to reflect the dynamic total

```javascript
// In SessionManager.js
class SessionManager {
  // Existing initialization

  evaluateCard(userTranslation) {
    // Existing evaluation logic
    
    if (!isCorrect) {
      // Add current card to the incorrect queue for retry
      this.cardSelector.addIncorrectCard(this.currentCard);
      
      // Update total cards count to include this retry
      this.updateTotalCardsCount();
    }
    
    // Continue with existing logic for advancing to next card
  }
  
  updateTotalCardsCount() {
    // Dynamic count including original cards plus retries
    this.totalCards = this.cardSelector.originalCards.length + 
                      this.cardSelector.incorrectQueue.length;
                      
    // Update UI with new count
    this.updateProgressUI();
  }
}
```

### 3. Progress Indicator Update

**Implementation details**:
- Update the progress indicator to handle the dynamic total
- Provide visual differentiation for retry cards in the session flow
- Make the UI clear about regular cards vs. retry cards

```javascript
// In practice-screen.js
function updateProgressIndicator(current, total) {
  document.getElementById('progress-current').textContent = current;
  document.getElementById('progress-total').textContent = total;
}

function showRetryIndicator(isRetry) {
  const cardElement = document.querySelector('.flashcard');
  
  if (isRetry) {
    cardElement.classList.add('retry-card');
    // Optionally add an indicator icon or label
    const retryBadge = document.createElement('div');
    retryBadge.className = 'retry-badge';
    retryBadge.textContent = 'Retry';
    cardElement.appendChild(retryBadge);
  } else {
    cardElement.classList.remove('retry-card');
    const existingBadge = cardElement.querySelector('.retry-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
  }
}
```

### 4. Statistics Tracking

**Implementation details**:
- Track first-attempt success vs. second-attempt success in session statistics
- Update the results screen to show performance on retry cards
- Maintain compatibility with existing statistics tracking

```javascript
// In Session.js model
class Session {
  constructor() {
    // Existing properties
    this.firstAttemptCorrect = 0;
    this.retryAttemptCorrect = 0;
    this.retryCount = 0;
  }
  
  // Update stats method
  updateStats(cardId, isCorrect, isRetry) {
    if (isRetry) {
      this.retryCount++;
      if (isCorrect) {
        this.retryAttemptCorrect++;
      }
    } else {
      if (isCorrect) {
        this.firstAttemptCorrect++;
      }
    }
    
    // Continue with existing stats updates
  }
}
```

## Implementation Plan

The implementation should proceed in these phases:

1. **Phase 1**: Modify the card selection components
   - Update `SessionCardSelector` to handle re-queueing
   - Add tracking for seen cards to avoid multiple retries
   - Create mechanisms to identify retry cards vs. regular cards

2. **Phase 2**: Update session management
   - Modify `SessionManager` to handle incorrect card re-queueing
   - Update progress calculation to include retry cards
   - Add visual indicators for retry cards

3. **Phase 3**: Enhance statistics tracking
   - Update session model to track regular vs. retry performance
   - Modify results screen to display retry statistics
   - Ensure backward compatibility with existing statistics

## Compatibility

This feature requires:
- Updates to session management logic
- Minor UI enhancements to indicate retry cards
- Extensions to statistics tracking

No breaking changes to existing functionality are anticipated, as this feature extends the session flow without fundamentally changing it.

## Testing Plan

Testing should include:

1. **Unit Tests**:
   - Test the `SessionCardSelector` to ensure proper queueing behavior
   - Verify retry cards are correctly identified
   - Test that cards are only retried once

2. **Integration Tests**:
   - Test session progression with incorrect answers
   - Verify the total card count is updated correctly
   - Ensure statistics are tracked properly for both regular and retry attempts

3. **E2E Tests**:
   - Complete sessions with intentionally incorrect answers
   - Verify retry cards appear after all regular cards
   - Test the visual indicators for retry cards

## Future Considerations

Potential future enhancements to this feature include:

1. **User Preferences**: Allow users to toggle the retry feature on/off
2. **Retry Limit**: Add configuration for the maximum number of retries per card
3. **Spaced Retry**: Instead of queueing all incorrect cards at the end, intersperse them among remaining regular cards
4. **Difficulty Tracking**: Use retry performance to automatically tag cards as "difficult" for future sessions

## Alternatives Considered

### End-of-Session Review

We considered having a separate "review phase" at the end of each session, but this would:
- Create a distinct mode rather than integrating with the natural session flow
- Require additional UI elements and navigation
- Feel more like a test than an integrated learning experience

### Immediate Retry

Another alternative was to immediately show the card again after an incorrect answer. This was rejected because:
- It interrupts the flow of new cards
- It doesn't allow time for reflection
- It might lead to frustration if users can't immediately recall the correct answer

## Conclusion

The incorrect flashcards retry feature enhances the learning experience by giving users a second chance with challenging cards within the same session. By maintaining the natural flow of the practice session while providing immediate reinforcement, we create a more effective learning tool without adding complexity to the user experience. This feature aligns with effective learning principles and should improve overall user satisfaction and learning outcomes.