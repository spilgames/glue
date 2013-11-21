HTML5 Glue Engine
=================

# Generic HTML5 engine and abstraction layer

Copyright © 2013 - SpilGames

License:
https://github.com/spilgames/5-glue-engine/blob/master/LICENSE

## Learn the tech

### What is Glue?

Glue is an abstraction module between HTML5 games and HTML5 engines. In addition to that Glue is also an engine by itself. Glue offers a game API that can be used to create HTML5 games. The implementation of this API can differ. To provide the functionality, Glue can delegates tasks to open source HTML5 engines by using engine adapters.Currently the API has an adapter for MelonJS. More adapters will be added as Glue evolves.

#### Glue modules

The Glue API also provides access to a SpilGames adapter which offers Glue modules created by SpilGames. Currently we have the following Glue modules available:
- Audio51: Provides a way to play audio on multiple devices
- Sugar: Provides utility functions to enhance the use of JavaScript
- Entity behaviours:
  - Draggable
  - Droptarget
  - Clickable
  - Hoverable
- Managers:
  - Camera manager
- UI:
  - Scroll area
  - Scroll button
