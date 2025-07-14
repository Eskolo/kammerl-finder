# Kammerl Finder

A web-based 3D visualization proof of concept tool for locating and highlighting storage boxes im "Kammerl", using [three.js](https://threejs.org/). Users can select a box from a dropdown to highlight it and smoothly move the camera to its location.

## Features

- Loads a 3D model (`kammerl.glb`) and overlays highlight boxes for each storage location.
- Dropdown menu to select and highlight a specific box.
- Smooth camera transitions to selected boxes.
- WASD keyboard controls for manual camera movement.

## Getting Started

1. **Install a local server** (for example, [http-server](https://www.npmjs.com/package/http-server)) or use any static file server.
3. Start the server in the project directory:
   ```sh
   npx http-server .
   ```
4. Open [http://localhost:8080](http://localhost:8080) (or the port your server uses) in your browser.

## Usage

- Use the dropdown to select a box. The corresponding box will be highlighted, and the camera will move to focus on it.
- Use `W`, `A`, `S`, `D` keys to move the camera manually.
- Use mouse to orbit, pan, and zoom.

## Dependencies

- [three.js](https://threejs.org/) (loaded via CDN)
- [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)

## Customization

- To add or modify boxes, edit `boxCoords.json`.
- To change the 3D model, replace `public/kammerl.glb`.