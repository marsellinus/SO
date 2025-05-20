/**
 * Game Challenge adalah controller untuk mode game dengan level dan tantangan.
 */
function gameController() {
    return {
        // State UI
        gameState: 'levelSelect', // levelSelect, levelIntro, gameplay, levelComplete
        currentLevel: 1,
        currentLevelData: null,
        score: 0,
        deadlockDetected: false,
        deadlockProcesses: [],
        hasNextLevel: false,
        
        // UI state
        showPreemption: false,
        showKillProcess: false,
        showNotification: false,
        showResolutionResult: false,
        resolutionMethod: null,
        resolutionMessage: null,
        notificationMessage: null,
        
        // Strategi penyelesaian deadlock (hanya bisa digunakan sekali per level)
        availableStrategies: {
            preemption: true,
            kill: true,
            rollback: true
        },
        
        // Game elements
        processes: [],
        resources: [],
        
        // Star rating
        stars: 0,
        
        // Level data
        levels: [
            {
                id: 1,
                name: "Basic Resource Allocation",
                description: "Learn how to allocate resources to processes",
                objective: "Complete all processes without causing deadlock",
                difficulty: 1,
                locked: false,
                completed: false,
                highScore: 0,
                starThresholds: [50, 100, 200], // Skor minimum untuk 1, 2, 3 bintang
                timeLimit: 120 // 2 menit
            },
            {
                id: 2,
                name: "Simple Deadlock",
                description: "Handle your first deadlock situation",
                objective: "Resolve a deadlock and complete all processes",
                difficulty: 2,
                locked: true,
                completed: false,
                highScore: 0,
                starThresholds: [100, 200, 300],
                timeLimit: 150 // 2.5 menit
            },
            {
                id: 3,
                name: "Complex Dependencies",
                description: "Multiple processes with interdependencies",
                objective: "Efficiently manage resources to prevent and resolve deadlocks",
                difficulty: 3,
                locked: true,
                completed: false,
                highScore: 0,
                starThresholds: [200, 300, 400],
                timeLimit: 180 // 3 menit
            }
        ],
        
        // Timer
        timer: 0,
        timerInterval: null,
        
        // Initialize the game
        init() {
            console.log("Game Challenge initialized");
            
            // Always start at level select screen
            this.gameState = 'levelSelect';
        },
        
        // Start a specific level
        startLevel(levelId) {
            this.currentLevel = levelId;
            this.currentLevelData = this.levels.find(l => l.id === levelId);
            this.gameState = 'levelIntro';
            
            // Check if there's a next level
            this.hasNextLevel = this.levels.some(l => l.id === levelId + 1 && !l.locked);
        },
        
        // Begin gameplay for current level
        startGameplay() {
            this.gameState = 'gameplay';
            this.score = 0;
            this.deadlockDetected = false;
            this.deadlockProcesses = [];
            this.stars = 0;
            
            // Reset timer
            this.timer = this.currentLevelData.timeLimit;
            
            // Reset available strategies
            this.availableStrategies = {
                preemption: true,
                kill: true,
                rollback: true
            };
            
            // Initialize game elements based on level
            this.initializeLevel(this.currentLevel);
            
            // Start timer
            this.startTimer();
            
            // Render initial state
            this.renderVisualization();
        },
        
        // Start the timer
        startTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            
            this.timerInterval = setInterval(() => {
                if (this.timer > 0) {
                    this.timer--;
                } else {
                    // Game over when time runs out
                    this.gameOver("Time's up!");
                }
            }, 1000);
        },
        
        // Stop the timer
        stopTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        },
        
        // Format time for display (mm:ss)
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        // Initialize level data
        initializeLevel(levelId) {
            switch(levelId) {
                case 1:
                    this.initLevel1();
                    break;
                case 2:
                    this.initLevel2();
                    break;
                case 3:
                    this.initLevel3();
                    break;
                default:
                    this.initLevel1();
            }
        },
        
        // Level 1: Basic resource allocation
        initLevel1() {
            this.processes = [
                { id: 'p1', name: 'Process 1', icon: '📊', needs: ['r1', 'r2'], allocation: [], progress: 0 },
                { id: 'p2', name: 'Process 2', icon: '🔍', needs: ['r2', 'r3'], allocation: [], progress: 0 },
                { id: 'p3', name: 'Process 3', icon: '📱', needs: ['r1', 'r3'], allocation: [], progress: 0 }
            ];
            
            this.resources = [
                { id: 'r1', name: 'CPU', icon: '🖥️', held_by: null },
                { id: 'r2', name: 'Memory', icon: '📝', held_by: null },
                { id: 'r3', name: 'Printer', icon: '🖨️', held_by: null },
                { id: 'r4', name: 'Disk', icon: '💾', held_by: null },
                { id: 'r5', name: 'Network', icon: '🌐', held_by: null }
            ];
        },
        
        // Level 2: Simple deadlock
        initLevel2() {
            this.processes = [
                { id: 'p1', name: 'Text Editor', icon: '📝', needs: ['r1', 'r3'], allocation: [], progress: 0 },
                { id: 'p2', name: 'Web Browser', icon: '🌐', needs: ['r2', 'r1'], allocation: [], progress: 0 },
                { id: 'p3', name: 'Email Client', icon: '📧', needs: ['r3', 'r2'], allocation: [], progress: 0 },
                { id: 'p4', name: 'Music Player', icon: '🎵', needs: ['r4'], allocation: [], progress: 0 }
            ];
            
            this.resources = [
                { id: 'r1', name: 'CPU Core 1', icon: '🖥️', held_by: null },
                { id: 'r2', name: 'CPU Core 2', icon: '🖥️', held_by: null },
                { id: 'r3', name: 'Memory', icon: '📊', held_by: null },
                { id: 'r4', name: 'Sound Card', icon: '🔊', held_by: null }
            ];
        },
        
        // Level 3: Complex dependencies
        initLevel3() {
            this.processes = [
                { id: 'p1', name: 'Database', icon: '🗄️', needs: ['r1', 'r2', 'r3'], allocation: [], progress: 0 },
                { id: 'p2', name: 'Web Server', icon: '🌐', needs: ['r2', 'r4'], allocation: [], progress: 0 },
                { id: 'p3', name: 'Video Encoder', icon: '🎬', needs: ['r3', 'r5'], allocation: [], progress: 0 },
                { id: 'p4', name: 'AI Training', icon: '🧠', needs: ['r1', 'r5'], allocation: [], progress: 0 },
                { id: 'p5', name: 'File Transfer', icon: '📁', needs: ['r4', 'r6'], allocation: [], progress: 0 }
            ];
            
            this.resources = [
                { id: 'r1', name: 'CPU Core 1', icon: '🖥️', held_by: null },
                { id: 'r2', name: 'CPU Core 2', icon: '🖥️', held_by: null },
                { id: 'r3', name: 'RAM Bank 1', icon: '📊', held_by: null },
                { id: 'r4', name: 'RAM Bank 2', icon: '📊', held_by: null },
                { id: 'r5', name: 'GPU', icon: '🎮', held_by: null },
                { id: 'r6', name: 'Network', icon: '📡', held_by: null }
            ];
        },
        
        // Drag and drop functionality
        dragResource(event, resourceId) {
            event.dataTransfer.setData('text/plain', resourceId);
        },
        
        // Handle drop on process
        dropResourceOnProcess(event, processId) {
            const resourceId = event.dataTransfer.getData('text/plain');
            if(!resourceId) return;
            
            this.allocateResource(resourceId, processId);
        },
        
        // Allocate resource to process
        allocateResource(resourceId, processId) {
            const resource = this.resources.find(r => r.id === resourceId);
            const process = this.processes.find(p => p.id === processId);
            
            if (!resource || !process) return;
            
            if (resource.held_by !== null) {
                console.log("Resource already allocated");
                return;
            }
            
            if (!process.needs.includes(resourceId)) {
                console.log("Process doesn't need this resource");
                return;
            }
            
            resource.held_by = processId;
            process.allocation.push(resourceId);
            
            process.progress = Math.round((process.allocation.length / process.needs.length) * 100);
            
            if (process.progress === 100) {
                setTimeout(() => {
                    this.completeProcess(processId);
                }, 500);
            }
            
            this.checkForDeadlock();
            this.renderVisualization();
        },
        
        // Complete a process
        completeProcess(processId) {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;
            
            process.allocation.forEach(resId => {
                const res = this.resources.find(r => r.id === resId);
                if (res) res.held_by = null;
            });
            
            this.processes = this.processes.filter(p => p.id !== processId);
            
            const processPoints = process.needs.length * 50;
            this.score += processPoints;
            
            this.showPointsEarned(processPoints);
            
            if (this.processes.length === 0) {
                this.levelComplete();
            } else {
                this.deadlockDetected = false;
                this.checkForDeadlock();
            }
            
            this.renderVisualization();
        },
        
        // Show points earned animation
        showPointsEarned(points) {
            const pointsIndicator = document.createElement('div');
            pointsIndicator.textContent = `+${points}`;
            pointsIndicator.className = 'absolute text-xl font-bold text-yellow-300 animate-float-up';
            pointsIndicator.style.left = `${Math.random() * 80 + 10}%`;
            pointsIndicator.style.top = `${Math.random() * 40 + 30}%`;
            
            document.getElementById('game-area').appendChild(pointsIndicator);
            
            setTimeout(() => {
                pointsIndicator.remove();
            }, 2000);
        },
        
        // Check for deadlock
        checkForDeadlock() {
            const waitForGraph = {};
            
            this.processes.forEach(process => {
                waitForGraph[process.id] = [];
            });
            
            this.processes.forEach(process => {
                const neededResources = process.needs.filter(
                    resourceId => !process.allocation.includes(resourceId)
                );
                
                neededResources.forEach(resourceId => {
                    const resource = this.resources.find(r => r.id === resourceId);
                    if (resource && resource.held_by && resource.held_by !== process.id) {
                        waitForGraph[process.id].push(resource.held_by);
                    }
                });
            });
            
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
                            const cycleStart = path.indexOf(neighbor);
                            deadlockedProcesses = [...path.slice(cycleStart), neighbor];
                            return true;
                        }
                    }
                }
                
                recStack[processId] = false;
                return false;
            };
            
            for (const process of this.processes) {
                if (!visited[process.id]) {
                    if (detectCycle(process.id)) {
                        break;
                    }
                }
            }
            
            this.deadlockDetected = deadlockedProcesses.length > 0;
            this.deadlockProcesses = deadlockedProcesses;
            
            if (this.deadlockDetected) {
                const hasAvailableStrategies = this.availableStrategies.preemption || 
                                              this.availableStrategies.kill || 
                                              this.availableStrategies.rollback;
                
                if (!hasAvailableStrategies) {
                    this.gameOver("No more strategies available to resolve deadlock!");
                }
            }
            
            return this.deadlockDetected;
        },
        
        // Menampilkan opsi penyelesaian deadlock
        showDeadlockResolutionOptions() {
            // Hanya tampilkan jika deadlock terdeteksi
            if (!this.deadlockDetected) return;
            
            // Check apakah masih ada strategi yang tersedia
            const hasAvailableStrategies = this.availableStrategies.preemption || 
                                          this.availableStrategies.kill || 
                                          this.availableStrategies.rollback;
            
            if (!hasAvailableStrategies) {
                this.gameOver("No more strategies available to resolve deadlock!");
                return;
            }
            
            // Logic untuk menampilkan dan memilih strategi
            this.showResolutionOptions = true;
        },
        
        // Memilih strategi preemption
        selectPreemptionStrategy() {
            // Validasi jika strategi ini masih tersedia
            if (!this.availableStrategies.preemption) {
                this.showStrategyUnavailableMessage("Preemption strategy already used!");
                return;
            }
            
            // Tampilkan modal untuk memilih resource
            this.selectedStrategy = 'preemption';
            this.showPreemption = true;
        },
        
        // Memilih strategi kill process
        selectKillStrategy() {
            // Validasi jika strategi ini masih tersedia
            if (!this.availableStrategies.kill) {
                this.showStrategyUnavailableMessage("Kill Process strategy already used!");
                return;
            }
            
            // Tampilkan modal untuk memilih proses
            this.selectedStrategy = 'kill';
            this.showKillProcess = true;
        },
        
        // Memilih strategi rollback
        selectRollbackStrategy() {
            // Validasi jika strategi ini masih tersedia
            if (!this.availableStrategies.rollback) {
                this.showStrategyUnavailableMessage("Rollback strategy already used!");
                return;
            }
            
            // Konfirmasi sebelum melakukan rollback
            if (confirm("Are you sure you want to reset all resource allocations?")) {
                this.resolveWithRollback();
            }
        },
        
        // Menampilkan pesan strategi tidak tersedia
        showStrategyUnavailableMessage(message) {
            this.notificationMessage = message;
            this.showNotification = true;
            
            // Auto-hide notification setelah beberapa detik
            setTimeout(() => {
                this.showNotification = false;
            }, 3000);
        },
        
        // Resolve deadlock dengan preemption dengan visualisasi yang lebih baik
        resolveWithPreemption(resourceId) {
            // Check if strategy is available
            if (!this.availableStrategies.preemption) {
                this.showStrategyUnavailableMessage("Preemption strategy already used!");
                return;
            }
            
            const resource = this.resources.find(r => r.id === resourceId);
            if (!resource || resource.held_by === null) return;
            
            const processId = resource.held_by;
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;
            
            process.allocation = process.allocation.filter(id => id !== resourceId);
            resource.held_by = null;
            
            process.progress = Math.round((process.allocation.length / process.needs.length) * 100);
            
            // Tandai strategi sudah digunakan
            this.availableStrategies.preemption = false;
            
            // Deduct points (boleh menjadi negatif)
            this.score -= 20;
            
            // Tampilkan hasil penyelesaian
            this.resolutionMethod = 'preemption';
            this.resolutionMessage = `Resource ${resource.name} was forcefully taken from ${process.name}`;
            this.showResolutionResult = true;
            
            // Close modal
            this.closeModals();
            
            // Check if deadlock is resolved
            this.checkForDeadlock();
            
            // Update visualization
            this.renderVisualization();
        },
        
        // Resolve deadlock with kill process
        resolveWithKill(processId) {
            // Check if strategy is available
            if (!this.availableStrategies.kill) {
                this.showStrategyUnavailableMessage("Kill Process strategy already used!");
                return;
            }
            
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;
            
            // Release all resources held by this process
            process.allocation.forEach(resId => {
                const res = this.resources.find(r => r.id === resId);
                if (res) res.held_by = null;
            });
            
            // Remove process from list
            this.processes = this.processes.filter(p => p.id !== processId);
            
            // Tandai strategi sudah digunakan
            this.availableStrategies.kill = false;
            
            // Deduct points (boleh menjadi negatif)
            this.score -= 50;
            
            // Show termination effect
            this.showTerminationEffect(processId);
            
            // Close modal
            this.closeModals();
            
            // Check if level is complete
            if (this.processes.length === 0) {
                this.levelComplete();
            } else {
                // Check if deadlock is resolved
                this.deadlockDetected = false;
                this.checkForDeadlock();
            }
            
            // Update visualization
            this.renderVisualization();
        },
        
        // Resolve deadlock with rollback
        resolveWithRollback() {
            // Check if strategy is available
            if (!this.availableStrategies.rollback) {
                this.showStrategyUnavailableMessage("Rollback strategy already used!");
                return;
            }
            
            // Reset all resource allocations
            this.resources.forEach(resource => {
                resource.held_by = null;
            });
            
            // Reset all process allocations
            this.processes.forEach(process => {
                process.allocation = [];
                process.progress = 0;
            });
            
            // Tandai strategi sudah digunakan
            this.availableStrategies.rollback = false;
            
            // Deduct points (boleh menjadi negatif)
            this.score -= 30;
            
            // Reset deadlock status
            this.deadlockDetected = false;
            this.deadlockProcesses = [];
            
            // Show rollback effect
            this.showRollbackEffect();
            
            // Update visualization
            this.renderVisualization();
            
            // Tampilkan hasil penyelesaian
            this.resolutionMethod = 'rollback';
            this.resolutionMessage = 'All resource allocations have been reset';
            this.showResolutionResult = true;
        },
        
        // Efek visual saat resource diambil paksa
        showPreemptionEffect(processId, resourceId) {
            const process = this.processes.find(p => p.id === processId);
            const resource = this.resources.find(r => r.id === resourceId);
            
            if (!process || !resource) return;
            
            const processEl = document.querySelector(`[data-process-id="${processId}"]`);
            const resourceEl = document.querySelector(`[data-resource-id="${resourceId}"]`);
            
            if (!processEl || !resourceEl) return;
            
            const processRect = processEl.getBoundingClientRect();
            const resourceRect = resourceEl.getBoundingClientRect();
            
            const animationEl = document.createElement('div');
            animationEl.className = 'resource-freed-animation';
            animationEl.style.position = 'fixed';
            animationEl.style.left = `${processRect.left + processRect.width/2}px`;
            animationEl.style.top = `${processRect.top + processRect.height/2}px`;
            animationEl.style.width = '20px';
            animationEl.style.height = '20px';
            animationEl.style.backgroundColor = '#f59e0b';
            animationEl.style.borderRadius = '50%';
            animationEl.style.zIndex = '1000';
            animationEl.style.setProperty('--to-x', `${resourceRect.left + resourceRect.width/2}px`);
            animationEl.style.setProperty('--to-y', `${resourceRect.top + resourceRect.height/2}px`);
            
            document.body.appendChild(animationEl);
            
            setTimeout(() => {
                animationEl.remove();
            }, 1500);
        },
        
        // Efek visual saat proses diterminasi
        showTerminationEffect(processId) {
            const process = this.processes.find(p => p.id === processId);
            if (!process) return;
            
            const processEl = document.querySelector(`[data-process-id="${processId}"]`);
            if (!processEl) return;
            
            const overlay = document.createElement('div');
            overlay.className = 'process-terminated-overlay';
            overlay.textContent = 'TERMINATED';
            processEl.style.position = 'relative';
            processEl.appendChild(overlay);
            
            processEl.classList.add('termination-animation');
        },
        
        // Efek visual saat rollback dilakukan
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
        
        // Game over
        gameOver(reason) {
            this.stopTimer();
            this.gameState = 'gameOver';
            this.gameOverReason = reason;
        },
        
        // Level complete
        levelComplete() {
            this.stopTimer();
            
            // Game over jika skor di bawah 0
            if (this.score < 0) {
                this.gameOver("Game over! Score is below 0");
                return;
            }
            
            // Calculate stars based on score thresholds
            const thresholds = this.currentLevelData.starThresholds;
            if (this.score >= thresholds[2]) {
                this.stars = 3;
            } else if (this.score >= thresholds[1]) {
                this.stars = 2;
            } else if (this.score >= thresholds[0]) {
                this.stars = 1;
            } else {
                this.stars = 0;
            }
            
            const levelIndex = this.levels.findIndex(l => l.id === this.currentLevel);
            if (levelIndex >= 0) {
                if (this.score > this.levels[levelIndex].highScore) {
                    this.levels[levelIndex].highScore = this.score;
                }
                
                this.levels[levelIndex].completed = true;
                
                if (levelIndex + 1 < this.levels.length) {
                    this.levels[levelIndex + 1].locked = false;
                    this.hasNextLevel = true;
                }
            }
            
            const timeBonus = this.timer * 2;
            if (timeBonus > 0) {
                this.score += timeBonus;
                setTimeout(() => {
                    this.showPointsEarned(timeBonus);
                }, 500);
            }
            
            this.gameState = 'levelComplete';
        },
        
        // Go to next level
        goToNextLevel() {
            if (this.hasNextLevel) {
                this.startLevel(this.currentLevel + 1);
            }
        },
        
        // Restart current level
        restartLevel() {
            this.startGameplay();
        },
        
        // Exit to level selection screen
        exitToLevelSelect() {
            this.stopTimer();
            this.gameState = 'levelSelect';
        },
        
        // Get all allocated resources for preemption
        getAllocatedResources() {
            return this.resources.filter(r => r.held_by !== null);
        },
        
        // Get all deadlocked processes
        getDeadlockedProcesses() {
            return this.processes.filter(p => this.deadlockProcesses.includes(p.id));
        },
        
        // Show preemption options modal
        showPreemptionOptions() {
            this.showPreemption = true;
        },
        
        // Show kill process options modal
        showKillProcessOptions() {
            this.showKillProcess = true;
        },
        
        // Close all modals
        closeModals() {
            this.showPreemption = false;
            this.showKillProcess = false;
        },
        
        // Render visualization
        renderVisualization() {
            const container = document.getElementById('visualization');
            if (!container) return;
            
            container.innerHTML = '';
            
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 600 300');
            container.appendChild(svg);
            
            const processY = 70;
            const resourceY = 220;
            const spacing = Math.min(500 / (Math.max(this.processes.length, this.resources.length) + 1), 120);
            const startX = spacing;
            
            const processPositions = {};
            this.processes.forEach((process, index) => {
                const x = startX + index * spacing;
                const isDeadlocked = this.deadlockProcesses.includes(process.id);
                
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', processY);
                circle.setAttribute('r', 25);
                circle.setAttribute('fill', isDeadlocked ? '#ef4444' : '#6366f1');
                circle.setAttribute('stroke', isDeadlocked ? '#dc2626' : '#4f46e5');
                circle.setAttribute('stroke-width', '2');
                circle.setAttribute('data-process-id', process.id);
                svg.appendChild(circle);
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', processY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('fill', 'white');
                text.setAttribute('font-size', '12');
                text.textContent = process.name;
                svg.appendChild(text);
                
                processPositions[process.id] = { x, y: processY };
            });
            
            const resourcePositions = {};
            this.resources.forEach((resource, index) => {
                const x = startX + index * spacing;
                
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
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', resourceY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('fill', 'white');
                text.setAttribute('font-size', '12');
                text.textContent = resource.name;
                svg.appendChild(text);
                
                resourcePositions[resource.id] = { x, y: resourceY };
            });
            
            this.resources.forEach(resource => {
                if (resource.held_by && processPositions[resource.held_by] && resourcePositions[resource.id]) {
                    const fromX = resourcePositions[resource.id].x;
                    const fromY = resourcePositions[resource.id].y - 20;
                    const toX = processPositions[resource.held_by].x;
                    const toY = processPositions[resource.held_by].y + 25;
                    
                    const isDeadlockEdge = this.deadlockProcesses.includes(resource.held_by);
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', fromX);
                    line.setAttribute('y1', fromY);
                    line.setAttribute('x2', toX);
                    line.setAttribute('y2', toY);
                    line.setAttribute('stroke', isDeadlockEdge ? '#ef4444' : '#f97316');
                    line.setAttribute('stroke-width', isDeadlockEdge ? '3' : '2');
                    svg.appendChild(line);
                    
                    this.drawArrowhead(svg, fromX, fromY, toX, toY, isDeadlockEdge ? '#ef4444' : '#f97316');
                }
            });
            
            this.processes.forEach(process => {
                process.needs.forEach(resourceId => {
                    if (!process.allocation.includes(resourceId) && processPositions[process.id] && resourcePositions[resourceId]) {
                        const fromX = processPositions[process.id].x;
                        const fromY = processPositions[process.id].y + 25;
                        const toX = resourcePositions[resourceId].x;
                        const toY = resourcePositions[resourceId].y - 20;
                        
                        const isDeadlockEdge = this.deadlockProcesses.includes(process.id);
                        
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', fromX);
                        line.setAttribute('y1', fromY);
                        line.setAttribute('x2', toX);
                        line.setAttribute('y2', toY);
                        line.setAttribute('stroke', isDeadlockEdge ? '#ef4444' : '#8b5cf6');
                        line.setAttribute('stroke-width', isDeadlockEdge ? '3' : '2');
                        line.setAttribute('stroke-dasharray', '5,5');
                        svg.appendChild(line);
                        
                        this.drawArrowhead(svg, fromX, fromY, toX, toY, isDeadlockEdge ? '#ef4444' : '#8b5cf6');
                    }
                });
            });
        },
        
        drawArrowhead(svg, fromX, fromY, toX, toY, color) {
            const dx = toX - fromX;
            const dy = toY - fromY;
            const angle = Math.atan2(dy, dx);
            
            const arrowLength = 10;
            const arrowWidth = 6;
            
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
