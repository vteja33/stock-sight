from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout


app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": [
        "http://localhost:5173",
        "https://stock-sight-gamma.vercel.app",
        "https://stock-sight-vteja.vercel.app",
        "https://stock-sight-git-main-vteja.vercel.app",
    ]
}})

@app.route('/predict', methods=['GET'])
def predict_stock():
    ticker = request.args.get('symbol', default='AAPL', type=str)
    FUTURE_DAYS = request.args.get('days', default=10, type=int)

    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="2y", interval="1d")
        data = hist[['Close']].dropna()

        if data.empty:
            return jsonify({"error": "No data found for this ticker."}), 400

        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(data)

        WINDOW_SIZE = 30
        X, y = [], []
        for i in range(WINDOW_SIZE, len(scaled_data) - FUTURE_DAYS):
            X.append(scaled_data[i - WINDOW_SIZE:i])  # shape: (30, 1)
            y.append(scaled_data[i:i + FUTURE_DAYS].flatten())  # shape: (FUTURE_DAYS,)
        X, y = np.array(X), np.array(y)

        # Reshape for LSTM: (samples, timesteps, features)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = Sequential([
            LSTM(64, return_sequences=True, input_shape=(WINDOW_SIZE, 1)),
            Dropout(0.2),
            LSTM(32),
            Dense(64, activation='relu'),
            Dense(FUTURE_DAYS)
        ])
        model.compile(optimizer='adam', loss='mse')
        model.fit(X_train, y_train, epochs=50, batch_size=32, verbose=0)

        y_pred = model.predict(X_test)
        r2 = r2_score(y_test.flatten(), y_pred.flatten())

        # Predict future
        last_window = scaled_data[-WINDOW_SIZE:]
        last_window = last_window.reshape((1, WINDOW_SIZE, 1))
        prediction_scaled = model.predict(last_window)[0]
        prediction = scaler.inverse_transform(prediction_scaled.reshape(-1, 1)).flatten()

        historical_dates = data.index.strftime('%Y-%m-%d').tolist()
        historical_prices = data['Close'].tolist()
        future_dates = pd.date_range(start=data.index[-1] + pd.Timedelta(days=1), periods=FUTURE_DAYS)
        future_dates_str = future_dates.strftime('%Y-%m-%d').tolist()

        return jsonify({
            "historical_dates": historical_dates,
            "historical_prices": historical_prices,
            "future_dates": future_dates_str,
            "predicted_prices": prediction.tolist(),
            "model_accuracy": round(r2, 3)
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
