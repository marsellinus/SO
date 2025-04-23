/**
 * Definisi level untuk game Deadlock Solver
 */
const gameLevels = [
    // Level 1: Pengenalan
    {
        id: 1,
        title: "Pengenalan Proses dan Resource",
        description: "Pelajari cara mengalokasikan resource ke proses. Drag & drop resource ke proses yang membutuhkannya.",
        objective: "Selesaikan semua proses tanpa deadlock",
        maxTime: 120, // dalam detik
        processes: [
            { id: "P1", name: "Word Processor", icon: "📝", needs: ["R1", "R2"], allocation: [] },
            { id: "P2", name: "Browser", icon: "🌐", needs: ["R2"], allocation: [] }
        ],
        resources: [
            { id: "R1", name: "CPU", icon: "⚙️", count: 1, held_by: null },
            { id: "R2", name: "Memory", icon: "🧠", count: 2, held_by: null }
        ],
        tutorial: [
            "Selamat datang di Deadlock Solver!",
            "Proses membutuhkan resource untuk berjalan. Alokasikan resource dengan menarik dan melepaskan ke proses yang membutuhkan.",
            "Setiap proses harus mendapatkan semua resource yang dibutuhkan untuk selesai.",
            "Jika semua proses selesai, kamu menang! Jika terjadi deadlock, kamu harus mengatasinya."
        ],
        challenges: [],
        winCondition: "allProcessesCompleted"
    },
    
    // Level 2: Deadlock Terselubung
    {
        id: 2,
        title: "Deadlock Terselubung",
        description: "Hati-hati! Deadlock bisa terjadi jika resource tidak dialokasikan dengan benar.",
        objective: "Selesaikan semua proses dan identifikasi deadlock jika terjadi",
        maxTime: 180,
        processes: [
            { id: "P1", name: "Database", icon: "🗄️", needs: ["R1", "R3"], allocation: [] },
            { id: "P2", name: "Web Server", icon: "🖥️", needs: ["R2", "R3"], allocation: [] },
            { id: "P3", name: "Backup Service", icon: "💾", needs: ["R1", "R2"], allocation: [] }
        ],
        resources: [
            { id: "R1", name: "CPU", icon: "⚙️", count: 1, held_by: null },
            { id: "R2", name: "Memory", icon: "🧠", count: 1, held_by: null },
            { id: "R3", name: "Disk", icon: "💿", count: 1, held_by: null }
        ],
        tutorial: [
            "Sekarang kita mulai dengan skenario yang lebih kompleks.",
            "Deadlock terjadi ketika beberapa proses saling menunggu resource yang dikuasai oleh proses lainnya.",
            "Gunakan tombol 'Check Deadlock' untuk mendeteksi deadlock, dan pilih solusi yang tepat."
        ],
        challenges: [
            "Deadlock akan terjadi jika resource tidak dialokasikan dengan benar"
        ],
        winCondition: "allProcessesCompletedOrDeadlockResolved"
    },
    
    // Level 3: Kompleksitas Tinggi
    {
        id: 3,
        title: "Kompleksitas Tinggi",
        description: "Skenario kompleks dengan banyak proses dan resource. Tantangan yang lebih sulit!",
        objective: "Kelola resource dengan efisien dan tangani deadlock yang terjadi",
        maxTime: 240,
        processes: [
            { id: "P1", name: "Video Editor", icon: "🎬", needs: ["R1", "R2", "R4"], allocation: [] },
            { id: "P2", name: "3D Renderer", icon: "🎮", needs: ["R1", "R3"], allocation: [] },
            { id: "P3", name: "AI Training", icon: "🤖", needs: ["R2", "R3", "R4"], allocation: [] },
            { id: "P4", name: "Data Analysis", icon: "📊", needs: ["R1", "R4"], allocation: [] },
            { id: "P5", name: "Compiler", icon: "⌨️", needs: ["R2", "R3"], allocation: [] }
        ],
        resources: [
            { id: "R1", name: "CPU", icon: "⚙️", count: 2, held_by: null },
            { id: "R2", name: "Memory", icon: "🧠", count: 2, held_by: null },
            { id: "R3", name: "GPU", icon: "📺", count: 1, held_by: null },
            { id: "R4", name: "Disk", icon: "💿", count: 2, held_by: null }
        ],
        tutorial: [
            "Level tersulit! Banyak proses yang bersaing untuk resource terbatas.",
            "Kamu perlu berhati-hati mengalokasikan resource untuk menghindari deadlock.",
            "Jika terjadi deadlock, kamu harus menganalisis dengan tepat proses mana yang harus diakhiri."
        ],
        challenges: [
            "Multiple deadlocks mungkin terjadi",
            "Resource terbatas, manajemen yang tepat diperlukan"
        ],
        winCondition: "allProcessesCompletedOrDeadlockResolved"
    }
];

/**
 * Mengambil level berdasarkan ID
 */
function getLevel(levelId) {
    return gameLevels.find(level => level.id === levelId) || gameLevels[0];
}

/**
 * Fungsi untuk memeriksa kondisi kemenangan
 */
function checkWinCondition(level, gameState) {
    if (level.winCondition === "allProcessesCompleted") {
        return gameState.completedProcesses.length === level.processes.length;
    } else if (level.winCondition === "allProcessesCompletedOrDeadlockResolved") {
        // Menang jika semua proses selesai atau deadlock berhasil diselesaikan
        return gameState.completedProcesses.length === level.processes.length || 
               (gameState.deadlockOccurred && gameState.deadlockResolved);
    }
    return false;
}

/**
 * Fungsi untuk mengecek apakah deadlock terjadi
 */
function detectDeadlock(processes, resources) {
    // Implementasi algoritma deteksi deadlock
    // Bangun resource allocation graph
    const graph = buildResourceAllocationGraph(processes, resources);
    
    // Cek apakah ada cycle dalam graph
    return findCycleInGraph(graph);
}

/**
 * Membangun resource allocation graph
 */
function buildResourceAllocationGraph(processes, resources) {
    // Implementasi pembangunan RAG
    // Mengembalikan graph dalam bentuk adjacency list
    const graph = {};
    
    // Inisialisasi semua proses dan resource dalam graph
    processes.forEach(process => {
        graph[process.id] = { type: 'process', edges: [] };
    });
    
    resources.forEach(resource => {
        graph[resource.id] = { type: 'resource', edges: [] };
    });
    
    // Tambahkan edge dari resource ke proses yang memegangnya
    resources.forEach(resource => {
        if (resource.held_by) {
            graph[resource.id].edges.push(resource.held_by);
        }
    });
    
    // Tambahkan edge dari proses ke resource yang dibutuhkan
    processes.forEach(process => {
        const neededButNotAllocated = process.needs.filter(
            resId => !process.allocation.includes(resId)
        );
        
        neededButNotAllocated.forEach(resId => {
            graph[process.id].edges.push(resId);
        });
    });
    
    return graph;
}

/**
 * Mencari siklus dalam graph
 */
function findCycleInGraph(graph) {
    const visited = {};
    const recStack = {};
    
    // Fungsi DFS rekursif untuk deteksi siklus
    function dfsCheckCycle(node, path = []) {
        // Jika node sudah dalam stack rekursi, kita menemukan cycle
        if (recStack[node]) {
            return { 
                detected: true, 
                cycle: path.slice(path.indexOf(node)).concat(node)
            };
        }
        
        // Jika node sudah dikunjungi dan tidak dalam cycle
        if (visited[node]) {
            return { detected: false };
        }
        
        // Tandai node sebagai dikunjungi dan dalam stack rekursi
        visited[node] = true;
        recStack[node] = true;
        path.push(node);
        
        // Periksa semua tetangga
        for (const neighbor of graph[node].edges || []) {
            const result = dfsCheckCycle(neighbor, path);
            if (result.detected) {
                return result;
            }
        }
        
        // Hapus node dari stack rekursi
        recStack[node] = false;
        return { detected: false };
    }
    
    // Jalankan DFS dari setiap proses
    for (const node in graph) {
        if (graph[node].type === 'process') {
            const result = dfsCheckCycle(node);
            if (result.detected) {
                return result;
            }
        }
    }
    
    return { detected: false };
}
