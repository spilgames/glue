version 0.9.6
March 11, 2014

- Added sorting type stable to prevent sorting issues in Google Chrome

version 0.9.5
March 7, 2014

- Animatable: animations now start at frame one instead of zero
- Added Scenegraph functionality by adding child objects to BaseObject
- Fixed: Updating rectangle after the origin is changed
- Fixed: Capping angles on rotations
- Fixed: Boundingbox is also updated when scalable is used
- Added special asset type for loading Spinable plugin assets
- Added functionality to delete objects from game screens
- Optimized game drawing order for better sorting results

version 0.9.4
February 26, 2014

- Refactored BaseObject and multiple Components to work together

version 0.9.3
February 23, 2014

- Added loopcount to Animatable component
- Added loop finished callback function to Animatable component

version 0.9.2
February 21, 2014

- Fixed blinking up to an alpha of 1 in fadable component
- Fixed being able to load a Glue game without any assets
- Added the Glue logo in base64 format

version 0.9.1
February 19, 2014

- Patch for calling this.getDimension in scalable
- Patch for checking config.sort settings

version 0.9.0 
February 19, 2014

- Added register and deregister functionality to BaseObject, so components can register themselves automatically and you can overwrite these if needed
- Added the BaseComponent which contains base logic like registering
- Added support for loading audio sprites to the loader

version 0.8.0  
February 10, 2014

- Added SAT
- Added Kineticable component
- Added Math circle
- Added Spatial Hashmap
- Added Nigo's Cave game to examples to demo SAT and Physics
- Added JSON and Binary files to Loader
- Added the Howler plugin for playing audio cross device
- Added Tweenable component (Robbert Penner's easing equations)
- Updated documentation

version 0.7.0  
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

version 0.6.0  
December 31, 2013

- Support added for alpha fading.
- Moved the Visible dependency of the Animatable to the module itself instead of implementation side
- Added sound module.
- Added rotatable component.
- Added scalable component.
- Fixed unit test enviroment.
- Added a math module for defining Polygons.
- Added fadable component.

version 0.5.0  
December 29, 2013

- Fix for zindex of visibles so they are sorted correctly in all cases
- Fixed start frame for animatables so it starts at one (more intuitive)
- Using Sugar removeObject for removing objects from game loop

version 0.4.0  
December 20, 2013

- Added support for position animations (Movable component)
- Created average framerate counter
- Added a maximum time to deltaT, fixes position issues

version 0.3.0  
December 18, 2013

- Debugbar style should come with glue stylesheet
- Made visible required for animatables
- Added pointerUp support for clickables

version 0.2.0  
December 17, 2013

- Glue Math
  - Added iterate method to math/matrix and refactor m x n

- Fixed animationframe fallback bug for stock Android browsers

version 0.1.0    
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