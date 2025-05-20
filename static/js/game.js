document.addEventListener('DOMContentLoaded', function() {
    // Listen for Alpine.js initialization
    document.addEventListener('alpine:initialized', () => {
        // Initialize visualization when data is available
        if (window.alpineComponent && window.alpineComponent.processes.length > 0) {
            renderResourceAllocationGraph();
        }
    });
    
    // Update renderResourceAllocationGraph function to handle dynamic process counts
    window.renderResourceAllocationGraph = function() {
        const visualizationDiv = document.getElementById('visualization');
        if (!visualizationDiv) return;
        
        // Get data from Alpine.js component
        const component = window.alpineComponent;
        if (!component) return;
        
        const { processes, resources, cores, processCoreMapping, deadlockProcesses } = component;
        
        // Skip if no processes or resources
        if (!processes.length || !resources.length) return;
        
        // Clear previous visualization
        visualizationDiv.innerHTML = '';
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 800 250');
        visualizationDiv.appendChild(svg);
        
        // Calculate positions
        const processStartX = 100;
        const processY = 80;
        const processSpacing = 120;
        
        const resourceStartX = 100;
        const resourceY = 180;
        const resourceSpacing = 120;
        
        // Color mapping for cores
        const coreColors = [
            { fill: '#3b82f6', stroke: '#2563eb' }, // blue
            { fill: '#ef4444', stroke: '#dc2626' }, // red
            { fill: '#10b981', stroke: '#059669' }, // green
            { fill: '#f59e0b', stroke: '#d97706' }  // amber
        ];
        
        // Get color for process based on its core
        function getProcessColorByCore(processName) {
            if (!processCoreMapping || !processName) return coreColors[0];
            
            const coreName = processCoreMapping[processName];
            if (!coreName) return coreColors[0];
            
            const coreIndex = cores.indexOf(coreName);
            if (coreIndex === -1) return coreColors[0];
            
            return coreColors[coreIndex % coreColors.length];
        }
        
        // Draw processes (circles) - grouped by core
        processes.forEach((process, idx) => {
            const isDeadlocked = deadlockProcesses.includes(process.name);
            const x = processStartX + idx * processSpacing;
            
            // Get color based on core
            const coreColor = getProcessColorByCore(process.name);
            
            // Create process node (circle)
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', processY);
            circle.setAttribute('r', 25);
            
            if (isDeadlocked) {
                circle.setAttribute('fill', '#ef4444');
                circle.setAttribute('stroke', '#dc2626');
                circle.setAttribute('stroke-width', '2');
                // Add pulse animation for deadlocked processes
                circle.classList.add('deadlock-highlight');
            } else {
                circle.setAttribute('fill', coreColor.fill);
                circle.setAttribute('stroke', coreColor.stroke);
                circle.setAttribute('stroke-width', '2');
            }
            
            svg.appendChild(circle);
            
            // Add core indicator
            if (processCoreMapping && processCoreMapping[process.name]) {
                const coreLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                coreLabel.setAttribute('x', x);
                coreLabel.setAttribute('y', processY - 30);
                coreLabel.setAttribute('text-anchor', 'middle');
                coreLabel.setAttribute('font-size', '10');
                coreLabel.setAttribute('fill', 'white');
                coreLabel.textContent = processCoreMapping[process.name];
                svg.appendChild(coreLabel);
            }
            
            // Add process label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', processY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.textContent = process.name;
            svg.appendChild(text);
            
            // Store position for edge creation
            process._pos = { x, y: processY };
        });
        
        // Draw resources (rectangles)
        resources.forEach((resource, idx) => {
            const x = resourceStartX + idx * resourceSpacing;
            
            // Create resource node (rectangle)
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x - 20);
            rect.setAttribute('y', resourceY - 20);
            rect.setAttribute('width', 40);
            rect.setAttribute('height', 40);
            rect.setAttribute('class', 'resource-node');
            svg.appendChild(rect);
            
            // Add resource label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', resourceY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.textContent = resource;
            svg.appendChild(text);
            
            // Store position for edge creation
            resources[idx] = { 
                name: resource, 
                _pos: { x, y: resourceY } 
            };
        });
        
        // Draw allocation edges (resource → process)
        processes.forEach((process, pIdx) => {
            process.allocation.forEach((count, rIdx) => {
                if (count > 0) {
                    const resource = resources[rIdx];
                    drawArrow(
                        svg,
                        resource._pos.x, resource._pos.y - 20, // Start from top of resource
                        process._pos.x, process._pos.y + 20,   // End at bottom of process
                        'allocation-edge'
                    );
                }
            });
        });
        
        // Draw request edges (process → resource)
        processes.forEach((process, pIdx) => {
            process.need.forEach((need, rIdx) => {
                if (need > 0) {
                    const resource = resources[rIdx];
                    drawArrow(
                        svg,
                        process._pos.x, process._pos.y + 20,    // Start from bottom of process
                        resource._pos.x, resource._pos.y - 20,  // End at top of resource
                        'request-edge'
                    );
                }
            });
        });
        
        // Add labels for strategy-specific visualizations
        if (component.solutionSteps && component.solutionSteps.length > 0) {
            const currentStep = component.currentStep;
            const currentStepIndex = component.currentStepIndex;
            const currentStrategy = component.currentStrategy;
            
            const header = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            header.setAttribute('x', '20');
            header.setAttribute('y', '30');
            header.setAttribute('font-size', '16');
            header.setAttribute('fill', 'white');
            
            // Different labels based on strategy
            if (currentStrategy === 'Avoidance') {
                header.textContent = `Banker's Algorithm - Step ${currentStepIndex + 1}: Executing ${currentStep.process}`;
            } else if (currentStrategy === 'Detection') {
                if (currentStep.action === 'Terminate') {
                    header.textContent = `Recovery - Step ${currentStepIndex + 1}: Terminating ${currentStep.process}`;
                } else {
                    header.textContent = `Recovery - Step ${currentStepIndex + 1}: ${currentStep.detail}`;
                }
            } else {
                header.textContent = `${currentStrategy} - Step ${currentStepIndex + 1}`;
            }
            
            svg.appendChild(header);
        }
        
        // Check if we're in detection & recovery mode
        const inDetectionMode = component.currentStrategy === 'Detection' && component.solutionSteps.length > 0;
        if (inDetectionMode && component.currentStep) {
            const currentStep = component.currentStep;
            
            // Draw dependency arrows for detection phase
            if (currentStep.type === 'detection' && currentStep.dependencies) {
                // Add a title for the detection phase
                const detectionTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                detectionTitle.setAttribute('x', '20');
                detectionTitle.setAttribute('y', '30');
                detectionTitle.setAttribute('font-size', '16');
                detectionTitle.setAttribute('fill', 'white');
                detectionTitle.textContent = 'Deteksi Circular Wait';
                svg.appendChild(detectionTitle);
                
                // If we have specific circular waits, draw them
                if (currentStep.circular_waits && currentStep.circular_waits.length > 0) {
                    // Draw each circular wait with a different color
                    const cycleColors = ['#f43f5e', '#8b5cf6', '#ec4899'];
                    
                    currentStep.circular_waits.forEach((cycle, cycleIndex) => {
                        const cycleColor = cycleColors[cycleIndex % cycleColors.length];
                        
                        // Draw cycle arrows
                        for (let i = 0; i < cycle.length; i++) {
                            const fromProcess = processes.find(p => p.name === cycle[i]);
                            const toProcess = processes.find(p => p.name === cycle[(i + 1) % cycle.length]);
                            
                            if (fromProcess && fromProcess._pos && toProcess && toProcess._pos) {
                                // Draw dependency arrow
                                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                const startX = fromProcess._pos.x;
                                const startY = fromProcess._pos.y - 20;
                                const endX = toProcess._pos.x;
                                const endY = toProcess._pos.y - 20;
                                
                                // Create curved path for dependency arrow
                                const dx = endX - startX;
                                const controlPointY = startY - Math.min(40, Math.abs(dx) * 0.5);
                                const path = `M ${startX} ${startY} Q ${startX + dx/2} ${controlPointY}, ${endX} ${endY}`;
                                
                                arrow.setAttribute('d', path);
                                arrow.setAttribute('fill', 'none');
                                arrow.setAttribute('stroke', cycleColor);
                                arrow.setAttribute('stroke-width', '3');
                                arrow.setAttribute('marker-end', `url(#arrowhead-detection-${cycleIndex})`);
                                arrow.setAttribute('class', 'circular-wait');
                                svg.appendChild(arrow);
                                
                                // Add "waits for" text
                                const textX = startX + dx/2;
                                const textY = controlPointY - 10;
                                const waitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                waitText.setAttribute('x', textX);
                                waitText.setAttribute('y', textY);
                                waitText.setAttribute('text-anchor', 'middle');
                                waitText.setAttribute('font-size', '12');
                                waitText.setAttribute('fill', cycleColor);
                                waitText.textContent = 'waits for';
                                svg.appendChild(waitText);
                            }
                        }
                        
                        // Add arrowhead marker definition for this cycle
                        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                        marker.setAttribute('id', `arrowhead-detection-${cycleIndex}`);
                        marker.setAttribute('markerWidth', '10');
                        marker.setAttribute('markerHeight', '7');
                        marker.setAttribute('refX', '10');
                        marker.setAttribute('refY', '3.5');
                        marker.setAttribute('orient', 'auto');
                        
                        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                        polygon.setAttribute('fill', cycleColor);
                        marker.appendChild(polygon);
                        defs.appendChild(marker);
                        svg.appendChild(defs);
                    });
                } else {
                    // Fallback to drawing from dependencies if no circular_waits
                    Object.keys(currentStep.dependencies).forEach(process => {
                        const waitsFor = currentStep.dependencies[process].waits_for;
                        if (waitsFor && waitsFor.length > 0) {
                            const fromProcess = processes.find(p => p.name === process);
                            
                            waitsFor.forEach(targetProcess => {
                                const toProcess = processes.find(p => p.name === targetProcess);
                                if (fromProcess && fromProcess._pos && toProcess && toProcess._pos) {
                                    // Draw dependency arrow similar to above
                                    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    const startX = fromProcess._pos.x;
                                    const startY = fromProcess._pos.y - 20;
                                    const endX = toProcess._pos.x;
                                    const endY = toProcess._pos.y - 20;
                                    
                                    // Create curved path for dependency arrow
                                    const dx = endX - startX;
                                    const controlPointY = startY - Math.min(40, Math.abs(dx) * 0.5);
                                    const path = `M ${startX} ${startY} Q ${startX + dx/2} ${controlPointY}, ${endX} ${endY}`;
                                    
                                    arrow.setAttribute('d', path);
                                    arrow.setAttribute('fill', 'none');
                                    arrow.setAttribute('stroke', '#f43f5e');
                                    arrow.setAttribute('stroke-width', '3');
                                    arrow.setAttribute('marker-end', 'url(#arrowhead-detection)');
                                    arrow.setAttribute('class', 'circular-wait');
                                    svg.appendChild(arrow);
                                    
                                    // Add "waits for" text
                                    const textX = startX + dx/2;
                                    const textY = controlPointY - 10;
                                    const waitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                    waitText.setAttribute('x', textX);
                                    waitText.setAttribute('y', textY);
                                    waitText.setAttribute('text-anchor', 'middle');
                                    waitText.setAttribute('font-size', '12');
                                    waitText.setAttribute('fill', '#f43f5e');
                                    waitText.textContent = 'waits for';
                                    svg.appendChild(waitText);
                                }
                            });
                        }
                    });
                }
            }
            
            // Visualize recovery phase - make sure it handles any number of processes
            if (currentStep.type === 'recovery') {
                // Add a title for the recovery phase
                const recoveryTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                recoveryTitle.setAttribute('x', '20');
                recoveryTitle.setAttribute('y', '30');
                recoveryTitle.setAttribute('font-size', '16');
                recoveryTitle.setAttribute('fill', 'white');
                recoveryTitle.textContent = 'Recovery: Terminasi ' + currentStep.process;
                svg.appendChild(recoveryTitle);
                
                // Add visual effects for terminated process
                const terminatedProcess = processes.find(p => p.name === currentStep.process);
                if (terminatedProcess && terminatedProcess._pos) {
                    // Add animated X mark
                    const x = terminatedProcess._pos.x;
                    const y = terminatedProcess._pos.y;
                    
                    // Draw X with animation
                    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line1.setAttribute('x1', x - 20);
                    line1.setAttribute('y1', y - 20);
                    line1.setAttribute('x2', x + 20);
                    line1.setAttribute('y2', y + 20);
                    line1.setAttribute('stroke', '#ef4444');
                    line1.setAttribute('stroke-width', '5');
                    line1.setAttribute('class', 'terminate-animation');
                    svg.appendChild(line1);
                    
                    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line2.setAttribute('x1', x - 20);
                    line2.setAttribute('y1', y + 20);
                    line2.setAttribute('x2', x + 20);
                    line2.setAttribute('y2', y - 20);
                    line2.setAttribute('stroke', '#ef4444');
                    line2.setAttribute('stroke-width', '5');
                    line2.setAttribute('class', 'terminate-animation');
                    svg.appendChild(line2);
                    
                    // Show freed resources with animation
                    if (currentStep.resources_freed && currentStep.resources_freed.length > 0) {
                        currentStep.resources_freed.forEach((res, idx) => {
                            const resourceName = res.resource;
                            // Find resource by name or direct reference
                            const resourceObj = resources.find(r => 
                                r === resourceName || r.name === resourceName
                            );
                            
                            if (resourceObj && resourceObj._pos) {
                                // Create an animated path from process to resource
                                const animation = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                                animation.setAttribute('cx', x);
                                animation.setAttribute('cy', y);
                                animation.setAttribute('r', '8');
                                animation.setAttribute('fill', '#22c55e');
                                animation.setAttribute('class', 'resource-freed-animation');
                                animation.style.setProperty('--to-x', resourceObj._pos.x + 'px');
                                animation.style.setProperty('--to-y', resourceObj._pos.y + 'px');
                                svg.appendChild(animation);
                                
                                // Add resource amount text
                                const amountText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                amountText.setAttribute('x', (x + resourceObj._pos.x) / 2);
                                amountText.setAttribute('y', (y + resourceObj._pos.y) / 2 - 10);
                                amountText.setAttribute('text-anchor', 'middle');
                                amountText.setAttribute('font-size', '14');
                                amountText.setAttribute('fill', '#22c55e');
                                amountText.textContent = `+${res.amount} ${resourceName}`;
                                amountText.setAttribute('class', 'resource-text-animation');
                                svg.appendChild(amountText);
                            }
                        });
                    }
                }
                
                // Show remaining deadlock if any
                if (currentStep.remaining_deadlock && currentStep.remaining_deadlock.length > 0) {
                    currentStep.remaining_deadlock.forEach(proc => {
                        const deadlockedProcess = processes.find(p => p.name === proc);
                        if (deadlockedProcess && deadlockedProcess._pos) {
                            // Highlight remaining deadlocked processes
                            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            highlight.setAttribute('cx', deadlockedProcess._pos.x);
                            highlight.setAttribute('cy', deadlockedProcess._pos.y);
                            highlight.setAttribute('r', '30');
                            highlight.setAttribute('fill', 'none');
                            highlight.setAttribute('stroke', '#ef4444');
                            highlight.setAttribute('stroke-width', '3');
                            highlight.setAttribute('stroke-dasharray', '5,5');
                            highlight.setAttribute('class', 'pulse-animation');
                            svg.appendChild(highlight);
                        }
                    });
                }
            }
            
            // Continue phase remains the same as it doesn't depend on the number of processes
            if (currentStep.type === 'continue') {
                // Add a title for the continue phase
                const continueTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                continueTitle.setAttribute('x', '20');
                continueTitle.setAttribute('y', '30');
                continueTitle.setAttribute('font-size', '16');
                continueTitle.setAttribute('fill', 'white');
                continueTitle.textContent = 'Proses Berlanjut: ' + currentStep.process;
                svg.appendChild(continueTitle);
                
                // Add visual effects for continuing process
                const continuingProcess = processes.find(p => p.name === currentStep.process);
                if (continuingProcess && continuingProcess._pos) {
                    // Add animation for continuing process
                    const x = continuingProcess._pos.x;
                    const y = continuingProcess._pos.y;
                    
                    // Draw checkmark with animation
                    const checkmark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const d = `M ${x-15} ${y} L ${x-5} ${y+10} L ${x+15} ${y-10}`;
                    checkmark.setAttribute('d', d);
                    checkmark.setAttribute('fill', 'none');
                    checkmark.setAttribute('stroke', '#22c55e');
                    checkmark.setAttribute('stroke-width', '5');
                    checkmark.setAttribute('class', 'continue-animation');
                    svg.appendChild(checkmark);
                    
                    // Draw "success" highlight
                    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    highlight.setAttribute('cx', x);
                    highlight.setAttribute('cy', y);
                    highlight.setAttribute('r', '30');
                    highlight.setAttribute('fill', 'none');
                    highlight.setAttribute('stroke', '#22c55e');
                    highlight.setAttribute('stroke-width', '3');
                    highlight.setAttribute('stroke-dasharray', '5,5');
                    highlight.setAttribute('class', 'success-pulse-animation');
                    svg.appendChild(highlight);
                }
            }
        }
        
        // Add special visualization for Banker's Algorithm
        const inBankersMode = component.currentStrategy === 'Avoidance' && component.solutionSteps.length > 0;
        if (inBankersMode && component.currentStep) {
            const currentStep = component.currentStep;
            
            // Add a title for the Banker's Algorithm step
            const bankersTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            bankersTitle.setAttribute('x', '20');
            bankersTitle.setAttribute('y', '30');
            bankersTitle.setAttribute('font-size', '16');
            bankersTitle.setAttribute('fill', 'white');
            bankersTitle.textContent = `Banker's Algorithm - Step ${currentStep.step}: Executing ${currentStep.process}`;
            svg.appendChild(bankersTitle);
            
            // Find the current process being executed
            const executingProcess = processes.find(p => p.name === currentStep.process);
            if (executingProcess && executingProcess._pos) {
                // Highlight the executing process
                const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                highlight.setAttribute('cx', executingProcess._pos.x);
                highlight.setAttribute('cy', executingProcess._pos.y);
                highlight.setAttribute('r', '30');
                highlight.setAttribute('fill', 'none');
                highlight.setAttribute('stroke', '#22c55e');
                highlight.setAttribute('stroke-width', '3');
                highlight.setAttribute('stroke-dasharray', '5,5');
                highlight.setAttribute('class', 'success-pulse-animation');
                svg.appendChild(highlight);
                
                // Draw checkmark to indicate this process is being safely executed
                const checkmark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const x = executingProcess._pos.x;
                const y = executingProcess._pos.y;
                const d = `M ${x-15} ${y} L ${x-5} ${y+10} L ${x+15} ${y-10}`;
                checkmark.setAttribute('d', d);
                checkmark.setAttribute('fill', 'none');
                checkmark.setAttribute('stroke', '#22c55e');
                checkmark.setAttribute('stroke-width', '5');
                checkmark.setAttribute('class', 'continue-animation');
                svg.appendChild(checkmark);
                
                // Show resources needed and allocated
                if (currentStep.need) {
                    // Visualize need vs. available
                    const needText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    needText.setAttribute('x', x);
                    needText.setAttribute('y', y - 40);
                    needText.setAttribute('text-anchor', 'middle');
                    needText.setAttribute('font-size', '12');
                    needText.setAttribute('fill', 'white');
                    needText.textContent = `Need: [${currentStep.need.join(', ')}]`;
                    svg.appendChild(needText);
                    
                    // Visualize available resources before execution
                    const availText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    availText.setAttribute('x', x);
                    availText.setAttribute('y', y - 55);
                    availText.setAttribute('text-anchor', 'middle');
                    availText.setAttribute('font-size', '12');
                    availText.setAttribute('fill', '#22c55e');
                    availText.textContent = `Available: [${currentStep.work_before.join(', ')}]`;
                    svg.appendChild(availText);
                }
                
                // Show resources being released
                for (let i = 0; i < resources.length; i++) {
                    const resourceObj = resources[i];
                    if (!resourceObj || !resourceObj._pos) continue;
                    
                    // Check if this process holds this resource
                    const allocAmount = executingProcess.allocation ? executingProcess.allocation[i] : 0;
                    
                    if (allocAmount > 0) {
                        // Draw an animation showing resources being released
                        const resourceX = resourceObj._pos.x;
                        const resourceY = resourceObj._pos.y;
                        const processX = executingProcess._pos.x;
                        const processY = executingProcess._pos.y;
                        
                        // Draw animation for resource being released
                        const animation = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        animation.setAttribute('cx', processX);
                        animation.setAttribute('cy', processY);
                        animation.setAttribute('r', '8');
                        animation.setAttribute('fill', '#3b82f6');
                        animation.setAttribute('class', 'resource-freed-animation');
                        animation.style.setProperty('--to-x', resourceX + 'px');
                        animation.style.setProperty('--to-y', resourceY + 'px');
                        svg.appendChild(animation);
                        
                        // Add resource amount text
                        const amountText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        amountText.setAttribute('x', (processX + resourceX) / 2);
                        amountText.setAttribute('y', (processY + resourceY) / 2 - 10);
                        amountText.setAttribute('text-anchor', 'middle');
                        amountText.setAttribute('font-size', '14');
                        amountText.setAttribute('fill', '#3b82f6');
                        amountText.textContent = `+${allocAmount} ${typeof resourceObj === 'string' ? resourceObj : resourceObj.name}`;
                        amountText.setAttribute('class', 'resource-text-animation');
                        svg.appendChild(amountText);
                    }
                }
            }
            
            // Show current safe sequence
            if (component.safeSequence && component.safeSequence.length > 0) {
                // Get index of current process in the safe sequence
                const currentSeqIndex = component.safeSequence.indexOf(currentStep.process);
                
                // Find already executed and future processes
                const executedProcesses = component.safeSequence.slice(0, currentSeqIndex + 1);
                const futureProcesses = component.safeSequence.slice(currentSeqIndex + 1);
                
                // Draw the safe sequence at the bottom
                const seqY = 230; // Bottom of SVG
                const seqStartX = 100;
                const seqStepWidth = 600 / Math.max(component.safeSequence.length, 1);
                
                // Draw sequence line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', seqStartX);
                line.setAttribute('y1', seqY);
                line.setAttribute('x2', seqStartX + seqStepWidth * (component.safeSequence.length - 1));
                line.setAttribute('y2', seqY);
                line.setAttribute('stroke', 'white');
                line.setAttribute('stroke-width', '2');
                svg.appendChild(line);
                
                // Draw step nodes with different colors
                component.safeSequence.forEach((proc, idx) => {
                    const x = seqStartX + idx * seqStepWidth;
                    
                    // Different styling based on execution status
                    let color, textColor;
                    if (idx < currentSeqIndex) {
                        // Already executed
                        color = '#22c55e'; // Green
                        textColor = 'white';
                    } else if (idx === currentSeqIndex) {
                        // Currently executing
                        color = '#3b82f6'; // Blue
                        textColor = 'white';
                    } else {
                        // Future execution
                        color = '#94a3b8'; // Gray
                        textColor = 'white';
                    }
                    
                    // Draw node
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', seqY);
                    circle.setAttribute('r', '12');
                    circle.setAttribute('fill', color);
                    svg.appendChild(circle);
                    
                    // Draw process name
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', seqY);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'middle');
                    text.setAttribute('font-size', '10');
                    text.setAttribute('fill', textColor);
                    text.textContent = proc;
                    svg.appendChild(text);
                    
                    if (idx > 0) {
                        // Draw arrow between nodes
                        const arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        const prevX = seqStartX + (idx - 1) * seqStepWidth;
                        arrowLine.setAttribute('x1', prevX + 15);
                        arrowLine.setAttribute('y1', seqY);
                        arrowLine.setAttribute('x2', x - 15);
                        arrowLine.setAttribute('y2', seqY);
                        arrowLine.setAttribute('stroke', 'white');
                        arrowLine.setAttribute('stroke-width', '2');
                        arrowLine.setAttribute('marker-end', 'url(#arrowhead-sequence)');
                        svg.appendChild(arrowLine);
                    }
                });
                
                // Add arrowhead definition for sequence arrows
                if (component.safeSequence.length > 1 && !document.getElementById('arrowhead-sequence')) {
                    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                    marker.setAttribute('id', 'arrowhead-sequence');
                    marker.setAttribute('markerWidth', '10');
                    marker.setAttribute('markerHeight', '7');
                    marker.setAttribute('refX', '10');
                    marker.setAttribute('refY', '3.5');
                    marker.setAttribute('orient', 'auto');
                    
                    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                    polygon.setAttribute('fill', 'white');
                    marker.appendChild(polygon);
                    defs.appendChild(marker);
                    svg.appendChild(defs);
                }
            }
        }
    };

    // Helper function to draw arrows
    function drawArrow(svg, fromX, fromY, toX, toY, className) {
        // Calculate direction vector
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        // Normalize and scale back to get points on the circles/rectangles
        const length = Math.sqrt(dx * dx + dy * dy);
        const normX = dx / length;
        const normY = dy / length;
        
        // Shorten the arrow to stop at the edge of nodes
        const shortenBy = 10;
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
        line.setAttribute('stroke-width', '2');
        line.setAttribute('class', className);
        svg.appendChild(line);
        
        // Create arrowhead
        const arrowSize = 6;
        
        // Calculate arrowhead angle
        const angle = Math.atan2(adjustedToY - adjustedFromY, adjustedToX - adjustedFromX);
        
        // Calculate arrowhead points
        const arrowPoint1X = adjustedToX - arrowSize * Math.cos(angle - Math.PI/6);
        const arrowPoint1Y = adjustedToY - arrowSize * Math.sin(angle - Math.PI/6);
        const arrowPoint2X = adjustedToX - arrowSize * Math.cos(angle + Math.PI/6);
        const arrowPoint2Y = adjustedToY - arrowSize * Math.sin(angle + Math.PI/6);
        
        // Create arrowhead polygon
        const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrowhead.setAttribute('points', 
            `${adjustedToX},${adjustedToY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`
        );
        arrowhead.setAttribute('class', className);
        svg.appendChild(arrowhead);
    }

    // Add touch event support for drag and drop
    function initTouchDragAndDrop() {
        const draggableElements = document.querySelectorAll('.draggable-resource');
        const dropTargets = document.querySelectorAll('[data-droppable="true"]');
        
        let draggedElement = null;
        let touchOffsetX = 0;
        let touchOffsetY = 0;
        
        // For each draggable element
        draggableElements.forEach(element => {
            element.addEventListener('touchstart', function(e) {
                e.preventDefault();
                draggedElement = this;
                
                // Calculate touch offset
                const touch = e.touches[0];
                const rect = draggedElement.getBoundingClientRect();
                touchOffsetX = touch.clientX - rect.left;
                touchOffsetY = touch.clientY - rect.top;
                
                // Initial position
                this.classList.add('dragging');
                this.style.position = 'fixed';
                this.style.zIndex = '1000';
                
                updateTouchPosition(e);
            });
        });
        
        document.addEventListener('touchmove', function(e) {
            if (!draggedElement) return;
            e.preventDefault();
            updateTouchPosition(e);
        });
        
        document.addEventListener('touchend', function(e) {
            if (!draggedElement) return;
            
            // Check if dropped on valid target
            let targetElement = null;
            
            dropTargets.forEach(target => {
                const rect = target.getBoundingClientRect();
                const touch = e.changedTouches[0];
                
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    targetElement = target;
                }
            });
            
            // If dropped on valid target, dispatch custom drop event
            if (targetElement) {
                const resourceId = draggedElement.getAttribute('data-resource-id');
                const customEvent = new CustomEvent('resource-dropped', {
                    detail: {
                        resourceId: resourceId,
                        targetId: targetElement.getAttribute('data-process-id')
                    }
                });
                targetElement.dispatchEvent(customEvent);
            }
            
            // Reset element
            draggedElement.style.position = '';
            draggedElement.style.top = '';
            draggedElement.style.left = '';
            draggedElement.style.zIndex = '';
            draggedElement.classList.remove('dragging');
            draggedElement = null;
        });
        
        function updateTouchPosition(e) {
            if (!draggedElement) return;
            
            const touch = e.touches[0];
            draggedElement.style.top = (touch.clientY - touchOffsetY) + 'px';
            draggedElement.style.left = (touch.clientX - touchOffsetX) + 'px';
        }
    }

    // Initialize both mouse and touch drag/drop
    function initDragAndDrop() {
        // Existing mouse drag/drop code
        // ...existing code...
        
        // Touch drag/drop for mobile
        initTouchDragAndDrop();
    }

    // Make visualization responsive
    function makeVisualizationResponsive() {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                const height = entry.contentRect.height;
                
                // Update SVG viewBox or canvas size
                const svg = entry.target.querySelector('svg');
                if (svg) {
                    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
                    svg.setAttribute('width', width);
                    svg.setAttribute('height', height);
                }
            }
        });
        
        // Observe visualization container for size changes
        const container = document.getElementById('visualization-container');
        if (container) {
            resizeObserver.observe(container);
        }
    }

    // Improve touch handling for drag and drop
    function enhanceTouchInteractions() {
        // Add visual feedback for drop targets
        document.addEventListener('dragover', function(e) {
            const dropTarget = findDropTarget(e.target);
            if (!dropTarget) return;
            
            dropTarget.classList.add('drag-over');
            
            // Hapus class setelah 300ms
            setTimeout(() => {
                dropTarget.classList.remove('drag-over');
            }, 300);
        });
        
        // Find the nearest valid drop target
        function findDropTarget(element) {
            if (!element) return null;
            
            if (element.getAttribute('data-droppable') === 'true') {
                return element;
            }
            
            // Traverse up to find droppable parent
            return findDropTarget(element.parentElement);
        }
        
        // Add tablet detection
        const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
        if (isTablet) {
            document.body.classList.add('tablet-device');
        }
    }

    // Add subtle animation to UI elements
    function addUIAnimations() {
        // Add subtle hover effects to cards
        document.querySelectorAll('.process-card, .resource-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
        
        // Highlight newly added resources
        document.addEventListener('resource-allocated', function(e) {
            const { resourceId, processId } = e.detail;
            const resourceElement = document.querySelector(`[data-allocated-resource="${resourceId}"]`);
            
            if (resourceElement) {
                resourceElement.classList.add('resource-active');
                setTimeout(() => {
                    resourceElement.classList.remove('resource-active');
                }, 2000);
            }
        });
    }

    // Update visualization container size on resize
    function handleResponsiveVisualization() {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                // Update SVG viewBox if visualization exists
                updateVisualization();
            }
        });
        
        const vizContainer = document.getElementById('visualization-container');
        if (vizContainer) {
            resizeObserver.observe(vizContainer);
        }
        
        // Also handle orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                updateVisualization();
            }, 100);
        });
    }

    // Initialize mobile-friendly features
    document.addEventListener('DOMContentLoaded', function() {
        // Add responsive visualization
        makeVisualizationResponsive();
        
        // Detect mobile devices and adjust UI
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            document.body.classList.add('mobile-device');
        }
        
        enhanceTouchInteractions();
        addUIAnimations();
        handleResponsiveVisualization();
    });
});
