/* viewSwitcher.js - Helper for switching views with cleanup */
export function switchToView(newView, renderFunction) {
  console.log('Switching to view:', newView.constructor.name);
  try {
    // Destroy previous view if it exists and has destroy method
    if (window.currentView && typeof window.currentView.destroy === 'function') {
      window.currentView.destroy();
    }

    // Set new view as current
    window.currentView = newView;

    // Call render function
    renderFunction();
  } catch (error) {
    console.error('Error switching view:', error);
    if (window.showErrorNotification) {
      window.showErrorNotification('Failed to load page. Please refresh.');
    }
  }
}
