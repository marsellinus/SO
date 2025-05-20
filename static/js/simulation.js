/**
 * Simulator controller for deadlock simulation
 */
function simulationController() {
    return {
        // Data State
        processes: [],
        resources: [],
        deadlockDetected: false,
        deadlockProcesses: [],
        
        // UI State
        showPreemptionOptions: false,
        showTerminateOptions: false,
        
        // Educational State
        showRealtimeEdu: true,  // Enabled by default
        eduSteps: [],
        currentEduStep: 0,
        eduFeedback: "",
        eduHighlights: {},
        
        // Random generation parameters
        randomGenParams: {
            numProcesses: 3,
            numResources: 3
        },
        
        // New process/resource templates
        newProcess: {
            name: '',
            icon: '📊',
            needs: []
        },
        
        newResource: {
            name: '',
            icon: '🖥️'
        },
        
        // Educational Mode
        educationalMode: false, // Default off
        eduTopic: 'intro',
        eduTopics: ['intro', 'conditions', 'rag', 'detection', 'resolution', 'prevention'],
        
        // Toggle educational mode
        toggleEducationalMode() {
            this.educationalMode = !this.educationalMode;
        },
        
        // Set educational topic
        setEduTopic(topic) {
            this.eduTopic = topic;
        },
        
        // Navigate to previous topic
        prevEduTopic() {
            const currentIndex = this.eduTopics.indexOf(this.eduTopic);
            if (currentIndex > 0) {
                this.eduTopic = this.eduTopics[currentIndex - 1];
            } else {
                // Wrap to last topic
                this.eduTopic = this.eduTopics[this.eduTopics.length - 1];
            }
        },
        
        // Navigate to next topic
        nextEduTopic() {
            const currentIndex = this.eduTopics.indexOf(this.eduTopic);
            if (currentIndex < this.eduTopics.length - 1) {
                this.eduTopic = this.eduTopics[currentIndex + 1];
            } else {
                // Wrap to first topic
                this.eduTopic = this.eduTopics[0];
            }
        },
        
        // Initialize simulation
        init() {
            console.log("Simulation initialized");
            
            // Add some default resources
            this.resources = [
                { id: 'r1', name: 'CPU', icon: '🖥️', held_by: null },
                { id: 'r2', name: 'Memory', icon: '📊', held_by: null },
                { id: 'r3', name: 'Disk', icon: '💾', held_by: null }
            ];
            
            // Initialize with first educational step
            this.addEduStep('welcome', 'Selamat datang di Simulator Deadlock! Mulailah dengan membuat proses dan resource.');
            
            // Render initial visualization
            setTimeout(() => {
                this.renderVisualization();
            }, 100);
        },
        
        // Toggle realtime edu visibility
        toggleRealtimeEdu() {
            this.showRealtimeEdu = !this.showRealtimeEdu;
        },
        
        // Add educational step/feedback
        addEduStep(type, message) {
            const step = {
                id: this.eduSteps.length + 1,
                type: type, // 'welcome', 'info', 'warning', 'success', 'tip'
                message: message,
                timestamp: new Date()
            };
            
            this.eduSteps.push(step);
            this.currentEduStep = this.eduSteps.length - 1;
            this.eduFeedback = message;
            
            // Auto-scroll to new step
            setTimeout(() => {
                const eduLog = document.getElementById('edu-log');
                if (eduLog) {
                    eduLog.scrollTop = eduLog.scrollHeight;
                }
            }, 100);
        },
        
        // Generate random simulation scenario
        generateRandomScenario() {
            const numProcesses = this.randomGenParams.numProcesses;
            const numResources = this.randomGenParams.numResources;
            
            // Validate parameters
            if (numProcesses < 2 || numProcesses > 6) {
                alert('Jumlah proses harus antara 2-6');
                return;
            }
            
            if (numResources < 2 || numResources > 6) {
                alert('Jumlah resource harus antara 2-6');
                return;
            }
            
            // Reset current simulation
            this.resetSimulation();
            
            // Add educational step
            this.addEduStep('info', `Membuat skenario acak dengan ${numProcesses} proses dan ${numResources} resource...`);
            
            // Create resources
            const resourceIcons = ['🖥️', '📊', '💾', '🖨️', '🌐', '🔋'];
            const resourceNames = ['CPU', 'Memory', 'Disk', 'Printer', 'Network', 'Power'];
            
            this.resources = [];
            for (let i = 0; i < numResources; i++) {
                this.resources.push({
                    id: `r${i+1}`,
                    name: i < resourceNames.length ? resourceNames[i] : `Resource ${i+1}`,
                    icon: i < resourceIcons.length ? resourceIcons[i] : '💠',
                    held_by: null
                });
            }
            
            // Create processes
            const processIcons = ['📊', '🔍', '📱', '🎬', '🎮', '📝'];
            
            this.processes = [];
            for (let i = 0; i < numProcesses; i++) {
                // Random number of resource needs (1 to max resources)
                const numNeeds = Math.floor(Math.random() * numResources) + 1;
                
                // Random selection of resources
                const availableResources = this.resources.map(r => r.id);
                const needs = [];
                
                // Generate unique needs
                while (needs.length < numNeeds && availableResources.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableResources.length);
                    needs.push(availableResources[randomIndex]);
                    availableResources.splice(randomIndex, 1);
                }
                
                this.processes.push({
                    id: `p${i+1}`,
                    name: `Process ${i+1}`,
                    icon: i < processIcons.length ? processIcons[i] : '📄',
                    needs: needs,
                    allocation: []
                });
            }
            
            // Create educational step
            this.addEduStep('success', 'Skenario acak berhasil dibuat! Coba alokasikan resource dengan drag & drop untuk melihat apa yang terjadi.');
            
            // If in educational mode, explain how deadlock might occur
            this.addEduStep('tip', 'Petunjuk: Coba alokasikan resource ke beberapa proses hingga terbentuk circular wait. Deadlock dapat terjadi ketika beberapa proses saling menunggu resource yang dipegang proses lain.');
            
            // Render visualization
            this.renderVisualization();
        },
        
        // Add a new process
        addProcess() {
            if (!this.newProcess.name.trim()) {
                alert("Please enter a process name");
                return;
            }
            
            if (this.newProcess.needs.length === 0) {
                alert("Please select at least one required resource");
                return;
            }
            
            // Create new process with unique ID
            const processId = 'p' + (this.processes.length + 1);
            const process = {
                id: processId,
                name: this.newProcess.name.trim(),
                icon: this.newProcess.icon,
                needs: [...this.newProcess.needs],
                allocation: []
            };
            
            this.processes.push(process);
            
            // Reset the form
            this.newProcess = {
                name: '',
                icon: '📊',
                needs: []
            };
            
            // Add educational step based on process count
            if (this.processes.length === 1) {
                this.addEduStep('info', `Proses "${process.name}" ditambahkan. Proses ini membutuhkan ${process.needs.length} resource. Tambahkan proses lain untuk simulasi yang lebih kompleks.`);
            } else {
                const resourceNames = process.needs.map(id => this.getResourceName(id)).join(", ");
                this.addEduStep('info', `Proses "${process.name}" ditambahkan. Proses ini membutuhkan: ${resourceNames}`);
            }
            
            // Check for deadlock after adding process
            this.checkForDeadlock();
            this.renderVisualization();
        },
        
        // Remove a process
        removeProcess(index) {
            const process = this.processes[index];
            
            // Release any allocated resources
            process.allocation.forEach(resourceId => {
                const resource = this.resources.find(r => r.id === resourceId);
                if (resource) {
                    resource.held_by = null;
                }
            });
            
            // Remove process from list
            this.processes.splice(index, 1);
            
            // Check if deadlock is resolved
            this.checkForDeadlock();
            this.renderVisualization();
        },
        
        // Add a new resource
        addResource() {
            if (!this.newResource.name.trim()) {
                alert("Please enter a resource name");
                return;
            }
            
            // Create new resource with unique ID
            const resourceId = 'r' + (this.resources.length + 1);
            const resource = {
                id: resourceId,
                name: this.newResource.name.trim(),
                icon: this.newResource.icon,
                held_by: null
            };
            
            this.resources.push(resource);
            
            // Reset the form
            this.newResource = {
                name: '',
                icon: '🖥️'
            };
            
            this.renderVisualization();
        },
        
        // Remove a resource
        removeResource(index) {
            const resourceId = this.resources[index].id;
            
            // Check if resource is allocated to any process
            const allocated = this.resources[index].held_by;
            if (allocated) {
                // Remove from process allocation
                const process = this.processes.find(p => p.id === allocated);
                if (process) {
                    process.allocation = process.allocation.filter(id => id !== resourceId);
                }
            }
            
            // Remove from all process needs
            this.processes.forEach(process => {
                process.needs = process.needs.filter(id => id !== resourceId);
            });
            
            // Remove resource from list
            this.resources.splice(index, 1);
            
            // Check if deadlock is resolved
            this.checkForDeadlock();
            this.renderVisualization();
        },
        
        // Drag and drop functionality
        dragResource(event, resourceId) {
            event.dataTransfer.setData('text/plain', resourceId);
        },
        
        // Handle drop on process
        dropResourceOnProcess(event, processId) {
            const resourceId = event.dataTransfer.getData('text/plain');
            if (!resourceId) return;
            
            this.allocateResource(resourceId, processId);
        },
        
        // Allocate resource to process
        allocateResource(resourceId, processId) {
            const resource = this.resources.find(r => r.id === resourceId);
            const process = this.processes.find(p => p.id === processId);
            
            if (!resource || !process) return;
            
            if (resource.held_by !== null) {
                console.log("Resource already allocated");
                this.addEduStep('warning', `${resource.name} sudah dialokasikan ke proses lain dan tidak dapat digunakan.`);
                return;
            }
            
            if (!process.needs.includes(resourceId)) {
                console.log("Process doesn't need this resource");
                this.addEduStep('warning', `${process.name} tidak membutuhkan ${resource.name}. Perhatikan kebutuhan resource setiap proses.`);
                return;
            }
            
            // Allocate resource
            resource.held_by = processId;
            process.allocation.push(resourceId);
            
            // Add educational step
            this.addEduStep('success', `${resource.name} berhasil dialokasikan ke ${process.name}`);
            
            // Check for circular dependency potential
            const otherProcesses = this.processes.filter(p => p.id !== processId);
            let circularPotential = false;
            
            for (const otherProcess of otherProcesses) {
                // If this process holds resources that other process needs
                // AND other process holds resources that this process needs
                const thisHoldsNeededByOther = process.allocation.some(resId => 
                    otherProcess.needs.includes(resId) && !otherProcess.allocation.includes(resId));
                
                const otherHoldsNeededByThis = otherProcess.allocation.some(resId => 
                    process.needs.includes(resId) && !process.allocation.includes(resId));
                
                if (thisHoldsNeededByOther && otherHoldsNeededByThis) {
                    circularPotential = true;
                    this.addEduStep('warning', `Potensi circular wait terdeteksi antara ${process.name} dan ${otherProcess.name}. Hal ini dapat menyebabkan deadlock!`);
                    break;
                }
            }
            
            // Check for deadlock
            const wasDeadlock = this.deadlockDetected;
            this.checkForDeadlock();
            
            if (!wasDeadlock && this.deadlockDetected) {
                // Deadlock baru terdeteksi
                this.addEduStep('warning', `DEADLOCK TERDETEKSI! Terdapat circular wait di mana setiap proses menunggu resource yang dipegang proses lain.`);
                this.eduHighlights = {
                    type: 'deadlock',
                    processes: this.deadlockProcesses,
                    timestamp: Date.now()
                };
                
                // Explain possible resolution
                this.addEduStep('tip', 'Pilih salah satu strategi penyelesaian deadlock: Preemption, Kill Process, atau Rollback untuk mengatasi deadlock.');
            }
            
            this.renderVisualization();
        },
        
        // Release resource from a process
        releaseResource(resourceId) {
            const resource = this.resources.find(r => r.id === resourceId);
            if (!resource || !resource.held_by) return;
            
            const process = this.processes.find(p => p.id === resource.held_by);
            if (process) {
                // Remove resource from process allocation
                process.allocation = process.allocation.filter(id => id !== resourceId);
            }
            
            // Release resource
            resource.held_by = null;
            
            // Check if deadlock is resolved
            this.checkForDeadlock();
            this.renderVisualization();
        },
        
        // Check for deadlock using wait-for graph algorithm
        checkForDeadlock() {
            // Initialize wait-for graph
            const waitForGraph = {};
            
            this.processes.forEach(process => {
                waitForGraph[process.id] = [];
            });
            
            // Build wait-for graph
            this.processes.forEach(process => {
                // Find resources process needs but doesn't have
                const neededResources = process.needs.filter(
                    resourceId => !process.allocation.includes(resourceId)
                );
                
                // For each needed resource, find who's holding it
                neededResources.forEach(resourceId => {
                    const resource = this.resources.find(r => r.id === resourceId);
                    if (resource && resource.held_by && resource.held_by !== process.id) {
                        // This process is waiting for a process holding the resource
                        waitForGraph[process.id].push(resource.held_by);
                    }
                });
            });
            
            // Detect cycle in wait-for graph using DFS
            const visited = {};
            const recStack = {};
            let deadlockedProcesses = [];
            
            const detectCycle = (processId, path = []) => {
                if (!visited[processId]) {
                    visited[processId] = true;
                    recStack[processId] = true;
                    path.push(processId);
                    
                    for (const neighbor of waitForGraph[processId]) {
                        if (!visited[neighbor]) {
                            if (detectCycle(neighbor, [...path])) {
                                return true;
                            }
                        } else if (recStack[neighbor]) {
                            // Found cycle
                            const cycleStart = path.indexOf(neighbor);
                            deadlockedProcesses = [...path.slice(cycleStart), neighbor];
                            return true;
                        }
                    }
                }
                
                recStack[processId] = false;
                return false;
            };
            
            // Check for cycle starting from each process
            for (const process of this.processes) {
                if (!visited[process.id]) {
                    if (detectCycle(process.id)) {
                        break;
                    }
                }
            }
            
            this.deadlockDetected = deadlockedProcesses.length > 0;
            this.deadlockProcesses = deadlockedProcesses;
            
            // Identify circular wait for educational purposes if deadlock detected
            if (this.deadlockDetected && this.showRealtimeEdu) {
                // Create description of the wait cycle
                const cycleDescription = this.deadlockProcesses.map(id => {
                    const proc = this.processes.find(p => p.id === id);
                    return proc ? proc.name : id;
                }).join(" → ") + " → " + this.deadlockProcesses[0];
                
                // Reset but don't add new edu step to avoid repetitive messages
                this.eduHighlights = {
                    type: 'deadlock_cycle',
                    cycle: cycleDescription,
                    processes: this.deadlockProcesses,
                    timestamp: Date.now()
                };
            }
            
            return this.deadlockDetected;
        },
        
        // Format deadlock cycle for display
        formatDeadlockCycle() {
            if (!this.deadlockDetected || this.deadlockProcesses.length === 0) {
                return "No deadlock detected";
            }
            
            return this.deadlockProcesses.map(id => {
                const process = this.processes.find(p => p.id === id);
                return process ? process.name : id;
            }).join(" → ") + " → ...";
        },
        
        // Reset the simulation
        resetSimulation() {
            // Release all resources
            this.resources.forEach(resource => {
                resource.held_by = null;
            });
            
            // Reset all processes
            this.processes.forEach(process => {
                process.allocation = [];
            });
            
            // Reset deadlock state
            this.deadlockDetected = false;
            this.deadlockProcesses = [];
            
            // Update visualization
            this.renderVisualization();
        },
        
        // Preemption: forcibly take a resource
        preemptResource(resourceId) {
            const resource = this.resources.find(r => r.id === resourceId);
            if (!resource || resource.held_by === null) return;
            
            const processId = resource.held_by;
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;
            
            // Remove resource from process allocation
            process.allocation = process.allocation.filter(id => id !== resourceId);
            // Release resource
            resource.held_by = null;
            
            // Add educational step
            this.addEduStep('info', `PREEMPTION: ${resource.name} diambil paksa dari ${process.name}. Hal ini melanggar kondisi "No Preemption" dari deadlock.`);
            
            // Show animation for preemption
            this.showPreemptionEffect(processId, resourceId);
            
            // Close modal
            this.showPreemptionOptions = false;
            
            // Check if deadlock is resolved
            const wasDeadlock = this.deadlockDetected;
            this.checkForDeadlock();
            
            if (wasDeadlock && !this.deadlockDetected) {
                this.addEduStep('success', 'Deadlock berhasil diselesaikan dengan preemption!');
            }
            
            this.renderVisualization();
        },
        
        // Terminate a process
        terminateProcess(processId) {
            const processIndex = this.processes.findIndex(p => p.id === processId);
            if (processIndex < 0) return;
            
            const process = this.processes[processIndex];
            
            // Show termination effect before removal
            this.showTerminationEffect(processId);
            
            // Add educational step
            this.addEduStep('info', `TERMINASI: Proses ${process.name} diterminasi dan semua resourcenya dibebaskan. Ini adalah strategi paling ekstrem.`);
            
            // Release all resources held by this process
            const freedResources = [];
            process.allocation.forEach(resId => {
                const res = this.resources.find(r => r.id === resId);
                if (res) {
                    res.held_by = null;
                    freedResources.push(res.name);
                }
            });
            
            if (freedResources.length > 0) {
                this.addEduStep('info', `Resource yang dibebaskan: ${freedResources.join(', ')}`);
            }
            
            // Remove the process
            this.processes.splice(processIndex, 1);
            
            // Close modal
            this.showTerminateOptions = false;
            
            // Check if deadlock is resolved
            const wasDeadlock = this.deadlockDetected;
            this.checkForDeadlock();
            
            if (wasDeadlock && !this.deadlockDetected) {
                this.addEduStep('success', 'Deadlock berhasil diselesaikan dengan terminasi proses!');
            }
            
            this.renderVisualization();
        },
        
        // Confirm and execute rollback
        confirmRollback() {
            if (confirm("Are you sure you want to reset all resource allocations?")) {
                this.rollbackAllocations();
            }
        },
        
        // Reset all resource allocations
        rollbackAllocations() {
            // Add educational step
            this.addEduStep('info', 'ROLLBACK: Semua alokasi resource direset ke keadaan awal.');
            
            // Release all resources
            this.resources.forEach(resource => {
                resource.held_by = null;
            });
            
            // Clear all process allocations
            this.processes.forEach(process => {
                process.allocation = [];
            });
            
            // Reset deadlock state
            this.deadlockDetected = false;
            this.deadlockProcesses = [];
            
            this.addEduStep('success', 'Semua alokasi resource dikembalikan ke keadaan awal. Sistem sekarang dalam keadaan aman.');
            
            // Show rollback effect
            this.showRollbackEffect();
            
            // Update visualization
            this.renderVisualization();
        },
        
        // Show preemption effect
        showPreemptionEffect(processId, resourceId) {
            const processEl = document.querySelector(`[data-process-id="${processId}"]`);
            const resourceEl = document.querySelector(`[data-resource-id="${resourceId}"]`);
            
            if (!processEl || !resourceEl) return;
            
            processEl.classList.add('shake-animation');
            setTimeout(() => {
                processEl.classList.remove('shake-animation');
            }, 1000);
        },
        
        // Show termination effect
        showTerminationEffect(processId) {
            const processEl = document.querySelector(`[data-process-id="${processId}"]`);
            if (!processEl) return;
            
            processEl.classList.add('termination-animation');
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.className = 'process-terminated-overlay';
            overlay.textContent = 'TERMINATED';
            processEl.style.position = 'relative';
            processEl.appendChild(overlay);
        },
        
        // Show rollback effect
        showRollbackEffect() {
            const processEls = document.querySelectorAll('[data-process-id]');
            const resourceEls = document.querySelectorAll('[data-resource-id]');
            
            processEls.forEach(el => {
                el.classList.add('shake-animation');
                setTimeout(() => el.classList.remove('shake-animation'), 1000);
            });
            
            resourceEls.forEach(el => {
                el.classList.add('pulse-animation');
                setTimeout(() => el.classList.remove('pulse-animation'), 1000);
            });
        },
        
        // Helper method to get resource name by ID
        getResourceName(id) {
            const resource = this.resources.find(r => r.id === id);
            return resource ? resource.name : id;
        },
        
        // Helper method to get process name by ID
        getProcessName(id) {
            const process = this.processes.find(p => p.id === id);
            return process ? process.name : id;
        },
        
        // Render resource allocation graph visualization
        renderVisualization() {
            const container = document.getElementById('visualization');
            if (!container) return;
            
            container.innerHTML = '';
            
            // Create SVG element
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 600 300');
            container.appendChild(svg);
            
            // Calculate positions
            const processY = 70;
            const resourceY = 220;
            const spacing = Math.min(500 / (Math.max(this.processes.length, this.resources.length) + 1), 120);
            const startX = spacing;
            
            // Draw process nodes
            const processPositions = {};
            this.processes.forEach((process, index) => {
                const x = startX + index * spacing;
                const isDeadlocked = this.deadlockProcesses.includes(process.id);
                
                // Create circle for process
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', processY);
                circle.setAttribute('r', 25);
                circle.setAttribute('fill', isDeadlocked ? '#ef4444' : '#6366f1');
                circle.setAttribute('stroke', isDeadlocked ? '#dc2626' : '#4f46e5');
                circle.setAttribute('stroke-width', '2');
                circle.setAttribute('data-process-id', process.id);
                svg.appendChild(circle);
                
                // Create text label
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', processY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('fill', 'white');
                text.setAttribute('font-size', '12');
                text.textContent = process.name;
                svg.appendChild(text);
                
                // Store position for edges
                processPositions[process.id] = { x, y: processY };
            });
            
            // Draw resource nodes
            const resourcePositions = {};
            this.resources.forEach((resource, index) => {
                const x = startX + index * spacing;
                
                // Create rectangle for resource
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x - 20);
                rect.setAttribute('y', resourceY - 20);
                rect.setAttribute('width', 40);
                rect.setAttribute('height', 40);
                rect.setAttribute('fill', '#10b981');
                rect.setAttribute('stroke', '#059669');
                rect.setAttribute('stroke-width', '2');
                rect.setAttribute('data-resource-id', resource.id);
                svg.appendChild(rect);
                
                // Create text label
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', resourceY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('fill', 'white');
                text.setAttribute('font-size', '12');
                text.textContent = resource.name;
                svg.appendChild(text);
                
                // Store position for edges
                resourcePositions[resource.id] = { x, y: resourceY };
            });
            
            // Draw edges showing resource allocation
            this.resources.forEach(resource => {
                if (resource.held_by && processPositions[resource.held_by] && resourcePositions[resource.id]) {
                    const fromX = resourcePositions[resource.id].x;
                    const fromY = resourcePositions[resource.id].y - 20;
                    const toX = processPositions[resource.held_by].x;
                    const toY = processPositions[resource.held_by].y + 25;
                    
                    const isDeadlockEdge = this.deadlockProcesses.includes(resource.held_by);
                    
                    // Draw line
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', fromX);
                    line.setAttribute('y1', fromY);
                    line.setAttribute('x2', toX);
                    line.setAttribute('y2', toY);
                    line.setAttribute('stroke', isDeadlockEdge ? '#ef4444' : '#f97316');
                    line.setAttribute('stroke-width', isDeadlockEdge ? '3' : '2');
                    svg.appendChild(line);
                    
                    // Draw arrowhead
                    this.drawArrowhead(svg, fromX, fromY, toX, toY, isDeadlockEdge ? '#ef4444' : '#f97316');
                }
            });
            
            // Draw edges for resource requests
            this.processes.forEach(process => {
                process.needs.forEach(resourceId => {
                    if (!process.allocation.includes(resourceId) && processPositions[process.id] && resourcePositions[resourceId]) {
                        const fromX = processPositions[process.id].x;
                        const fromY = processPositions[process.id].y + 25;
                        const toX = resourcePositions[resourceId].x;
                        const toY = resourcePositions[resourceId].y - 20;
                        
                        const isDeadlockEdge = this.deadlockProcesses.includes(process.id);
                        
                        // Draw dashed line
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', fromX);
                        line.setAttribute('y1', fromY);
                        line.setAttribute('x2', toX);
                        line.setAttribute('y2', toY);
                        line.setAttribute('stroke', isDeadlockEdge ? '#ef4444' : '#8b5cf6');
                        line.setAttribute('stroke-width', isDeadlockEdge ? '3' : '2');
                        line.setAttribute('stroke-dasharray', '5,5');
                        svg.appendChild(line);
                        
                        // Draw arrowhead
                        this.drawArrowhead(svg, fromX, fromY, toX, toY, isDeadlockEdge ? '#ef4444' : '#8b5cf6');
                    }
                });
            });
            
            // Add educational highlights if applicable
            if (this.eduHighlights && this.eduHighlights.type === 'deadlock_cycle') {
                // Highlight the circular wait more prominently
                // Code to enhance the visualization of the deadlock cycle
                
                // Add explanatory text to the visualization
                const svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                svgText.setAttribute('x', '50%');
                svgText.setAttribute('y', '280');
                svgText.setAttribute('text-anchor', 'middle');
                svgText.setAttribute('fill', '#ef4444');
                svgText.setAttribute('font-size', '14');
                svgText.setAttribute('font-weight', 'bold');
                svgText.setAttribute('class', 'deadlock-cycle-text');
                svgText.textContent = 'Deadlock Detected: Circular Wait';
                svg.appendChild(svgText);
            }
        },
        
        // Helper function to draw arrowhead
        drawArrowhead(svg, fromX, fromY, toX, toY, color) {
            const dx = toX - fromX;
            const dy = toY - fromY;
            const angle = Math.atan2(dy, dx);
            
            const arrowLength = 10;
            
            const x1 = toX - arrowLength * Math.cos(angle - Math.PI / 6);
            const y1 = toY - arrowLength * Math.sin(angle - Math.PI / 6);
            const x2 = toX - arrowLength * Math.cos(angle + Math.PI / 6);
            const y2 = toY - arrowLength * Math.sin(angle + Math.PI / 6);
            
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            arrow.setAttribute('points', `${toX},${toY} ${x1},${y1} ${x2},${y2}`);
            arrow.setAttribute('fill', color);
            svg.appendChild(arrow);
        }
    };
}
