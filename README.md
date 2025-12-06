# 🧠 Neural Network Builder (NNBuilder)

[![Stars](https://img.shields.io/github/stars/ZakariaZair1502/neural-net-builder?style=social)](https://github.com/ZakariaZair1502/neural-net-builder/stargazers)
[![License](https://img.shields.io/github/license/ZakariaZair1502/neural-net-builder?style=flat-square)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/ZakariaZair1502/neural-net-builder?style=flat-square&color=blue)](https://github.com/ZakariaZair1502/neural-net-builder/commits/main)

## 🎥 Project Demonstration

See the power of NNBuilder in action:

[![Watch the Demo Video](https://img.youtube.com/vi/NNBuilder_Video_ID/maxresdefault.jpg)](https://res.cloudinary.com/dpkddumyr/video/upload/NNBuilder.mp4)

---

## ✨ Project Overview

**NNBuilder** is an innovative Full-Stack platform designed to **democratize Deep Learning** by providing a Low-Code/No-Code interface for the construction, training, and deployment of Deep Neural Networks (DNNs).

This application targets data scientists and developers looking to rapidly prototype **classification and regression models** without being burdened by complex, boilerplate TensorFlow/Keras code.

### 🚀 Key Features

* **Modular DNN Design:** Graphically build sequential Neural Networks, configuring `Dense` layers, activation functions (ReLU, Sigmoid, etc.), and custom hyperparameter settings.
* **Automated Preprocessing:** Seamless integration of **`StandardScaler`** (normalization) and **One-Hot Encoding** for targets, ensuring optimal data preparation.
* **Task Versatility:** Automatic detection and support for **Classification** and **Regression** tasks, applying appropriate loss functions and metrics.
* **Flexible Datasets:** Train on integrated datasets (Iris, Cancer, Housing) or upload **custom CSV files**.
* **Robust Persistence:** Securely save the trained Keras model, hyperparameters, and custom data files using **MongoDB GridFS**, allowing users to resume or share work effortlessly.
* **Security & Authentication:** Full user registration and login system powered by **JWT** (JSON Web Tokens) and secure password hashing with **Bcrypt**.

---

## 🏗️ Technical Architecture

The project employs a modern architecture that clearly separates the user interface (Frontend) from the core AI logic (Backend).

### 1. Backend (API - Python)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Web Framework** | `Flask` | Creates RESTful endpoints for training, prediction, and user management. |
| **Deep Learning**| `TensorFlow` / `Keras` | Core engine for training and evaluating neural networks. |
| **Data Science** | `Pandas` / `Scikit-learn` | Handles data loading, preprocessing (Scaling, Encoding), and validation. |
| **Database** | `MongoDB` / `GridFS` | Stores project metadata. **GridFS** is crucial for persisting heavy objects: trained `.keras` models and custom `.csv` files. |
| **Security** | `Flask-JWT-Extended` / `Bcrypt` | Manages access tokens and secure password hashing. |


### 2. Frontend (User Interface - React)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **UI Framework** | `React` (TSX) | Builds the interactive user interface (model configuration forms, prediction inputs, history display). |
| **Language** | `TypeScript` | Ensures robust, scalable client-side code through strict typing. |
| **API Calls** | `Fetch API` | Handles asynchronous communication with the Flask backend. |

---

## ⚙️ Installation and Setup

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

Ensure you have the following installed:

* **Python** (3.8+)
* **Node.js** (16+) / **npm**
* A running **MongoDB** instance (accessible via the URI `mongodb://localhost:27017/NN`).

### 2. Backend (Flask API)

```bash
# Clone the repository
git clone [https://github.com/ZakariaZair1502/neural-net-builder.git](https://github.com/ZakariaZair1502/neural-net-builder.git)
cd neural-net-builder

# Create and activate a virtual environment (recommended)
python -m venv venv
.\venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt # Make sure this file lists Flask, Keras, TensorFlow, Scikit-learn, etc.

# Start the Flask server
python app.py
# The API should start on http://localhost:5000

# Install dependencies
npm install

# Start the React application
npm start
