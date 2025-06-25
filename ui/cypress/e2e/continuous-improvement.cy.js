describe('Continuous Improvement - Agent Events & Health Panel', () => {
  beforeEach(() => {
    cy.visit('/dashboard/continuous-improvement');
    // Optionally mock API responses for stability
    cy.intercept('GET', '/api/ai-agents/activities*', { fixture: 'agent-activities.json' }).as('getAgentActivities');
    cy.intercept('GET', '/api/ai-agents', { fixture: 'ai-agents.json' }).as('getAgents');
  });

  it('shows the Agent Events & Health panel', () => {
    cy.contains('Recent AI Agent Events & Health').should('be.visible');
  });

  it('displays a list of recent agent events', () => {
    cy.wait('@getAgentActivities');
    cy.get('li').should('contain.text', 'status_change');
  });

  it('displays agent health cards', () => {
    cy.wait('@getAgents');
    cy.get('div').should('contain.text', 'Task Optimizer');
    cy.get('div').should('contain.text', 'Story Estimator');
  });

  it('filters events by type', () => {
    cy.get('[aria-label="Event Type"]').click();
    cy.get('li').contains('recommendation').click();
    cy.get('li').should('contain.text', 'recommendation');
    cy.get('li').should('not.contain.text', 'status_change');
  });

  it('filters events by agent', () => {
    cy.get('[aria-label="Agent"]').click();
    cy.get('li').contains('Task Optimizer').click();
    cy.get('li').should('contain.text', 'Task Optimizer');
    cy.get('li').should('not.contain.text', 'Story Estimator');
  });

  it('refresh button reloads data', () => {
    cy.get('[aria-label="Refresh events"]').click();
    cy.wait('@getAgentActivities');
    cy.contains('Recent AI Agent Events & Health').should('be.visible');
  });
}); 