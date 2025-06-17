# Teamwork UI Styles

This directory contains all the SCSS styles extracted from `ai_dev_planning_workflow.html` and organized into a component-based architecture.

## Directory Structure

```
styles/
├── components/        # Component-specific styles
│   ├── _buttons.scss
│   ├── _cards.scss
│   ├── _forms.scss
│   ├── _modals.scss
│   └── _progress.scss
├── features/          # Feature-specific styles
│   ├── _board.scss
│   ├── _collaborative.scss
│   ├── _optimization.scss
│   └── _sprint.scss
├── layout/            # Layout styles
│   ├── _containers.scss
│   ├── _flexbox.scss
│   ├── _grid.scss
│   ├── _header.scss
│   └── _navigation.scss
├── utilities/         # Utility classes
│   ├── _helpers.scss
│   └── _responsive.scss
├── variables/         # SCSS variables
│   ├── _breakpoints.scss
│   ├── _colors.scss
│   ├── _mixins.scss
│   ├── _spacing.scss
│   ├── _typography.scss
│   └── _z-index.scss
└── main.scss          # Main entry point
```

## Compiling SCSS to CSS

To compile the SCSS files to CSS, run the following command from the project root:

```bash
# Using npm script (if configured)
npm run build:styles

# Or using node-sass directly
npx node-sass ui/styles/main.scss ui/styles/main.css --output-style compressed
```

## Usage

Link the compiled CSS file in your HTML:

```html
<link rel="stylesheet" href="styles/main.css">
```

## Notes

- The styles have been organized following a component-based architecture
- All variables are separated by concern (colors, typography, spacing, etc.)
- Utility classes for common styling needs are provided in the utilities directory
