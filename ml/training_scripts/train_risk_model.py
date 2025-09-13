import pandas as pd
import numpy as np
import random
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import joblib
import os
import logging
from datetime import datetime
from collections import Counter
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.feature_extraction import DictVectorizer
import shutil # Import shutil for file operations

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set random seeds for reproducibility
np.random.seed(42)
random.seed(42)

def train_model():
    logger.info("Loading and preprocessing data...")
    
    # Load the dataset
    file_path = "../dataset/feature_vectors_syscallsbinders_frequency_5_Cat.csv"
    df = pd.read_csv(file_path)
    
    # Clean data
    df = df.drop_duplicates()
    
    # Remove sparse features (features with mostly zeros)
    sparse_features = df.columns[df.sum() < 10]
    df = df.drop(columns=sparse_features)
    logger.info(f"Removed {len(sparse_features)} sparse features\n")
    
    # Prepare features and target
    X_df = df.drop('Class', axis=1)
    y = df['Class']
    
    # Remap classes to start from 0
    y = y - y.min()

    # Convert X_df to list of dictionaries for DictVectorizer
    X_dict = X_df.to_dict(orient='records')

    # Initialize and fit DictVectorizer
    vectorizer = DictVectorizer(sparse=False)
    X_vectorized = vectorizer.fit_transform(X_dict)
    
    # Split vectorized data
    X_train, X_test, y_train, y_test = train_test_split(X_vectorized, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Handle class imbalance with SMOTE
    logger.info("Training model...")
    logger.info(f"Class distribution in y_train before SMOTE: {Counter(y_train)}")
    smote = SMOTE(random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train_scaled, y_train)
    logger.info(f"Class distribution after SMOTE: {Counter(y_train_balanced)}")
    
    # Define model and parameters
    model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')
    param_grid = {
        'learning_rate': [0.1],
        'max_depth': [5],
        'n_estimators': [100]
    }
    
    # Grid search
    logger.info("Starting grid search...")
    grid_search = GridSearchCV(model, param_grid, cv=3, scoring='accuracy')
    grid_search.fit(X_train_balanced, y_train_balanced)
    
    # Get best model
    best_model = grid_search.best_estimator_
    logger.info(f"Best Params: {grid_search.best_params_}\n")
    
    # Evaluate model
    y_pred = best_model.predict(X_test_scaled)
    logger.info("\nClassification Report:")
    logger.info(classification_report(y_test, y_pred))
    logger.info("\nConfusion Matrix:")
    logger.info(confusion_matrix(y_test, y_pred))
    logger.info(f"Accuracy Score: {accuracy_score(y_test, y_pred)}\n")
    
    # Create models directory if it doesn't exist
    models_dir = '../models'
    os.makedirs(models_dir, exist_ok=True)
    
    # Save model, scaler, and vectorizer with timestamps
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_timestamped_path = os.path.join(models_dir, f'risk_model_{timestamp}.pkl')
    scaler_timestamped_path = os.path.join(models_dir, f'scaler_{timestamp}.pkl')
    vectorizer_timestamped_path = os.path.join(models_dir, f'feature_vectorizer_{timestamp}.pkl')
    
    joblib.dump(best_model, model_timestamped_path)
    joblib.dump(scaler, scaler_timestamped_path)
    joblib.dump(vectorizer, vectorizer_timestamped_path)
    
    # Copy to generic names for easier loading by the backend
    latest_model_path = os.path.join(models_dir, 'risk_model.pkl')
    latest_scaler_path = os.path.join(models_dir, 'scaler.pkl')
    latest_vectorizer_path = os.path.join(models_dir, 'feature_vectorizer.pkl')

    logger.info(f"Copying model from {model_timestamped_path} to {latest_model_path}")
    shutil.copy2(model_timestamped_path, latest_model_path)
    logger.info(f"Copying scaler from {scaler_timestamped_path} to {latest_scaler_path}")
    shutil.copy2(scaler_timestamped_path, latest_scaler_path)
    logger.info(f"Copying vectorizer from {vectorizer_timestamped_path} to {latest_vectorizer_path}")
    shutil.copy2(vectorizer_timestamped_path, latest_vectorizer_path)
    
    logger.info("✅ Model, scaler, and vectorizer saved successfully!")
    return best_model, scaler, vectorizer

if __name__ == "__main__":
    train_model() 