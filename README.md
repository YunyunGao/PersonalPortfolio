# 🌟 Personal Portfolio Page

## 🚧 Project Under Construction 🚧

I'm currently working hard to showcase my best self for both academia and industry!  
Please check back soon for exciting updates.

Thanks for visiting! 🙌

---

## 📌 Changelog v0.0.6

- Added Project 7
- Added interactive beamstop mask editor with polygon drawing capabilities
- Added performance comparison table using iframe
- Enhanced project description with scientific context and visualizations
- Added links to published paper and poster
- Improved responsiveness for complex scientific figures

## 📌 Changelog v0.0.5

- Added project 6
- Enhanced interactive elements with SVG animations
- Added hover effects for data visualization
- Improved code documentation and examples

## 📌 Changelog v0.0.4

- Added project 5
- Added image popup functionality for better viewing
- Enhanced figure layouts and captions
- Improved scientific content presentation
- Implemented consistent styling across projects

## 📌 Changelog v0.0.3

- Added project 4
- Added typed.js for dynamic text animation on homepage
- Enhanced image hover effects and transitions
- Added detailed figure captions with scientific context
- Implemented custom CSS for better text readability

## 📌 Changelog v0.0.2

- Finished project 1-3

## 📌 Changelog v0.0.1

- Modified Jekyll template
- Added CSS animations for hyperlinks
- Included personal roadmap section
- Added first reference

# Popup Polygon Editor

A modern, responsive polygon editor implemented as a popup application. This editor allows users to create and manipulate polygons on images, with support for synchronizing polygons across quadrants, editing vertices, and adjusting image properties.

## Features

- **Popup Interface**: Opens as an overlay without navigating away from the current page
- **Interactive Polygon Drawing**: Draw precise polygons with point-by-point placement
- **Vertex Editing**: Double-click on polygons to enter edit mode and manipulate individual vertices
- **Quadrant Synchronization**: Changes to a polygon in one quadrant are reflected in other quadrants
- **Image Adjustments**: Control brightness, contrast, and gamma of the background image
- **Responsive Design**: Works across various screen sizes
- **Modern UI**: Clean, minimalist interface with intuitive controls

## Implementation

### Files Structure

- `index.html`: Demo page showing integration
- `popup-polygon-editor.html`: HTML structure for the popup editor (not required if integrated into a page)
- `popup-polygon-editor.css`: Styling for the popup and controls
- `popup-polygon-editor.js`: Main JavaScript file handling the popup functionality and canvas initialization
- `polygon-editor-core.js`: Core polygon editing functionality

### Getting Started

1. Include the required CSS and JavaScript files in your project:

```html
<!-- In the head section -->
<link rel="stylesheet" href="popup-polygon-editor.css" />
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>

<!-- Before closing body tag -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
<script src="polygon-editor-core.js"></script>
<script src="popup-polygon-editor.js"></script>
```

2. Add the popup HTML structure to your page:

```html
<div id="polygonEditorPopup" class="popup-container">
  <div class="popup-content">
    <div class="popup-header">
      <h2>Polygon Editor</h2>
      <button id="closeEditor" class="close-button">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="editor-layout">
      <!-- Canvas Container -->
      <div class="canvas-container">
        <canvas id="canvas"></canvas>
      </div>

      <!-- Controls -->
      <div class="controls-container">
        <!-- Drawing Controls -->
        <div class="drawing-controls">
          <button id="drawMask" class="control-button">
            <i class="fas fa-pen"></i> Draw Mask
          </button>
          <button id="clearAll" class="control-button">
            <i class="fas fa-trash"></i> Clear All
          </button>
        </div>

        <!-- Image Adjustment Controls -->
        <div class="image-controls">
          <h3>Image Adjustments</h3>

          <div class="slider-control">
            <label for="brightnessSlider">Brightness</label>
            <div class="slider-container">
              <input
                type="range"
                id="brightnessSlider"
                min="-1"
                max="1"
                step="0.01"
                value="0"
              />
              <span id="brightnessValue" class="value-display">0.00</span>
            </div>
          </div>

          <div class="slider-control">
            <label for="contrastSlider">Contrast</label>
            <div class="slider-container">
              <input
                type="range"
                id="contrastSlider"
                min="-1"
                max="1"
                step="0.01"
                value="0"
              />
              <span id="contrastValue" class="value-display">0.00</span>
            </div>
          </div>

          <div class="slider-control">
            <label for="gammaSlider">Gamma</label>
            <div class="slider-container">
              <input
                type="range"
                id="gammaSlider"
                min="0.1"
                max="2.2"
                step="0.01"
                value="1"
              />
              <span id="gammaValue" class="value-display">1.00</span>
            </div>
          </div>
        </div>

        <!-- Tips Section -->
        <div class="tips-section">
          <h3>Tips</h3>
          <ul>
            <li>Click "Draw Mask" to start drawing polygons</li>
            <li>Double-click on a polygon to edit vertices</li>
            <li>Click outside a polygon to exit edit mode</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
```

3. Add a button to open the editor:

```html
<button id="openEditor" class="open-button">Open Polygon Editor</button>
```

### Customization

#### Changing the Background Image

Update the `loadBackgroundImage` function in `popup-polygon-editor.js`:

```javascript
function loadBackgroundImage() {
  fabric.Image.fromURL("/path/to/your/image.jpg", function (img) {
    // ...existing code...
  });
}
```

#### Modifying Polygon Appearance

To change the appearance of polygons, modify the settings in the `createPolygonInQuadrant` function in `polygon-editor-core.js`:

```javascript
const polygon = new fabric.Polygon(points, {
  fill: "rgba(0, 0, 255, 0.3)", // Change fill color and opacity
  stroke: "blue", // Change border color
  strokeWidth: 2, // Change border width
  // ...other settings...
});
```

#### Adjusting Canvas Size

The canvas size is determined in the `initializeCanvas` function in `popup-polygon-editor.js`. Modify it to match your needs:

```javascript
function initializeCanvas() {
  // ...existing code...
  const canvasWidth = Math.min(800, containerWidth); // Adjust max width
  const canvasHeight = Math.min(690, containerHeight); // Adjust max height
  // ...existing code...
}
```

## How It Works

### Drawing Polygons

1. Click the "Draw Mask" button to enter drawing mode
2. Click on the canvas to add polygon vertices
3. Continue clicking to add more points
4. Double-click or click near the starting point to complete the polygon
5. The polygon will be created in all quadrants of the image

### Editing Polygons

1. Double-click on a polygon to enter edit mode
2. Drag the vertex control points to modify the polygon shape
3. Changes will be synchronized across all quadrants
4. Click outside the polygon to exit edit mode

### Adjusting Image

Use the sliders on the right side to adjust:

- Brightness: Lighten or darken the image
- Contrast: Increase or decrease the difference between light and dark areas
- Gamma: Adjust the midtone values of the image

## Dependencies

- [Fabric.js](http://fabricjs.com/) - JavaScript canvas library
- [Font Awesome](https://fontawesome.com/) - Icon library

## Browser Support

This editor works in all modern browsers that support HTML5 Canvas:

- Chrome
- Firefox
- Edge
- Safari

## License

MIT License
