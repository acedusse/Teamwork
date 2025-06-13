describe('Task Management Workflows', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForAppReady()
    // Mock API responses for consistent testing
    cy.mockApiResponse('GET', '**/api/tasks', {
      tasks: [
        {
          id: '1',
          title: 'Sample Task 1',
          description: 'Description for task 1',
          status: 'pending',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Sample Task 2',
          description: 'Description for task 2',
          status: 'done',
          priority: 'medium'
        }
      ]
    })
  })

  describe('Task Board Navigation', () => {
    it('should navigate to task board', () => {
      cy.navigateToSection('tasks')
      cy.get('h1, h2').should('contain.text', 'Task')
    })

    it('should display task cards', () => {
      cy.navigateToSection('tasks')
      cy.get('[data-testid="task-card"], .task-card, [role="article"]')
        .should('have.length.at.least', 1)
    })

    it('should filter tasks by status', () => {
      cy.navigateToSection('tasks')
      
      // Test pending tasks filter
      cy.get('[data-testid="filter-pending"], button:contains("Pending")')
        .click()
      cy.contains('Sample Task 1').should('be.visible')
      
      // Test completed tasks filter
      cy.get('[data-testid="filter-done"], button:contains("Done")')
        .click()
      cy.contains('Sample Task 2').should('be.visible')
    })
  })

  describe('Task Creation Workflow', () => {
    it('should create a new task with basic information', () => {
      const newTask = {
        title: 'Test Task Creation',
        description: 'This is a test task created by Cypress',
        priority: 'high'
      }

      cy.mockApiResponse('POST', '**/api/tasks', {
        id: '3',
        ...newTask,
        status: 'pending'
      }, 201)

      cy.createTask(newTask)
      cy.contains(newTask.title).should('be.visible')
    })

    it('should validate required fields', () => {
      cy.navigateToSection('tasks')
      cy.get('[data-testid="add-task-button"], [aria-label*="Create"], [aria-label*="Add"]')
        .first()
        .click()
      
      // Try to save without title
      cy.get('[data-testid="save-task-button"], button[type="submit"], button:contains("Save")')
        .click()
      
      // Should show validation error
      cy.contains('required', { matchCase: false }).should('be.visible')
    })

    it('should support keyboard shortcuts for task creation', () => {
      cy.navigateToSection('tasks')
      cy.get('body').type('{ctrl}n')
      cy.get('[data-testid="task-dialog"], [role="dialog"]').should('be.visible')
    })
  })

  describe('Task Editing Workflow', () => {
    it('should edit an existing task', () => {
      cy.navigateToSection('tasks')
      
      // Click on first task to edit
      cy.get('[data-testid="task-card"], .task-card')
        .first()
        .click()
      
      // Edit task title
      cy.get('[data-testid="task-title-input"], input[value*="Sample Task"]')
        .clear()
        .type('Updated Task Title')
      
      // Save changes
      cy.get('[data-testid="save-task-button"], button:contains("Save")')
        .click()
      
      // Verify changes
      cy.contains('Updated Task Title').should('be.visible')
    })

    it('should update task status', () => {
      cy.navigateToSection('tasks')
      
      // Find a pending task and mark as done
      cy.contains('Sample Task 1').parent()
        .find('[data-testid="status-select"], select, [role="combobox"]')
        .click()
      
      cy.get('[data-value="done"], option[value="done"]')
        .click()
      
      // Verify status update
      cy.contains('Sample Task 1').parent()
        .should('contain.text', 'done')
    })

    it('should update task priority', () => {
      cy.navigateToSection('tasks')
      
      cy.contains('Sample Task 1').parent()
        .find('[data-testid="priority-select"], [aria-label*="priority"]')
        .click()
      
      cy.get('[data-value="low"], option[value="low"]')
        .click()
      
      // Verify priority update
      cy.contains('Sample Task 1').parent()
        .should('contain.text', 'low')
    })
  })

  describe('Task Deletion Workflow', () => {
    it('should delete a task with confirmation', () => {
      cy.navigateToSection('tasks')
      
      // Mock delete API
      cy.mockApiResponse('DELETE', '**/api/tasks/1', {}, 204)
      
      // Click delete button
      cy.contains('Sample Task 1').parent()
        .find('[data-testid="delete-task-button"], [aria-label*="delete"]')
        .click()
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete"], button:contains("Delete"), button:contains("Confirm")')
        .click()
      
      // Verify task is removed
      cy.contains('Sample Task 1').should('not.exist')
    })

    it('should cancel task deletion', () => {
      cy.navigateToSection('tasks')
      
      cy.contains('Sample Task 1').parent()
        .find('[data-testid="delete-task-button"], [aria-label*="delete"]')
        .click()
      
      // Cancel deletion
      cy.get('[data-testid="cancel-delete"], button:contains("Cancel")')
        .click()
      
      // Verify task still exists
      cy.contains('Sample Task 1').should('be.visible')
    })
  })

  describe('Drag and Drop Workflow', () => {
    it('should support drag and drop between status columns', () => {
      cy.navigateToSection('tasks')
      
      // Test drag and drop if kanban board exists
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="kanban-board"], .kanban-column').length > 0) {
          cy.testDragDrop(
            '[data-testid="task-card"]:contains("Sample Task 1")',
            '[data-testid="done-column"], [data-status="done"]'
          )
          
          // Verify task moved to done column
          cy.get('[data-testid="done-column"], [data-status="done"]')
            .should('contain.text', 'Sample Task 1')
        }
      })
    })

    it('should provide visual feedback during drag', () => {
      cy.navigateToSection('tasks')
      
      cy.get('[data-testid="task-card"]').first()
        .trigger('mousedown', { button: 0 })
      
      // Should show drag feedback
      cy.get('[data-testid="task-card"]').first()
        .should('have.class', 'dragging')
        .or('have.attr', 'aria-grabbed', 'true')
    })
  })

  describe('Search and Filter Functionality', () => {
    it('should search tasks by title', () => {
      cy.navigateToSection('tasks')
      cy.testSearch('Sample Task 1', ['Sample Task 1'])
    })

    it('should filter tasks by priority', () => {
      cy.navigateToSection('tasks')
      
      cy.get('[data-testid="priority-filter"], select[name="priority"]')
        .select('high')
      
      cy.contains('Sample Task 1').should('be.visible')
      cy.contains('Sample Task 2').should('not.be.visible')
    })

    it('should clear filters', () => {
      cy.navigateToSection('tasks')
      
      // Apply filter
      cy.get('[data-testid="priority-filter"]').select('high')
      
      // Clear filters
      cy.get('[data-testid="clear-filters"], button:contains("Clear")')
        .click()
      
      // All tasks should be visible
      cy.contains('Sample Task 1').should('be.visible')
      cy.contains('Sample Task 2').should('be.visible')
    })
  })

  describe('Task Dependencies', () => {
    it('should navigate to dependency graph', () => {
      cy.navigateToSection('dependencies')
      cy.get('[data-testid="dependency-graph"], #dependency-graph').should('be.visible')
    })

    it('should display task relationships', () => {
      cy.navigateToSection('dependencies')
      
      // Mock dependency data
      cy.mockApiResponse('GET', '**/api/dependencies', {
        dependencies: [
          { from: '1', to: '2', type: 'depends_on' }
        ]
      })
      
      cy.reload()
      cy.waitForAppReady()
      
      // Verify dependency visualization
      cy.get('[data-testid="dependency-link"], .dependency-edge')
        .should('have.length.at.least', 1)
    })
  })

  describe('Performance and Accessibility', () => {
    it('should load task board efficiently', () => {
      cy.navigateToSection('tasks')
      cy.measurePageLoad(2000)
    })

    it('should be accessible with keyboard navigation', () => {
      cy.navigateToSection('tasks')
      cy.get('[data-testid="task-card"]').first().focus()
      cy.testKeyboardNavigation('[data-testid="task-card"]')
    })

    it('should pass accessibility audit', () => {
      cy.navigateToSection('tasks')
      cy.testAccessibility()
    })

    it('should work across different screen sizes', () => {
      cy.testResponsive((viewport) => {
        cy.navigateToSection('tasks')
        cy.get('[data-testid="task-card"], .task-card')
          .should('be.visible')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.testErrorHandling({
        statusCode: 500,
        selector: '[data-testid="add-task-button"]'
      })
    })

    it('should handle network errors', () => {
      cy.mockApiResponse('GET', '**/api/tasks', 
        { error: 'Network error' }, 
        0 // Network error
      )
      
      cy.navigateToSection('tasks')
      cy.contains('error', { matchCase: false }).should('be.visible')
    })

    it('should show loading states', () => {
      // Mock slow API response
      cy.intercept('GET', '**/api/tasks', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(res.send({
              statusCode: 200,
              body: { tasks: [] }
            })), 2000)
          })
        })
      })
      
      cy.navigateToSection('tasks')
      cy.get('[role="progressbar"], .loading, [data-testid="loading"]')
        .should('be.visible')
    })
  })
}) 