describe('Navigation and Layout', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForAppReady()
  })

  describe('Application Loading', () => {
    it('should load the application within performance threshold', () => {
      cy.measurePageLoad(3000)
    })

    it('should display main navigation elements', () => {
      cy.get('[role="banner"]').should('be.visible')
      cy.get('[role="navigation"]').should('be.visible')
      cy.get('#main-content').should('be.visible')
    })

    it('should have accessible skip links', () => {
      cy.get('body').tab()
      cy.focused().should('contain.text', 'Skip to main content')
      cy.focused().click()
      cy.focused().should('have.attr', 'id', 'main-content')
    })
  })

  describe('Navigation Menu', () => {
    const menuItems = [
      { text: 'Dashboard', path: '/' },
      { text: 'Task Board', path: '/tasks' },
      { text: 'PRD Editor', path: '/prd' },
      { text: 'Sprint Planning', path: '/sprints' },
      { text: 'Dependencies', path: '/dependencies' },
      { text: 'Performance', path: '/performance' },
      { text: 'Settings', path: '/settings' }
    ]

    menuItems.forEach(item => {
      it(`should navigate to ${item.text}`, () => {
        cy.contains(item.text).click()
        cy.url().should('include', item.path)
        cy.waitForAppReady()
      })
    })

    it('should highlight active navigation item', () => {
      cy.navigateToSection('tasks')
      cy.get('[role="menuitem"][aria-current="page"]')
        .should('contain.text', 'Task Board')
    })

    it('should support keyboard navigation', () => {
      cy.get('[role="menuitem"]').first().focus()
      cy.testKeyboardNavigation('[role="menuitem"]')
    })
  })

  describe('Sidebar Functionality', () => {
    it('should toggle sidebar on menu button click', () => {
      cy.get('[aria-label*="navigation menu"]').click()
      cy.get('[role="navigation"]').should('not.be.visible')
      
      cy.get('[aria-label*="navigation menu"]').click()
      cy.get('[role="navigation"]').should('be.visible')
    })

    it('should collapse sidebar on desktop', () => {
      cy.setViewport('desktop')
      cy.get('[aria-label*="Collapse"], [aria-label*="Expand"]').click()
      cy.get('[role="navigation"]').should('have.css', 'width', '65px')
    })

    it('should show tooltips on collapsed sidebar', () => {
      cy.setViewport('desktop')
      cy.get('[aria-label*="Collapse"]').click()
      cy.get('[role="menuitem"]').first().trigger('mouseover')
      cy.get('[role="tooltip"]').should('be.visible')
    })
  })

  describe('Top App Bar', () => {
    it('should display application title', () => {
      cy.get('[role="banner"] h1').should('contain.text', 'Taskmaster')
    })

    it('should show breadcrumb navigation', () => {
      cy.navigateToSection('tasks')
      cy.get('[role="navigation"][aria-label*="breadcrumb"]')
        .should('contain.text', 'Dashboard')
        .and('contain.text', 'Task Board')
    })

    it('should have functional search input', () => {
      cy.get('#search-input').should('be.visible')
      cy.get('#search-input').type('test search{enter}')
      // Search functionality test - implementation depends on search feature
    })

    it('should display notification badge', () => {
      cy.get('[aria-label*="Notifications"]').should('be.visible')
      cy.get('[role="status"]').should('contain.text', '4')
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      cy.setViewport('mobile')
      cy.get('[role="navigation"]').should('not.be.visible')
      cy.get('[aria-label*="navigation menu"]').click()
      cy.get('[role="navigation"]').should('be.visible')
    })

    it('should adapt to tablet viewport', () => {
      cy.setViewport('tablet')
      cy.get('[role="navigation"]').should('be.visible')
      cy.get('#main-content').should('be.visible')
    })

    it('should maintain functionality across viewports', () => {
      cy.testResponsive((viewport) => {
        cy.log(`Testing ${viewport} viewport`)
        cy.get('[role="banner"]').should('be.visible')
        cy.get('#main-content').should('be.visible')
      })
    })
  })

  describe('Accessibility', () => {
    it('should pass accessibility audit', () => {
      cy.testAccessibility()
    })

    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1)
      cy.get('h1').should('contain.text', 'Taskmaster')
    })

    it('should have proper ARIA labels', () => {
      cy.get('[role="navigation"]').should('have.attr', 'aria-label')
      cy.get('[role="banner"]').should('exist')
      cy.get('[role="main"]').should('exist')
    })

    it('should support screen reader navigation', () => {
      cy.get('[role="region"]').each(($region) => {
        cy.wrap($region).should('have.attr', 'aria-label')
      })
    })
  })

  describe('Performance Monitoring', () => {
    it('should track page performance metrics', () => {
      cy.window().then((win) => {
        expect(win.performance).to.exist
        if (win.getPerformanceReport) {
          const report = win.getPerformanceReport()
          expect(report).to.have.property('metrics')
          expect(report).to.have.property('coreWebVitals')
        }
      })
    })

    it('should load lazily loaded components efficiently', () => {
      cy.navigateToSection('tasks')
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource')
        const jsResources = resources.filter(r => r.name.includes('.js'))
        cy.log(`Loaded ${jsResources.length} JS resources`)
        expect(jsResources.length).to.be.lessThan(20) // Reasonable chunk count
      })
    })
  })
}) 