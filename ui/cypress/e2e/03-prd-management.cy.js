describe('PRD Management Workflows', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForAppReady()
  })

  describe('PRD Upload Functionality', () => {
    it('should navigate to PRD section', () => {
      cy.navigateToSection('prd')
      cy.get('h1, h2').should('contain.text', 'PRD')
    })

    it('should display file upload interface', () => {
      cy.navigateToSection('prd')
      cy.get('[data-testid="file-upload"], input[type="file"], .upload-area')
        .should('be.visible')
    })

    it('should upload a PRD file', () => {
      cy.navigateToSection('prd')
      
      // Create a test file
      const fileName = 'test-prd.txt'
      const fileContent = `
        # Product Requirements Document
        
        ## Overview
        This is a test PRD for Cypress testing.
        
        ## Features
        - Feature 1: User authentication
        - Feature 2: Task management
        - Feature 3: Reporting dashboard
        
        ## Requirements
        - REQ-001: System must support 1000 concurrent users
        - REQ-002: Response time must be under 200ms
      `
      
      cy.get('[data-testid="file-upload"], input[type="file"]')
        .selectFile({
          contents: fileContent,
          fileName,
          mimeType: 'text/plain'
        }, { force: true })
      
      // Verify file is selected
      cy.contains(fileName).should('be.visible')
    })

    it('should validate file types', () => {
      cy.navigateToSection('prd')
      
      // Try to upload invalid file type
      cy.get('[data-testid="file-upload"], input[type="file"]')
        .selectFile({
          contents: 'invalid content',
          fileName: 'invalid.exe',
          mimeType: 'application/octet-stream'
        }, { force: true })
      
      // Should show validation error
      cy.contains('invalid', { matchCase: false }).should('be.visible')
    })

    it('should handle large file uploads', () => {
      cy.navigateToSection('prd')
      
      // Create large test content
      const largeContent = 'x'.repeat(10000000) // 10MB
      
      cy.get('[data-testid="file-upload"], input[type="file"]')
        .selectFile({
          contents: largeContent,
          fileName: 'large-prd.txt',
          mimeType: 'text/plain'
        }, { force: true })
      
      // Should show file size warning or error
      cy.get('body').should('contain.text', 'size')
    })
  })

  describe('PRD Preview and Editing', () => {
    beforeEach(() => {
      // Mock PRD content
      cy.window().then((win) => {
        win.localStorage.setItem('currentPRD', JSON.stringify({
          fileName: 'test-prd.txt',
          content: `# Test PRD
          
## Features
- Authentication system
- Task management
- Reporting dashboard

## Technical Requirements
- Node.js backend
- React frontend
- PostgreSQL database`
        }))
      })
    })

    it('should display PRD preview', () => {
      cy.navigateToSection('prd')
      cy.get('[data-testid="prd-preview"], .prd-preview').should('be.visible')
      cy.contains('Test PRD').should('be.visible')
    })

    it('should edit PRD content', () => {
      cy.navigateToSection('prd')
      
      // Switch to edit mode
      cy.get('[data-testid="edit-prd"], button:contains("Edit")')
        .click()
      
      // Edit content
      cy.get('[data-testid="prd-editor"], .prd-editor textarea, .quill-editor')
        .clear()
        .type('# Updated PRD Content\n\nThis is updated content.')
      
      // Save changes
      cy.get('[data-testid="save-prd"], button:contains("Save")')
        .click()
      
      // Verify changes
      cy.contains('Updated PRD Content').should('be.visible')
    })

    it('should support rich text editing', () => {
      cy.navigateToSection('prd')
      
      cy.get('[data-testid="edit-prd"], button:contains("Edit")')
        .click()
      
      // Test rich text features if Quill editor is present
      cy.get('body').then(($body) => {
        if ($body.find('.ql-toolbar').length > 0) {
          // Test bold formatting
          cy.get('.ql-bold').click()
          cy.get('.ql-editor').type('Bold text')
          cy.get('.ql-editor strong').should('contain.text', 'Bold text')
        }
      })
    })

    it('should auto-save changes', () => {
      cy.navigateToSection('prd')
      
      cy.get('[data-testid="edit-prd"], button:contains("Edit")')
        .click()
      
      // Make changes and wait for auto-save
      cy.get('[data-testid="prd-editor"], .prd-editor textarea')
        .type(' Additional content')
      
      cy.wait(3000) // Wait for auto-save
      
      // Should show saved indicator
      cy.get('[data-testid="save-indicator"], .save-status')
        .should('contain.text', 'saved')
    })
  })

  describe('PRD Processing and Task Generation', () => {
    it('should generate tasks from PRD', () => {
      cy.navigateToSection('prd')
      
      // Mock PRD processing API
      cy.mockApiResponse('POST', '**/api/prd/process', {
        tasks: [
          {
            id: 'generated-1',
            title: 'Implement Authentication System',
            description: 'Based on PRD requirements for user authentication',
            priority: 'high'
          },
          {
            id: 'generated-2',
            title: 'Create Task Management Interface',
            description: 'Based on PRD requirements for task management',
            priority: 'medium'
          }
        ]
      })
      
      // Trigger task generation
      cy.get('[data-testid="generate-tasks"], button:contains("Generate Tasks")')
        .click()
      
      // Verify tasks are generated
      cy.contains('Implement Authentication System').should('be.visible')
      cy.contains('Create Task Management Interface').should('be.visible')
    })

    it('should show processing progress', () => {
      cy.navigateToSection('prd')
      
      // Mock slow processing
      cy.intercept('POST', '**/api/prd/process', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(res.send({
              statusCode: 200,
              body: { tasks: [] }
            })), 3000)
          })
        })
      })
      
      cy.get('[data-testid="generate-tasks"], button:contains("Generate Tasks")')
        .click()
      
      // Should show progress indicator
      cy.get('[role="progressbar"], .processing-indicator')
        .should('be.visible')
    })

    it('should handle processing errors', () => {
      cy.navigateToSection('prd')
      
      // Mock processing error
      cy.mockApiResponse('POST', '**/api/prd/process', 
        { error: 'Failed to process PRD' }, 
        500
      )
      
      cy.get('[data-testid="generate-tasks"], button:contains("Generate Tasks")')
        .click()
      
      // Should show error message
      cy.contains('error', { matchCase: false }).should('be.visible')
    })
  })

  describe('PRD Version Management', () => {
    it('should save PRD versions', () => {
      cy.navigateToSection('prd')
      
      // Edit and save multiple versions
      cy.get('[data-testid="edit-prd"], button:contains("Edit")')
        .click()
      
      cy.get('[data-testid="prd-editor"], .prd-editor textarea')
        .type('\n\n## Version 2 Updates\n- Added new requirements')
      
      cy.get('[data-testid="save-version"], button:contains("Save Version")')
        .click()
      
      // Verify version is saved
      cy.get('[data-testid="version-list"], .version-history')
        .should('contain.text', 'Version')
    })

    it('should restore previous versions', () => {
      cy.navigateToSection('prd')
      
      // Mock version history
      cy.window().then((win) => {
        win.localStorage.setItem('prdVersions', JSON.stringify([
          {
            id: 1,
            content: 'Original content',
            timestamp: Date.now() - 86400000
          },
          {
            id: 2,
            content: 'Updated content',
            timestamp: Date.now()
          }
        ]))
      })
      
      // Open version history
      cy.get('[data-testid="version-history"], button:contains("History")')
        .click()
      
      // Restore previous version
      cy.get('[data-testid="restore-version"]').first().click()
      
      // Verify content is restored
      cy.contains('Original content').should('be.visible')
    })
  })

  describe('Collaboration Features', () => {
    it('should support comments on PRD sections', () => {
      cy.navigateToSection('prd')
      
      // Add comment to section
      cy.get('[data-testid="add-comment"], .comment-button')
        .first()
        .click()
      
      cy.get('[data-testid="comment-input"], textarea[placeholder*="comment"]')
        .type('This section needs clarification')
      
      cy.get('[data-testid="save-comment"], button:contains("Comment")')
        .click()
      
      // Verify comment is displayed
      cy.contains('This section needs clarification').should('be.visible')
    })

    it('should show collaboration indicators', () => {
      cy.navigateToSection('prd')
      
      // Mock other users editing
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('userJoined', {
          detail: { userId: 'user2', userName: 'Test User' }
        }))
      })
      
      // Should show active users
      cy.get('[data-testid="active-users"], .collaboration-indicator')
        .should('contain.text', 'Test User')
    })
  })

  describe('Performance and Accessibility', () => {
    it('should load PRD editor efficiently', () => {
      cy.navigateToSection('prd')
      cy.measurePageLoad(2500)
    })

    it('should be accessible with screen readers', () => {
      cy.navigateToSection('prd')
      cy.testAccessibility({
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true }
        }
      })
    })

    it('should work on mobile devices', () => {
      cy.testResponsive((viewport) => {
        cy.navigateToSection('prd')
        
        if (viewport === 'mobile') {
          // Mobile-specific tests
          cy.get('[data-testid="mobile-menu"]').should('be.visible')
        }
        
        cy.get('[data-testid="prd-preview"], .prd-content')
          .should('be.visible')
      })
    })

    it('should handle large PRD documents efficiently', () => {
      cy.navigateToSection('prd')
      
      // Mock large document
      const largeContent = Array(1000).fill('# Section\n\nContent here.\n\n').join('')
      
      cy.window().then((win) => {
        win.localStorage.setItem('currentPRD', JSON.stringify({
          fileName: 'large-prd.txt',
          content: largeContent
        }))
      })
      
      cy.reload()
      cy.waitForAppReady()
      
      // Should still be responsive
      cy.get('[data-testid="prd-preview"]').should('be.visible')
      
      // Test scrolling performance
      cy.get('[data-testid="prd-preview"]')
        .scrollTo('bottom', { duration: 1000 })
        .scrollTo('top', { duration: 1000 })
    })
  })

  describe('Export and Integration', () => {
    it('should export PRD to different formats', () => {
      cy.navigateToSection('prd')
      
      // Test PDF export
      cy.get('[data-testid="export-pdf"], button:contains("PDF")')
        .click()
      
      // Verify download initiated
      cy.readFile('cypress/downloads/test-prd.pdf', { timeout: 10000 })
        .should('exist')
    })

    it('should integrate with external tools', () => {
      cy.navigateToSection('prd')
      
      // Test integration buttons
      cy.get('[data-testid="share-link"], button:contains("Share")')
        .click()
      
      // Should generate shareable link
      cy.get('[data-testid="share-url"], input[value*="http"]')
        .should('be.visible')
    })
  })
}) 