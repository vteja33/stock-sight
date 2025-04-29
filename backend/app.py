from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})  # Allow frontend to call backend

# Endpoint for prediction
@app.route('/predict', methods=['GET'])
def predict_stock():
    ticker = request.args.get('symbol', default='AAPL', type=str)
    FUTURE_DAYS = request.args.get('days', default=10, type=int)

    try:
        # 1. Fetch data
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y", interval="1d")
        data = hist[['Close']].dropna()

        if data.empty:
            return jsonify({"error": "No data found for this ticker."}), 400

        # 2. Normalize
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(data)

        # 3. Create dataset
        WINDOW_SIZE = 30
        X = []
        y = []

        for i in range(WINDOW_SIZE, len(scaled_data) - FUTURE_DAYS):
            X.append(scaled_data[i - WINDOW_SIZE:i, 0])
            y.append(scaled_data[i:i + FUTURE_DAYS, 0])

        X, y = np.array(X), np.array(y)

        # 4. Build model
        model = Sequential([
            Dense(128, activation='relu', input_shape=(X.shape[1],)),
            Dense(64, activation='relu'),
            Dense(FUTURE_DAYS)
        ])

        model.compile(optimizer=Adam(learning_rate=0.001), loss='mse')
        model.fit(X, y, epochs=20, batch_size=32, verbose=0)  # Keep epochs small for faster response

        # 5. Predict next 10 days
        last_window = scaled_data[-WINDOW_SIZE:]
        last_window = np.expand_dims(last_window.flatten(), axis=0)

        prediction_scaled = model.predict(last_window)[0]
        prediction = scaler.inverse_transform(prediction_scaled.reshape(-1, 1)).flatten()

        # 6. Prepare response
        historical_dates = data.index.strftime('%Y-%m-%d').tolist()
        historical_prices = data['Close'].tolist()

        future_dates = pd.date_range(start=data.index[-1] + pd.Timedelta(days=1), periods=FUTURE_DAYS)
        future_dates_str = future_dates.strftime('%Y-%m-%d').tolist()

        return jsonify({
            "historical_dates": historical_dates,
            "historical_prices": historical_prices,
            "future_dates": future_dates_str,
            "predicted_prices": prediction.tolist()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True, port=5001)