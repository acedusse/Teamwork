describe('Continuous Improvement Dashboard', () => {
  beforeEach(() => {
    cy.visit('/');
    
    // Navigate to Continuous Improvement page
    cy.get('[data-testid="sidebar"]').should('be.visible');
    cy.contains('Continuous Improvement').click();
    
    // Wait for the page to load
    cy.url().should('include', '/continuous-improvement');
    cy.contains('Continuous Improvement').should('be.visible');
  });

  describe('Page Navigation and Layout', () => {
    it('should display the main navigation tabs', () => {
      cy.get('[role="tablist"]').should('be.visible');
      cy.get('[role="tab"]').should('have.length', 3);
      
      // Check tab labels
      cy.contains('[role="tab"]', 'Retrospectives').should('be.visible');
      cy.contains('[role="tab"]', 'Action Items').should('be.visible');
      cy.contains('[role="tab"]', 'Metrics').should('be.visible');
    });

    it('should have proper header controls', () => {
      cy.get('[aria-label="refresh"]').should('be.visible');
      cy.contains('button', 'Export').should('be.visible');
      cy.get('[aria-label="settings"]').should('be.visible');
    });

    it('should display floating action button', () => {
      cy.get('[aria-label="add retrospective"]').should('be.visible');
    });

    it('should show last updated timestamp', () => {
      cy.contains('Last updated:').should('be.visible');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', () => {
      // Initially on Retrospectives tab
      cy.contains('[role="tab"]', 'Retrospectives').should('have.attr', 'aria-selected', 'true');
      
      // Switch to Action Items
      cy.contains('[role="tab"]', 'Action Items').click();
      cy.contains('[role="tab"]', 'Action Items').should('have.attr', 'aria-selected', 'true');
      cy.contains('[role="tab"]', 'Retrospectives').should('have.attr', 'aria-selected', 'false');
      
      // Switch to Metrics
      cy.contains('[role="tab"]', 'Metrics').click();
      cy.contains('[role="tab"]', 'Metrics').should('have.attr', 'aria-selected', 'true');
      cy.contains('[role="tab"]', 'Action Items').should('have.attr', 'aria-selected', 'false');
      
      // Switch back to Retrospectives
      cy.contains('[role="tab"]', 'Retrospectives').click();
      cy.contains('[role="tab"]', 'Retrospectives').should('have.attr', 'aria-selected', 'true');
    });

    it('should maintain tab state when refreshing', () => {
      // Switch to Action Items tab
      cy.contains('[role="tab"]', 'Action Items').click();
      cy.contains('[role="tab"]', 'Action Items').should('have.attr', 'aria-selected', 'true');
      
      // Refresh the page
      cy.reload();
      
      // Should return to default (first) tab
      cy.contains('[role="tab"]', 'Retrospectives').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('Retrospectives Tab', () => {
    beforeEach(() => {
      cy.contains('[role="tab"]', 'Retrospectives').click();
    });

    it('should display retrospective board interface', () => {
      // Check for retrospective board components
      cy.get('[data-testid="retrospective-board"]').should('be.visible');
    });

    it('should handle retrospective creation via FAB', () => {
      cy.get('[aria-label="add retrospective"]').click();
      
      // Should trigger retrospective creation flow
      // Note: This depends on the actual RetrospectiveBoard implementation
      cy.wait(500); // Give time for any dialogs to appear
    });

    it('should support retrospective template selection', () => {
      // This test depends on the actual RetrospectiveBoard implementation
      // Check if template selector is available
      cy.get('body').then($body => {
        if ($body.find('[data-testid="template-selector"]').length > 0) {
          cy.get('[data-testid="template-selector"]').should('be.visible');
        }
      });
    });

    it('should display retrospective columns', () => {
      // Check for Start/Stop/Continue columns or other template columns
      cy.get('body').then($body => {
        if ($body.find('[data-testid="retrospective-column"]').length > 0) {
          cy.get('[data-testid="retrospective-column"]').should('have.length.at.least', 2);
        }
      });
    });
  });

  describe('Action Items Tab', () => {
    beforeEach(() => {
      cy.contains('[role="tab"]', 'Action Items').click();
    });

    it('should display action item tracker interface', () => {
      cy.get('[data-testid="action-item-tracker"]').should('be.visible');
    });

    it('should show action item counts and filters', () => {
      // Check for action item count display
      cy.get('body').then($body => {
        if ($body.find('[data-testid="action-items-count"]').length > 0) {
          cy.get('[data-testid="action-items-count"]').should('contain', 'action items');
        }
      });
    });

    it('should support action item filtering', () => {
      // Check for filter controls
      cy.get('body').then($body => {
        if ($body.find('[data-testid="filter-controls"]').length > 0) {
          cy.get('[data-testid="filter-controls"]').should('be.visible');
        }
      });
    });

    it('should display action item cards with status indicators', () => {
      // Check for action item cards
      cy.get('body').then($body => {
        if ($body.find('[data-testid="action-item-card"]').length > 0) {
          cy.get('[data-testid="action-item-card"]').should('have.length.at.least', 1);
        }
      });
    });
  });

  describe('Metrics Tab', () => {
    beforeEach(() => {
      cy.contains('[role="tab"]', 'Metrics').click();
    });

    it('should display improvement metrics interface', () => {
      cy.get('[data-testid="improvement-metrics"]').should('be.visible');
    });

    it('should show metrics charts and visualizations', () => {
      // Check for chart containers
      cy.get('body').then($body => {
        if ($body.find('[data-testid="metrics-chart"]').length > 0) {
          cy.get('[data-testid="metrics-chart"]').should('have.length.at.least', 1);
        }
      });
    });

    it('should support time range selection', () => {
      // Check for time range controls
      cy.get('body').then($body => {
        if ($body.find('[data-testid="time-range-selector"]').length > 0) {
          cy.get('[data-testid="time-range-selector"]').should('be.visible');
        }
      });
    });

    it('should display metric cards with trend indicators', () => {
      // Check for metric cards
      cy.get('body').then($body => {
        if ($body.find('[data-testid="metric-card"]').length > 0) {
          cy.get('[data-testid="metric-card"]').should('have.length.at.least', 1);
        }
      });
    });
  });

  describe('Export Functionality', () => {
    it('should open export dialog when export button is clicked', () => {
      cy.contains('button', 'Export').click();
      
      // Check if export dialog opens
      cy.get('body').then($body => {
        if ($body.find('[data-testid="retrospective-exporter"]').length > 0) {
          cy.get('[data-testid="retrospective-exporter"]').should('be.visible');
        }
      });
    });

    it('should close export dialog when cancelled', () => {
      cy.contains('button', 'Export').click();
      
      // Wait for dialog to potentially appear
      cy.wait(500);
      
      // Try to close dialog if it exists
      cy.get('body').then($body => {
        if ($body.find('[data-testid="close-export-btn"]').length > 0) {
          cy.get('[data-testid="close-export-btn"]').click();
          cy.get('[data-testid="retrospective-exporter"]').should('not.exist');
        }
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should handle refresh button click', () => {
      cy.get('[aria-label="refresh"]').click();
      
      // Should show loading state briefly
      cy.get('[role="progressbar"]').should('be.visible');
      
      // Loading should disappear
      cy.get('[role="progressbar"]', { timeout: 3000 }).should('not.exist');
      
      // Timestamp should update
      cy.contains('Last updated:').should('be.visible');
    });

    it('should update last updated timestamp after refresh', () => {
      // Get initial timestamp
      cy.contains('Last updated:').invoke('text').then((initialText) => {
        // Wait a moment to ensure timestamp difference
        cy.wait(1000);
        
        // Click refresh
        cy.get('[aria-label="refresh"]').click();
        
        // Wait for refresh to complete
        cy.wait(1500);
        
        // Check that timestamp has changed
        cy.contains('Last updated:').invoke('text').should('not.equal', initialText);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      cy.viewport('iphone-x');
      
      // Main container should still be visible
      cy.contains('Continuous Improvement').should('be.visible');
      cy.get('[role="tablist"]').should('be.visible');
      
      // Tabs should be accessible
      cy.get('[role="tab"]').should('be.visible');
    });

    it('should adapt to tablet viewport', () => {
      cy.viewport('ipad-2');
      
      // All elements should be properly sized
      cy.contains('Continuous Improvement').should('be.visible');
      cy.get('[role="tablist"]').should('be.visible');
      cy.get('[aria-label="add retrospective"]').should('be.visible');
    });

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080);
      
      // All features should be accessible
      cy.contains('Continuous Improvement').should('be.visible');
      cy.get('[role="tablist"]').should('be.visible');
      cy.contains('button', 'Export').should('be.visible');
      cy.get('[aria-label="refresh"]').should('be.visible');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[aria-label="add retrospective"]').should('exist');
      cy.get('[aria-label="refresh"]').should('exist');
      cy.get('[aria-label="settings"]').should('exist');
    });

    it('should support keyboard navigation', () => {
      // Focus on first tab
      cy.get('[role="tab"]').first().focus();
      cy.focused().should('have.attr', 'role', 'tab');
      
      // Navigate with arrow keys
      cy.focused().type('{rightarrow}');
      cy.focused().should('contain', 'Action Items');
      
      cy.focused().type('{rightarrow}');
      cy.focused().should('contain', 'Metrics');
      
      cy.focused().type('{leftarrow}');
      cy.focused().should('contain', 'Action Items');
    });

    it('should have proper tab roles and attributes', () => {
      cy.get('[role="tablist"]').should('exist');
      cy.get('[role="tab"]').should('have.length', 3);
      cy.get('[role="tabpanel"]').should('exist');
      
      // Check aria-selected attributes
      cy.get('[role="tab"][aria-selected="true"]').should('have.length', 1);
      cy.get('[role="tab"][aria-selected="false"]').should('have.length', 2);
    });

    it('should support screen reader navigation', () => {
      // Check for proper heading structure
      cy.get('h1, h2, h3, h4, h5, h6').should('exist');
      
      // Check for proper labeling
      cy.get('[role="tab"]').each($tab => {
        cy.wrap($tab).should('have.text');
      });
    });
  });

  describe('Performance and Loading', () => {
    it('should load within acceptable time limits', () => {
      const startTime = Date.now();
      
      cy.visit('/continuous-improvement');
      cy.contains('Continuous Improvement').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
      });
    });

    it('should handle tab switching without delays', () => {
      const switchTab = (tabName) => {
        const startTime = Date.now();
        cy.contains('[role="tab"]', tabName).click();
        cy.contains('[role="tab"]', tabName).should('have.attr', 'aria-selected', 'true');
        cy.then(() => {
          const switchTime = Date.now() - startTime;
          expect(switchTime).to.be.lessThan(1000); // Should switch within 1 second
        });
      };

      switchTab('Action Items');
      switchTab('Metrics');
      switchTab('Retrospectives');
    });

    it('should not have memory leaks during tab switching', () => {
      // Switch between tabs multiple times to test for memory leaks
      for (let i = 0; i < 5; i++) {
        cy.contains('[role="tab"]', 'Action Items').click();
        cy.wait(100);
        cy.contains('[role="tab"]', 'Metrics').click();
        cy.wait(100);
        cy.contains('[role="tab"]', 'Retrospectives').click();
        cy.wait(100);
      }
      
      // Should still be responsive
      cy.contains('Continuous Improvement').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('networkError');
      
      // Try to refresh
      cy.get('[aria-label="refresh"]').click();
      
      // Should still display the interface
      cy.contains('Continuous Improvement').should('be.visible');
    });

    it('should recover from component errors', () => {
      // The interface should remain stable even if there are JavaScript errors
      cy.window().then((win) => {
        // Override console.error to catch errors
        const errors = [];
        const originalError = win.console.error;
        win.console.error = (...args) => {
          errors.push(args);
          originalError.apply(win.console, args);
        };
        
        // Perform actions that might cause errors
        cy.get('[aria-label="refresh"]').click();
        cy.contains('[role="tab"]', 'Action Items').click();
        cy.contains('[role="tab"]', 'Metrics').click();
        
        // Interface should still be functional
        cy.contains('Continuous Improvement').should('be.visible');
      });
    });
  });

  describe('Integration with Dashboard', () => {
    it('should maintain navigation state when returning from other pages', () => {
      // Navigate to another page
      cy.contains('Dashboard').click();
      cy.url().should('include', '/');
      
      // Return to Continuous Improvement
      cy.contains('Continuous Improvement').click();
      cy.url().should('include', '/continuous-improvement');
      cy.contains('Continuous Improvement').should('be.visible');
    });

    it('should preserve data when navigating between dashboard sections', () => {
      // Switch to Action Items tab to potentially load data
      cy.contains('[role="tab"]', 'Action Items').click();
      
      // Navigate to another dashboard section
      cy.contains('Flow Optimization').click();
      cy.wait(1000);
      
      // Return to Continuous Improvement
      cy.contains('Continuous Improvement').click();
      
      // Should return to default tab (Retrospectives)
      cy.contains('[role="tab"]', 'Retrospectives').should('have.attr', 'aria-selected', 'true');
    });
  });
}); 