import React from 'react';
import PropTypes from 'prop-types';

/**
 * Main semantic layout wrapper
 * Provides the primary application structure with proper ARIA landmarks
 */
export function AppLayout({ children, className = '', ...props }) {
  return (
    <div 
      className={`app-layout ${className}`}
      role="application"
      aria-label="Task Master Application"
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Header component with banner landmark
 */
export function AppHeader({ children, className = '', showSkipLinks = true, ...props }) {
  return (
    <header 
      className={`app-header ${className}`}
      role="banner"
      {...props}
    >
      {showSkipLinks && <SkipLinks />}
      {children}
    </header>
  );
}

/**
 * Navigation component with navigation landmark
 */
export function AppNavigation({ 
  children, 
  className = '', 
  label = 'Main navigation',
  orientation = 'horizontal',
  ...props 
}) {
  return (
    <nav 
      className={`app-navigation ${className}`}
      role="navigation"
      aria-label={label}
      aria-orientation={orientation}
      {...props}
    >
      {children}
    </nav>
  );
}

/**
 * Main content area with main landmark
 */
export function AppMain({ 
  children, 
  className = '', 
  label = 'Main content',
  ...props 
}) {
  return (
    <main 
      id="main-content"
      className={`app-main ${className}`}
      role="main"
      aria-label={label}
      tabIndex="-1"
      {...props}
    >
      {children}
    </main>
  );
}

/**
 * Sidebar/aside component with complementary landmark
 */
export function AppSidebar({ 
  children, 
  className = '', 
  label = 'Sidebar',
  ...props 
}) {
  return (
    <aside 
      className={`app-sidebar ${className}`}
      role="complementary"
      aria-label={label}
      {...props}
    >
      {children}
    </aside>
  );
}

/**
 * Footer component with contentinfo landmark
 */
export function AppFooter({ children, className = '', ...props }) {
  return (
    <footer 
      className={`app-footer ${className}`}
      role="contentinfo"
      {...props}
    >
      {children}
    </footer>
  );
}

/**
 * Generic section with proper heading hierarchy
 */
export function AppSection({ 
  children, 
  className = '', 
  heading,
  headingLevel = 2,
  label,
  ...props 
}) {
  const HeadingTag = `h${Math.min(Math.max(headingLevel, 1), 6)}`;
  
  return (
    <section 
      className={`app-section ${className}`}
      role="region"
      aria-label={label}
      {...props}
    >
      {heading && (
        <HeadingTag 
          className="app-section__heading"
          aria-level={headingLevel}
        >
          {heading}
        </HeadingTag>
      )}
      {children}
    </section>
  );
}

/**
 * Article component for standalone content
 */
export function AppArticle({ 
  children, 
  className = '', 
  heading,
  headingLevel = 2,
  ...props 
}) {
  const HeadingTag = `h${Math.min(Math.max(headingLevel, 1), 6)}`;
  
  return (
    <article 
      className={`app-article ${className}`}
      {...props}
    >
      {heading && (
        <HeadingTag className="app-article__heading">
          {heading}
        </HeadingTag>
      )}
      {children}
    </article>
  );
}

/**
 * Skip links for keyboard navigation
 */
export function SkipLinks({ className = '' }) {
  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#sidebar-navigation', text: 'Skip to navigation' },
    { href: '#task-list', text: 'Skip to task list' },
    { href: '#search-input', text: 'Skip to search' }
  ];

  return (
    <div className={`skip-links ${className}`}>
      {skipLinks.map(({ href, text }) => (
        <a
          key={href}
          href={href}
          className="skip-link"
          onFocus={(e) => e.target.classList.add('skip-link--visible')}
          onBlur={(e) => e.target.classList.remove('skip-link--visible')}
        >
          {text}
        </a>
      ))}
    </div>
  );
}

/**
 * Accessible list component
 */
export function AccessibleList({
  children,
  className = '',
  label,
  ordered = false,
  role = 'list',
  ...props
}) {
  const ListTag = ordered ? 'ol' : 'ul';
  
  return (
    <ListTag
      className={`accessible-list ${className}`}
      role={role}
      aria-label={label}
      {...props}
    >
      {children}
    </ListTag>
  );
}

/**
 * Accessible list item component
 */
export function AccessibleListItem({
  children,
  className = '',
  level,
  position,
  setSize,
  selected,
  ...props
}) {
  const ariaProps = {};
  
  if (level !== undefined) ariaProps['aria-level'] = level;
  if (position !== undefined) ariaProps['aria-posinset'] = position;
  if (setSize !== undefined) ariaProps['aria-setsize'] = setSize;
  if (selected !== undefined) ariaProps['aria-selected'] = selected;

  return (
    <li
      className={`accessible-list-item ${className}`}
      role="listitem"
      {...ariaProps}
      {...props}
    >
      {children}
    </li>
  );
}

/**
 * Accessible button component with proper ARIA support
 */
export function AccessibleButton({
  children,
  className = '',
  variant = 'primary',
  pressed,
  expanded,
  controls,
  describedBy,
  disabled = false,
  ...props
}) {
  const ariaProps = {};
  
  if (pressed !== undefined) ariaProps['aria-pressed'] = pressed;
  if (expanded !== undefined) ariaProps['aria-expanded'] = expanded;
  if (controls) ariaProps['aria-controls'] = controls;
  if (describedBy) ariaProps['aria-describedby'] = describedBy;

  return (
    <button
      className={`accessible-button accessible-button--${variant} ${className}`}
      disabled={disabled}
      aria-disabled={disabled}
      {...ariaProps}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Accessible form field wrapper
 */
export function AccessibleField({
  children,
  label,
  description,
  error,
  required = false,
  className = '',
  fieldId,
  ...props
}) {
  const labelId = `${fieldId}-label`;
  const descId = description ? `${fieldId}-desc` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  
  const describedBy = [descId, errorId].filter(Boolean).join(' ');

  return (
    <div 
      className={`accessible-field ${error ? 'accessible-field--error' : ''} ${className}`}
      {...props}
    >
      {label && (
        <label 
          id={labelId}
          htmlFor={fieldId}
          className="accessible-field__label"
        >
          {label}
          {required && (
            <span 
              aria-label="required"
              className="accessible-field__required"
            >
              *
            </span>
          )}
        </label>
      )}
      
      {description && (
        <div 
          id={descId}
          className="accessible-field__description"
        >
          {description}
        </div>
      )}
      
      <div className="accessible-field__input">
        {React.cloneElement(children, {
          id: fieldId,
          'aria-labelledby': labelId,
          'aria-describedby': describedBy || undefined,
          'aria-required': required,
          'aria-invalid': !!error,
          required
        })}
      </div>
      
      {error && (
        <div 
          id={errorId}
          className="accessible-field__error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Accessible heading component with proper level management
 */
export function AccessibleHeading({
  children,
  level = 2,
  className = '',
  ...props
}) {
  const HeadingTag = `h${Math.min(Math.max(level, 1), 6)}`;
  
  return (
    <HeadingTag
      className={`accessible-heading accessible-heading--level-${level} ${className}`}
      aria-level={level}
      {...props}
    >
      {children}
    </HeadingTag>
  );
}

/**
 * Status/announcement region for screen readers
 */
export function StatusRegion({
  children,
  className = '',
  live = 'polite',
  atomic = true,
  ...props
}) {
  return (
    <div
      className={`status-region ${className}`}
      role="status"
      aria-live={live}
      aria-atomic={atomic}
      {...props}
    >
      {children}
    </div>
  );
}

// PropTypes for better development experience
AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

AppHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  showSkipLinks: PropTypes.bool
};

AppNavigation.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  label: PropTypes.string,
  orientation: PropTypes.oneOf(['horizontal', 'vertical'])
};

AppMain.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  label: PropTypes.string
};

AppSidebar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  label: PropTypes.string
};

AppFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

AppSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  heading: PropTypes.string,
  headingLevel: PropTypes.number,
  label: PropTypes.string
};

AccessibleButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.string,
  pressed: PropTypes.bool,
  expanded: PropTypes.bool,
  controls: PropTypes.string,
  describedBy: PropTypes.string,
  disabled: PropTypes.bool
};

AccessibleField.propTypes = {
  children: PropTypes.element.isRequired,
  label: PropTypes.string,
  description: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  fieldId: PropTypes.string.isRequired
};

AccessibleHeading.propTypes = {
  children: PropTypes.node.isRequired,
  level: PropTypes.number,
  className: PropTypes.string
};

StatusRegion.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  live: PropTypes.oneOf(['off', 'polite', 'assertive']),
  atomic: PropTypes.bool
}; 