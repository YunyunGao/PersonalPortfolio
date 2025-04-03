// Polygon Editor Core Functionality
// This file contains the core polygon editing functionality

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
    
    // Add handler for scaling to keep control points within quadrant
    polygon.on('scaling', function(e) {
        const obj = this;
        const bounds = obj.quadrantBounds;
        const pointer = canvas.getPointer(e.e);
        
        // Check if pointer is outside quadrant boundaries
        if (pointer.x < bounds.xMin || pointer.x > bounds.xMax || 
            pointer.y < bounds.yMin || pointer.y > bounds.yMax) {
            
            // Get active corner
            const corner = obj.__corner;
            if (corner) {
                // Determine which coordinate to constrain based on the corner
                if (corner.includes('t')) { // top corners
                    if (pointer.y < bounds.yMin) canvas.setCursor({y: bounds.yMin});
                }
                if (corner.includes('b')) { // bottom corners
                    if (pointer.y > bounds.yMax) canvas.setCursor({y: bounds.yMax});
                }
                if (corner.includes('l')) { // left corners
                    if (pointer.x < bounds.xMin) canvas.setCursor({x: bounds.xMin});
                }
                if (corner.includes('r')) { // right corners
                    if (pointer.x > bounds.xMax) canvas.setCursor({x: bounds.xMax});
                }
                
                // Set the current transform's wrapperCoords to reflect boundaries
                if (obj.canvas && obj.canvas._currentTransform) {
                    const transform = obj.canvas._currentTransform;
                    if (pointer.x < bounds.xMin) transform.wrapperCoords.x = bounds.xMin;
                    if (pointer.x > bounds.xMax) transform.wrapperCoords.x = bounds.xMax;
                    if (pointer.y < bounds.yMin) transform.wrapperCoords.y = bounds.yMin;
                    if (pointer.y > bounds.yMax) transform.wrapperCoords.y = bounds.yMax;
                }
            }
        }
        
        // After scaling, check if any part of the polygon is outside bounds
        const rect = obj.getBoundingRect();
        
        // Create scale factor adjustment if needed
        let scaleXFactor = 1;
        let scaleYFactor = 1;
        
        // Check horizontal bounds
        if (rect.left < bounds.xMin) {
            // Adjust scale to fit left boundary
            const overflowX = bounds.xMin - rect.left;
            scaleXFactor = (rect.width - overflowX) / rect.width;
        } else if (rect.left + rect.width > bounds.xMax) {
            // Adjust scale to fit right boundary
            const overflowX = (rect.left + rect.width) - bounds.xMax;
            scaleXFactor = (rect.width - overflowX) / rect.width;
        }
        
        // Check vertical bounds
        if (rect.top < bounds.yMin) {
            // Adjust scale to fit top boundary
            const overflowY = bounds.yMin - rect.top;
            scaleYFactor = (rect.height - overflowY) / rect.height;
        } else if (rect.top + rect.height > bounds.yMax) {
            // Adjust scale to fit bottom boundary
            const overflowY = (rect.top + rect.height) - bounds.yMax;
            scaleYFactor = (rect.height - overflowY) / rect.height;
        }
        
        // Apply scale adjustments if needed
        if (scaleXFactor < 1 || scaleYFactor < 1) {
            obj.scaleX = obj.scaleX * scaleXFactor;
            obj.scaleY = obj.scaleY * scaleYFactor;
        }
        
        // Call the sync function
        syncPolygonEvent.call(this, e);
    });
    
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
            canvas.renderAll(); // Force render after entering edit mode
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
            const xMin = quadrant === 0 || quadrant === 2 ? 0: quadrantWidth;
            const xMax = quadrant === 0 || quadrant === 2 ? quadrantWidth: canvas.width;
            const yMin = quadrant === 0 || quadrant === 1 ? 0: quadrantHeight;
            const yMax = quadrant === 0 || quadrant === 1 ? quadrantHeight: canvas.height;
            
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
            
            // Force polygon to redraw
            polygon.set({
                dirty: true,
                objectCaching: false
            });
            
            polygon.setCoords(); // Recalculate coords
            
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
            // Store original position if not already stored during edit mode
            // (Keep this for initial storage, but don't reset to it)
            if (polygon.originalLeft === undefined && polygon.isEditing) {
                polygon.originalLeft = polygon.left;
                polygon.originalTop = polygon.top;
                polygon.originalScaleX = polygon.scaleX;
                polygon.originalScaleY = polygon.scaleY;
                polygon.originalAngle = polygon.angle;
            }
            
            // Update just the points but let polygon's position adjust
            polygon.set({
                points: denormalizePoints(normalizedPoints, index),
                dirty: true,
                objectCaching: false
            });
            
            polygon.setCoords(); // Recalculate coords
            
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

// Exit edit mode
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
            
            // Force the polygon to recalculate its dimensions
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
            
            // Ensure coordinates and bounding box are recalculated
            polygon.setCoords(); 

            // Restore update to last known position AFTER editing
            polygon.lastTop = polygon.top;
            polygon.lastLeft = polygon.left;

            // Restore controls and interactivity
            polygon.set({
                hasControls: true,
                hasBorders: true,
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                objectCaching: false // Re-enable caching if desired, or keep false
            });
        });
    });
    
    canvas.renderAll();
    log('Exited editing mode');
}

// Sync polygon event handler
function syncPolygonEvent(event) {
    if (isSyncing) return;
    
    const sourcePolygon = this;
    if (sourcePolygon.isEditing) return;
    
    const groupId = sourcePolygon.groupId;
    const group = polygonGroups[groupId];
    
    if (!group) return;
    
    isSyncing = true;
    const sourceQuadrant = sourcePolygon.quadrant;
    
    // Determine if this is a genuine drag/move event
    const isMovingEvent = event && event.e && event.e.type === 'mousemove';
    let isActualDragEvent = isMovingEvent && !sourcePolygon.isEditing;

    // Calculate relative changes ONLY for actual drag events
    let dTop = 0;
    let dLeft = 0;
    if (isActualDragEvent && sourcePolygon.lastTop !== undefined && sourcePolygon.lastLeft !== undefined) {
        dTop = sourcePolygon.top - sourcePolygon.lastTop;
        dLeft = sourcePolygon.left - sourcePolygon.lastLeft;
    }
    
    // For transformations
    const normalizedPoints = normalizePoints(sourcePolygon.points, sourceQuadrant);
    
    group.forEach((polygon, index) => {
        if (index !== sourceQuadrant) {
            // Apply position changes ONLY if it was an actual drag event
            if (isActualDragEvent && (dTop !== 0 || dLeft !== 0)) {
                let targetLeft = polygon.left + dLeft;
                let targetTop = polygon.top + dTop;
                
                // Apply boundary constraints
                const bounds = polygon.quadrantBounds;
                const polyWidth = polygon.width * polygon.scaleX;
                const polyHeight = polygon.height * polygon.scaleY;
                
                if (targetLeft < bounds.xMin) targetLeft = bounds.xMin;
                if (targetLeft + polyWidth > bounds.xMax) {
                    targetLeft = bounds.xMax - polyWidth;
                }
                if (targetTop < bounds.yMin) targetTop = bounds.yMin;
                if (targetTop + polyHeight > bounds.yMax) {
                    targetTop = bounds.yMax - polyHeight;
                }
                
                polygon.set({
                    left: targetLeft,
                    top: targetTop
                }); 
            }
            
            // Apply point changes for scaling, rotating, etc.
            const newPoints = denormalizePoints(normalizedPoints, index);
            
            // Keep points within quadrant
            const bounds = polygon.quadrantBounds;
            const margin = 0;
            
            const constrainedPoints = newPoints.map(point => {
                let x = point.x;
                let y = point.y;
                
                if (x < bounds.xMin + margin) x = bounds.xMin + margin;
                if (x > bounds.xMax - margin) x = bounds.xMax - margin;
                if (y < bounds.yMin + margin) y = bounds.yMin + margin;
                if (y > bounds.yMax - margin) y = bounds.yMax - margin;
                
                return { x, y };
            });
            
            // Update polygon
            polygon.set({ 
                points: constrainedPoints,
                scaleX: sourcePolygon.scaleX,
                scaleY: sourcePolygon.scaleY,
                angle: sourcePolygon.angle,
                dirty: true,
                objectCaching: false
            });
            
            // Update last positions
            if (isActualDragEvent) {
                polygon.lastTop = polygon.top;
                polygon.lastLeft = polygon.left;
            }
            polygon.lastPoints = polygon.points.map(p => ({x: p.x, y: p.y}));
            
            polygon.setCoords();
        }
    });
    
    // Update source polygon's last position
    if (isActualDragEvent) {
        sourcePolygon.lastTop = sourcePolygon.top;
        sourcePolygon.lastLeft = sourcePolygon.left;
    }
    sourcePolygon.lastPoints = sourcePolygon.points.map(p => ({x: p.x, y: p.y}));
    
    sourcePolygon.set({
        dirty: true,
        objectCaching: false
    });
    
    canvas.renderAll();
    isSyncing = false;
}

// Canvas event handlers for drawing
function setupCanvasDrawingHandlers() {
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
}

// Add event handler for limiting control points during transformation
canvas.on('mouse:move', function(o) {
    if (!canvas._currentTransform) return;
    
    const transform = canvas._currentTransform;
    const target = transform.target;
    
    // Only handle scaling of polygons that have quadrant constraints
    if (!target || !target.quadrantBounds || transform.action !== 'scale') return;
    
    const bounds = target.quadrantBounds;
    const pointer = canvas.getPointer(o.e);
    
    // Constrain pointer to boundaries
    let constrainedX = pointer.x;
    let constrainedY = pointer.y;
    
    if (constrainedX < bounds.xMin) constrainedX = bounds.xMin;
    if (constrainedX > bounds.xMax) constrainedX = bounds.xMax;
    if (constrainedY < bounds.yMin) constrainedY = bounds.yMin;
    if (constrainedY > bounds.yMax) constrainedY = bounds.yMax;
    
    // If the pointer was outside boundaries, update the transform
    if (constrainedX !== pointer.x || constrainedY !== pointer.y) {
        const corner = transform.corner;
        
        // Update the current transform with constrained pointer
        transform.wrapperCoords.x = constrainedX;
        transform.wrapperCoords.y = constrainedY;
        
        // Update the internal target coordinates used for scaling
        if (corner) {
            if (corner.includes('m')) {
                // Handle middle points (scaling in only one direction)
                if (corner === 'mt') transform.newY = constrainedY;
                if (corner === 'mb') transform.newY = constrainedY;
                if (corner === 'ml') transform.newX = constrainedX;
                if (corner === 'mr') transform.newX = constrainedX;
            } else {
                // Handle corner points (scaling in both directions)
                transform.newX = constrainedX;
                transform.newY = constrainedY;
            }
        }
    }
});

// Add document-level event listeners to handle mouse leaving the browser window
function setupGlobalMouseHandlers() {
    let isScalingOutsideBrowser = false;
    let lastValidTransform = null;
    let targetPolygon = null;
    
    // Store the last valid transform when scaling starts
    canvas.on('mouse:down', function(o) {
        if (!o.target) return;
        
        // If clicking on a polygon with quadrant bounds
        if (o.target.quadrantBounds) {
            // Store the target for potential out-of-window recovery
            targetPolygon = o.target;
            
            // Reset flag
            isScalingOutsideBrowser = false;
        }
    });
    
    // Watch for mouse leaving the window during scaling
    document.addEventListener('mouseout', function(e) {
        // Check if the mouse is leaving to outside the document
        if (e.relatedTarget === null && canvas._currentTransform && targetPolygon) {
            isScalingOutsideBrowser = true;
            
            // Store a snapshot of the current transform
            const transform = canvas._currentTransform;
            lastValidTransform = {
                action: transform.action,
                corner: transform.corner,
                x: transform.wrapperCoords ? transform.wrapperCoords.x : null,
                y: transform.wrapperCoords ? transform.wrapperCoords.y : null,
                target: transform.target,
                quadrant: transform.target.quadrant
            };
        }
    });
    
    // Handle mouse re-entering the window
    document.addEventListener('mouseover', function(e) {
        // If we were scaling and mouse re-enters document
        if (isScalingOutsideBrowser && e.relatedTarget === null && lastValidTransform) {
            // Get the current valid quadrant boundaries
            const bounds = lastValidTransform.target.quadrantBounds;
            
            // When mouse re-enters, we'll immediately constrain it to the quadrant
            document.addEventListener('mousemove', constrainMouseOnReentry, true);
        }
    });
    
    // One-time handler to constrain mouse when re-entering
    function constrainMouseOnReentry(e) {
        if (!canvas._currentTransform) {
            // Remove this one-time handler
            document.removeEventListener('mousemove', constrainMouseOnReentry, true);
            return;
        }
        
        const transform = canvas._currentTransform;
        const target = transform.target;
        
        if (!target || !target.quadrantBounds) {
            // Remove this one-time handler
            document.removeEventListener('mousemove', constrainMouseOnReentry, true);
            return;
        }
        
        const bounds = target.quadrantBounds;
        
        // Get mouse position relative to canvas
        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
        let x = e.clientX - canvasRect.left;
        let y = e.clientY - canvasRect.top;
        
        // Constrain coordinates to quadrant boundaries
        if (x < bounds.xMin) x = bounds.xMin;
        if (x > bounds.xMax) x = bounds.xMax;
        if (y < bounds.yMin) y = bounds.yMin;
        if (y > bounds.yMax) y = bounds.yMax;
        
        // Update the transform with constrained coordinates
        if (transform.wrapperCoords) {
            transform.wrapperCoords.x = x;
            transform.wrapperCoords.y = y;
        }
        
        // Update the corner coordinates based on the corner being dragged
        if (transform.corner) {
            if (transform.corner.includes('m')) {
                // Handle middle points
                if (transform.corner === 'mt' || transform.corner === 'mb') transform.newY = y;
                if (transform.corner === 'ml' || transform.corner === 'mr') transform.newX = x;
            } else {
                // Handle corner points
                transform.newX = x;
                transform.newY = y;
            }
        }
        
        // Remove this one-time handler
        document.removeEventListener('mousemove', constrainMouseOnReentry, true);
        
        // Reset flags
        isScalingOutsideBrowser = false;
        lastValidTransform = null;
    }
    
    // Handle mouseup outside the browser window
    document.addEventListener('mouseup', function(e) {
        if (isScalingOutsideBrowser) {
            // Reset our tracking flags
            isScalingOutsideBrowser = false;
            lastValidTransform = null;
            targetPolygon = null;
        }
    });
    
    log('Global mouse handlers set up for out-of-browser scaling');
}

// Initialize global mouse handlers when canvas is ready
function initializeGlobalMouseHandlers() {
    if (canvas) {
        setupGlobalMouseHandlers();
    } else {
        // If canvas isn't ready yet, wait for it
        document.addEventListener('DOMContentLoaded', function() {
            // Try again after a short delay to ensure canvas is initialized
            setTimeout(setupGlobalMouseHandlers, 500);
        });
    }
}

// Call the initializer
initializeGlobalMouseHandlers();

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