# Changelog

### 0.2.0
- Added hover tooltips
- Added support for context menus
- Added support for zoom control buttons
- Added support for saving a graph to png
- Added support for dashed lines for edges
- Added ability to select edge labels
- Added node and edge templates to make configuration easier
- Fixed bug where zoom to fit would not center properly
- Fixed bug where labels would not be positioned correctly for multi-edges
- Fixed bug in Tree layout that would sometimes create strange trees in complex graphs.
- Fixed issue where coordinates would be incorrect in events fired by the renderer.
- Fixed issue where lasso selections would cause freezing lag
- Updated data structures for edges and nodes
- Updated several functions and classes to accept a single options argument with named properties instead of many arguments in arbitrary order
- Improved renderer performance and structure
- Centralized more configuration in the env file
- Created a development playground for feature testing
- Switched from Rollup to Vite
- Switched from Jest to Vitest
- Updated Eslint to latest version
- Updated Prettier to latest version
- Updated Pixi to latest version
- Improved type safety

### 0.1.9
- Fixed broken image links

### 0.1.8
- Fixed graphical glitch in renderer that would sometimes occur on some operating systems

### 0.1.7
- Improved rendering of shapes and positioning / sizing of their content

### 0.1.6
- Improvements and bug fixes for tree layout

### 0.1.5
- Added "orthogonal" line type to renderer
- Added "cubicbezier" line type to renderer

### 0.1.4
- Added new marker types
- Added tree layout
- Added force layout
- Added connections layout

### 0.1.3
- Several bug fixes

### 0.1.2

- Implemented layout engine
- Implemented data manager
- Implemented community detection
- Implemented path finding
- Implemented traversal functions DFS and BFS
- Implemented WebGL Renderer
- Added documentation
- Created layout component NBody
- Created layout component Link
- Created layout component Collision
- Created layout component Attraction (Gravity)
- Created layout component Hierarchy
- Created layout component Grid
- Created layout component Matrix
- Created layout component Cluster
- Created layout component Radial
- Created layout component Fan
- Created layout component Center
- Created layout component Bounding Box
- Created layout component Animation
