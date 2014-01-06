version 0.0.7 
January 6, 2014

- Added Screen module to be able to manage game screens which can contain game objects
- Added Director module which enables you to switch between scenes and save screen states
- Added a plugin for Spine to be able to create 2D skeleton animations
- Changed Component to BaseObject for clarity
- Updates regarding setting an origin for rotation and scaling in visible the components themselves
- Added check for dom ready to Glue Game module so it works by default
- Moved and updated documentation pages
- Fixed returning the scaled bounding boxes when an object is scaled using the Scalable component
- Fixed the hit detection in DropTarget component to be compatible with Animatable components

version 0.0.6 
December 31, 2013

- Support added for alpha fading.
- Moved the Visible dependency of the Animatable to the module itself instead of implementation side
- Added sound module.
- Added rotatable component.
- Added scalable component.
- Fixed unit test enviroment.
- Added a math module for defining Polygons.
- Added fadable component.

version 0.0.5 
December 29, 2013

- Fix for zindex of visibles so they are sorted correctly in all cases
- Fixed start frame for animatables so it starts at one (more intuitive)
- Using Sugar removeObject for removing objects from game loop

version 0.0.4 
December 20, 2013

- Added support for position animations (Movable component)
- Created average framerate counter
- Added a maximum time to deltaT, fixes position issues

version 0.0.3 
December 18, 2013

- Debugbar style should come with glue stylesheet
- Made visible required for animatables
- Added pointerUp support for clickables

version 0.0.2 
December 17, 2013

- Glue Math
  - Added iterate method to math/matrix and refactor m x n

- Fixed animationframe fallback bug for stock Android browsers

version 0.0.1   
December 6, 2013 - Inception

- Glue Game
  - Component management
  - System events
  - Browser events

- Components
  - Base
  - Animatable
  - Clickable
  - Draggable
  - Droptarget
  - Hoverable
  - Visible

- Math
  - Dimension
  - Matrix
  - Rectangle
  - Vector

- Examples
  - Drag & Drop
    - Basic
    - Droptarget
    - Multi
  - Animation
    - Animatable
    - Simple movement
  - Games
    - Inspector Dan
    - Jailbreaker

- Asset loader
- Sugar