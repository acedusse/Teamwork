// ***********************************************
// Custom commands for Task Master UI testing
// ***********************************************

// Command to login (if authentication is implemented)
Cypress.Commands.add('login', (username = 'testuser', password = 'testpass') => {
  // Mock login for now - replace with actual login logic when implemented
  cy.window().then((win) => {
    win.localStorage.setItem('user', JSON.stringify({
      id: 1,
      username,
      role: 'user'
    }))
  })
})

// Command to navigate to specific sections
Cypress.Commands.add('navigateToSection', (section) => {
  const sections = {
    dashboard: '/',
    tasks: '/tasks',
    prd: '/prd',
    sprints: '/sprints',
    dependencies: '/dependencies',
    performance: '/performance',
    settings: '/settings'
  }
  
  const path = sections[section]
  if (!path) {
    throw new Error(`Unknown section: ${section}`)
  }
  
  cy.visit(path)
  cy.waitForAppReady()
})

// Command to create a new task
Cypress.Commands.add('createTask', (taskData = {}) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'Test task description',
    priority: 'medium',
    status: 'pending'
  }
  
  const task = { ...defaultTask, ...taskData }
  
  // Navigate to tasks page
  cy.navigateToSection('tasks')
  
  // Click add task button
  cy.get('[data-testid="add-task-button"], [aria-label*="Create"], [aria-label*="Add"]')
    .first()
    .click()
  
  // Fill in task details
  cy.get('[data-testid="task-title-input"], input[placeholder*="title" i]')
    .type(task.title)
  
  cy.get('[data-testid="task-description-input"], textarea[placeholder*="description" i]')
    .type(task.description)
  
  // Select priority if dropdown exists
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="priority-select"]').length > 0) {
      cy.get('[data-testid="priority-select"]').click()
      cy.get(`[data-value="${task.priority}"]`).click()
    }
  })
  
  // Save task
  cy.get('[data-testid="save-task-button"], button[type="submit"], button:contains("Save")')
    .click()
  
  // Wait for task to be created
  cy.contains(task.title).should('be.visible')
})

// Command to test keyboard navigation
Cypress.Commands.add('testKeyboardNavigation', (startElement) => {
  cy.get(startElement).focus()
  
  // Test Tab navigation
  cy.focused().tab()
  cy.focused().should('not.be', startElement)
  
  // Test Shift+Tab navigation
  cy.focused().tab({ shift: true })
  cy.focused().should('be', startElement)
})

// Command to test responsive design
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = ['mobile', 'tablet', 'desktop']
  
  viewports.forEach(viewport => {
    cy.setViewport(viewport)
    cy.wait(500) // Allow time for responsive changes
    
    if (callback) {
      callback(viewport)
    }
  })
})

// Command to measure page load performance
Cypress.Commands.add('measurePageLoad', (expectedThreshold = 3000) => {
  cy.window().then((win) => {
    // Mark start time
    win.performance.mark('test-start')
  })
  
  cy.waitForAppReady()
  
  cy.window().then((win) => {
    // Mark end time and measure
    win.performance.mark('test-end')
    win.performance.measure('page-load', 'test-start', 'test-end')
    
    const measures = win.performance.getEntriesByName('page-load')
    const loadTime = measures[0]?.duration || 0
    
    cy.log(`Page load time: ${loadTime}ms`)
    expect(loadTime).to.be.lessThan(expectedThreshold)
  })
})

// Command to test accessibility
Cypress.Commands.add('testAccessibility', (options = {}) => {
  cy.injectAxe()
  cy.checkA11y(null, {
    includedImpacts: ['critical', 'serious'],
    ...options
  })
})

// Command to simulate user workflow
Cypress.Commands.add('simulateUserWorkflow', (workflow) => {
  workflow.forEach((step, index) => {
    cy.log(`Step ${index + 1}: ${step.action}`)
    
    switch (step.action) {
      case 'navigate':
        cy.navigateToSection(step.section)
        break
      case 'click':
        cy.get(step.selector).click()
        break
      case 'type':
        cy.get(step.selector).type(step.text)
        break
      case 'wait':
        cy.wait(step.duration || 1000)
        break
      case 'assert':
        cy.get(step.selector).should(step.assertion, step.value)
        break
      default:
        cy.log(`Unknown action: ${step.action}`)
    }
  })
})

// Command to test search functionality
Cypress.Commands.add('testSearch', (searchTerm, expectedResults = []) => {
  // Find search input
  cy.get('#search-input, [data-testid="search-input"], input[placeholder*="search" i]')
    .clear()
    .type(searchTerm)
    .type('{enter}')
  
  // Wait for search results
  cy.wait(1000)
  
  // Verify expected results if provided
  if (expectedResults.length > 0) {
    expectedResults.forEach(result => {
      cy.contains(result).should('be.visible')
    })
  }
})

// Command to test drag and drop functionality
Cypress.Commands.add('testDragDrop', (sourceSelector, targetSelector) => {
  cy.get(sourceSelector)
    .trigger('mousedown', { button: 0 })
    .wait(100)
  
  cy.get(targetSelector)
    .trigger('mousemove')
    .trigger('mouseup')
  
  cy.wait(500) // Allow time for drop to complete
})

// Command to mock API responses
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as('apiCall')
})

// Command to test error handling
Cypress.Commands.add('testErrorHandling', (errorScenario) => {
  // Mock error response
  cy.mockApiResponse('GET', '**/api/**', 
    { error: 'Test error' }, 
    errorScenario.statusCode || 500
  )
  
  // Trigger action that should cause error
  if (errorScenario.action) {
    cy.get(errorScenario.selector).click()
  }
  
  // Verify error is displayed
  cy.contains('error', { matchCase: false }).should('be.visible')
})

// Add to Cypress TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<Element>
      navigateToSection(section: string): Chainable<Element>
      createTask(taskData?: object): Chainable<Element>
      testKeyboardNavigation(startElement: string): Chainable<Element>
      testResponsive(callback?: Function): Chainable<Element>
      measurePageLoad(expectedThreshold?: number): Chainable<Element>
      testAccessibility(options?: object): Chainable<Element>
      simulateUserWorkflow(workflow: Array<any>): Chainable<Element>
      testSearch(searchTerm: string, expectedResults?: Array<string>): Chainable<Element>
      testDragDrop(sourceSelector: string, targetSelector: string): Chainable<Element>
      mockApiResponse(method: string, url: string, response: any, statusCode?: number): Chainable<Element>
      testErrorHandling(errorScenario: object): Chainable<Element>
      setViewport(device: string): Chainable<Element>
      waitForAppReady(): Chainable<Element>
    }
  }
} 