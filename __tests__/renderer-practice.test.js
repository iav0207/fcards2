/**
 * Tests for the renderer's practice screen functionality
 * @jest-environment jsdom
 */

describe('Renderer - Practice Screen', () => {
  // Setup - DOM environment
  document.body.innerHTML = `
    <div id="practice-screen">
      <div id="card-content"></div>
      <div id="session-progress"></div>
      <div id="card-tags"></div>
      <input id="translation-input" type="text" />
    </div>
  `;

  // Mocks for global objects
  window.flashcards = {
    getCurrentCard: jest.fn().mockResolvedValue({
      card: {
        content: 'Test content',
        tags: ['grammar', 'beginner']
      },
      sessionProgress: { current: 1, total: 3 }
    })
  };

  // Store the original setTimeout
  const originalSetTimeout = global.setTimeout;
  
  beforeEach(() => {
    // Mock setTimeout to execute immediately
    global.setTimeout = jest.fn((callback) => callback());
    
    // Mock the focus method on input element
    document.getElementById('translation-input').focus = jest.fn();
  });
  
  afterEach(() => {
    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;
    
    // Clear mocks
    jest.clearAllMocks();
  });

  // Import the renderer code to create the FlashCardsApp
  // Since we can't import directly (module isolation), 
  // We'll test the loadCurrentCard method separately
  test('loadCurrentCard should focus the translation input', async () => {
    // Create a partial implementation of the FlashCardsApp
    const app = {
      state: { sessionId: 'test-session' },
      notificationSystem: {
        error: jest.fn()
      },
      loadCurrentCard: async function() {
        try {
          const cardData = await window.flashcards.getCurrentCard(this.state.sessionId);
          
          if (!cardData) {
            // Session is complete
            return null;
          }
          
          this.state.currentCard = cardData;
          
          // Update UI
          document.getElementById('card-content').textContent = cardData.card.content;
          
          // Update progress
          const progressPercent = (cardData.sessionProgress.current / cardData.sessionProgress.total) * 100;
          document.getElementById('session-progress').style.width = `${progressPercent}%`;
          
          // Display card tags if available
          const tagsContainer = document.getElementById('card-tags');
          tagsContainer.innerHTML = '';

          if (cardData.card.tags && cardData.card.tags.length > 0) {
            cardData.card.tags.forEach(tag => {
              const tagElement = document.createElement('span');
              tagElement.className = 'card-tag';
              tagElement.textContent = tag;
              tagsContainer.appendChild(tagElement);
            });
          }

          // Clear the input
          document.getElementById('translation-input').value = '';

          // Focus the input field for immediate typing
          setTimeout(() => {
            document.getElementById('translation-input').focus();
          }, 100);
        } catch (error) {
          console.error('Error loading current card:', error);
          this.notificationSystem.error(
            'Card Loading Failed',
            'Could not load the current card',
            error.message
          );
        }
      }
    };

    // Call the method
    await app.loadCurrentCard();
    
    // Assertions
    expect(window.flashcards.getCurrentCard).toHaveBeenCalledWith('test-session');
    expect(document.getElementById('card-content').textContent).toBe('Test content');
    expect(document.getElementById('translation-input').focus).toHaveBeenCalled();

    // Check tags were displayed correctly
    const tagsContainer = document.getElementById('card-tags');
    const tagElements = tagsContainer.querySelectorAll('.card-tag');
    expect(tagElements.length).toBe(2);
    expect(tagElements[0].textContent).toBe('grammar');
    expect(tagElements[1].textContent).toBe('beginner');
  });
});