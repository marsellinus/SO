// ...existing code...
            icon.setAttribute('x', x);
            icon.setAttribute('y', resourceY - 15);
            icon.setAttribute('text-anchor', 'middle');
            icon.setAttribute('fill', 'white');
            icon.setAttribute('font-size', '16');
            icon.textContent = resource.icon;
            svg.appendChild(icon);
        }
        
        // Store position for edge creation
        resourceNodes[resource.id] = { x, y: resourceY };
    });
    
    // Draw allocation edges (resource to process)
    resources.forEach(resource => {
        if (resource.held_by) {
            const process = processes.find(p => p.id === resource.held_by);
            if (process && resourceNodes[resource.id] && processNodes[resource.id]) {
                // Draw arrow from resource to process
                const startX = resourceNodes[resource.id].x;
                const startY = resourceNodes[resource.id].y - 25; // Top of resource
                const endX = processNodes[resource.held_by].x;
                const endY = processNodes[resource.held_by].y + 25; // Bottom of process
                
                const isDeadlockEdge = deadlockCycle.includes(resource.id) && 
                                       deadlockCycle.includes(process.id);
                
                drawArrow(
                    svg, 
                    startX, startY, 
                    endX, endY,
                    isDeadlockEdge ? 'deadlock-edge' : 'allocation-edge',
                    isDeadlockEdge ? 'deadlock-arrowhead' : 'alloc-arrowhead'
                );
            }
        }
    });
    
    // Draw request edges (process to resource)
    processes.forEach(process => {
        // Find resources that the process needs but doesn't have
        const neededResources = process.needs.filter(
            resourceId => !process.allocation.includes(resourceId)
        );
        
        neededResources.forEach(resourceId => {
            if (processNodes[process.id] && resourceNodes[resourceId]) {
                // Draw arrow from process to resource
                const startX = processNodes[process.id].x;
                const startY = processNodes[process.id].y + 25; // Bottom of process
                const endX = resourceNodes[resourceId].x;
                const endY = resourceNodes[resourceId].y - 25; // Top of resource
                
                const isDeadlockEdge = deadlockCycle.includes(resourceId) && 
                                       deadlockCycle.includes(process.id);
                
                drawArrow(
                    svg, 
                    startX, startY, 
                    endX, endY,
                    isDeadlockEdge ? 'deadlock-edge' : 'request-edge',
                    isDeadlockEdge ? 'deadlock-arrowhead' : 'arrowhead'
                );
            }
        });
    });
    
    // Draw deadlock cycle (if any)
    if (deadlockCycle.length > 0) {
        // Add a label for the deadlock
        const deadlockLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        deadlockLabel.setAttribute('x', 20);
        deadlockLabel.setAttribute('y', 30);
        deadlockLabel.setAttribute('font-size', '14');
        deadlockLabel.setAttribute('fill', '#ef4444');
        deadlockLabel.textContent = "Deadlock Detected";
        svg.appendChild(deadlockLabel);
    }
}

/**
 * Helper function to draw an arrow
 */
function drawArrow(svg, fromX, fromY, toX, toY, className, markerEnd) {
    // Calculate direction vector
    const dx = toX - fromX;
    const dy = toY - fromY;
    
    // Normalize and scale back to get points on the circles/rectangles
    const length = Math.sqrt(dx * dx + dy * dy);
    const normX = dx / length;
    const normY = dy / length;
    
    // Shorten the arrow to stop at the edge of nodes
    const shortenBy = 5;
    const adjustedFromX = fromX + normX * shortenBy;
    const adjustedFromY = fromY + normY * shortenBy;
    const adjustedToX = toX - normX * shortenBy;
    const adjustedToY = toY - normY * shortenBy;
    
    // Create arrow line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', adjustedFromX);
    line.setAttribute('y1', adjustedFromY);
    line.setAttribute('x2', adjustedToX);
    line.setAttribute('y2', adjustedToY);
    line.setAttribute('class', className);
    if (markerEnd) {
        line.setAttribute('marker-end', `url(#${markerEnd})`);
    }
    svg.appendChild(line);
}