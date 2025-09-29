# Memory Bank Structure

## Overview
This memory bank contains all essential project documentation and context for the Portfolio Management System. It's organized to provide quick access to core information while maintaining detailed documentation in appropriate subfolders.

## Structure

### Core Files (Root Level)
These files are essential for every session and should be read first:

- **`activeContext.md`** - Current work focus, recent changes, next steps
- **`productContext.md`** - Why this project exists, problems it solves, user experience goals
- **`progress.md`** - What works, what's left to build, current status
- **`projectbrief.md`** - Foundation document with core requirements and goals
- **`systemPatterns.md`** - System architecture, technical decisions, design patterns
- **`techContext.md`** - Technologies used, development setup, dependencies

### Subfolders

#### `fixes/` - Technical Fixes and Solutions
Contains detailed documentation of specific technical fixes and solutions:

- **`database-naming-convention-fix.md`** - Database naming convention standardization (September 15, 2025)
- **`cash-flow-pagination-implementation.md`** - Cash flow pagination and chart API format update (September 19, 2025)
- **`snapshot-management-optimization-2024-09-28.md`** - Snapshot Management System optimization with tab refresh fixes and code cleanup (September 28, 2025)

#### `modules/` - Module-Specific Progress
Contains detailed progress documentation for specific modules:

- **`trading-system-progress.md`** - Trading System Module implementation and testing status

## Usage Guidelines

### For New Sessions
1. **Always read core files first** - Start with `activeContext.md` and `progress.md`
2. **Check relevant subfolders** - Look for specific fixes or module details if needed
3. **Update core files** - Keep `activeContext.md` and `progress.md` current

### For Documentation Updates
1. **Core changes** - Update core files (activeContext.md, progress.md)
2. **Specific fixes** - Create new files in `fixes/` folder
3. **Module progress** - Update or create files in `modules/` folder

### File Naming Conventions
- **Core files**: Use descriptive names (activeContext.md, progress.md)
- **Fixes**: Use descriptive names with date (database-naming-convention-fix.md)
- **Modules**: Use module name + progress (trading-system-progress.md)

## Memory Bank Principles

### 1. Core Files Priority
Core files contain the most important information and should be maintained as the single source of truth.

### 2. Detailed Documentation
Subfolders contain detailed documentation that supports but doesn't replace core files.

### 3. Consistency
All files should follow the same structure and update patterns.

### 4. Completeness
Every significant change should be documented in the appropriate location.

## Maintenance

### Regular Updates
- Update `activeContext.md` after each significant work session
- Update `progress.md` when completing major milestones
- Create new files in subfolders for significant fixes or module work

### File Organization
- Keep core files focused and concise
- Move detailed documentation to appropriate subfolders
- Maintain clear references between files

## History

### September 15, 2025
- **Restructured** memory bank with subfolder organization
- **Moved** `database-naming-convention-fix.md` to `fixes/` folder
- **Moved** `trading-system-progress.md` to `modules/` folder
- **Created** this README.md for structure documentation
