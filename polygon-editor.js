// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('canvas', {
    width: 800,
    height: 690,
    selection: false
});

// Track polygon groups and background image
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

// Load the background image
fabric.Image.fromURL('/images/plain.png', function(img) {
    img.scaleToWidth(800);
    backgroundImage = img;

    // Initialize Filters
    brightnessFilter = new fabric.Image.filters.Brightness({ brightness: 0 });
    contrastFilter = new fabric.Image.filters.Contrast({ contrast: 0 });
    gammaFilter = new fabric.Image.filters.Gamma({ gamma: [1, 1, 1] }); // Default gamma [R, G, B]

    backgroundImage.filters.push(brightnessFilter, contrastFilter, gammaFilter);
    // Don't apply filters immediately, let setBackgroundImage handle the initial render
    // backgroundImage.applyFilters(); 

    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        // Apply filters when setting the background image initially
        filters: backgroundImage.filters, 
        callback: function() {
            backgroundImage.applyFilters(); // Ensure filters are applied after setting
            canvas.renderAll();
        }
    }, {
        crossOrigin: 'anonymous'
    });
    log('Background image loaded successfully');

    // Add Event Listeners for Controls (assuming HTML exists)
    setupImageControlListeners();
});

// --- New Function to Setup Image Control Listeners ---
function setupImageControlListeners() {
    const brightnessSlider = document.getElementById('brightnessSlider');
    const contrastSlider = document.getElementById('contrastSlider');
    const gammaSlider = document.getElementById('gammaSlider');
    const brightnessValueSpan = document.getElementById('brightnessValue');
    const contrastValueSpan = document.getElementById('contrastValue');
    const gammaValueSpan = document.getElementById('gammaValue');

    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            brightnessFilter.brightness = value;
            if (brightnessValueSpan) brightnessValueSpan.textContent = value.toFixed(2);
            applyBackgroundFilters();
        });
    } else {
        log("Warning: Brightness slider element ('brightnessSlider') not found.");
    }

    if (contrastSlider) {
        contrastSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            contrastFilter.contrast = value;
            if (contrastValueSpan) contrastValueSpan.textContent = value.toFixed(2);
            applyBackgroundFilters();
        });
    } else {
        log("Warning: Contrast slider element ('contrastSlider') not found.");
    }

    if (gammaSlider) {
        gammaSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            // Apply same gamma to R, G, B for grayscale effect
            gammaFilter.gamma = [value, value, value];
             if (gammaValueSpan) gammaValueSpan.textContent = value.toFixed(2);
            applyBackgroundFilters();
        });
    } else {
        log("Warning: Gamma slider element ('gammaSlider') not found.");
    }
}

// --- New Helper Function to Apply Background Filters ---
function applyBackgroundFilters() {
    if (backgroundImage && backgroundImage.filters.length > 0) {
        backgroundImage.applyFilters();
        canvas.renderAll();
    } else if (backgroundImage) {
        // Ensure canvas re-renders even if filters array was initially empty or cleared
        canvas.renderAll();
    }
}

// Function to determine which quadrant a point belongs to
function getQuadrant(point) {
    const x = point.x;
    const y = point.y;
    if (x < quadrantWidth && y < quadrantHeight) return 0; // Top-left
    if (x >= quadrantWidth && y < quadrantHeight) return 1; // Top-right
    if (x < quadrantWidth && y >= quadrantHeight) return 2; // Bottom-left
    return 3; // Bottom-right
}

// Function to normalize points relative to their quadrant
function normalizePoints(points, sourceQuadrant) {
    return points.map(point => {
        let x = point.x;
        let y = point.y;
        
        // Normalize to 0-1 range within quadrant
        if (sourceQuadrant === 1 || sourceQuadrant === 3) x -= quadrantWidth;
        if (sourceQuadrant === 2 || sourceQuadrant === 3) y -= quadrantHeight;
        
        return { x, y };
    });
}

// Function to denormalize points for a target quadrant
function denormalizePoints(normalizedPoints, targetQuadrant) {
    return normalizedPoints.map(point => {
        let x = point.x;
        let y = point.y;
        
        // Apply quadrant offset
        if (targetQuadrant === 1 || targetQuadrant === 3) x += quadrantWidth;
        if (targetQuadrant === 2 || targetQuadrant === 3) y += quadrantHeight;
        
        return { x, y };
    });
}

// Function to create a polygon in a specific quadrant
function createPolygonInQuadrant(points, quadrant, groupId) {
    const polygon = new fabric.Polygon(points, {
        fill: 'rgba(0, 0, 255, 0.3)',
        stroke: 'blue',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        originX: 'left',
        originY: 'top',
        transparentCorners: false,
        cornerColor: 'blue',
        cornerSize: 10,
        perPixelTargetFind: true,
        objectCaching: false, // Disable object caching to prevent clipping
        groupId: groupId,
        quadrant: quadrant
    });

    // Set quadrant constraints
    const xMin = quadrant === 0 || quadrant === 2 ? 0 : quadrantWidth;
    const xMax = quadrant === 0 || quadrant === 2 ? quadrantWidth : canvas.width;
    const yMin = quadrant === 0 || quadrant === 1 ? 0 : quadrantHeight;
    const yMax = quadrant === 0 || quadrant === 1 ? quadrantHeight : canvas.height;
    
    // Store the constraints directly on the polygon object
    polygon.quadrantBounds = { xMin, xMax, yMin, yMax };
    
    // Add custom handlers for point modification
    polygon.on('moving', function(e) {
        const obj = this;
        
        // Get the actual bounds of the polygon
        const polyBounds = this.getBoundingRect();
        
        // Apply quadrant constraints
        // Left boundary
        if (obj.left < obj.quadrantBounds.xMin) {
            obj.set('left', obj.quadrantBounds.xMin);
        }
        // Right boundary 
        // Calculate the rightmost edge of the polygon
        const rightEdge = obj.left + polyBounds.width;
        if (rightEdge > obj.quadrantBounds.xMax) {
            // Move back so the right edge aligns with boundary
            obj.set('left', obj.quadrantBounds.xMax - polyBounds.width);
        }
        
        // Top boundary
        if (obj.top < obj.quadrantBounds.yMin) {
            obj.set('top', obj.quadrantBounds.yMin);
        }
        // Bottom boundary 
        // Calculate the bottom edge of the polygon
        const bottomEdge = obj.top + polyBounds.height;
        if (bottomEdge > obj.quadrantBounds.yMax) {
            // Move back so the bottom edge aligns with boundary
            obj.set('top', obj.quadrantBounds.yMax - polyBounds.height);
        }
        
        // Call the sync function
        syncPolygonEvent.call(this, e);
    });
    
    polygon.on('scaling', syncPolygonEvent);
    polygon.on('rotating', syncPolygonEvent);
    polygon.on('modified', syncPolygonEvent);
    polygon.on('mousedown', function() {
        this.lastTop = this.top;
        this.lastLeft = this.left;
        this.lastPoints = this.points.map(p => ({x: p.x, y: p.y}));
    });
    
    // Add double-click handler for edit mode
    polygon.on('mousedblclick', function() {
        // First check if any polygon is already in edit mode
        let anyPolygonEditing = false;
        polygonGroups.forEach(group => {
            group.forEach(polygon => {
                if (polygon.isEditing) {
                    anyPolygonEditing = true;
                }
            });
        });
        
        // If another polygon is in edit mode, exit that first
        if (anyPolygonEditing) {
            exitEditMode();
        }
        
        // Find all polygons in this group
        const groupId = this.groupId;
        const group = polygonGroups[groupId];
        
        if (group) {
            // Make all points in the group editable
            group.forEach(polygon => {
                makeEditable(polygon);
            });
            log('Entered edit mode for polygon group: ' + groupId);
        }
    });
    
    return polygon;
}

// Make polygon points editable
function makeEditable(polygon) {
    // Mark polygon as being edited
    polygon.isEditing = true;
    
    // Disable controls for scaling and rotation while in vertex edit mode
    polygon.set({
        hasControls: false,
        hasBorders: false,
        selectable: false,
        evented: false, // Disable all events on the polygon
        lockMovementX: true, // Lock horizontal movement
        lockMovementY: true, // Lock vertical movement
        objectCaching: false // Disable caching to ensure polygon renders properly
    });
    
    // Store original properties to restore later
    polygon.originalLeft = polygon.left;
    polygon.originalTop = polygon.top;
    polygon.originalScaleX = polygon.scaleX;
    polygon.originalScaleY = polygon.scaleY;
    polygon.originalAngle = polygon.angle;
    
    // For each point in the polygon
    polygon.points.forEach((point, index) => {
        // Calculate absolute position of the point, accounting for transformations
        const absolutePoint = fabric.util.transformPoint(
            { 
                x: point.x - polygon.pathOffset.x, 
                y: point.y - polygon.pathOffset.y 
            },
            polygon.calcTransformMatrix()
        );
        
        // Create control point
        const circle = new fabric.Circle({
            left: absolutePoint.x,
            top: absolutePoint.y,
            strokeWidth: 2,
            radius: 6,
            fill: 'white',
            stroke: 'blue',
            originX: 'center',
            originY: 'center',
            hasBorders: false,
            hasControls: false,
            pointIndex: index,
            polygonId: polygon.groupId,
            quadrant: polygon.quadrant,
            editPoint: true
        });
        
        circle.on('moving', function() {
            // Constrain within quadrant boundaries
            const quadrant = this.quadrant;
            
            // Calculate the actual boundaries for control point
            const xMin = quadrant === 0 || quadrant === 2 ? 0 + this.radius : quadrantWidth + this.radius;
            const xMax = quadrant === 0 || quadrant === 2 ? quadrantWidth - this.radius : canvas.width - this.radius;
            const yMin = quadrant === 0 || quadrant === 1 ? 0 + this.radius : quadrantHeight + this.radius;
            const yMax = quadrant === 0 || quadrant === 1 ? quadrantHeight - this.radius : canvas.height - this.radius;
            
            // Apply the constraints
            if (this.left < xMin) this.set({ left: xMin });
            if (this.left > xMax) this.set({ left: xMax });
            if (this.top < yMin) this.set({ top: yMin });
            if (this.top > yMax) this.set({ top: yMax });
            
            // Convert absolute control point position back to relative polygon coordinates
            const invertedMatrix = fabric.util.invertTransform(polygon.calcTransformMatrix());
            const newRelativePoint = fabric.util.transformPoint(
                { x: this.left, y: this.top },
                invertedMatrix
            );
            
            // Update the polygon point directly
            polygon.points[this.pointIndex] = { 
                x: newRelativePoint.x + polygon.pathOffset.x, 
                y: newRelativePoint.y + polygon.pathOffset.y 
            };
            
            // Important: we're NOT going to call setPositionByOrigin here, which is what
            // was causing the polygon to move. Instead, we'll just keep the polygon
            // in place and update its points directly.
            
            // Force polygon to redraw but maintain position and dimensions
            polygon.set({
                dirty: true,
                objectCaching: false
            });
            
            // Make sure transform values don't change during edit
            if (polygon.originalLeft !== undefined) {
                polygon.set({
                    left: polygon.originalLeft,
                    top: polygon.originalTop,
                    scaleX: polygon.originalScaleX,
                    scaleY: polygon.originalScaleY,
                    angle: polygon.originalAngle
                });
            }
            
            polygon.setCoords();
            
            // Sync the change to other quadrants
            syncPolygonPoints(polygon);
            canvas.renderAll();
        });
        
        canvas.add(circle);
    });
}

// Sync polygon points when editing vertices
function syncPolygonPoints(sourcePolygon) {
    if (isSyncing) return;
    isSyncing = true;
    
    const groupId = sourcePolygon.groupId;
    const group = polygonGroups[groupId];
    
    if (!group) {
        isSyncing = false;
        return;
    }
    
    const sourceQuadrant = sourcePolygon.quadrant;
    const normalizedPoints = normalizePoints(sourcePolygon.points, sourceQuadrant);
    
    group.forEach((polygon, index) => {
        if (index !== sourceQuadrant) {
            const newPoints = denormalizePoints(normalizedPoints, index);
            
            // Make sure points stay within their quadrant boundaries with a small safety margin
            const bounds = polygon.quadrantBounds;
            const margin = 0.5;
            
            const constrainedPoints = newPoints.map(point => {
                let x = point.x;
                let y = point.y;
                
                // Apply constraints with minimal margins
                if (x < bounds.xMin + margin) x = bounds.xMin + margin;
                if (x > bounds.xMax - margin) x = bounds.xMax - margin;
                if (y < bounds.yMin + margin) y = bounds.yMin + margin;
                if (y > bounds.yMax - margin) y = bounds.yMax - margin;
                
                return { x, y };
            });
            
            // Store original position if not already stored during edit mode
            if (polygon.originalLeft === undefined && polygon.isEditing) {
                polygon.originalLeft = polygon.left;
                polygon.originalTop = polygon.top;
                polygon.originalScaleX = polygon.scaleX;
                polygon.originalScaleY = polygon.scaleY;
                polygon.originalAngle = polygon.angle;
            }
            
            // Update just the points but keep the polygon's position
            polygon.set({
                points: constrainedPoints,
                dirty: true,
                objectCaching: false
            });
            
            // Maintain original position and transformations during edit
            if (polygon.isEditing && polygon.originalLeft !== undefined) {
                polygon.set({
                    left: polygon.originalLeft,
                    top: polygon.originalTop,
                    scaleX: polygon.originalScaleX,
                    scaleY: polygon.originalScaleY,
                    angle: polygon.originalAngle
                });
            }
            
            polygon.setCoords();
            
            // Update control points if in edit mode
            updateControlPoints(polygon);
        }
    });
    
    canvas.renderAll();
    isSyncing = false;
}

// Update control points positions when parent polygon changes
function updateControlPoints(polygon) {
    canvas.getObjects('circle').forEach(circle => {
        if (circle.polygonId === polygon.groupId && circle.quadrant === polygon.quadrant) {
            // Calculate absolute position of the point after transformation
            const point = polygon.points[circle.pointIndex];
            const absolutePoint = fabric.util.transformPoint(
                { 
                    x: point.x - polygon.pathOffset.x, 
                    y: point.y - polygon.pathOffset.y 
                },
                polygon.calcTransformMatrix()
            );
            
            circle.set({
                left: absolutePoint.x,
                top: absolutePoint.y
            });
        }
    });
}

// Sync polygon event handler
function syncPolygonEvent(event) {
    if (isSyncing) return;
    
    const sourcePolygon = this;
    // Don't sync if the polygon is currently in vertex edit mode itself
    // Dragging/scaling happens when isEditing is false.
    // Vertex changes are handled by syncPolygonPoints.
    if (sourcePolygon.isEditing) return; 
    
    const groupId = sourcePolygon.groupId;
    const group = polygonGroups[groupId];
    
    if (!group) return;
    
    isSyncing = true;
    const sourceQuadrant = sourcePolygon.quadrant;
    
    // Determine if this is a genuine drag/move event
    const isMovingEvent = event && event.e && event.e.type === 'mousemove';
    let isActualDragEvent = isMovingEvent && !sourcePolygon.isEditing; // Must not be in edit mode

    // Calculate relative changes ONLY for actual drag events
    let dTop = 0;
    let dLeft = 0;
    if (isActualDragEvent && sourcePolygon.lastTop !== undefined && sourcePolygon.lastLeft !== undefined) {
        dTop = sourcePolygon.top - sourcePolygon.lastTop;
        dLeft = sourcePolygon.left - sourcePolygon.lastLeft;
    }
    
    // For point changes or other transformations (scale, rotate)
    const normalizedPoints = normalizePoints(sourcePolygon.points, sourceQuadrant);
    
    group.forEach((polygon, index) => {
        if (index !== sourceQuadrant) {
            // Apply position changes ONLY if it was an actual drag event
            if (isActualDragEvent && (dTop !== 0 || dLeft !== 0)) {
                // Calculate new position
                let targetLeft = polygon.left + dLeft;
                let targetTop = polygon.top + dTop;
                
                // Apply boundary constraints from the target polygon
                const bounds = polygon.quadrantBounds;
                const polyWidth = polygon.width * polygon.scaleX;
                const polyHeight = polygon.height * polygon.scaleY;
                
                // Apply bounds checking to keep within quadrant
                if (targetLeft < bounds.xMin) targetLeft = bounds.xMin;
                if (targetLeft + polyWidth > bounds.xMax) {
                    targetLeft = bounds.xMax - polyWidth;
                }
                if (targetTop < bounds.yMin) targetTop = bounds.yMin;
                if (targetTop + polyHeight > bounds.yMax) {
                    targetTop = bounds.yMax - polyHeight;
                }
                
                // Disable the following line to prevent the polygon from moving
                // This is useful when you want to keep the polygon in place while editing
                // UNCOMMENTED: This should now only apply during drags
                polygon.set({
                    left: targetLeft,
                    top: targetTop
                }); 
            }
            
            // Apply point changes for scaling, rotating, etc. (Always sync these)
            const newPoints = denormalizePoints(normalizedPoints, index);
            
            // Make sure points stay within their quadrant boundaries with a margin
            const bounds = polygon.quadrantBounds;
            const margin = 0.5; // Small margin to avoid clipping issues
            
            const constrainedPoints = newPoints.map(point => {
                let x = point.x;
                let y = point.y;
                
                // Apply constraints with margins
                if (x < bounds.xMin + margin) x = bounds.xMin + margin;
                if (x > bounds.xMax - margin) x = bounds.xMax - margin;
                if (y < bounds.yMin + margin) y = bounds.yMin + margin;
                if (y > bounds.yMax - margin) y = bounds.yMax - margin;
                
                return { x, y };
            });
            
            // Update polygon with improved rendering settings
            // Avoid setting left/top here as it might conflict with drag sync
            polygon.set({ 
                points: constrainedPoints,
                scaleX: sourcePolygon.scaleX,
                scaleY: sourcePolygon.scaleY,
                angle: sourcePolygon.angle,
                dirty: true,
                objectCaching: false
            });
            
            // Update last positions ONLY after an actual drag event
            if (isActualDragEvent) {
                polygon.lastTop = polygon.top;
                polygon.lastLeft = polygon.left;
            }
            // Store last points always for reference, though not used for deltas here
            polygon.lastPoints = polygon.points.map(p => ({x: p.x, y: p.y}));
            
            polygon.setCoords(); // Update coordinates
            
            // Update control points if in edit mode (shouldn't happen if syncPolygonEvent guarded correctly)
            // updateControlPoints(polygon); // Let's remove this, vertex sync handles controls
        }
    });
    
    // Update source polygon's last position ONLY after an actual drag event
    if (isActualDragEvent) {
        sourcePolygon.lastTop = sourcePolygon.top;
        sourcePolygon.lastLeft = sourcePolygon.left;
    }
    sourcePolygon.lastPoints = sourcePolygon.points.map(p => ({x: p.x, y: p.y}));
    
    // Make sure source polygon also has caching disabled
    sourcePolygon.set({
        dirty: true,
        objectCaching: false
    });
    
    canvas.renderAll();
    isSyncing = false;
}

// Function to constrain a point to stay within its quadrant
function constrainPointToQuadrant(point) {
    // Determine which quadrant the point belongs to
    const quadrant = getQuadrant(point);
    
    // Calculate quadrant boundaries
    const xMin = quadrant === 0 || quadrant === 2 ? 0 : quadrantWidth;
    const xMax = quadrant === 0 || quadrant === 2 ? quadrantWidth : canvas.width;
    const yMin = quadrant === 0 || quadrant === 1 ? 0 : quadrantHeight;
    const yMax = quadrant === 0 || quadrant === 1 ? quadrantHeight : canvas.height;
    
    // Constrain the point
    let x = point.x;
    let y = point.y;
    
    if (x < xMin) x = xMin;
    if (x > xMax) x = xMax;
    if (y < yMin) y = yMin;
    if (y > yMax) y = yMax;
    
    return { x, y };
}

// Draw Mask button event
document.getElementById('drawMask').addEventListener('click', function() {
    if (drawingMode) {
        // If already in drawing mode, cancel it
        exitDrawingMode();
    } else {
        // Enter drawing mode
        enterDrawingMode();
    }
});

// Enter drawing mode
function enterDrawingMode() {
    drawingMode = true;
    isDrawing = false;
    points = [];
    activeQuadrant = null;
    
    // Change button text
    document.getElementById('drawMask').textContent = 'Cancel Drawing';
    
    // Change cursor
    canvas.defaultCursor = 'crosshair';
    
    log('Entered drawing mode');
}

// Exit drawing mode
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
    
    // Remove any temporary points
    canvas.getObjects('circle').forEach(obj => {
        if (obj.temporary) {
            canvas.remove(obj);
        }
    });
    
    // Change button text back
    document.getElementById('drawMask').textContent = 'Draw Mask';
    
    // Reset cursor
    canvas.defaultCursor = 'default';
    
    canvas.renderAll();
    log('Exited drawing mode');
}

// Event listeners for canvas in drawing mode
canvas.on('mouse:down', function(o) {
    // First check if we're in drawing mode
    if (drawingMode) {
        if (!o.target || (o.target && o.target.temporary)) {
            const pointer = canvas.getPointer(o.e);
            
            // If this is the first point, determine the active quadrant
            if (!isDrawing || points.length === 0) {
                isDrawing = true;
                points = [];
                activeQuadrant = getQuadrant(pointer);
            }
            
            // Constrain point to active quadrant
            const constrainedPoint = constrainToActiveQuadrant(pointer);
            
            // Check if this is close to the first point (to close the polygon)
            if (points.length > 2 && closeEnough(constrainedPoint, points[0], 10)) {
                // Complete the polygon
                finishPolygon();
                return;
            }
            
            // Add the point
            points.push(constrainedPoint);
            
            // Add a visual control point
            addTemporaryControlPoint(constrainedPoint);
            
            // If we have at least 2 points, draw line segments
            if (points.length > 1) {
                drawLineSegments();
            }
            
            canvas.renderAll();
        }
    } else {
        // Check if we have any polygons in edit mode
        let anyPolygonEditing = false;
        polygonGroups.forEach(group => {
            group.forEach(polygon => {
                if (polygon.isEditing) {
                    anyPolygonEditing = true;
                }
            });
        });
        
        // If we are in edit mode and clicked on empty space, exit edit mode
        if (anyPolygonEditing && !o.target) {
            exitEditMode();
        }
    }
});

// Handle double click to close the polygon
canvas.on('mouse:dblclick', function(o) {
    if (!drawingMode || !isDrawing || points.length < 3) return;
    
    // Check if we're clicking on a temporary control point
    if (o.target && o.target.temporary) {
        finishPolygon();
    }
});

// Handle mouse move to show preview line
canvas.on('mouse:move', function(o) {
    if (!drawingMode || !isDrawing || points.length === 0) return;
    
    const pointer = canvas.getPointer(o.e);
    const constrainedPoint = constrainToActiveQuadrant(pointer);
    
    // Update or create the temporary line
    if (temporaryLine) {
        canvas.remove(temporaryLine);
    }
    
    temporaryLine = new fabric.Line(
        [points[points.length - 1].x, points[points.length - 1].y, constrainedPoint.x, constrainedPoint.y],
        {
            stroke: 'blue',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            temporary: true
        }
    );
    
    canvas.add(temporaryLine);
    canvas.renderAll();
});

// Constrain a point to the active quadrant
function constrainToActiveQuadrant(point) {
    if (activeQuadrant === null) return point;
    
    // Calculate quadrant boundaries
    const xMin = activeQuadrant === 0 || activeQuadrant === 2 ? 0 : quadrantWidth;
    const xMax = activeQuadrant === 0 || activeQuadrant === 2 ? quadrantWidth : canvas.width;
    const yMin = activeQuadrant === 0 || activeQuadrant === 1 ? 0 : quadrantHeight;
    const yMax = activeQuadrant === 0 || activeQuadrant === 1 ? quadrantHeight : canvas.height;
    
    // Constrain the point
    let x = point.x;
    let y = point.y;
    
    if (x < xMin) x = xMin;
    if (x > xMax) x = xMax;
    if (y < yMin) y = yMin;
    if (y > yMax) y = yMax;
    
    return { x, y };
}

// Add a temporary control point
function addTemporaryControlPoint(point) {
    const circle = new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: 6,
        fill: 'white',
        stroke: 'blue',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        hasBorders: false,
        hasControls: false,
        selectable: true,
        evented: true,
        temporary: true
    });
    
    canvas.add(circle);
}

// Draw line segments between points
function drawLineSegments() {
    // Remove old active line if exists
    if (activeLine) {
        canvas.remove(activeLine);
    }
    
    // Create a polyline from all points
    activeLine = new fabric.Polyline(points, {
        stroke: 'blue',
        strokeWidth: 2,
        fill: 'transparent',
        selectable: false,
        evented: false,
        temporary: true
    });
    
    canvas.add(activeLine);
}

// Check if two points are close enough
function closeEnough(p1, p2, threshold) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
}

// Finish the polygon and create the synchronized polygons
function finishPolygon() {
    if (points.length < 3) {
        log('Not enough points to create a polygon');
        exitDrawingMode();
        return;
    }
    
    // Clean up temporary drawing elements
    if (temporaryLine) {
        canvas.remove(temporaryLine);
        temporaryLine = null;
    }
    
    if (activeLine) {
        canvas.remove(activeLine);
        activeLine = null;
    }
    
    // Remove temporary points
    canvas.getObjects('circle').forEach(obj => {
        if (obj.temporary) {
            canvas.remove(obj);
        }
    });
    
    // Close the polygon by adding the first point again if needed
    if (!closeEnough(points[0], points[points.length - 1], 10)) {
        points.push({ x: points[0].x, y: points[0].y });
    }
    
    // Create group for the polygon
    currentGroup = polygonGroups.length;
    polygonGroups[currentGroup] = [];
    
    // Create polygons in all quadrants
    const sourceQuadrant = activeQuadrant;
    const normalizedPoints = normalizePoints(points, sourceQuadrant);
    
    for (let i = 0; i < 4; i++) {
        const transformedPoints = denormalizePoints(normalizedPoints, i);
        const polygon = createPolygonInQuadrant(transformedPoints, i, currentGroup);
        polygonGroups[currentGroup].push(polygon);
        canvas.add(polygon);
    }
    
    // Exit drawing mode
    exitDrawingMode();
    log('Completed polygon group: ' + currentGroup);
}

// Clear all polygons
document.getElementById('clearAll').addEventListener('click', function() {
    // Exit drawing mode if active
    if (drawingMode) {
        exitDrawingMode();
    }
    
    // Remove all objects
    canvas.clear();
    canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas));
    polygonGroups = [];
    currentGroup = null;
    log('Cleared all polygons');
});

// Logging function
function log(message) {
    console.log(message);
    // You can implement file logging here if needed
}

// Initial setup logging
log('Canvas initialized');

// Add this new function to exit edit mode
function exitEditMode() {
    // Find all edit points and remove them
    canvas.getObjects('circle').forEach(obj => {
        if (obj.editPoint) {
            canvas.remove(obj);
        }
    });
    
    // Clear editing flag on all polygons and restore controls
    polygonGroups.forEach(group => {
        group.forEach(polygon => {
            // Check if this polygon was actually being edited
            if (!polygon.isEditing) return; // Skip if not edited

            polygon.isEditing = false;
            
            // Clear stored original values
            delete polygon.originalLeft;
            delete polygon.originalTop;
            delete polygon.originalScaleX;
            delete polygon.originalScaleY;
            delete polygon.originalAngle;
            
            // --- Force the polygon to recalculate its dimensions ---
            // Get the final points state after editing
            const finalPoints = polygon.points.map(p => ({ x: p.x, y: p.y }));
            
            // Mark for redraw and disable caching
            polygon.set({
                dirty: true,
                objectCaching: false
            });
            
            // Set the points again to trigger internal updates
            polygon.set('points', finalPoints);

            // Explicitly recalculate dimensions based on the new points
            polygon._setPositionDimensions({}); 
            
            // Ensure coordinates and bounding box (oCoords) are recalculated based on new dimensions
            polygon.setCoords(); 
            // -------------------------------------------------------

            // --- Update last known position to prevent jump on potential post-exit sync event ---
            polygon.lastTop = polygon.top;
            polygon.lastLeft = polygon.left;
            // ---------------------------------------------------------------------------------

            // Restore controls and interactivity
            polygon.set({
                hasControls: true,
                hasBorders: true,
                selectable: true,
                evented: true, // Re-enable events
                lockMovementX: false, // Unlock horizontal movement
                lockMovementY: false, // Unlock vertical movement
                objectCaching: false // Keep caching off for safety
            });
        });
    });
    
    canvas.renderAll();
    log('Exited editing mode');
} 