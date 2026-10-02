# Skybound Modern Menu Build

This build preserves the existing working simulator/aircraft and changes the player flow and HUD:

1. Title screen with START FLIGHT
2. Interactive fictional world map to choose the departure airport
3. Aircraft hangar selection
4. Straight into the simulator

During flight, the large side panels are minimised by default. A compact dock opens ATC, COM radio, map, passenger/career info, throttle and audio one at a time. The × button closes the active panel. MENU reloads the simulator back to the new title screen.

Upload the full project contents to GitHub Pages and keep the `css` and `js` folders intact.


## v1.1 boarding fix
Passenger boarding now uses the actual departure gate assigned by the modern start menu instead of the old fixed A01 coordinates.
