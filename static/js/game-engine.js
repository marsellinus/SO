/**
 * Game Engine adalah kelas inti yang mengelola logika simulasi deadlock.
 * 
 * Fitur utama:
 * 1. Menyediakan abstraksi dan implementasi inti dari simulasi deadlock
 * 2. Mengelola algoritma deteksi deadlock
 * 3. Menangani alokasi resource dan eksekusi proses
 * 4. Mengimplementasikan strategi resolusi deadlock (prevention, avoidance, detection)
 * 5. Bertindak sebagai "backend" untuk simulasi dalam game
 * 
 * Game Engine tidak berinteraksi langsung dengan UI tetapi menyediakan API
 * yang digunakan oleh komponen UI untuk memperbarui tampilan.
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
            availableStrategies: {
                preemption: true,
                kill: true,
                rollback: true
            },
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
            availableStrategies: {
                preemption: true,
                kill: true,
                rollback: true
            },
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
        console.error('Resource deallocation is not allowed outside of deadlock resolution strategies.');
        return false;
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
            this.gameState.deadlockResolved = false; // Reset state untuk deadlock baru
            
            // Cek apakah masih ada strategi yang bisa digunakan
            const hasAvailableStrategies = Object.values(this.gameState.availableStrategies).some(available => available);
            
            if (!hasAvailableStrategies) {
                // Tidak ada strategi tersisa, pemain kalah
                this.endGame('failed', 'Level failed! No more strategies available to resolve deadlock.');
            }
            
            // Trigger event deadlock detected
            this.triggerEvent('deadlockDetected', { 
                cycle: result.cycle,
                hasStrategies: hasAvailableStrategies
            });
            
            return true;
        }
        
        return false;
    }

    /**
     * Tangani deadlock dengan preemption
     */
    handleDeadlockWithPreemption(processId, resourceId) {
        // Cek apakah strategi ini masih tersedia
        if (!this.gameState.availableStrategies.preemption) {
            this.triggerEvent('strategyUnavailable', { 
                strategy: 'preemption',
                message: 'Preemption strategy has already been used!'
            });
            return false;
        }
        
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
        
        // PREEMPTION: Hanya mengambil resource dari proses tanpa menghentikan prosesnya
        // Tetapi membuat resource tersedia untuk proses lain
        resource.held_by = null;  // Bebaskan resource
        process.allocation = process.allocation.filter(id => id !== resourceId); // Hapus dari alokasi proses
        
        // Cek apakah deadlock masih ada
        const deadlockBefore = this.gameState.deadlockOccurred;
        this.gameState.deadlockOccurred = false; // Reset untuk cek ulang
        
        if (!this.checkDeadlock()) {
            // Deadlock teratasi
            this.gameState.deadlockResolved = true;
            
            // Tandai strategi ini sebagai sudah digunakan
            this.gameState.availableStrategies.preemption = false;
            
            // Kurangi skor - biarkan menjadi minus jika perlu
            this.gameState.score -= 20; // Penalty for preemption
            
            // Trigger event deadlock resolved
            this.triggerEvent('deadlockResolved', { 
                method: 'preemption', 
                process, 
                resource,
                message: `Resource ${resource.id} was forcefully taken from ${process.name} (${process.id}). Process continues to run, waiting for the resource.`
            });
            
            return true;
        } else {
            // Deadlock masih ada, kembalikan seperti semula
            if (!deadlockBefore) {
                this.gameState.deadlockOccurred = false;
            }
            return false;
        }
    }

    /**
     * Tangani deadlock dengan kill process
     */
    handleDeadlockWithKill(processId) {
        // Cek apakah strategi ini masih tersedia
        if (!this.gameState.availableStrategies.kill) {
            this.triggerEvent('strategyUnavailable', { 
                strategy: 'kill',
                message: 'Kill Process strategy has already been used!'
            });
            return false;
        }
        
        // Validasi input
        const process = this.gameState.processes.find(p => p.id === processId);
        
        if (!process) {
            console.error('Process not found!');
            return false;
        }
        
        // Simpan resource yang dipegang oleh proses
        const allocatedResources = [...process.allocation];
        const freedResourceDetails = [];
        
        // KILL PROCESS: Mematikan proses dan membebaskan semua resourcenya
        
        // Bebaskan semua resource yang dipegang
        allocatedResources.forEach(resourceId => {
            const resource = this.gameState.resources.find(r => r.id === resourceId);
            if (resource) {
                resource.held_by = null;
                freedResourceDetails.push(resource);
            }
        });
        
        // Hapus proses dari daftar proses aktif
        this.gameState.processes = this.gameState.processes.filter(p => p.id !== processId);
        
        // Cek apakah deadlock masih ada
        const deadlockBefore = this.gameState.deadlockOccurred;
        this.gameState.deadlockOccurred = false; // Reset untuk cek ulang
        
        if (!this.checkDeadlock()) {
            // Deadlock teratasi
            this.gameState.deadlockResolved = true;
            
            // Tandai strategi ini sebagai sudah digunakan
            this.gameState.availableStrategies.kill = false;
            
            // Kurangi skor - biarkan menjadi minus jika perlu
            this.gameState.score -= 50; // Penalty for killing
            
            // Trigger event deadlock resolved
            const resourceNames = freedResourceDetails.map(r => r.id).join(', ');
            this.triggerEvent('deadlockResolved', { 
                method: 'kill', 
                process,
                freedResources: freedResourceDetails,
                message: `Process ${process.name} (${process.id}) was terminated, freeing resources: ${resourceNames}`
            });
            
            return true;
        } else {
            // Deadlock masih ada, kembalikan seperti semula
            if (!deadlockBefore) {
                this.gameState.deadlockOccurred = false;
            }
            return false;
        }
    }

    /**
     * Tangani deadlock dengan rollback
     */
    handleDeadlockWithRollback() {
        // Cek apakah strategi ini masih tersedia
        if (!this.gameState.availableStrategies.rollback) {
            this.triggerEvent('strategyUnavailable', { 
                strategy: 'rollback',
                message: 'Rollback strategy has already been used!'
            });
            return false;
        }
        
        // Track resources yang dibebaskan
        const releasedAllocations = [];
        
        // ROLLBACK: Reset semua alokasi resource, tapi tidak menghapus proses
        let success = false;
        
        // Catat semua alokasi sebelum direset
        this.gameState.processes.forEach(process => {
            if (process.allocation.length > 0) {
                const processAllocation = {
                    process: process,
                    resources: []
                };
                
                // Reset alokasi proses
                process.allocation.forEach(resourceId => {
                    const resource = this.gameState.resources.find(r => r.id === resourceId);
                    if (resource) {
                        processAllocation.resources.push(resource);
                        resource.held_by = null; // Bebaskan resource
                    }
                });
                
                // Kosongkan alokasi proses
                process.allocation = [];
                
                if (processAllocation.resources.length > 0) {
                    releasedAllocations.push(processAllocation);
                    success = true;
                }
            }
        });
        
        if (success) {
            // Cek apakah deadlock masih ada (seharusnya tidak karena semua resource dibebaskan)
            this.gameState.deadlockOccurred = false;
            this.gameState.deadlockResolved = true;
            this.gameState.deadlockCycle = [];
            
            // Tandai strategi ini sebagai sudah digunakan
            this.gameState.availableStrategies.rollback = false;
            
            // Kurangi skor - biarkan menjadi minus jika perlu
            this.gameState.score -= 30; // Penalty for rollback
            
            // Buat pesan yang menjelaskan efek rollback
            let rollbackDetails = releasedAllocations.map(item => 
                `${item.process.name} (${item.process.id}) released ${item.resources.map(r => r.id).join(', ')}`
            ).join('; ');
            
            // Trigger event deadlock resolved
            this.triggerEvent('deadlockResolved', { 
                method: 'rollback',
                releasedAllocations: releasedAllocations,
                message: `All allocations were reset: ${rollbackDetails}`
            });
            
            return true;
        }
        
        return false;
    }

    /**
     * Cek kondisi kemenangan
     */
    checkWinCondition() {
        const win = checkWinCondition(this.currentLevel, this.gameState);
        
        // Tidak ada pengecekan skor minimum lagi
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
