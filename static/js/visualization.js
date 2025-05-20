function renderResourceAllocationGraph(container, processes, resources, deadlockCycle = []) {
    // Bersihkan container
    container.innerHTML = '';
    
    // Buat elemen SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 800 400');
    container.appendChild(svg);
    
    // Posisi untuk node
    const processY = 100;
    const resourceY = 300;
    const startX = 100;
    const spacing = 150;
    
    // Simpan posisi node
    const processNodes = {};
    const resourceNodes = {};
    
    // Gambar proses (lingkaran)
    processes.forEach((process, idx) => {
        const x = startX + idx * spacing;
        
        // Buat lingkaran untuk proses
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', processY);
        circle.setAttribute('r', 30);
        
        // Style berdasarkan status deadlock
        if (deadlockCycle.includes(process.id)) {
            circle.setAttribute('class', 'deadlock-process');
        } else {
            circle.setAttribute('class', 'process-node');
        }
        
        svg.appendChild(circle);
        
        // Label proses
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', processY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.textContent = process.name;
        svg.appendChild(text);
        
        // Simpan posisi untuk edge
        processNodes[process.id] = { x, y: processY };
    });
    
    // Gambar resource (kotak)
    resources.forEach((resource, idx) => {
        const x = startX + idx * spacing;
        
        // Buat kotak untuk resource
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - 25);
        rect.setAttribute('y', resourceY - 25);
        rect.setAttribute('width', 50);
        rect.setAttribute('height', 50);
        rect.setAttribute('class', 'resource-node');
        svg.appendChild(rect);
        
        // Label resource
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', resourceY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.textContent = resource.name;
        svg.appendChild(text);
        
        // Icon resource (opsional)
        if (resource.icon) {
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            icon.setAttribute('x', x);
            icon.setAttribute('y', resourceY - 35);
            icon.setAttribute('text-anchor', 'middle');
            icon.setAttribute('fill', 'white');
            icon.setAttribute('font-size', '16');
            icon.textContent = resource.icon;
            svg.appendChild(icon);
        }
        
        // Simpan posisi untuk edge
        resourceNodes[resource.id] = { x, y: resourceY };
    });
    
    // Gambar allocation edges (resource ke process)
    resources.forEach(resource => {
        if (resource.held_by) {
            const process = processes.find(p => p.id === resource.held_by);
            if (process && resourceNodes[resource.id] && processNodes[process.id]) {
                // Gambar panah dari resource ke process
                const startX = resourceNodes[resource.id].x;
                const startY = resourceNodes[resource.id].y - 25; // Atas resource
                const endX = processNodes[process.id].x;
                const endY = processNodes[process.id].y + 25; // Bawah process
                
                const isDeadlockEdge = deadlockCycle.includes(resource.id) && 
                                       deadlockCycle.includes(process.id);
                
                drawArrow(
                    svg, 
                    startX, startY, 
                    endX, endY,
                    isDeadlockEdge ? 'deadlock-edge' : 'allocation-edge'
                );
            }
        }
    });
    
    // Gambar request edges (process ke resource)
    processes.forEach(process => {
        // Cari resource yang dibutuhkan tapi belum dimiliki
        const neededResources = process.needs.filter(
            resourceId => !process.allocation.includes(resourceId)
        );
        
        neededResources.forEach(resourceId => {
            const resource = resources.find(r => r.id === resourceId);
            if (resource && processNodes[process.id] && resourceNodes[resourceId]) {
                // Gambar panah dari process ke resource
                const startX = processNodes[process.id].x;
                const startY = processNodes[process.id].y + 25; // Bawah process
                const endX = resourceNodes[resourceId].x;
                const endY = resourceNodes[resourceId].y - 25; // Atas resource
                
                const isDeadlockEdge = deadlockCycle.includes(resourceId) && 
                                       deadlockCycle.includes(process.id);
                
                drawArrow(
                    svg, 
                    startX, startY, 
                    endX, endY,
                    isDeadlockEdge ? 'deadlock-edge' : 'request-edge'
                );
            }
        });
    });
    
    // Tambahkan label deadlock jika ada
    if (deadlockCycle.length > 0) {
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
 * Fungsi helper untuk menggambar panah
 */
function drawArrow(svg, fromX, fromY, toX, toY, className) {
    // Hitung vektor arah
    const dx = toX - fromX;
    const dy = toY - fromY;
    
    // Normalisasi dan skalakan untuk mendapatkan titik pada lingkaran/kotak
    const length = Math.sqrt(dx * dx + dy * dy);
    const normX = dx / length;
    const normY = dy / length;
    
    // Perpendek panah agar berhenti di tepi node
    const shortenBy = 5;
    const adjustedFromX = fromX + normX * shortenBy;
    const adjustedFromY = fromY + normY * shortenBy;
    const adjustedToX = toX - normX * shortenBy;
    const adjustedToY = toY - normY * shortenBy;
    
    // Buat garis panah
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', adjustedFromX);
    line.setAttribute('y1', adjustedFromY);
    line.setAttribute('x2', adjustedToX);
    line.setAttribute('y2', adjustedToY);
    line.setAttribute('class', className);
    svg.appendChild(line);
    
    // Buat ujung panah (arrowhead)
    const arrowSize = 8;
    
    // Hitung sudut arrowhead
    const angle = Math.atan2(adjustedToY - adjustedFromY, adjustedToX - adjustedFromX);
    
    // Hitung titik-titik arrowhead
    const arrowPoint1X = adjustedToX - arrowSize * Math.cos(angle - Math.PI/6);
    const arrowPoint1Y = adjustedToY - arrowSize * Math.sin(angle - Math.PI/6);
    const arrowPoint2X = adjustedToX - arrowSize * Math.cos(angle + Math.PI/6);
    const arrowPoint2Y = adjustedToY - arrowSize * Math.sin(angle + Math.PI/6);
    
    // Buat polygon arrowhead
    const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrowhead.setAttribute('points', 
        `${adjustedToX},${adjustedToY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`
    );
    arrowhead.setAttribute('class', className);
    svg.appendChild(arrowhead);
}