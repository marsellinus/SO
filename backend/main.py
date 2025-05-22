from flask import Flask, jsonify, request, render_template, send_from_directory
from solver import handle_deadlock, solve_deadlock, generate_random_scenario, check_resource_compatibility

app = Flask(__name__, 
            static_folder='../static',
            template_folder='../templates')

@app.route('/api/simulate', methods=['POST'])
def simulate():
    """
    Simulate a deadlock scenario based on user input.
    """
    data = request.json
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    result = handle_deadlock(data)
    return jsonify(result)

@app.route('/api/solve', methods=['POST'])
def solve():
    """
    Solve a deadlock scenario using the specified strategy.
    """
    data = request.json
    if not data or 'strategy' not in data:
        return jsonify({"error": "Invalid input or missing strategy"}), 400
    
    strategy = data.pop('strategy')
    result = solve_deadlock(data, strategy)
    return jsonify(result)

@app.route('/api/generate', methods=['POST'])
def generate():
    """
    Generate a random multi-core scenario with given parameters.
    """
    data = request.json
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    
    try:
        num_processes = int(data.get('processes', 5))
        num_resources = int(data.get('resources', 3))
        num_cores = int(data.get('cores', 2))
    except ValueError:
        return jsonify({"error": "Invalid parameters. Ensure all inputs are integers."}), 400
    
    if num_processes <= 0 or num_resources <= 0 or num_cores <= 0:
        return jsonify({"error": "Parameters must be positive integers."}), 400
    
    scenario = generate_random_scenario(num_processes, num_resources, num_cores)
    return jsonify(scenario)

@app.route('/api/check_compatibility', methods=['POST'])
def check_compatibility():
    """
    Check if a resource is compatible with a process based on its needs.
    """
    data = request.json
    if not data or 'processId' not in data or 'resourceId' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    result = check_resource_compatibility(data['processId'], data['resourceId'], data.get('processes', []), data.get('resources', []))
    return jsonify(result)

@app.route('/')
def index():
    """
    Render the main index page.
    """
    return render_template('index.html')

@app.route('/game')
def game():
    """
    Render the game simulator page.
    """
    return render_template('game.html')

@app.route('/game/challenge')
def game_challenge():
    """
    Render the game challenge mode page with interactive levels.
    This page is a standalone game with multiple levels where users
    can learn about deadlock through a gamified experience.
    """
    return render_template('game-ui.html')

@app.route('/info')
def info_page():
    """
    Render the information and help page.
    """
    return render_template('info.html')

@app.errorhandler(404)
def page_not_found(e):
    """
    Handle 404 errors with a custom message.
    """
    return jsonify({"error": "Page not found"}), 404

@app.errorhandler(500)
def internal_server_error(e):
    """
    Handle 500 errors with a custom message.
    """
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Enable reloader and debugging for development
    app.run(debug=True, use_reloader=True)
