<link rel="stylesheet" href="../popup-polygon-editor.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">


<div class="button-section">
    <button id="openEditor" class="btn">Open Polygon Editor</button>
</div>

<div id="polygonEditorPopup" class="popup-container">
    <div class="popup-content">
        <div class="popup-header">
            <h2>Polygon Editor</h2>
            <button id="closeEditor" class="close-button"><i class="fas fa-times"></i></button>
        </div>
        <div class="editor-layout">
            <!-- Canvas Container -->
            <div class="canvas-container">
                <canvas id="canvas"></canvas>
            </div>
            <!-- Vertical Controls on the Right -->
            <div class="controls-container">
                <!-- Drawing Controls -->
                <div class="drawing-controls">
                    <button id="drawMask" class="control-button"><i class="fas fa-pen"></i> Draw Mask</button>
                    <button id="clearAll" class="control-button"><i class="fas fa-trash"></i> Clear All</button>
                </div>            
                <!-- Image Adjustment Controls -->
                <div class="image-controls">
                    <h3>Image Adjustments</h3>                
                    <div class="slider-control">
                        <label for="brightnessSlider">Brightness</label>
                        <div class="slider-container">
                            <input type="range" id="brightnessSlider" min="-1" max="1" step="0.01" value="0">
                            <span id="brightnessValue" class="value-display">0.00</span>
                        </div>
                    </div>                
                    <div class="slider-control">
                        <label for="contrastSlider">Contrast</label>
                        <div class="slider-container">
                            <input type="range" id="contrastSlider" min="-1" max="1" step="0.01" value="0">
                            <span id="contrastValue" class="value-display">0.00</span>
                        </div>
                    </div>                   
                    <div class="slider-control">
                        <label for="gammaSlider">Gamma</label>
                        <div class="slider-container">
                            <input type="range" id="gammaSlider" min="0.1" max="2.2" step="0.01" value="1">
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

<!-- Load Fabric.js library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
<!-- Load the core polygon editor functionality first -->
<script src="../polygon-editor-core.js"></script>
<!-- Then load the main popup script -->
<script src="../popup-polygon-editor.js"></script>
