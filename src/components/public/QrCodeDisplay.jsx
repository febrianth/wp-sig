import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCode } from "react-qrcode-logo";
import { CheckCircle } from 'lucide-react';

function QrCodeDisplay({ data }) {
    const qrValue = JSON.stringify({ id: data.member_id });

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader className="items-center text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <CardTitle className="text-2xl">Registrasi Berhasil!</CardTitle>
                <CardDescription>
                    Pendaftaran Anda sedang ditinjau. Silakan simpan (screenshot) QR Code di bawah ini.
                    Tunjukkan kode ini kepada admin untuk absensi di setiap event.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <div className="p-4 bg-white border-2 border-foreground shadow-neo">
                    <QRCode value={qrValue} size={250} />
                </div>
                <p className="text-center font-bold mt-4">ID Peserta Anda: {data.member_id}</p>
            </CardContent>
        </Card>
    );
}
export default QrCodeDisplay;