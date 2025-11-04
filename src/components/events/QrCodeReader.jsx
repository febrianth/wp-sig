import React, { useState } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function QrReaderComponent() {
  const [result, setResult] = useState("");

  return (
    <div className="qr-reader-container" style={{ textAlign: "center", padding: "20px" }}>
      <h2>QR Code Scanner</h2>

      <Scanner
        onDecode={(decodedText) => setResult(decodedText)}
        onError={(error) => console.error(error)}
        style={{ width: "300px", margin: "auto" }}
      />

      <div style={{ marginTop: "20px" }}>
        <strong>Hasil Scan:</strong>
        <p>{result || "Arahkan kamera ke QR code..."}</p>
      </div>
    </div>
  );
}
