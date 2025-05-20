import random

def detect_deadlock(processes, resources, allocation, max_need, available):
    """
    Mendeteksi deadlock menggunakan Resource Allocation Graph
    """
    n = len(processes)
    m = len(resources)
    finish = [False] * n
    work = available[:]

    # Algoritma deteksi deadlock
    while True:
        found = False
        for i in range(n):
            if not finish[i] and all(max_need[i][j] - allocation[i][j] <= work[j] for j in range(m)):
                # Proses bisa selesai
                for j in range(m):
                    work[j] += allocation[i][j]
                finish[i] = True
                found = True
        if not found:
            break

    # Proses yang tidak bisa selesai adalah deadlock
    deadlock_processes = [processes[i] for i in range(n) if not finish[i]]
    return deadlock_processes

def detect_deadlock_dependencies(processes, resources, allocation, max_need, available):
    """
    Mendeteksi deadlock dengan algoritma yang lebih robust untuk jumlah proses berapapun
    """
    n = len(processes)
    m = len(resources)
    finish = [False] * n
    work = available[:]
    
    # Resource Allocation Graph dependencies
    dependencies = {}
    for i in range(n):
        dependencies[processes[i]] = {
            "waits_for": [],
            "holds": []
        }
    
    # Identifikasi resource yang dipegang oleh proses
    for i in range(n):
        for j in range(m):
            if allocation[i][j] > 0:
                dependencies[processes[i]]["holds"].append({
                    "resource": resources[j],
                    "amount": allocation[i][j]
                })
    
    # Algoritma deteksi dengan pendekatan Need Matrix
    # Work = Available
    work = available[:]
    
    # Cari proses yang bisa selesai
    while True:
        found = False
        for i in range(n):
            if not finish[i]:
                # Cek apakah proses dapat dieksekusi dengan resource yang tersedia
                can_finish = True
                for j in range(m):
                    if max_need[i][j] - allocation[i][j] > work[j]:
                        can_finish = False
                        break
                
                if can_finish:
                    # Proses dapat selesai, tambahkan resource-nya ke work
                    for j in range(m):
                        work[j] += allocation[i][j]
                    finish[i] = True
                    found = True
        
        # Jika tidak ada proses yang bisa dieksekusi, keluar dari loop
        if not found:
            break
    
    # Build waits_for graph berdasarkan resource yang dibutuhkan dan ditahan
    for i in range(n):
        if not finish[i]:  # Deadlocked process
            needs = {}
            
            # Identifikasi resource yang dibutuhkan
            for j in range(m):
                remaining_need = max_need[i][j] - allocation[i][j]
                if remaining_need > 0:
                    needs[resources[j]] = remaining_need
            
            # Cari proses yang memegang resource yang dibutuhkan
            for j in range(n):
                if i != j:  # Bukan diri sendiri
                    holds_needed_resource = False
                    for k in range(m):
                        if allocation[j][k] > 0 and resources[k] in needs:
                            holds_needed_resource = True
                            break
                    
                    if holds_needed_resource and processes[j] not in dependencies[processes[i]]["waits_for"]:
                        dependencies[processes[i]]["waits_for"].append(processes[j])
    
    # Proses yang tidak bisa selesai adalah deadlock
    deadlock_processes = [processes[i] for i in range(n) if not finish[i]]
    
    # Filter dependencies untuk hanya menunjukkan yang relevan dengan deadlock
    deadlock_dependencies = {}
    for proc in deadlock_processes:
        deadlock_dependencies[proc] = {
            "waits_for": [p for p in dependencies[proc]["waits_for"] if p in deadlock_processes],
            "holds": dependencies[proc]["holds"]
        }
    
    # Identifikasi circular wait untuk visualisasi
    circular_waits = []
    if deadlock_processes:
        # Temukan semua siklus dalam wait-for graph
        circular_waits = find_cycles(deadlock_dependencies)
    
    return deadlock_processes, deadlock_dependencies, circular_waits

def find_cycles(dependencies):
    """
    Temukan semua siklus dalam wait-for graph menggunakan DFS
    """
    cycles = []
    visited = {}
    rec_stack = {}
    
    def dfs_cycle(node, path=None):
        if path is None:
            path = []
        
        if node in rec_stack and rec_stack[node]:
            # Ditemukan cycle, cek apakah valid
            cycle_start = path.index(node)
            cycle = path[cycle_start:] + [node]
            if len(cycle) > 1 and cycle not in cycles:
                cycles.append(cycle)
            return
        
        if node in visited and visited[node]:
            return
        
        visited[node] = True
        rec_stack[node] = True
        path.append(node)
        
        for neighbor in dependencies.get(node, {}).get("waits_for", []):
            dfs_cycle(neighbor, path[:])
        
        rec_stack[node] = False
    
    # Mulai DFS dari setiap node
    for node in dependencies:
        if node not in visited:
            dfs_cycle(node)
    
    return cycles

def calculate_process_priority(processes, allocation, max_need, deadlocked):
    """
    Hitung prioritas proses untuk terminasi:
    - Lebih sedikit resource yang ditahan = prioritas lebih tinggi
    - Proses dengan kebutuhan yang sudah hampir terpenuhi = prioritas lebih rendah
    """
    priorities = {}
    
    for proc in deadlocked:
        idx = processes.index(proc)
        
        # Hitung resource yang ditahan
        held_resources = sum(allocation[idx])
        
        # Hitung persentase pemenuhan kebutuhan
        need_total = sum(max_need[idx])
        if need_total == 0:
            fulfillment = 100
        else:
            fulfilled = sum(allocation[idx])
            fulfillment = (fulfilled / need_total) * 100
        
        # Prioritas: nilai rendah = prioritas tinggi untuk terminasi
        # Bobot untuk resource yang ditahan dan persentase pemenuhan
        priorities[proc] = (held_resources * 0.7) + (fulfillment * 0.3)
    
    # Urutkan berdasarkan prioritas (nilai rendah = prioritas tinggi)
    sorted_procs = sorted(priorities.items(), key=lambda x: x[1])
    return sorted_procs

def get_resource_needs(processes, resources, allocation, max_need):
    """
    Menghitung resource yang masih dibutuhkan oleh setiap proses
    """
    resource_needs = {}
    
    for i, process in enumerate(processes):
        proc_needs = {}
        for j, resource in enumerate(resources):
            need = max_need[i][j] - allocation[i][j]
            if need > 0:
                proc_needs[resource] = need
        
        resource_needs[process] = proc_needs
    
    return resource_needs

def get_resource_holdings(processes, resources, allocation):
    """
    Menghitung resource yang dipegang oleh setiap proses
    """
    resource_holdings = {}
    
    for i, process in enumerate(processes):
        proc_holdings = {}
        for j, resource in enumerate(resources):
            alloc = allocation[i][j]
            if alloc > 0:
                proc_holdings[resource] = alloc
        
        resource_holdings[process] = proc_holdings
    
    return resource_holdings

def analyze_deadlock_resource_relations(processes, resources, allocation, max_need, deadlocked):
    """
    Menganalisis relasi resource dan proses dalam deadlock untuk visualisasi yang lebih baik
    """
    resource_needs = get_resource_needs(processes, resources, allocation, max_need)
    resource_holdings = get_resource_holdings(processes, resources, allocation)
    
    relations = {}
    for proc in deadlocked:
        relations[proc] = {
            "needs": resource_needs.get(proc, {}),
            "holds": resource_holdings.get(proc, {}),
            "waits_for_resources": [],
            "blocks": []
        }
    
    # Identifikasi proses yang menunggu resource dan proses yang memblokir
    for proc1 in deadlocked:
        needs = resource_needs.get(proc1, {})
        for resource, amount in needs.items():
            for proc2 in deadlocked:
                if proc1 != proc2:
                    holdings = resource_holdings.get(proc2, {})
                    if resource in holdings and holdings[resource] > 0:
                        # proc1 menunggu resource yang dipegang oleh proc2
                        if resource not in relations[proc1]["waits_for_resources"]:
                            relations[proc1]["waits_for_resources"].append(resource)
                        
                        if proc2 not in relations[proc1]["blocks"]:
                            relations[proc1]["blocks"].append(proc2)
    
    return relations

def apply_detection_recovery_strategy(data):
    """
    Menerapkan strategi deteksi dan recovery dari deadlock yang lebih robust
    """
    processes = data['processes']
    resources = data['resources']
    allocation = data['allocation']
    max_need = data['max_need']
    available = data['available']
    
    # Deteksi deadlock dan dependencies
    deadlocked, dependencies, circular_waits = detect_deadlock_dependencies(
        processes, resources, allocation, max_need, available
    )
    
    result = {
        "strategy": "Detection & Recovery",
        "explanation": "Mendeteksi deadlock dan melakukan recovery dengan terminasi proses",
        "steps": [],
        "recovered": False,
        "deadlock_dependencies": dependencies,
        "circular_waits": circular_waits
    }
    
    if not deadlocked:
        result["explanation"] = "Tidak ada deadlock yang terdeteksi"
        result["recovered"] = True
        return result
    
    # Visualisasi awal deadlock
    cycle_descriptions = []
    for cycle in circular_waits:
        if len(cycle) > 1:
            cycle_descriptions.append(" → ".join(cycle))
    
    cycle_text = ", ".join([f"{i+1}. {desc}" for i, desc in enumerate(cycle_descriptions)])
    if not cycle_text:
        cycle_text = "Tidak ada siklus wait-for yang terdeteksi secara langsung, namun deadlock ada karena tidak ada proses yang bisa selesai."
    
    step1 = {
        "type": "detection",
        "description": f"Deteksi deadlock pada proses: {', '.join(deadlocked)}",
        "deadlocked": deadlocked,
        "dependencies": dependencies,
        "circular_waits": circular_waits,
        "detail": f"Resource Allocation Graph menunjukkan circular wait: {cycle_text}"
    }
    result["steps"].append(step1)
    
    # Analisis relasi resource dalam deadlock
    resource_relations = analyze_deadlock_resource_relations(
        processes, resources, allocation, max_need, deadlocked
    )
    result["resource_relations"] = resource_relations
    
    # Hitung prioritas proses untuk terminasi
    process_priorities = calculate_process_priority(processes, allocation, max_need, deadlocked)
    
    modified_allocation = [row[:] for row in allocation]
    modified_available = available.copy()
    
    # Coba terminasi satu per satu sampai deadlock teratasi
    for victim, priority_score in process_priorities:
        process_idx = processes.index(victim)
        
        # Kumpulkan detail resource yang akan dibebaskan
        freed_resources = []
        for j in range(len(resources)):
            if modified_allocation[process_idx][j] > 0:
                freed_resources.append({
                    "resource": resources[j],
                    "amount": modified_allocation[process_idx][j]
                })
                
        # Catat langkah recovery
        step = {
            "type": "recovery",
            "process": victim,
            "action": "Terminate",
            "priority_score": priority_score,
            "resources_freed": freed_resources,
            "detail": f"Terminasi proses {victim} dan lepaskan resource-nya"
        }
        
        # Lepaskan resource yang dipegang oleh proses yang diterminasi
        for j in range(len(resources)):
            modified_available[j] += modified_allocation[process_idx][j]
            modified_allocation[process_idx][j] = 0
        
        step["modified_allocation"] = [row[:] for row in modified_allocation]
        step["modified_available"] = modified_available.copy()
        
        result["steps"].append(step)
        
        # Cek apakah deadlock masih ada setelah terminasi
        remaining_deadlock, remaining_deps, remaining_cycles = detect_deadlock_dependencies(
            processes, resources, modified_allocation, max_need, modified_available
        )
        
        if remaining_deadlock:
            # Deadlock masih ada, catat deadlock yang tersisa
            step["remaining_deadlock"] = remaining_deadlock
            step["remaining_dependencies"] = remaining_deps
            step["remaining_cycles"] = remaining_cycles
        else:
            # Deadlock teratasi
            result["recovered"] = True
            step["detail"] += f". Deadlock teratasi!"
            
            # Tambahkan langkah untuk menunjukkan proses yang bisa dilanjutkan
            other_processes = [p for p in deadlocked if p != victim and p not in remaining_deadlock]
            for proc in other_processes:
                continue_step = {
                    "type": "continue",
                    "process": proc,
                    "action": "Continue",
                    "detail": f"Proses {proc} dapat melanjutkan eksekusi"
                }
                result["steps"].append(continue_step)
            
            break
    
    if not result["recovered"]:
        result["explanation"] += ". Deadlock masih terjadi meskipun beberapa proses telah diterminasi"
    else:
        terminated_processes = [step["process"] for step in result["steps"] if step["type"] == "recovery"]
        result["explanation"] += f". Deadlock teratasi setelah terminasi proses: {', '.join(terminated_processes)}"
    
    result["modified_allocation"] = modified_allocation
    result["modified_available"] = modified_available
    
    return result

def bankers_algorithm(processes, resources, allocation, max_need, available):
    """
    Implementasi Banker's Algorithm untuk avoidance yang lebih fleksibel
    """
    n = len(processes)
    m = len(resources)
    work = available[:]
    finish = [False] * n
    safe_sequence = []
    steps = []
    
    # Step by step execution
    step_count = 1
    
    while True:
        found = False
        for i in range(n):
            if not finish[i]:
                # Cek apakah proses dapat dieksekusi
                can_execute = True
                needs = []
                for j in range(m):
                    need = max_need[i][j] - allocation[i][j]
                    needs.append(need)
                    if need > work[j]:
                        can_execute = False
                        break
                
                if can_execute:
                    # Proses bisa dieksekusi
                    step = {
                        "step": step_count,
                        "process": processes[i],
                        "work_before": work.copy(),
                        "need": needs
                    }
                    
                    # Simulasikan eksekusi proses
                    for j in range(m):
                        work[j] += allocation[i][j]
                    
                    step["work_after"] = work.copy()
                    
                    finish[i] = True
                    safe_sequence.append(processes[i])
                    found = True
                    
                    steps.append(step)
                    step_count += 1
                    break
        
        if not found:
            break
    
    # Cek apakah semua proses berhasil dieksekusi
    result = {
        "safe": len(safe_sequence) == n,
        "steps": steps,
        "safe_sequence": safe_sequence
    }
    
    if result["safe"]:
        result["explanation"] = f"State aman ditemukan dengan sequence: {' → '.join(safe_sequence)}"
    else:
        deadlocked = [processes[i] for i in range(n) if not finish[i]]
        result["deadlocked"] = deadlocked
        result["explanation"] = f"State tidak aman. Proses yang mungkin deadlock: {', '.join(deadlocked)}"
    
    return result

def handle_deadlock(data):
    """
    Menangani request deteksi deadlock
    """
    processes = data['processes']
    resources = data['resources']
    allocation = data['allocation']
    max_need = data['max_need']
    available = data['available']

    # Deteksi deadlock
    deadlock_processes = detect_deadlock(processes, resources, allocation, max_need, available)

    if deadlock_processes:
        return {
            "status": "deadlock_detected",
            "explanation": f"Deadlock terjadi pada proses: {', '.join(deadlock_processes)}",
            "deadlocked_processes": deadlock_processes,
            "options": ["Prevention", "Avoidance", "Detection & Recovery"],
            "hint": "Coba gunakan algoritma Banker untuk menghindari deadlock"
        }
    else:
        return {
            "status": "no_deadlock",
            "explanation": "Tidak ada deadlock yang terdeteksi",
            "options": [],
            "hint": "Sistem berjalan normal"
        }

def apply_prevention_strategy(data):
    """
    Menerapkan strategi pencegahan deadlock dengan mengeliminasi Hold & Wait
    """
    processes = data['processes']
    resources = data['resources']
    allocation = data['allocation']
    max_need = data['max_need']
    available = data['available']
    
    # Identifikasi proses yang potensial deadlock
    potential_deadlocks = detect_deadlock(processes, resources, allocation, max_need, available)
    
    # Strategi prevention: Alokasikan semua resource yang dibutuhkan sekaligus
    result = {
        "strategy": "Prevention",
        "explanation": "Menghilangkan kondisi Hold & Wait dengan mengalokasikan semua resource di awal",
        "steps": [],
        "modified_allocation": allocation.copy(),
        "modified_available": available.copy()
    }
    
    # Simulasi langkah preventif
    for i, process in enumerate(processes):
        if process in potential_deadlocks:
            step = {
                "process": process,
                "action": "Prevent Hold & Wait",
                "detail": f"Proses {process} menunggu semua resource tersedia sekaligus"
            }
            result["steps"].append(step)
    
    return result

def apply_avoidance_strategy(data):
    """
    Menerapkan Banker's Algorithm untuk menghindari deadlock
    """
    processes = data['processes']
    resources = data['resources']
    allocation = data['allocation']
    max_need = data['max_need']
    available = data['available']
    
    banker_result = bankers_algorithm(processes, resources, allocation, max_need, available)
    
    result = {
        "strategy": "Avoidance (Banker's Algorithm)",
        "explanation": "Menggunakan Banker's Algorithm untuk menentukan state aman",
        "steps": banker_result["steps"],
        "safe": banker_result["safe"],
        "safe_sequence": banker_result.get("safe_sequence", [])
    }
    
    # Menambahkan penjelasan hasil
    if banker_result["safe"]:
        result["explanation"] += f". Ditemukan safe sequence: {' → '.join(banker_result['safe_sequence'])}"
    else:
        result["deadlocked"] = banker_result.get("deadlocked", [])
        result["explanation"] += f". Tidak ditemukan safe sequence. Sistem dalam state tidak aman."
    
    return result

def solve_deadlock(data, strategy):
    """
    Fungsi utama untuk menyelesaikan deadlock berdasarkan strategi yang dipilih
    """
    if strategy == "Prevention":
        return apply_prevention_strategy(data)
    elif strategy == "Avoidance":
        return apply_avoidance_strategy(data)
    elif strategy == "Detection":
        return apply_detection_recovery_strategy(data)
    else:
        return {
            "error": "Strategi tidak valid",
            "valid_strategies": ["Prevention", "Avoidance", "Detection"]
        }

def generate_random_scenario(num_processes, num_resources, num_cores=2):
    """
    Generate a random multi-core scenario dengan parameter yang diberikan
    """
    # Buat list nama proses (P1, P2, ..., Pn)
    processes = [f'P{i+1}' for i in range(num_processes)]
    
    # Buat list nama resource (R1, R2, ..., Rm)
    resources = [f'R{i+1}' for i in range(num_resources)]
    
    # Buat list nama core (Core1, Core2, ..., CoreC)
    cores = [f'Core{i+1}' for i in range(num_cores)]
    
    # Tentukan jumlah instance untuk setiap resource (1-5)
    total_resources = {resource: random.randint(2, 5) for resource in resources}
    
    # Alokasikan proses ke core secara random
    process_core_mapping = {process: random.choice(cores) for process in processes}
    
    # Inisialisasi alokasi dan kebutuhan maksimum untuk setiap proses
    allocation = []
    max_need = []
    
    for _ in range(num_processes):
        # Untuk setiap proses, alokasikan beberapa resource secara random
        alloc = []
        max_req = []
        
        for r in range(num_resources):
            # Resource yang dialokasikan tidak boleh melebihi total
            max_possible = min(total_resources[resources[r]], 3)  # Max 3 per proses
            allocated = random.randint(0, max_possible)
            
            # Kebutuhan maksimum harus >= alokasi yang sudah ada
            max_required = random.randint(allocated, allocated + 2)
            
            alloc.append(allocated)
            max_req.append(max_required)
            
            # Kurangi resource yang tersedia
            total_resources[resources[r]] -= allocated
        
        allocation.append(alloc)
        max_need.append(max_req)
    
    # Hitung resource yang tersedia
    available = []
    for r in range(num_resources):
        available.append(total_resources[resources[r]])
    
    # Buat skenario yang mungkin menghasilkan deadlock
    # Dengan membuat beberapa proses memiliki ketergantungan circular
    if random.random() < 0.7:  # 70% kemungkinan ada deadlock
        potential_deadlock_processes = random.sample(range(num_processes), min(3, num_processes))
        
        if len(potential_deadlock_processes) >= 2:
            for i in range(len(potential_deadlock_processes)):
                p1 = potential_deadlock_processes[i]
                p2 = potential_deadlock_processes[(i+1) % len(potential_deadlock_processes)]
                
                # Buat ketergantungan circular antara p1 dan p2
                for r in range(num_resources):
                    if allocation[p1][r] > 0 and max_need[p2][r] > allocation[p2][r]:
                        # p1 memegang resource yang dibutuhkan p2
                        # dan p2 memegang resource yang dibutuhkan p1
                        if r+1 < num_resources:
                            if allocation[p2][r+1] > 0 and max_need[p1][r+1] > allocation[p1][r+1]:
                                # Tingkatkan kebutuhan untuk membuat deadlock lebih mungkin
                                max_need[p1][r] = allocation[p1][r] + 1
                                max_need[p2][r+1] = allocation[p2][r+1] + 1
    
    # Hitung kebutuhan yang tersisa
    need = []
    for i in range(num_processes):
        need.append([max_need[i][j] - allocation[i][j] for j in range(num_resources)])
    
    # Tambahkan informasi edukasi tentang kondisi deadlock
    deadlock_explanation = """
    Perhatikan skenario ini dan coba identifikasi:
    
    1. Mutual Exclusion: Setiap resource hanya bisa digunakan oleh satu proses pada satu waktu
    2. Hold & Wait: Proses memegang resource sambil menunggu resource lain
    3. No Preemption: Resource hanya bisa dilepas secara sukarela oleh proses
    4. Circular Wait: Ada siklus proses yang saling menunggu resource
    
    Jika keempat kondisi terpenuhi, deadlock dapat terjadi!
    """
    
    process_descriptions = []
    for i, p in enumerate(processes):
        held_resources = [f"{resources[r]} ({allocation[i][r]})" for r in range(num_resources) if allocation[i][r] > 0]
        needed_resources = [f"{resources[r]} ({need[i][r]})" for r in range(num_resources) if need[i][r] > 0]
        
        desc = f"{p} pada {process_core_mapping[p]}: "
        if held_resources:
            desc += f"memegang {', '.join(held_resources)}"
        else:
            desc += "tidak memegang resource"
            
        if needed_resources:
            desc += f" dan butuh {', '.join(needed_resources)}"
        
        process_descriptions.append(desc)
    
    return {
        "processes": processes,
        "resources": resources,
        "cores": cores,
        "process_core_mapping": process_core_mapping,
        "allocation": allocation,
        "max_need": max_need,
        "need": need,
        "available": available,
        "total_resources": {res: sum(allocation[p][i] for p in range(num_processes)) + available[i] 
                            for i, res in enumerate(resources)},
        "educational": {
            "explanation": deadlock_explanation.strip(),
            "process_descriptions": process_descriptions
        }
    }
