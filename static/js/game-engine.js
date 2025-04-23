/**
 * Engine utama untuk game Deadlock Solver
 */
class DeadlockGameEngine {
    constructor() {
        this.currentLevel = null;
        this.gameState = {
            processes: [],
            resources: [],
            completedProcesses: [],
            deadlockOccurred: false,
            deadlockResolved: false,
            deadlockCycle: [],
            score: 0,
            timer: 0,
            timerInterval: null,
            status: 'not_started' // not_started, running, paused, completed, failed
        };
        this.eventListeners = {};
    }

    /**
     * Memulai level baru
     */
    startLevel(levelId) {
        // Dapatkan data level
        const level = getLevel(levelId);
        if (!level) {
            console.error(`Level ${levelId} not found!`);
            return false;
        }

        // Reset game state
        this.resetGameState();
        
        // Set level saat ini
        this.currentLevel = level;
        
        // Salin proses dan resource dari level
        this.gameState.processes = JSON.parse(JSON.stringify(level.processes));
        this.gameState.resources = JSON.parse(JSON.stringify(level.resources));
        
        // Set timer
        this.gameState.timer = level.maxTime;
        
        // Set status game menjadi running
        this.gameState.status = 'running';
        
        // Mulai timer
        this.startTimer();
        
        // Trigger event level started
        this.triggerEvent('levelStarted', { level: this.currentLevel });
        
        return true;
    }

    /**
     * Reset state game
     */
    resetGameState() {
        clearInterval(this.gameState.timerInterval);
        
        this.gameState = {
            processes: [],
            resources: [],
            completedProcesses: [],
            deadlockOccurred: false,
            deadlockResolved: false,
            deadlockCycle: [],
            score: 0,
            timer: 0,
            timerInterval: null,
            status: 'not_started'
        };
    }

    /**
     * Mulai timer countdown
     */
    startTimer() {
        clearInterval(this.gameState.timerInterval);
        
        this.gameState.timerInterval = setInterval(() => {
            if (this.gameState.status === 'running') {
                this.gameState.timer--;
                
                // Trigger event timer updated
                this.triggerEvent('timerUpdated', { timer: this.gameState.timer });
                
                // Cek apakah waktu habis
                if (this.gameState.timer <= 0) {
                    this.endGame('failed', 'Time is up!');
                }
            }
        }, 1000);
    }

    /**
     * Alokasikan resource ke proses
     */
    allocateResource(processId, resourceId) {
        // Cari proses dan resource
        const process = this.gameState.processes.find(p => p.id === processId);
        const resource = this.gameState.resources.find(r => r.id === resourceId);
        
        // Validasi input
        if (!process || !resource) {
            console.error('Process or resource not found!');
            return false;
        }
        
        // Cek apakah proses membutuhkan resource ini
        if (!process.needs.includes(resourceId)) {
            console.error(`Process ${processId} does not need resource ${resourceId}!`);
            return false;
        }
        
        // Cek apakah resource sudah dialokasikan ke proses lain
        if (resource.held_by !== null && resource.held_by !== processId) {
            console.error(`Resource ${resourceId} is already held by ${resource.held_by}!`);
            return false;
        }
        
        // Cek apakah resource sudah dialokasikan ke proses ini
        if (process.allocation.includes(resourceId)) {
            console.error(`Resource ${resourceId} is already allocated to process ${processId}!`);
            return false;
        }
        
        // Alokasikan resource
        process.allocation.push(resourceId);
        resource.held_by = processId;
        
        // Trigger event resource allocated
        this.triggerEvent('resourceAllocated', { process, resource });
        
        // Cek apakah proses sudah mendapatkan semua resource yang dibutuhkan
        this.checkProcessCompletion(process);
        
        // Cek deadlock setelah alokasi (jika Level 2+)
        if (this.currentLevel.id >= 2) {
            this.checkDeadlock();
        }
        
        return true;
    }

    /**
     * Dealokasikan resource dari proses
     */
    deallocateResource(processId, resourceId) {
        // Cari proses dan resource
        const process = this.gameState.processes.find(p => p.id === processId);
        const resource = this.gameState.resources.find(r => r.id === resourceId);
        
        // Validasi input
        if (!process || !resource) {
            console.error('Process or resource not found!');
            return false;
        }
        
        // Cek apakah resource dialokasikan ke proses ini
        if (resource.held_by !== processId) {
            console.error(`Resource ${resourceId} is not held by process ${processId}!`);
            return false;
        }
        
        // Dealokasikan resource
        process.allocation = process.allocation.filter(id => id !== resourceId);
        resource.held_by = null;
        
        // Trigger event resource deallocated
        this.triggerEvent('resourceDeallocated', { process, resource });
        
        return true;
    }

    /**
     * Cek apakah proses sudah mendapatkan semua resource yang dibutuhkan
     */
    checkProcessCompletion(process) {
        const allNeededResourcesAllocated = process.needs.every(
            resourceId => process.allocation.includes(resourceId)
        );
        
        if (allNeededResourcesAllocated) {
            // Pindahkan dari active processes ke completed processes
            this.gameState.processes = this.gameState.processes.filter(p => p.id !== process.id);
            this.gameState.completedProcesses.push(process);
            
            // Bebaskan semua resource yang dialokasikan ke proses ini
            process.allocation.forEach(resourceId => {
                const resource = this.gameState.resources.find(r => r.id === resourceId);
                if (resource) {
                    resource.held_by = null;
                }
            });
            
            // Tambah skor
            this.gameState.score += 100;
            
            // Trigger event process completed
            this.triggerEvent('processCompleted', { process });
            
            // Cek kondisi kemenangan
            this.checkWinCondition();
        }
    }

    /**
     * Cek apakah terjadi deadlock
     */
    checkDeadlock() {
        const result = detectDeadlock(this.gameState.processes, this.gameState.resources);
        
        if (result.detected) {
            this.gameState.deadlockOccurred = true;
            this.gameState.deadlockCycle = result.cycle;
            
            // Trigger event deadlock detected
            this.triggerEvent('deadlockDetected', { cycle: result.cycle });
            
            return true;
        }
        
        return false;
    }

    /**
     * Tangani deadlock dengan preemption
     */
    handleDeadlockWithPreemption(processId, resourceId) {
        // Validasi input
        const process = this.gameState.processes.find(p => p.id === processId);
        const resource = this.gameState.resources.find(r => r.id === resourceId);
        
        if (!process || !resource) {
            console.error('Process or resource not found!');
            return false;
        }
        
        // Cek apakah resource dialokasikan ke proses
        if (resource.held_by !== processId) {
            console.error(`Resource ${resourceId} is not held by process ${processId}!`);
            return false;
        }
        
        // Dealokasikan resource
        if (this.deallocateResource(processId, resourceId)) {
            // Cek apakah deadlock masih ada
            if (!this.checkDeadlock()) {
                this.gameState.deadlockResolved = true;
                this.gameState.score -= 20; // Penalty for preemption
                
                // Trigger event deadlock resolved
                this.triggerEvent('deadlockResolved', { method: 'preemption', process, resource });
                
                // Cek kondisi kemenangan
                this.checkWinCondition();
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Tangani deadlock dengan kill process
     */
    handleDeadlockWithKill(processId) {
        // Validasi input
        const process = this.gameState.processes.find(p => p.id === processId);
        
        if (!process) {
            console.error('Process not found!');
            return false;
        }
        
        // Bebaskan semua resource yang dialokasikan ke proses ini
        const allocatedResources = [...process.allocation];
        allocatedResources.forEach(resourceId => {
            this.deallocateResource(processId, resourceId);
        });
        
        // Hapus proses dari active processes (tidak ditambahkan ke completed)
        this.gameState.processes = this.gameState.processes.filter(p => p.id !== processId);
        
        // Cek apakah deadlock masih ada
        if (!this.checkDeadlock()) {
            this.gameState.deadlockResolved = true;
            this.gameState.score -= 50; // Larger penalty for killing
            
            // Trigger event deadlock resolved
            this.triggerEvent('deadlockResolved', { method: 'kill', process });
            
            // Cek kondisi kemenangan
            this.checkWinCondition();
            
            return true;
        }
        
        return false;
    }

    /**
     * Tangani deadlock dengan rollback
     */
    handleDeadlockWithRollback() {
        // Implementasi sederhana: bebaskan semua alokasi resource
        const success = this.gameState.processes.some(process => {
            if (process.allocation.length > 0) {
                const allocatedResources = [...process.allocation];
                allocatedResources.forEach(resourceId => {
                    this.deallocateResource(process.id, resourceId);
                });
                return true;
            }
            return false;
        });
        
        if (success) {
            // Reset deadlock state
            this.gameState.deadlockOccurred = false;
            this.gameState.deadlockResolved = true;
            this.gameState.deadlockCycle = [];
            this.gameState.score -= 30; // Penalty for rollback
            
            // Trigger event deadlock resolved
            this.triggerEvent('deadlockResolved', { method: 'rollback' });
            
            return true;
        }
        
        return false;
    }

    /**
     * Cek kondisi kemenangan
     */
    checkWinCondition() {
        const win = checkWinCondition(this.currentLevel, this.gameState);
        
        if (win) {
            this.endGame('completed', 'Level completed!');
            return true;
        }
        
        return false;
    }

    /**
     * Selesaikan game
     */
    endGame(status, message) {
        // Update status game
        this.gameState.status = status;
        
        // Stop timer
        clearInterval(this.gameState.timerInterval);
        
        // Trigger event game ended
        this.triggerEvent('gameEnded', { 
            status, 
            message, 
            score: this.gameState.score, 
            level: this.currentLevel.id 
        });
        
        return true;
    }

    /**
     * Register event listener
     */
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    /**
     * Trigger event
     */
    triggerEvent(eventName, data) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => callback(data));
        }
    }
}
