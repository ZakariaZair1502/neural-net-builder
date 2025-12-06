# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from sklearn.datasets import load_iris, fetch_california_housing, load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import pandas as pd
import os
import uuid
import json
from bson.objectid import ObjectId
from pymongo import MongoClient
import gridfs
import io

from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
from datetime import timedelta

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['NN']
users_collection = db['users']
projects_collection = db['projects']
fs = gridfs.GridFS(db)


# JWT
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
jwt = JWTManager(app)

# Globals
scaler = None
encoder = None
trained_model = None
feature_names = None
def load_and_preprocess_data(dataset_name, custom_file_path=None, target_column=None, feature_columns=None):
    global scaler, encoder, feature_names
    
    df = None
    y = None
    task = None
    
    if dataset_name == 'iris':
        data = load_iris(as_frame=True)
        df = data.data
        df.columns = ['Sepal Length', 'Sepal Width', 'Petal Length', 'Petal Width']
        y = data.target
        task = 'classification'
        encoder = OneHotEncoder(sparse_output=False)
        y = encoder.fit_transform(y.values.reshape(-1, 1))
    elif dataset_name in ['breast_cancer', 'cancer']:
        data = load_breast_cancer(as_frame=True)
        df = data.data
        y = data.target
        task = 'classification'
        encoder = OneHotEncoder(sparse_output=False)
        y = encoder.fit_transform(y.values.reshape(-1, 1))
    elif dataset_name in ['california_housing', 'housing']:
        data = fetch_california_housing(as_frame=True)
        df = data.data
        y = data.target
        task = 'regression'
        y = y.values.reshape(-1, 1)
    elif dataset_name == 'custom' and custom_file_path:
        df = pd.read_csv(custom_file_path)
        if target_column:
            y = df[target_column].values
            df = df.drop(columns=[target_column])
            
            unique_targets = np.unique(y)
            if len(unique_targets) < 10 or y.dtype == object or isinstance(y[0], str):
                task = 'classification'
                encoder = OneHotEncoder(sparse_output=False)
                y = encoder.fit_transform(y.reshape(-1, 1))
            else:
                task = 'regression'
                y = y.reshape(-1, 1)
    
    if df is None:
        raise ValueError("Dataset not found or could not be loaded")

    # Filter features if specified
    if feature_columns:
        available_columns = df.columns.tolist()
        valid_cols = [col for col in feature_columns if col in available_columns]
        if valid_cols:
            df = df[valid_cols]
    feature_names = df.columns.tolist()
    X = df.values
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    return X_train, X_test, y_train, y_test, task

def build_model(layers_config, hyperparameters, input_dim, output_dim, task):
    model = Sequential()
    
    for layer in layers_config:
        if layer['type'] == 'Hidden':
            model.add(Dense(
                units=int(layer['units']),
                activation=layer['activation'].lower(),
                input_shape=(input_dim,) if len(model.layers) == 0 else None
            ))
        elif layer['type'] == 'Output':
             model.add(Dense(
                units=int(layer['units']),
                activation=layer['activation'].lower(),
                input_shape=(input_dim,) if len(model.layers) == 0 else None
            ))
            
    learning_rate = float(hyperparameters.get('learningRate', 0.001))
    optimizer_name = hyperparameters.get('optimizer', 'adam').lower()
    
    if optimizer_name == 'sgd':
        optimizer = tf.keras.optimizers.SGD(learning_rate=learning_rate)
    elif optimizer_name == 'rmsprop':
        optimizer = tf.keras.optimizers.RMSprop(learning_rate=learning_rate)
    else:
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
        
    loss = 'categorical_crossentropy' if task == 'classification' else 'mean_squared_error'
    metrics = ['accuracy'] if task == 'classification' else ['mae']
    
    model.compile(optimizer=optimizer, loss=loss, metrics=metrics)
    
    return model, metrics[0]

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Aucun fichier envoyé'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Aucun fichier sélectionné'}), 400
    
    if file:
        filename = str(uuid.uuid4()) + "_" + file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            df = pd.read_csv(filepath)
            columns = df.columns.tolist()
            features_count = df.shape[1] - 1
            
            y = df.iloc[:, -1].values
            unique_targets = np.unique(y)
            if len(unique_targets) < 10 or y.dtype == object:
                output_count = len(unique_targets)
                task = 'Classification'
            else:
                output_count = 1
                task = 'Régression'
                
            return jsonify({
                'success': True, 
                'filename': filename,
                'columns': columns,
                'features': features_count,
                'output': output_count,
                'task': task
            })
        except Exception as e:
             return jsonify({'success': False, 'message': f'Erreur lecture CSV: {str(e)}'}), 400

@app.route('/analyze_target', methods=['POST'])
def analyze_target():
    data = request.get_json()
    filename = data.get('filename')
    target_column = data.get('targetColumn')
    
    if not filename or not target_column:
        return jsonify({'success': False, 'message': 'Filename and targetColumn are required'}), 400
        
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'message': 'File not found'}), 404
        
    try:
        df = pd.read_csv(filepath)
        if target_column not in df.columns:
            return jsonify({'success': False, 'message': f"Column '{target_column}' not found"}), 400
            
        features_count = df.shape[1] - 1
        
        y = df[target_column].values
        unique_targets = np.unique(y)
        
        if len(unique_targets) < 10 or y.dtype == object or isinstance(y[0], str):
            output_count = len(unique_targets)
            task = 'Classification'
        else:
            output_count = 1
            task = 'Régression'
            
        return jsonify({
            'success': True,
            'features': features_count,
            'output': output_count,
            'task': task
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error analyzing target: {str(e)}'}), 500

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400

    if users_collection.find_one({'username': username}):
        return jsonify({'success': False, 'message': 'Username already exists'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({'username': username, 'password': hashed_password})

    return jsonify({'success': True, 'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400

    user = users_collection.find_one({'username': username})

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        access_token = create_access_token(identity=username)
        return jsonify({'success': True, 'access_token': access_token, 'username': username}), 200
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    current_user = get_jwt_identity()
    return jsonify({'success': True, 'message': f'Welcome {current_user}', 'user': current_user}), 200

@app.route('/save_project', methods=['POST'])
@jwt_required()
def save_project():
    global trained_model, scaler, encoder, feature_names
    current_user = get_jwt_identity()
    data = request.get_json()
    
    project_name = data.get('name')
    layers = data.get('layers')
    hyperparameters = data.get('hyperparameters')
    dataset_info = data.get('datasetInfo')
    selected_dataset = data.get('selectedDataset')
    custom_filename = data.get('customFilename')

    model_file_id = None
    dataset_file_id = None
    
    # Save Model
    if trained_model:
        try:
            # Save to temp file then read
            temp_model_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_model.keras')
            trained_model.save(temp_model_path)
            
            with open(temp_model_path, 'rb') as f:
                model_file_id = fs.put(f, filename=f"{project_name}_model.keras")
            
            # Clean up temp file
            if os.path.exists(temp_model_path):
                os.remove(temp_model_path)
        except Exception as e:
            print(f"Error saving model to GridFS: {e}")

    # Save Dataset
    if selected_dataset == 'custom' and custom_filename:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], custom_filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'rb') as f:
                    dataset_file_id = fs.put(f, filename=custom_filename)
            except Exception as e:
                print(f"Error saving dataset to GridFS: {e}")

    
    if not project_name:
        return jsonify({'success': False, 'message': 'Project name is required'}), 400
        
    project = {
        'user': current_user,
        'name': project_name,
        'layers': layers,
        'feature_names': feature_names,
        'hyperparameters': hyperparameters,
        'datasetInfo': dataset_info,
        'selectedDataset': selected_dataset,
        'model_file_id': str(model_file_id) if model_file_id else None,
        'dataset_file_id': str(dataset_file_id) if dataset_file_id else None,
        'created_at': pd.Timestamp.now().isoformat()
    }
    
    projects_collection.insert_one(project)
    return jsonify({'success': True, 'message': 'Project saved successfully'}), 201

@app.route('/get_projects', methods=['GET'])
@jwt_required()
def get_projects():
    current_user = get_jwt_identity()
    projects = list(projects_collection.find({'user': current_user}, {'_id': 1, 'name': 1, 'created_at': 1, 'datasetInfo': 1, 'feature_names': 1, 'model_file_id': 1, 'dataset_file_id': 1}))
    
    for p in projects:
        p['_id'] = str(p['_id'])
        
    return jsonify({'success': True, 'projects': projects}), 200

@app.route('/get_project/<project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    current_user = get_jwt_identity()
    try:
        project = projects_collection.find_one({'_id': ObjectId(project_id), 'user': current_user})
        if not project:
            return jsonify({'success': False, 'message': 'Project not found'}), 404
            
        project['_id'] = str(project['_id'])
        return jsonify({'success': True, 'project': project}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Invalid project ID'}), 400

@app.route('/delete_project/<project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    current_user = get_jwt_identity()
    try:
        project = projects_collection.find_one({'_id': ObjectId(project_id), 'user': current_user})
        if not project:
            return jsonify({'success': False, 'message': 'Project not found'}), 404
            
        # Delete associated files from GridFS
        if project.get('model_file_id'):
            try:
                fs.delete(ObjectId(project['model_file_id']))
            except Exception as e:
                print(f"Error deleting model file: {e}")
                
        if project.get('dataset_file_id'):
            try:
                fs.delete(ObjectId(project['dataset_file_id']))
            except Exception as e:
                print(f"Error deleting dataset file: {e}")
                
        # Delete project document
        projects_collection.delete_one({'_id': ObjectId(project_id)})
        
        return jsonify({'success': True, 'message': 'Project deleted successfully'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting project: {str(e)}'}), 500

@app.route('/train', methods=['POST'])
def train_model_api():
    global trained_model
    
    try:
        data = request.get_json()
        
        layers_config = data.get('layers', [])
        hyperparameters = data.get('hyperparameters', {})
        selected_dataset = data.get('selectedDataset')
        custom_filename = data.get('customFilename')
        target_column = data.get('targetColumn')
        feature_columns = data.get('featureColumns')

        print(f"Train request: dataset={selected_dataset}, features={feature_columns}")

        custom_file_path = None
        if selected_dataset == 'custom' and custom_filename:
            custom_file_path = os.path.join(app.config['UPLOAD_FOLDER'], custom_filename)

        X_train, X_test, y_train, y_test, task = load_and_preprocess_data(selected_dataset, custom_file_path, target_column, feature_columns)
        
        print(f"Data loaded. X_train shape: {X_train.shape}, y_train shape: {y_train.shape}, task: {task}")
        
        input_dim = X_train.shape[1]
        output_dim = y_train.shape[1] if task == 'classification' else 1
        
        print(f"Building model. Input dim: {input_dim}, Output dim: {output_dim}")
        
        model, main_metric_name = build_model(layers_config, hyperparameters, input_dim, output_dim, task)

        history_data = []
        
        class MetricsCallback(tf.keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs=None):
                history_data.append({
                    'epoch': epoch + 1,
                    'Loss': logs['loss'],
                    'Accuracy': logs.get('accuracy') if task == 'classification' else None,
                    'MAE': logs.get('mae') if task == 'regression' else None,
                    'val_Loss': logs.get('val_loss'),
                    'val_Accuracy': logs.get('val_accuracy') if task == 'classification' else None,
                    'val_MAE': logs.get('val_mae') if task == 'regression' else None
                })
        
        print(f"Starting training for {hyperparameters['epochs']} epochs...")
        model.fit(X_train, y_train,
                  epochs=int(hyperparameters['epochs']),
                  batch_size=int(hyperparameters.get('batchSize', 32)),
                  validation_data=(X_test, y_test),
                  verbose=0,
                  callbacks=[MetricsCallback()])

        loss, main_metric_value = model.evaluate(X_test, y_test, verbose=0)
        
        trained_model = model
        
        final_metrics = {
            'final_loss': loss,
            'final_metric': main_metric_value,
            'metric_name': 'Accuracy' if task == 'classification' else 'MAE',
            'task': task
        }

        return jsonify({
            'success': True,
            'history': history_data,
            'final_metrics': final_metrics
        })

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        print(f"Erreur d'entraînement : {e}")
        return jsonify({'success': False, 'message': 'Erreur interne du serveur lors de l\'entraînement.'}), 500

@app.route('/model_metadata', methods=['GET'])
def get_model_metadata():
    global feature_names

    if feature_names is None:
        return jsonify({'success': False, 'message': 'Le modèle ou les métadonnées ne sont pas chargés.'}), 404

    input_dim = len(feature_names)
    return jsonify({
        'success': True,
        'feature_names': feature_names,
        'input_dim': input_dim
    }), 200

@app.route('/predict', methods=['POST'])
def predict_api():
    global trained_model, scaler, encoder, feature_names
    
    if trained_model is None:
        return jsonify({'success': False, 'message': 'Le modèle n\'a pas encore été entraîné.'}), 400
        
    try:
        data = request.get_json()
        input_data = np.array(data.get('input', []))
        
        if input_data.ndim == 1:
            input_data = input_data.reshape(1, -1)
        
        if feature_names and input_data.shape[1] != len(feature_names):
            return jsonify({
                'success': False, 
                'message': f'Erreur: Le nombre de features fournies ({input_data.shape[1]}) ne correspond pas au nombre de features du modèle ({len(feature_names)}).'
            }), 400

        if scaler is None:
            return jsonify({'success': False, 'message': 'Erreur: Le Scaler de normalisation est manquant.'}), 500

        scaled_input = scaler.transform(input_data)
        
        prediction = trained_model.predict(scaled_input)[0]
        
        task = trained_model.metrics_names[1] in ['accuracy'] and 'classification' or 'regression'
        
        output_label = None
        if task == 'classification':
            predicted_class_index = np.argmax(prediction)
            
            if encoder and hasattr(encoder, 'categories_'):
                output_label = f"Classe {predicted_class_index} (Probabilité: {prediction[predicted_class_index]:.4f})"
            else:
                output_label = f"Classe prédite: {predicted_class_index}"
            
        elif task == 'regression':
            output_label = f"Valeur Prédite: {prediction[0]:.2f}"
            
        return jsonify({
            'success': True,
            'prediction_value': prediction.tolist(),
            'prediction_label': output_label,
            'task': task
        })
        
    except Exception as e:
        print(f"Erreur de prédiction : {e}")
        return jsonify({'success': False, 'message': 'Erreur interne lors de la prédiction.'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)