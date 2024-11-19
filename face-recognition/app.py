from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Cho phép CORS từ Frontend

@app.route('/process_image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        app.logger.error("No 'image' field in request.files")
        return jsonify({'error': 'No image part'}), 400

    image_file = request.files['image']
    app.logger.info(f"Received file: {image_file.filename}")

    try:
        image = face_recognition.load_image_file(image_file)
    except Exception as e:
        app.logger.error(f"Error loading image: {e}")
        return jsonify({'error': 'Failed to load image'}), 500

    face_encodings = face_recognition.face_encodings(image)

    if len(face_encodings) > 0:
        embedding = face_encodings[0].tolist()
        app.logger.info("Face embedding successfully generated")
        return jsonify({'embedding': embedding})
    else:
        app.logger.warning("No face found in the image")
        return jsonify({'error': 'No face found'}), 400
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
