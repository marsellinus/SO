from flask import Flask, jsonify, request, render_template, send_from_directory
from solver import handle_deadlock, solve_deadlock, generate_random_scenario

app = Flask(__name__, 
            static_folder='../static',
            template_folder='../templates')

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    result = handle_deadlock(data)
    return jsonify(result)

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json
    if not data or 'strategy' not in data:
        return jsonify({"error": "Invalid input or missing strategy"}), 400
    
    strategy = data.pop('strategy')
    result = solve_deadlock(data, strategy)
    return jsonify(result)

@app.route('/api/generate', methods=['POST'])
def generate():
    """Generate a random multi-core scenario with given parameters"""
    data = request.json
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    
    num_processes = data.get('processes', 5)
    num_resources = data.get('resources', 3)
    num_cores = data.get('cores', 2)
    
    scenario = generate_random_scenario(num_processes, num_resources, num_cores)
    return jsonify(scenario)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

if __name__ == '__main__':
    app.run(debug=True)
