/**
 * Animation utility functions for floating reactions
 */

/**
 * Trigger floating animations when count increases (for real-time polling updates)
 *
 * @param itemId - The ID of the item (game ID, dead game ID, etc.)
 * @param oldCount - Previous count
 * @param newCount - New count
 * @param setAnimationState - State setter function for the animation array
 * @param createAnimationObject - Function to create the animation object with specific properties
 * @param animationPrefix - Optional prefix for animation ID (default: 'polling')
 */
export function triggerCountIncreaseAnimations<T>(
  itemId: string,
  oldCount: number,
  newCount: number,
  setAnimationState: any,
  createAnimationObject: (itemId: string, animationId: string) => T,
  animationPrefix: string = 'polling',
) {
  if (oldCount > 0 && newCount > oldCount) {
    // Calculate how many reactions were added, but only show 50% of them
    const reactionsAdded = newCount - oldCount;
    const animationsToShow = Math.max(1, Math.floor(reactionsAdded * 0.5));

    // Trigger floating animation (simplified, no power mode)
    for (let i = 0; i < animationsToShow; i++) {
      setTimeout(() => {
        const animationId = `${animationPrefix}-${itemId}-${Date.now()}-${Math.random()}`;
        const animationObject = createAnimationObject(itemId, animationId);
        setAnimationState((prev: any) => [...prev, animationObject]);
      }, i * 200); // Stagger animations by 200ms
    }
  }
}
