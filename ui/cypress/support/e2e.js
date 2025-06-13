// Import commands.js using ES2015 syntax:
import './commands'
import '@testing-library/cypress/add-commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configure global settings
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions, but we still want to log them
  console.error('Uncaught exception:', err)
  
  // Don't fail on certain types of errors that are expected in development
  if (err.message.includes('ResizeObserver loop limit exceeded') ||
      err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  
  // Let other errors fail the test
  return true
})

// Set up performance monitoring
beforeEach(() => {
  // Clear performance entries before each test
  cy.window().then((win) => {
    if (win.performance && win.performance.clearMarks) {
      win.performance.clearMarks()
      win.performance.clearMeasures()
    }
  })
  
  // Start performance measurement
  cy.window().then((win) => {
    win.testStartTime = Date.now()
  })
})

afterEach(() => {
  // Log performance metrics after each test
  cy.window().then((win) => {
    const testDuration = Date.now() - (win.testStartTime || 0)
    cy.task('log', `Test completed in ${testDuration}ms`)
    
    // Get performance report if available
    if (win.getPerformanceReport) {
      const report = win.getPerformanceReport()
      cy.task('table', {
        'FCP': report.coreWebVitals?.fcp || 'N/A',
        'LCP': report.coreWebVitals?.lcp || 'N/A',
        'Performance Grade': report.performance || 'N/A'
      })
    }
  })
})

// Add accessibility testing support
import 'cypress-axe'

// Configure viewport for consistent testing
Cypress.Commands.add('setViewport', (device = 'desktop') => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720],
    large: [1920, 1080]
  }
  
  const [width, height] = viewports[device] || viewports.desktop
  cy.viewport(width, height)
})

// Add custom command for waiting for app to be ready
Cypress.Commands.add('waitForAppReady', () => {
  // Wait for React app to be loaded
  cy.get('[data-testid="app-ready"]', { timeout: 10000 }).should('exist')
  
  // Wait for any loading spinners to disappear
  cy.get('[role="progressbar"]').should('not.exist')
  
  // Wait for main content to be visible
  cy.get('#main-content').should('be.visible')
}) 