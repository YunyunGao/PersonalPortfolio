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
        log('ERROR: Canvas container not found!');
        return;
    }
    log('Canvas container found:', canvasContainer);
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    log(`Canvas container dimensions: ${containerWidth}x${containerHeight}`);
    
    const padding = 40; 
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;
    log(`Available dimensions after padding: ${availableWidth}x${availableHeight}`);

    const canvasWidth = Math.min(800, availableWidth);
    const canvasHeight = Math.min(690, availableHeight);
    log(`Calculated canvas dimensions: ${canvasWidth}x${canvasHeight}`);

    if (canvasWidth <= 0 || canvasHeight <= 0) {
        log('ERROR: Calculated canvas dimensions are invalid.');
        return;
    }

    canvas = new fabric.Canvas('canvas', {
        width: canvasWidth,
        height: canvasHeight,
        selection: false,
        objectCaching: false,
        renderOnAddRemove: false,
        // backgroundColor: 'lightgrey'
    });
    log(`Fabric canvas initialized ${canvas.width}x${canvas.height} (Interactive)`);

    // --- Center Fabric's container manually ---
    if (canvas.wrapperEl) {
        log('Applying manual centering styles to canvas.wrapperEl');
        const wrapper = canvas.wrapperEl;
        wrapper.style.position = 'absolute';
        wrapper.style.left = '50%';
        wrapper.style.top = '50%';
        wrapper.style.transform = 'translate(-50%, -50%)';

        // --- Force dimension recalculation and initial render ---
        log('Forcing dimension recalculation and initial render');
        canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
        canvas.calcOffset();
        canvas.renderAll();
        log('Initial render after centering complete.');
        // --- End force render ---

        // --- Explicitly set upper canvas background --- 
        if (canvas.upperCanvasEl) {
            log('Explicitly setting upperCanvasEl background to transparent.');
            canvas.upperCanvasEl.style.backgroundColor = 'transparent'; // This is extremely important for popup environment.
        } else {
            log('Warning: upperCanvasEl not found after centering.');
        }
        // --- End set background ---

    } else {
        log('Warning: canvas.wrapperEl not found immediately after initialization.');
    }
    // --- End centering ---
    
    // --- Remove Test Rectangle --- 
    /*
    try {
        const rect = new fabric.Rect(...);
        canvas.add(rect);
        log('Test rectangle added to canvas.');
        setTimeout(() => {
            log('Attempting initial render with test rectangle.');
            canvas.renderAll(); 
            canvas.calcOffset();
            log('Initial render complete.');
        }, 50);
    } catch (e) {
        log('ERROR adding test rectangle:', e);
    }
    */
    // --- End Remove Test ---
    
    // --- Re-enable functionality --- 
    loadBackgroundImage(); // Re-enable image loading (using fromURL method)
    setupCanvasEventListeners(); // Re-enable button listeners
    setupCanvasDrawingHandlers(); // Re-enable core drawing handlers
    setupImageControlListeners(); // Re-enable slider listeners
    // --- End Re-enable --- 
    
    // Initialize global mouse handlers for out-of-browser events
    if (typeof setupGlobalMouseHandlers === 'function') {
        setTimeout(() => {
            setupGlobalMouseHandlers();
            log('Global mouse handlers initialized for out-of-browser events');
        }, 100);
    } else {
        log('Warning: setupGlobalMouseHandlers function not found');
    }
    
    log('Canvas initialization complete (image loading, events, controls enabled).');
}

// Update canvas dimensions if window resizes
function refreshCanvasDimensions() {
    const canvasContainer = document.querySelector('.canvas-container');
    const containerWidth = canvasContainer.clientWidth - 40;
    const containerHeight = canvasContainer.clientHeight - 40;
    
    const canvasWidth = Math.min(800, containerWidth);
    const canvasHeight = Math.min(690, containerHeight);
    
    canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    
    // Re-render the canvas with the new dimensions
    if (backgroundImage) {
        canvas.setBackgroundImage(backgroundImage, function() {
            // Use setTimeout to allow DOM to register changes before rendering
            setTimeout(function() {
                canvas.renderAll();
                canvas.calcOffset();
                log('Canvas dimensions updated with timing adjustments');
            }, 50);
        });
    }
}

// --- Restore Image Loading (fromURL method) and Filter Logic --- 
function loadBackgroundImage() {
    log('Attempting to load background image (as foreground object)...');
    const imagePath = '/images/plain.png';

    fabric.Image.fromURL(imagePath, function(img) {
        log('Image loaded via fabric.Image.fromURL.');
        
        img.scaleToWidth(canvas.width);
        
        // Add as a foreground object instead of background
        canvas.add(img);
        img.moveTo(0); 
        log('Image added to canvas as foreground object.');
        
        // --- Make image non-interactive ---
        img.selectable = false;
        img.evented = false; 
        log('Made image object non-selectable and non-evented.');
        // --- End non-interactive ---
        
        // Store reference for filters
        backgroundImage = img; 

        // Render the canvas
        setTimeout(function() {
            log('Rendering canvas after adding image object (timeout 100ms).');
            canvas.calcOffset(); // Recalculate offset BEFORE rendering
            canvas.renderAll();
            log('Initial image render complete. Initializing filters.');
            // Initialize filters AFTER image is added and rendered
            initializeAndApplyFilters();
        }, 100);

    }, {
        crossOrigin: 'anonymous' 
    });

    log(`Initiated loading image from: ${imagePath} using fabric.Image.fromURL`);
}

function initializeAndApplyFilters() {
    if (!backgroundImage) {
        log('Cannot apply filters: backgroundImage not available.');
        return;
    }
    
    log('Initializing filters...');
    brightnessFilter = new fabric.Image.filters.Brightness({ brightness: 0 });
    contrastFilter = new fabric.Image.filters.Contrast({ contrast: 0 });
    gammaFilter = new fabric.Image.filters.Gamma({ gamma: [1, 1, 1] });
    
    backgroundImage.filters = []; 
    backgroundImage.filters.push(brightnessFilter, contrastFilter, gammaFilter);
    log('Filters initialized and added to background image.');
    
    // Apply the filters initially (optional, could wait for slider interaction)
    // applyBackgroundFilters(); // Maybe don't apply immediately, let sliders do it
}

function applyBackgroundFilters() {
    if (backgroundImage && backgroundImage.filters && backgroundImage.filters.length > 0) {
        log('Applying filters to foreground image...');
        backgroundImage.applyFilters();
        setTimeout(function() {
            log('Rendering canvas after applying filters (timeout 100ms).');
            canvas.calcOffset(); // Recalculate offset BEFORE rendering
            canvas.renderAll();
        }, 100); 
    } else if (backgroundImage) {
        log('BackgroundImage (object) exists but no filters to apply.');
    } else {
        log('Skipping filter application: backgroundImage object not loaded yet.');
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
    log('Image control listeners set up.');
}

// Setup Canvas Event Listeners (Restore full logic)
function setupCanvasEventListeners() {
    // Draw Mask button
    drawMaskBtn.addEventListener('click', function() {
        log('Draw Mask button clicked.'); // Updated log
        if (drawingMode) {
            exitDrawingMode();
        } else {
            enterDrawingMode();
        }
    });
    
    // Clear All button
    clearAllBtn.addEventListener('click', function() {
        log('Clear All button clicked.'); // Updated log
        if (drawingMode) {
            exitDrawingMode(); // Exit drawing mode if active
        }
        
        canvas.clear(); // Clear fabric objects
        // Re-add the image object since canvas.clear() removes everything
        if (backgroundImage) {
            canvas.add(backgroundImage);
            backgroundImage.moveTo(0); // Ensure it's in the back
            log('Re-added background image object after clear.');
        } else {
            log('Cannot re-add background image, it was not loaded.')
        }
        
        polygonGroups = [];
        currentGroup = null;
        // Render after clearing and potentially re-adding image
        canvas.renderAll(); 
        log('Cleared all polygons and reset groups.');
    });
    log('Full canvas event listeners set up.'); // Updated log
}

// --- Restore Drawing Mode Logic ---
function enterDrawingMode() {
    drawingMode = true;
    isDrawing = false;
    points = [];
    activeQuadrant = null; // Reset active quadrant
    
    drawMaskBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Drawing';
    canvas.defaultCursor = 'crosshair';
    
    // Make the background image unselectable during drawing
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
    
    // Make the background image selectable again
    if (backgroundImage) {
        // backgroundImage.selectable = true; // Keep it false
        // backgroundImage.evented = true;    // Keep it false
        log('Image object remains non-selectable after exiting drawing mode.');
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