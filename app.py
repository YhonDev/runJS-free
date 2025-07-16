from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import subprocess
import os
import threading
import time
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('code_change')
def handle_code_change(data):
    code = data['code']
    tab_id = data['tab_id']

    # Use a separate thread to run Node.js to avoid blocking the SocketIO event loop
    threading.Thread(target=run_js_code, args=(code, tab_id)).start()

def run_js_code(code, tab_id):
    output_data = {'output': '', 'error': None}

    try:
        process = subprocess.run(
            ["node", "executor.js", code],
            capture_output=True,
            text=True,
            check=False, # Do not raise exception for non-zero exit codes
            encoding='utf-8',
            cwd=os.path.dirname(os.path.abspath(__file__)) # Run Node.js from the app's directory
        )

        # Attempt to parse the JSON output from executor.js
        try:
            result = json.loads(process.stdout)
            output_data['output'] = result.get('output', '')
            output_data['error'] = result.get('error', None)
        except json.JSONDecodeError:
            # If it's not valid JSON, treat it as raw output/error
            output_data['output'] = process.stdout
            if process.stderr:
                output_data['output'] += f"\nNode.js Stderr: {process.stderr}"
            output_data['error'] = {'type': 'ExecutionError', 'message': 'Invalid JSON output from executor.js'}

        if process.stderr:
            # Append stderr to output if present, even if JSON was parsed
            if output_data['output']:
                output_data['output'] += String.fromCharCode(10) # Add newline if there's already output
            output_data['output'] += f"Node.js Stderr: {process.stderr}"

    except FileNotFoundError:
        output_data['output'] = "Error: Node.js no encontrado. Asegúrate de que Node.js está instalado y en tu PATH."
        output_data['error'] = {'type': 'SystemError', 'message': 'Node.js not found'}
    except Exception as e:
        output_data['output'] = f"Error en el backend: {e}"
        output_data['error'] = {'type': 'BackendError', 'message': str(e)}

    socketio.emit('code_output', {'output': output_data['output'], 'error': output_data['error'], 'tab_id': tab_id})

if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
