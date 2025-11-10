import React, { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, CameraOff } from "lucide-react";

export default function QrReaderComponent({ onScanSuccess, onError, isCameraOn }) {
	const [cameraError, setCameraError] = useState(null);
	const cooldown = useRef(false);

	const handleCameraError = (error) => {
		console.error("Camera access error:", error);
		setCameraError(error);
		if (onError) onError(error);
	};

	const handleScan = (results) => {
		if (!results || cooldown.current) return;

		try {
			const rawValue = results[0]?.rawValue;
			if (!rawValue) return;

			let parsed;
			try {
				parsed = JSON.parse(rawValue);
			} catch {
				parsed = { text: rawValue };
			}

			console.log("QR parsed:", parsed);

			if (typeof onScanSuccess === "function") {
				onScanSuccess(parsed);
			}

			// cooldown 2 detik supaya tidak double scan
			cooldown.current = true;
			setTimeout(() => {
				cooldown.current = false;
			}, 2000);
		} catch (err) {
			console.error("Error parsing QR:", err);
			if (onError) onError(err);
		}
	};

	if (cameraError) {
		return (
			<div className="flex flex-col items-center justify-center h-64 bg-muted rounded-md text-center">
				<CameraOff className="h-10 w-10 mb-2 text-muted-foreground" />
				<p>Mohon izinkan akses kamera di browser Anda dan refresh halaman.</p>
			</div>
		);
	}

	if (!isCameraOn) {
		return (
			<div className="flex flex-col items-center justify-center h-64 bg-muted rounded-md text-center">
				<CameraOff className="h-10 w-10 mb-2 text-muted-foreground" />
				<p>Kamera dimatikan.</p>
			</div>
		);
	}

	return (
		<div className="rounded-md overflow-hidden border">
			<Scanner
				onScan={handleScan}
				onError={handleCameraError}
				constraints={{ facingMode: "environment" }}
				videoStyle={{ width: "100%", height: "auto", borderRadius: "0.5rem" }}
			/>
		</div>
	);
}
