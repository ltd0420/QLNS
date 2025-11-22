"""
CNN-based Dimensionality Reduction for HR Data
Uses 1D Convolutional Neural Network to reduce feature dimensions
"""
import argparse
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    TORCH_AVAILABLE = True
except (ImportError, OSError) as e:
    TORCH_AVAILABLE = False
    print(f"PyTorch not available ({e}). Using scikit-learn MLP as CNN alternative.")
    
# Fallback: Use scikit-learn MLP as CNN alternative
from sklearn.neural_network import MLPRegressor
import joblib
import os

# Set random seeds for reproducibility
np.random.seed(42)
if TORCH_AVAILABLE:
    torch.manual_seed(42)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(42)

def load_and_prepare_data(input_path):
    """Load cleaned JSON and prepare features"""
    records = []
    with open(input_path, 'r', encoding='utf-8') as f:
        for line in f:
            records.append(json.loads(line))
    
    df = pd.DataFrame(records)
    
    # Flatten nested fields
    numeric_cols = []
    categorical_cols = []
    
    # Extract numeric features
    if 'accuracy' in df.columns:
        numeric_cols.append('accuracy')
    if 'f1_score' in df.columns:
        numeric_cols.append('f1_score')
    
    # Extract from du_lieu_gia_lap
    if 'du_lieu_gia_lap' in df.columns:
        for idx, row in df.iterrows():
            data = row.get('du_lieu_gia_lap', {})
            if isinstance(data, dict):
                # Personal info
                personal = data.get('thong_tin_ca_nhan', {})
                if isinstance(personal, dict):
                    if 'tuoi' in personal:
                        df.at[idx, 'tuoi'] = personal['tuoi']
                    if 'so_nam_lam_viec' in personal:
                        df.at[idx, 'so_nam_lam_viec'] = personal['so_nam_lam_viec']
                
                # Job info
                job = data.get('thong_tin_cong_viec', {})
                if isinstance(job, dict):
                    if 'muc_luong_hien_tai' in job:
                        df.at[idx, 'muc_luong_hien_tai'] = job['muc_luong_hien_tai']
                    if 'tang_luong_nam_truoc' in job:
                        df.at[idx, 'tang_luong_nam_truoc'] = job['tang_luong_nam_truoc']
                    if 'so_gio_moi_tuan' in job:
                        df.at[idx, 'so_gio_moi_tuan'] = job['so_gio_moi_tuan']
                    if 'gio_ot' in job:
                        df.at[idx, 'gio_ot'] = job['gio_ot']
                    if 'so_du_an_tham_gia' in job:
                        df.at[idx, 'so_du_an_tham_gia'] = job['so_du_an_tham_gia']
                
                # Performance
                perf = data.get('thong_tin_hieu_suat', {})
                if isinstance(perf, dict):
                    if 'diem_kpi' in perf:
                        df.at[idx, 'diem_kpi'] = perf['diem_kpi']
                    if 'gio_dao_tao' in perf:
                        df.at[idx, 'gio_dao_tao'] = perf['gio_dao_tao']
                    if 'so_lan_thang_chuc' in perf:
                        df.at[idx, 'so_lan_thang_chuc'] = perf['so_lan_thang_chuc']
                
                # Well-being
                wellbeing = data.get('thai_do_phuc_loi', {})
                if isinstance(wellbeing, dict):
                    if 'muc_do_hai_long' in wellbeing:
                        df.at[idx, 'muc_do_hai_long'] = wellbeing['muc_do_hai_long']
                    if 'can_bang_cong_viec' in wellbeing:
                        df.at[idx, 'can_bang_cong_viec'] = wellbeing['can_bang_cong_viec']
                    if 'so_ngay_nghi_phep' in wellbeing:
                        df.at[idx, 'so_ngay_nghi_phep'] = wellbeing['so_ngay_nghi_phep']
                    if 'so_lan_di_muon' in wellbeing:
                        df.at[idx, 'so_lan_di_muon'] = wellbeing['so_lan_di_muon']
                    if 'diem_gan_ket' in wellbeing:
                        df.at[idx, 'diem_gan_ket'] = wellbeing['diem_gan_ket']
    
    # Select numeric columns
    numeric_features = [
        'accuracy', 'f1_score', 'tuoi', 'so_nam_lam_viec',
        'muc_luong_hien_tai', 'tang_luong_nam_truoc', 'so_gio_moi_tuan',
        'gio_ot', 'so_du_an_tham_gia', 'diem_kpi', 'gio_dao_tao',
        'so_lan_thang_chuc', 'muc_do_hai_long', 'can_bang_cong_viec',
        'so_ngay_nghi_phep', 'so_lan_di_muon', 'diem_gan_ket'
    ]
    
    numeric_features = [col for col in numeric_features if col in df.columns]
    df_numeric = df[numeric_features].fillna(0)
    
    # One-hot encode categorical
    categorical_features = ['loai_mo_hinh', 'ung_dung', 'trang_thai']
    categorical_features = [col for col in categorical_features if col in df.columns]
    
    if categorical_features:
        encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        encoded = encoder.fit_transform(df[categorical_features].fillna('Unknown'))
        encoded_df = pd.DataFrame(encoded, columns=encoder.get_feature_names_out(categorical_features))
        df_combined = pd.concat([df_numeric, encoded_df], axis=1)
    else:
        df_combined = df_numeric
    
    return df_combined, df[['ten_mo_hinh', 'phien_ban']], encoder if categorical_features else None


if TORCH_AVAILABLE:
    class CNNEncoder(nn.Module):
        """1D CNN Encoder for dimensionality reduction using PyTorch"""
        def __init__(self, input_dim, encoding_dim=50):
            super(CNNEncoder, self).__init__()
            self.input_dim = input_dim
            self.encoding_dim = encoding_dim
            
            # 1D Convolutional layers
            self.conv1 = nn.Conv1d(1, 128, kernel_size=3, padding=1)
            self.bn1 = nn.BatchNorm1d(128)
            self.conv2 = nn.Conv1d(128, 64, kernel_size=3, padding=1)
            self.bn2 = nn.BatchNorm1d(64)
            self.pool = nn.MaxPool1d(kernel_size=2)
            self.conv3 = nn.Conv1d(64, 32, kernel_size=3, padding=1)
            self.bn3 = nn.BatchNorm1d(32)
            self.global_pool = nn.AdaptiveAvgPool1d(1)
            self.fc = nn.Linear(32, encoding_dim)
            self.dropout = nn.Dropout(0.2)
            self.relu = nn.ReLU()
        
        def forward(self, x):
            # x shape: (batch, 1, input_dim)
            x = self.relu(self.bn1(self.conv1(x)))
            x = self.relu(self.bn2(self.conv2(x)))
            x = self.pool(x)
            x = self.relu(self.bn3(self.conv3(x)))
            x = self.global_pool(x).squeeze(-1)  # (batch, 32)
            x = self.relu(self.fc(x))
            x = self.dropout(x)
            return x


    class CNNDecoder(nn.Module):
        """Decoder to reconstruct from encoded representation"""
        def __init__(self, encoding_dim, output_dim):
            super(CNNDecoder, self).__init__()
            self.fc1 = nn.Linear(encoding_dim, 64)
            self.fc2 = nn.Linear(64, 32)
            self.fc3 = nn.Linear(32, output_dim)
            self.relu = nn.ReLU()
        
        def forward(self, x):
            x = self.relu(self.fc1(x))
            x = self.relu(self.fc2(x))
            x = self.fc3(x)  # No activation for reconstruction
            return x


    class CNNAutoencoder(nn.Module):
        """Complete CNN Autoencoder"""
        def __init__(self, input_dim, encoding_dim=50):
            super(CNNAutoencoder, self).__init__()
            self.encoder = CNNEncoder(input_dim, encoding_dim)
            self.decoder = CNNDecoder(encoding_dim, input_dim)
        
        def forward(self, x):
            encoded = self.encoder(x)
            decoded = self.decoder(encoded)
            return decoded, encoded


def train_cnn_mlp_fallback(X_train, X_val, encoding_dim=50):
    """Fallback: Train MLP-based autoencoder using scikit-learn (CNN-inspired)"""
    input_dim = X_train.shape[1]
    
    # Encoder: input_dim -> encoding_dim
    encoder = MLPRegressor(
        hidden_layer_sizes=(128, 64, encoding_dim),
        activation='relu',
        solver='adam',
        alpha=0.0001,
        batch_size=256,
        learning_rate='adaptive',
        max_iter=200,
        early_stopping=True,
        validation_fraction=0.1,
        random_state=42,
        verbose=True
    )
    
    # Train encoder (reconstruct to encoding_dim)
    print("Training encoder (MLP)...")
    encoder.fit(X_train.values, X_train.values[:, :encoding_dim] if encoding_dim < input_dim else X_train.values)
    
    # Get encoded representation
    X_train_encoded = encoder.predict(X_train.values)
    X_val_encoded = encoder.predict(X_val.values)
    
    # Decoder: encoding_dim -> input_dim
    decoder = MLPRegressor(
        hidden_layer_sizes=(32, 64, input_dim),
        activation='relu',
        solver='adam',
        alpha=0.0001,
        batch_size=256,
        learning_rate='adaptive',
        max_iter=200,
        early_stopping=True,
        validation_fraction=0.1,
        random_state=42,
        verbose=True
    )
    
    print("Training decoder (MLP)...")
    decoder.fit(X_train_encoded, X_train.values)
    
    # Calculate losses
    train_reconstructed = decoder.predict(X_train_encoded)
    val_reconstructed = decoder.predict(X_val_encoded)
    
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    train_loss = mean_squared_error(X_train.values, train_reconstructed)
    val_loss = mean_squared_error(X_val.values, val_reconstructed)
    train_mae = mean_absolute_error(X_train.values, train_reconstructed)
    val_mae = mean_absolute_error(X_val.values, val_reconstructed)
    
    history = {
        'loss': [train_loss],
        'val_loss': [val_loss],
        'mae': [train_mae],
        'val_mae': [val_mae]
    }
    
    # Create a simple encoder wrapper
    class EncoderWrapper:
        def __init__(self, mlp_encoder):
            self.mlp_encoder = mlp_encoder
        
        def __call__(self, x):
            return self.mlp_encoder.predict(x)
    
    class DecoderWrapper:
        def __init__(self, mlp_decoder):
            self.mlp_decoder = mlp_decoder
    
    return EncoderWrapper(encoder), DecoderWrapper(decoder), None, history


def train_cnn_autoencoder(X_train, X_val, encoding_dim=50, epochs=50, batch_size=256):
    """Train CNN autoencoder for dimensionality reduction using PyTorch"""
    if not TORCH_AVAILABLE:
        raise ImportError("PyTorch is required for CNN training. Install with: pip install torch")
    
    input_dim = X_train.shape[1]
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Build model
    model = CNNAutoencoder(input_dim, encoding_dim).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Convert to tensors
    X_train_tensor = torch.FloatTensor(X_train.values).to(device)
    X_val_tensor = torch.FloatTensor(X_val.values).to(device)
    
    # Reshape for CNN: (batch, 1, input_dim)
    X_train_reshaped = X_train_tensor.unsqueeze(1)
    X_val_reshaped = X_val_tensor.unsqueeze(1)
    
    # Training history
    history = {'loss': [], 'val_loss': [], 'mae': [], 'val_mae': []}
    
    print(f"Training on {device}...")
    model.train()
    for epoch in range(epochs):
        # Training
        train_loss = 0.0
        train_mae = 0.0
        n_batches = 0
        
        for i in range(0, len(X_train_reshaped), batch_size):
            batch_x = X_train_reshaped[i:i+batch_size]
            batch_target = X_train_tensor[i:i+batch_size]
            
            optimizer.zero_grad()
            decoded, encoded = model(batch_x)
            loss = criterion(decoded, batch_target)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            train_mae += torch.mean(torch.abs(decoded - batch_target)).item()
            n_batches += 1
        
        avg_train_loss = train_loss / n_batches if n_batches > 0 else 0
        avg_train_mae = train_mae / n_batches if n_batches > 0 else 0
        
        # Validation
        model.eval()
        with torch.no_grad():
            val_decoded, _ = model(X_val_reshaped)
            val_loss = criterion(val_decoded, X_val_tensor).item()
            val_mae = torch.mean(torch.abs(val_decoded - X_val_tensor)).item()
        
        model.train()
        
        history['loss'].append(avg_train_loss)
        history['val_loss'].append(val_loss)
        history['mae'].append(avg_train_mae)
        history['val_mae'].append(val_mae)
        
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"Epoch {epoch+1}/{epochs} - Loss: {avg_train_loss:.4f}, Val Loss: {val_loss:.4f}, MAE: {avg_train_mae:.4f}, Val MAE: {val_mae:.4f}")
    
    return model.encoder, model.decoder, model, history


def reduce_with_cnn(df_features, encoder_model, encoding_dim=50):
    """Apply trained CNN encoder to reduce dimensions"""
    # Check if it's PyTorch model or scikit-learn model
    if hasattr(encoder_model, 'predict'):
        # scikit-learn MLP encoder
        encoded_np = encoder_model.predict(df_features.values)
    elif hasattr(encoder_model, 'eval'):
        # PyTorch model
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        encoder_model.eval()
        encoder_model.to(device)
        
        input_dim = df_features.shape[1]
        X_tensor = torch.FloatTensor(df_features.values).to(device)
        X_reshaped = X_tensor.unsqueeze(1)  # (batch, 1, input_dim)
        
        with torch.no_grad():
            encoded = encoder_model(X_reshaped)
            encoded_np = encoded.cpu().numpy()
    else:
        # Direct callable
        encoded_np = encoder_model(df_features.values)
    
    # Ensure correct shape
    if encoded_np.shape[1] != encoding_dim:
        # If encoder output doesn't match, take first encoding_dim columns or pad
        if encoded_np.shape[1] > encoding_dim:
            encoded_np = encoded_np[:, :encoding_dim]
        else:
            # Pad with zeros if needed
            padding = np.zeros((encoded_np.shape[0], encoding_dim - encoded_np.shape[1]))
            encoded_np = np.hstack([encoded_np, padding])
    
    # Create DataFrame with CNN components
    component_cols = [f'cnn_component_{i+1}' for i in range(encoding_dim)]
    df_reduced = pd.DataFrame(encoded_np, columns=component_cols)
    
    return df_reduced


def main():
    # Note: We can use scikit-learn MLP as fallback if PyTorch is not available
    
    parser = argparse.ArgumentParser(description="Perform CNN-based dimensionality reduction using PyTorch")
    parser.add_argument("--input", required=True, help="Path to cleaned JSON dataset")
    parser.add_argument("--output", required=True, help="Path to save reduced CSV")
    parser.add_argument("--components", type=int, default=50, help="Number of CNN components")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=256, help="Batch size")
    args = parser.parse_args()
    
    print("Loading and preparing data...")
    df_features, df_meta, encoder = load_and_prepare_data(args.input)
    
    print(f"Feature shape: {df_features.shape}")
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df_features)
    X_scaled_df = pd.DataFrame(X_scaled, columns=df_features.columns)
    
    # Split for training
    X_train, X_val = train_test_split(X_scaled_df, test_size=0.2, random_state=42)
    
    if TORCH_AVAILABLE:
        print(f"Training CNN autoencoder with PyTorch (encoding_dim={args.components})...")
        cnn_encoder, cnn_decoder, autoencoder, history = train_cnn_autoencoder(
            X_train, X_val,
            encoding_dim=args.components,
            epochs=args.epochs,
            batch_size=args.batch_size
        )
    else:
        print(f"Training CNN-inspired autoencoder with scikit-learn MLP (encoding_dim={args.components})...")
        cnn_encoder, cnn_decoder, autoencoder, history = train_cnn_mlp_fallback(
            X_train, X_val,
            encoding_dim=args.components
        )
    
    print("Applying CNN encoder to full dataset...")
    df_reduced = reduce_with_cnn(X_scaled_df, cnn_encoder, args.components)
    
    # Combine with metadata
    result_df = pd.concat([df_reduced, df_meta.reset_index(drop=True)], axis=1)
    
    # Save
    result_df.to_csv(args.output, index=False)
    print(f"Saved CNN-reduced data to {args.output}")
    
    # Save model and scaler
    model_dir = os.path.dirname(args.output)
    scaler_path = os.path.join(model_dir, 'cnn_scaler.joblib')
    
    if TORCH_AVAILABLE and hasattr(cnn_encoder, 'state_dict'):
        # PyTorch model
        model_path = os.path.join(model_dir, 'cnn_encoder.pth')
        torch.save({
            'encoder_state_dict': cnn_encoder.state_dict(),
            'input_dim': X_scaled_df.shape[1],
            'encoding_dim': args.components,
        }, model_path)
        print(f"Saved PyTorch CNN encoder to {model_path}")
    else:
        # scikit-learn MLP model
        model_path = os.path.join(model_dir, 'cnn_encoder_mlp.joblib')
        joblib.dump(cnn_encoder.mlp_encoder if hasattr(cnn_encoder, 'mlp_encoder') else cnn_encoder, model_path)
        print(f"Saved scikit-learn MLP encoder to {model_path}")
    
    joblib.dump(scaler, scaler_path)
    print(f"Saved scaler to {scaler_path}")
    
    # Save metadata
    framework_used = "PyTorch" if TORCH_AVAILABLE and hasattr(cnn_encoder, 'state_dict') else "scikit-learn MLP"
    meta = {
        "method": f"CNN ({framework_used})",
        "n_components": args.components,
        "input_features": df_features.shape[1],
        "training_loss": float(history['loss'][-1]) if history['loss'] else 0.0,
        "validation_loss": float(history['val_loss'][-1]) if history['val_loss'] else 0.0,
        "training_mae": float(history['mae'][-1]) if history['mae'] else 0.0,
        "validation_mae": float(history['val_mae'][-1]) if history['val_mae'] else 0.0,
        "framework": framework_used,
    }
    
    meta_path = args.output + '.meta.json'
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"Saved metadata to {meta_path}")


if __name__ == "__main__":
    main()

