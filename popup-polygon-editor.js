// DOM Elements
const openEditorBtn = document.getElementById('openEditor');
const closeEditorBtn = document.getElementById('closeEditor');
const popupContainer = document.getElementById('polygonEditorPopup');
const drawMaskBtn = document.getElementById('drawMask');
const clearAllBtn = document.getElementById('clearAll');

// Canvas Variables
let canvas;
let polygonGroups = [];
let currentGroup = null;
let isDrawing = false;
let isEditing = false;
let points = [];
let backgroundImage = null;
let drawingPolygons = [];
let isSyncing = false;
let drawingMode = false;
let activeQuadrant = null;
let temporaryLine = null;
let activeLine = null;

// Image adjustment filters
let brightnessFilter, contrastFilter, gammaFilter;

// Calculate quadrant boundaries
const quadrantWidth = 400;
const quadrantHeight = 345;

// Popup Functionality
openEditorBtn.addEventListener('click', openEditor);
closeEditorBtn.addEventListener('click', closeEditor);

function openEditor() {
    popupContainer.classList.add('active');
    
    // Initialize canvas when popup is opened to ensure correct dimensions
    if (!canvas) {
        initializeCanvas();
    } else {
        // If canvas already exists, just update its dimensions
        refreshCanvasDimensions();
    }
}

function closeEditor() {
    popupContainer.classList.remove('active');
}

// Initialize Fabric.js canvas
function initializeCanvas() {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) {
        console.error('ERROR: Canvas container not found!');
        return;
    }

    // Get container dimensions
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    
    // Calculate canvas dimensions
    const canvasWidth = Math.min(800, containerWidth);
    const canvasHeight = Math.min(690, containerHeight);

    if (canvasWidth <= 0 || canvasHeight <= 0) {
        console.error('ERROR: Calculated canvas dimensions are invalid.');
        return;
    }

    // Create canvas with proper dimensions
    canvas = new fabric.Canvas('canvas', {
        width: canvasWidth,
        height: canvasHeight,
        selection: false,
        objectCaching: false,
        renderOnAddRemove: false,
        preserveObjectStacking: true
    });

    // Ensure canvas elements are properly positioned
    if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.backgroundColor = 'transparent';
        canvas.upperCanvasEl.style.position = 'absolute';
        canvas.upperCanvasEl.style.top = '0';
        canvas.upperCanvasEl.style.left = '0';
        canvas.upperCanvasEl.style.width = '100%';
        canvas.upperCanvasEl.style.height = '100%';
    }

    if (canvas.lowerCanvasEl) {
        canvas.lowerCanvasEl.style.position = 'absolute';
        canvas.lowerCanvasEl.style.top = '0';
        canvas.lowerCanvasEl.style.left = '0';
        canvas.lowerCanvasEl.style.width = '100%';
        canvas.lowerCanvasEl.style.height = '100%';
    }

    // Set up canvas container
    canvas.wrapperEl.style.position = 'relative';
    canvas.wrapperEl.style.width = '100%';
    canvas.wrapperEl.style.height = '100%';
    
    // --- Re-enable functionality --- 
    loadBackgroundImage();
    setupCanvasEventListeners();
    setupCanvasDrawingHandlers();
    setupImageControlListeners();
    // --- End Re-enable --- 
    
    // Initialize global mouse handlers for out-of-browser events
    if (typeof setupGlobalMouseHandlers === 'function') {
        setTimeout(() => {
            setupGlobalMouseHandlers();
        }, 100);
    } else {
        console.warn('Warning: setupGlobalMouseHandlers function not found');
    }
    
    log('Canvas initialization complete.');
}

// Update canvas dimensions if window resizes
function refreshCanvasDimensions() {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer || !canvas) return;

    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    
    const canvasWidth = Math.min(800, containerWidth);
    const canvasHeight = Math.min(690, containerHeight);
    
    // Update canvas dimensions
    canvas.setDimensions({ 
        width: canvasWidth, 
        height: canvasHeight 
    });
    
    // Update wrapper dimensions
    canvas.wrapperEl.style.width = '100%';
    canvas.wrapperEl.style.height = '100%';
    
    // Update both canvas layers
    if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.width = '100%';
        canvas.upperCanvasEl.style.height = '100%';
    }
    if (canvas.lowerCanvasEl) {
        canvas.lowerCanvasEl.style.width = '100%';
        canvas.lowerCanvasEl.style.height = '100%';
    }
    
    if (backgroundImage) {
        canvas.add(backgroundImage);
        backgroundImage.moveTo(0);
        canvas.renderAll();
        canvas.calcOffset();
    } else {
        canvas.renderAll();
        canvas.calcOffset();
    }
}

// Restore Image Loading (fromURL method) and Filter Logic
function loadBackgroundImage() {
    log('Loading background image...');
    const imagePath = '/images/plain.png';

    fabric.Image.fromURL(imagePath, function(img) {
        img.scaleToWidth(canvas.width);
        
        canvas.add(img);
        img.moveTo(0); 
        
        img.selectable = false;
        img.evented = false; 
        
        backgroundImage = img; 

        setTimeout(function() {
            canvas.calcOffset();
            canvas.renderAll();
            initializeAndApplyFilters();
        }, 100);

    }, {
        crossOrigin: 'anonymous' 
    });
}

function initializeAndApplyFilters() {
    if (!backgroundImage) {
        console.warn('Cannot apply filters: backgroundImage not available.');
        return;
    }
    
    brightnessFilter = new fabric.Image.filters.Brightness({ brightness: 0 });
    contrastFilter = new fabric.Image.filters.Contrast({ contrast: 0 });
    gammaFilter = new fabric.Image.filters.Gamma({ gamma: [1, 1, 1] });
    
    backgroundImage.filters = []; 
    backgroundImage.filters.push(brightnessFilter, contrastFilter, gammaFilter);
}

function applyBackgroundFilters() {
    if (backgroundImage && backgroundImage.filters && backgroundImage.filters.length > 0) {
        backgroundImage.applyFilters();
        setTimeout(function() {
            canvas.calcOffset();
            canvas.renderAll();
        }, 100); 
    } else if (backgroundImage) {
    } else {
    }
}
// --- End Restore --- 

// Setup Image Control Listeners (Restore this function)
function setupImageControlListeners() {
    const brightnessSlider = document.getElementById('brightnessSlider');
    const contrastSlider = document.getElementById('contrastSlider');
    const gammaSlider = document.getElementById('gammaSlider');
    const brightnessValueSpan = document.getElementById('brightnessValue');
    const contrastValueSpan = document.getElementById('contrastValue');
    const gammaValueSpan = document.getElementById('gammaValue');
    
    brightnessSlider.addEventListener('input', function() {
        if (!backgroundImage) return;
        const value = parseFloat(this.value);
        brightnessFilter.brightness = value;
        brightnessValueSpan.textContent = value.toFixed(2);
        applyBackgroundFilters();
    });
    
    contrastSlider.addEventListener('input', function() {
        if (!backgroundImage) return;
        const value = parseFloat(this.value);
        contrastFilter.contrast = value;
        contrastValueSpan.textContent = value.toFixed(2);
        applyBackgroundFilters();
    });
    
    gammaSlider.addEventListener('input', function() {
        if (!backgroundImage) return;
        const value = parseFloat(this.value);
        // Ensure gamma is array [R, G, B]
        gammaFilter.gamma = [value, value, value]; 
        gammaValueSpan.textContent = value.toFixed(2);
        applyBackgroundFilters();
    });
}

// Setup Canvas Event Listeners (Restore full logic)
function setupCanvasEventListeners() {
    // Draw Mask button
    drawMaskBtn.addEventListener('click', function() {
        if (drawingMode) {
            exitDrawingMode();
        } else {
            enterDrawingMode();
        }
    });
    
    // Clear All button
    clearAllBtn.addEventListener('click', function() {
        if (drawingMode) {
            exitDrawingMode();
        }
        
        canvas.clear();
        if (backgroundImage) {
            canvas.add(backgroundImage);
            backgroundImage.moveTo(0);
        } else {
            console.warn('Cannot re-add background image, it was not loaded.')
        }
        
        polygonGroups = [];
        currentGroup = null;
        canvas.renderAll(); 
    });

    // --- ADD LOGGING FOR SELECTION ---
    canvas.on('selection:updated', function(e) {
        if (e.selected && e.selected.length === 1) {
            const selectedObject = e.selected[0];
            // Check if it's one of our polygons (using a known property like groupId)
            if (selectedObject.groupId !== undefined) {
                console.log(`[DEBUG SelectionUpdated] Polygon ${selectedObject.groupId}-${selectedObject.quadrant} SELECTED:`,
                    `\n  Pos: (${selectedObject.left.toFixed(2)}, ${selectedObject.top.toFixed(2)})`,
                    `\n  Scale: (${selectedObject.scaleX.toFixed(2)}, ${selectedObject.scaleY.toFixed(2)})`,
                    `\n  Width/Height: (${selectedObject.width.toFixed(2)}, ${selectedObject.height.toFixed(2)})`,
                    `\n  PathOffset: (${selectedObject.pathOffset.x.toFixed(2)}, ${selectedObject.pathOffset.y.toFixed(2)})`,
                    `\n  aCoords TL: (${selectedObject.aCoords?.tl?.x?.toFixed(2)}, ${selectedObject.aCoords?.tl?.y?.toFixed(2)})`,
                    `\n  aCoords BR: (${selectedObject.aCoords?.br?.x?.toFixed(2)}, ${selectedObject.aCoords?.br?.y?.toFixed(2)})`
                );
            }
        }
    });
    // --- END LOGGING FOR SELECTION ---

    // --- ADD LOGGING FOR MOUSE:UP ---
    canvas.on('mouse:up', function(e) {
        if (e.target && e.target.groupId !== undefined) {
            const selectedObject = e.target; // Target of the mouse event

            // --- Recalculate state on selection --- 
            console.log(`[DEBUG MouseUp] Polygon ${selectedObject.groupId}-${selectedObject.quadrant} BEFORE Recalc:`,
                `\n  Pos: (${selectedObject.left.toFixed(2)}, ${selectedObject.top.toFixed(2)})`,
                `\n  Width/Height: (${selectedObject.width.toFixed(2)}, ${selectedObject.height.toFixed(2)})`
            );

            selectedObject._setPositionDimensions({}); // Recalc pos, width, height, pathOffset
            selectedObject.setCoords(); // Update controls

            console.log(`[DEBUG MouseUp] Polygon ${selectedObject.groupId}-${selectedObject.quadrant} AFTER Recalc:`,
                `\n  Pos: (${selectedObject.left.toFixed(2)}, ${selectedObject.top.toFixed(2)})`,
                `\n  Scale: (${selectedObject.scaleX.toFixed(2)}, ${selectedObject.scaleY.toFixed(2)})`,
                `\n  Width/Height: (${selectedObject.width.toFixed(2)}, ${selectedObject.height.toFixed(2)})`,
                `\n  PathOffset: (${selectedObject.pathOffset.x.toFixed(2)}, ${selectedObject.pathOffset.y.toFixed(2)})`,
                `\n  aCoords TL: (${selectedObject.aCoords?.tl?.x?.toFixed(2)}, ${selectedObject.aCoords?.tl?.y?.toFixed(2)})`,
                `\n  aCoords BR: (${selectedObject.aCoords?.br?.x?.toFixed(2)}, ${selectedObject.aCoords?.br?.y?.toFixed(2)})`
            );
            
            // Might need a render if selection doesn't trigger it
            canvas.requestRenderAll();
            // --- End Recalculation ---

        }
    });
    // --- END LOGGING FOR MOUSE:UP ---
}

// --- Restore Drawing Mode Logic ---
function enterDrawingMode() {
    drawingMode = true;
    isDrawing = false;
    points = [];
    activeQuadrant = null;
    
    drawMaskBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Drawing';
    canvas.defaultCursor = 'crosshair';
    
    if (backgroundImage) {
        backgroundImage.selectable = false;
        backgroundImage.evented = false;
    }
    
    log('Entered drawing mode');
}

function exitDrawingMode() {
    drawingMode = false;
    isDrawing = false;
    points = [];
    activeQuadrant = null;
    
    // Remove temporary drawing elements
    if (temporaryLine) {
        canvas.remove(temporaryLine);
        temporaryLine = null;
    }
    if (activeLine) {
        canvas.remove(activeLine);
        activeLine = null;
    }
    canvas.getObjects('circle').forEach(obj => {
        if (obj.temporary) {
            canvas.remove(obj);
        }
    });
    
    drawMaskBtn.innerHTML = '<i class="fas fa-pen"></i> Draw Mask';
    canvas.defaultCursor = 'default';
    
    if (backgroundImage) {
        // backgroundImage.selectable = true; // Keep it false
        // backgroundImage.evented = true;    // Keep it false
    }
    
    canvas.renderAll();
    log('Exited drawing mode');
}
// --- End Restore ---

// Helper for logging
function log(message) {
    console.log(message);
}

// Resize handler for responsive canvas
window.addEventListener('resize', function() {
    if (canvas && popupContainer.classList.contains('active')) {
        refreshCanvasDimensions();
    }
});

// Initialize popup when document is ready
document.addEventListener('DOMContentLoaded', function() {
    log('DOM Content Loaded. Polygon Editor Popup ready.');
    // Note: Canvas is NOT initialized here, only when popup opens.
}); 