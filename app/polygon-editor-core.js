// Polygon Editor Core Functionality
// This file contains the core polygon editing functionality

// let isExitingEditMode = false; // Flag to prevent sync during exit -- REMOVED

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

// --- Updated Edit Mode Handlers (Based on Example) ---

// Calculates control point position based on polygon vertex
function polygonPositionHandler(dim, finalMatrix, fabricObject) {
    const pointIndex = this.pointIndex;
    // Ensure pointIndex is valid
    if (pointIndex === undefined || pointIndex >= fabricObject.points.length) {
        console.error("Invalid pointIndex in polygonPositionHandler:", pointIndex);
        return { x: 0, y: 0 }; 
    }
    const p = fabricObject.points[pointIndex];
    const x = (p.x - fabricObject.pathOffset.x);
    const y = (p.y - fabricObject.pathOffset.y);

    return fabric.util.transformPoint(
        { x: x, y: y },
        fabric.util.multiplyTransformMatrices(
            fabricObject.canvas.viewportTransform || [1, 0, 0, 1, 0, 0],
            fabricObject.calcTransformMatrix()
        )
    );
}

// Action handler for moving a control point (vertex)
function actionHandler(eventData, transform, x, y) {
    const polygon = transform.target;
    const currentControl = polygon.controls[polygon.__corner];
    const pointIndex = currentControl.pointIndex;

    // Ensure pointIndex is valid
    if (pointIndex === undefined || pointIndex >= polygon.points.length) {
        console.error("Invalid pointIndex in actionHandler:", pointIndex);
        return false;
    }

    const mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center');
    const polygonBaseSize = polygon._getNonTransformedDimensions();
    const size = polygon._getTransformedDimensions(0, 0);
    
    // --- Quadrant Constraint ---
    const bounds = polygon.quadrantBounds;
    
    // Calculate the final point position, accounting for scaling
    let finalPointPosition = {
        x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
        y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
    };
    
    // Calculate the absolute position to check against bounds
    const absolutePoint = fabric.util.transformPoint(
        { x: finalPointPosition.x - polygon.pathOffset.x, y: finalPointPosition.y - polygon.pathOffset.y },
        polygon.calcTransformMatrix()
    );

    let constrainedX = absolutePoint.x;
    let constrainedY = absolutePoint.y;

    if (constrainedX < bounds.xMin) constrainedX = bounds.xMin;
    if (constrainedX > bounds.xMax) constrainedX = bounds.xMax;
    if (constrainedY < bounds.yMin) constrainedY = bounds.yMin;
    if (constrainedY > bounds.yMax) constrainedY = bounds.yMax;

    // If constrained, convert back to local coordinates
    if (constrainedX !== absolutePoint.x || constrainedY !== absolutePoint.y) {
        const constrainedLocalPoint = polygon.toLocalPoint(
            new fabric.Point(constrainedX, constrainedY), 
            'center', 
            'center'
        );
        finalPointPosition = {
            x: constrainedLocalPoint.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
            y: constrainedLocalPoint.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
        };
    }
    // --- End Quadrant Constraint ---

    // Update the polygon point
    polygon.points[pointIndex].x = finalPointPosition.x;
    polygon.points[pointIndex].y = finalPointPosition.y;

    // Sync the change to other quadrants
    syncPolygonPoints(polygon);

    return true;
}

// Keeps polygon anchored during vertex edits
function anchorWrapper(anchorIndex, fn) {
    return function(eventData, transform, x, y) {
        const fabricObject = transform.target;
        
        // Ensure anchorIndex is valid
        if (anchorIndex === undefined || anchorIndex >= fabricObject.points.length) {
            console.error("Invalid anchorIndex in anchorWrapper:", anchorIndex);
            return false; 
        }

        const point = fabricObject.points[anchorIndex];
        const absolutePoint = fabric.util.transformPoint({
            x: (point.x - fabricObject.pathOffset.x),
            y: (point.y - fabricObject.pathOffset.y),
        }, fabricObject.calcTransformMatrix());

        // Call the action handler (which includes synchronization)
        const actionPerformed = fn(eventData, transform, x, y);

        if (actionPerformed) {
            // Recalculate polygon dimensions based on the modified points
            fabricObject._setPositionDimensions({});
            
            // Recalculate anchor point's relative position within the new dimensions
            const newPoint = fabricObject.points[anchorIndex];
            const polygonBaseSize = fabricObject._getNonTransformedDimensions();
            const newX = (polygonBaseSize.x === 0) ? 0 : (newPoint.x - fabricObject.pathOffset.x) / polygonBaseSize.x;
            const newY = (polygonBaseSize.y === 0) ? 0 : (newPoint.y - fabricObject.pathOffset.y) / polygonBaseSize.y;

            // Reposition the polygon so the anchor point remains in its original absolute position
            fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
        }

        return actionPerformed;
    }
}

// --- End Updated Edit Mode Handlers ---

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
        cornerStyle: 'rect',
        cornerSize: 10,
        perPixelTargetFind: true,
        objectCaching: false,
        groupId: groupId,
        quadrant: quadrant,
        edit: false
    });

    // Set quadrant constraints
    const xMin = quadrant === 0 || quadrant === 2 ? 0 : quadrantWidth;
    const xMax = quadrant === 0 || quadrant === 2 ? quadrantWidth : canvas.width;
    const yMin = quadrant === 0 || quadrant === 1 ? 0 : quadrantHeight;
    const yMax = quadrant === 0 || quadrant === 1 ? quadrantHeight : canvas.height;
    
    polygon.quadrantBounds = { xMin, xMax, yMin, yMax };
    
    // Store default controls for restoring later
    polygon.standardControls = { ...fabric.Object.prototype.controls };

    // Add standard event handlers
    polygon.on('moving', function(e) {
        if (this.edit) return; // Don't move in edit mode
        
        const obj = this;
        const polyBounds = this.getBoundingRect();
        
        // Apply quadrant constraints
        if (obj.left < obj.quadrantBounds.xMin) obj.set('left', obj.quadrantBounds.xMin);
        const rightEdge = obj.left + polyBounds.width;
        if (rightEdge > obj.quadrantBounds.xMax) obj.set('left', obj.quadrantBounds.xMax - polyBounds.width);
        if (obj.top < obj.quadrantBounds.yMin) obj.set('top', obj.quadrantBounds.yMin);
        const bottomEdge = obj.top + polyBounds.height;
        if (bottomEdge > obj.quadrantBounds.yMax) obj.set('top', obj.quadrantBounds.yMax - polyBounds.height);
        
        syncPolygonEvent.call(this, e);
    });
    
    polygon.on('scaling', function(e) {
        if (this.edit) return; // Don't scale in edit mode

        // Apply scaling constraints and sync as in original code
        // ... (existing scaling code remains unchanged) ...
        
        syncPolygonEvent.call(this, e);
    });
    
    polygon.on('rotating', function(e) {
        if (this.edit) return; // Don't rotate in edit mode
        syncPolygonEvent.call(this, e);
    });

    polygon.on('mousedown', function(o) {
        // Allow setting initial position if not editing AND
        // EITHER there's no transform OR the transform action is 'drag' (start of a drag)
        if (!this.edit && (!o.transform || (o.transform && o.transform.action === 'drag'))) {
            this.lastTop = this.top;
            this.lastLeft = this.left;
            // --- DEBUG LOGGING START ---
            // console.log(`Mousedown on Quad ${this.quadrant}: Set lastTop=${this.lastTop.toFixed(2)}, lastLeft=${this.lastLeft.toFixed(2)}`);
            // --- DEBUG LOGGING END ---
        } 
        // else {
        //      // --- DEBUG LOGGING START ---
        //      console.log(`Mousedown on Quad ${this.quadrant}: SKIPPED setting last pos. Edit: ${this.edit}, Transform: ${o.transform ? o.transform.action : 'none'}`);
        //     // --- DEBUG LOGGING END ---
        // }
    });

    polygon.on('modified', function(e) {
        if (this.edit) return;
        // REMOVED: syncPolygonEvent.call(this, e); // Let moving/scaling/rotating handle sync during event
        
        // Update last known state AFTER final sync from moving/scaling/rotating
        this.lastTop = this.top;
        this.lastLeft = this.left;
        this.setCoords(); // Ensure controls are updated based on final state
    });

    // Add double-click handler for entering edit mode
    polygon.on('mousedblclick', function() {
        // Exit edit mode for any other group first
        const currentGroupId = this.groupId;
        polygonGroups.forEach((group, groupId) => {
            if (groupId !== currentGroupId && group.length > 0 && group[0].edit) {
                exitEditMode(group);
            }
        });

        // Toggle edit mode for this group
        const group = polygonGroups[currentGroupId];
        if (group) {
            if (!this.edit) {
                enterEditMode(group);
            } else {
                exitEditMode(group);
            }
            canvas.setActiveObject(this);
            canvas.requestRenderAll();
        }
    });
    
    return polygon;
}

// --- Edit Mode State Management ---

function enterEditMode(group) {
    if (!group || group.length === 0) return;

    group.forEach((polygon) => {
        polygon.edit = true;

        // Define custom controls for vertex editing
        const lastControlIndex = polygon.points.length - 1;
        
        polygon.cornerStyle = 'circle';
        polygon.cornerColor = 'rgba(0,0,255,0.5)';
        
        polygon.controls = polygon.points.reduce((acc, point, pointIndex) => {
            // Skip duplicate control for the last point if it's same as first
            if (pointIndex === lastControlIndex && 
                polygon.points.length > 1 &&
                point.x === polygon.points[0].x && 
                point.y === polygon.points[0].y) {
                return acc;
            }

            acc['p' + pointIndex] = new fabric.Control({
                positionHandler: polygonPositionHandler,
                actionHandler: anchorWrapper(
                    pointIndex === 0 ? lastControlIndex - 1 : pointIndex - 1, 
                    actionHandler
                ),
                actionName: 'modifyPolygon',
                pointIndex: pointIndex,
                cursorStyle: 'crosshair',
                render: (ctx, left, top, styleOverride, fabricObject) => {
                    styleOverride = styleOverride || {};
                    const size = styleOverride.cornerSize || fabricObject.cornerSize || 10;
                    ctx.save();
                    ctx.translate(left, top);
                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
                    ctx.fillStyle = styleOverride.cornerColor || fabricObject.cornerColor || 'blue';
                    ctx.fill();
                    ctx.lineWidth = styleOverride.cornerStrokeWidth || 1;
                    ctx.strokeStyle = styleOverride.cornerStrokeColor || 'black';
                    ctx.stroke();
                    ctx.restore();
                }
            });
            return acc;
        }, {});

        // Apply edit mode appearance and behavior
        polygon.set({
            hasBorders: false,
            hasControls: true,
            selectable: true,
            lockMovementX: true,
            lockMovementY: true,
            evented: true,
            objectCaching: false
        });
        polygon.setCoords();
    });
}

function exitEditMode(group) {
    if (!group || group.length === 0 || !group[0].edit) return;

    group.forEach(polygon => {
        polygon.edit = false;

        // Restore standard controls and appearance
        polygon.cornerColor = 'blue';
        polygon.cornerStyle = 'rect';
        polygon.controls = polygon.standardControls;
        
        polygon.set({
            hasBorders: true,
            hasControls: true,
            selectable: true,
            lockMovementX: false,
            lockMovementY: false,
            evented: true,
            objectCaching: false
        });
        
        polygon.lastTop = polygon.top;
        polygon.lastLeft = polygon.left;
        polygon.setCoords();
    });

    // Deselect object if the exited group contained the active object
    const activeObject = canvas.getActiveObject();
    if (activeObject && group.includes(activeObject)) {
        canvas.discardActiveObject();
    }
    canvas.requestRenderAll();
}

// Sync polygon points when editing vertices
function syncPolygonPoints(sourcePolygon) {
    if (isSyncing) return; // Prevent recursion
    
    // Ensure source polygon is valid and part of a group
    if (!sourcePolygon || sourcePolygon.groupId === undefined) return;
    
    const groupId = sourcePolygon.groupId;
    const group = polygonGroups[groupId];
    
    if (!group || !sourcePolygon.edit) return;

    isSyncing = true;
    
    const sourceQuadrant = sourcePolygon.quadrant;
    const currentPoints = sourcePolygon.points.map(p => ({ x: p.x, y: p.y }));
    const normalizedPoints = normalizePoints(currentPoints, sourceQuadrant);
    
    group.forEach((polygon, index) => {
        if (index !== sourceQuadrant) {
            const denormalized = denormalizePoints(normalizedPoints, index);
            polygon.set({
                points: denormalized,
                objectCaching: false
            });

            polygon._setPositionDimensions({});
            polygon.setCoords();
        }
    });
    
    sourcePolygon.setCoords();
    canvas.renderAll();
    isSyncing = false;
}

// Sync polygon event handler (for move, scale, rotate in NORMAL mode) - REPLACED WITH PROVIDED VERSION
function syncPolygonEvent(event) {
    if (isSyncing) return;
    
    const sourcePolygon = this;
    // Don't sync if the polygon is currently in vertex edit mode itself
    // Dragging/scaling happens when edit is false.
    // Vertex changes are handled by syncPolygonPoints.
    if (sourcePolygon.edit) return; // Use 'edit' flag from current codebase
    
    const groupId = sourcePolygon.groupId;
    const group = polygonGroups[groupId];
    
    if (!group) return;
    
    isSyncing = true;
    const sourceQuadrant = sourcePolygon.quadrant;
    
    // Determine if this is a genuine drag/move event
    const isMovingEvent = event && event.e && event.e.type === 'mousemove';
    let isActualDragEvent = isMovingEvent && !sourcePolygon.edit; // Must not be in edit mode

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
                 // Use getBoundingRect for more accurate width/height with scaling/rotation
                 const polyBounds = polygon.getBoundingRect(); 
                 const polyWidth = polyBounds.width;
                 const polyHeight = polyBounds.height;
                
                // Apply bounds checking to keep within quadrant
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
            
            // Apply point changes for scaling, rotating, etc. (Always sync these)
            const newPoints = denormalizePoints(normalizedPoints, index);
            
            // Optional: Constrain points to stay within boundaries (from provided code)
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
            // Store last points always for reference (if needed later)
            // polygon.lastPoints = polygon.points.map(p => ({x: p.x, y: p.y}));
            
            polygon.setCoords(); // Update coordinates
        }
    });
    
    // Update source polygon's last position ONLY after an actual drag event
    if (isActualDragEvent) {
        sourcePolygon.lastTop = sourcePolygon.top;
        sourcePolygon.lastLeft = sourcePolygon.left;
    }
    // Store last points always for reference (if needed later)
    // sourcePolygon.lastPoints = sourcePolygon.points.map(p => ({x: p.x, y: p.y}));
    
    // Make sure source polygon also has caching disabled
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
        // If clicking on empty space and a polygon group is in edit mode, exit that mode.
        if (!o.target && !drawingMode) {
            let groupToExit = null;
            for (const group of polygonGroups) {
                if (group.length > 0 && group[0].edit) {
                    groupToExit = group;
                    break;
                }
            }
            if (groupToExit) {
                exitEditMode(groupToExit);
                return; // Prevent drawing start right after exiting edit mode
            }
        }

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
                    if (polygon.edit) {
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
} 