import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import QrReaderComponent from '@/components/events/QrCodeReader';
import { Camera, CameraOff, XCircle, Info, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CountdownTimer from '@/components/events/countDownTimer';

function AttendanceScanner({ activeEvent, onScanSuccess, isCameraOn }) {
    const { toast } = useToast();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Camera className="mr-2 h-5 w-5" /> Pindai Absensi (Check-in)</CardTitle>
                <CardDescription>Mulai Event, lalu pindai QR Code member untuk mencatat kehadiran.</CardDescription>
            </CardHeader>
            <CardContent>
                {!activeEvent ? (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Event Ditutup</AlertTitle>
                        <AlertDescription>Silakan buka atau buat jadwal event baru untuk memulai absensi.</AlertDescription>
                    </Alert>
                ) : (
                    <div className="w-full max-w-sm mx-auto aspect-square overflow-hidden rounded-md border-2 border-foreground shadow-neo">
                        <QrReaderComponent
                            onScanSuccess={(data) => {
                                if (data?.id) {
                                    onScanSuccess(data.id, activeEvent.id);
                                } else {
                                    toast({ variant: "destructive", title: "QR Code Tidak Valid" });
                                }
                            }}
                            onError={(err) => {
                                console.error(err);
                                toast({
                                    variant: "destructive",
                                    title: "Error Kamera",
                                    description: "Tidak dapat mengakses kamera.",
                                });
                            }}
                            isCameraOn={isCameraOn}
                        />

                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function UsageTipsCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5" /> Tips Penggunaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                    <strong>1. Alur Registrasi:</strong> Buat Halaman WordPress baru dan tambahkan shortcode
                    <code>[sig_registration_form]</code>. Bagikan link halaman tersebut kepada calon member.
                </p>
                <p>
                    <strong>2. Proses Absensi:</strong> Member yang sudah mendaftar (via form) atau ditambah (via impor/manual) bisa menggunakan QR Code mereka untuk check-in ke event yang sedang Anda buka di halaman ini.
                </p>
                <p>
                    <strong>3. Lupa Barcode:</strong> Jika member lupa QR Code, Anda bisa mencarinya di halaman "Dashboard", klik "Edit" pada member tersebut, dan tunjukkan QR Code dari sana. (Fitur "Cetak" akan dikembangkan).
                </p>
            </CardContent>
        </Card>
    );
}

function AttendancePage() {
    const [activeEvent, setActiveEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [lastScanned, setLastScanned] = useState('');
    const { toast } = useToast();

    // Ambil data event aktif
    useEffect(() => {
        fetch(sig_plugin_data.api_url + 'event-schedule', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } })
            .then(res => res.text())
            .then(text => text ? JSON.parse(text) : null)
            .then(data => {
                setActiveEvent(data);
                setLoading(false);
            });
    }, []);

    const handleScan = (result) => {
        if (result && result.rawValue && result.rawValue !== lastScanned) {
            setLastScanned(result.rawValue); // Cegah double scan
            try {
                const data = JSON.parse(result.rawValue);

                if (data.id && activeEvent?.id) {
                    // Panggil fungsi API check-in di sini
                    onScanSuccess(data.id, activeEvent.id);
                } else {
                    toast({
                        variant: "destructive",
                        title: "QR Code Tidak Valid",
                    });
                }
            } catch (e) {
                console.error("QR parsing error:", e);
                toast({
                    variant: "destructive",
                    title: "Error Membaca QR",
                    description: "Pastikan QR Code berisi data yang valid.",
                });
            }

            setTimeout(() => setLastScanned(''), 3000);
        }
    };


    const onScanSuccess = async (memberId, eventId) => {
        try {
            const response = await fetch(sig_plugin_data.api_url + 'check-in', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, event_id: eventId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Check-in gagal.');

            toast({ title: "Check-in Berhasil!", description: result.message });
            setLastScanned(result.message); // Tampilkan pesan selamat datang
        } catch (error) {
            toast({ variant: "destructive", title: "Check-in Gagal", description: error.message });
        }
    };

    if (loading) return <p>Memuat...</p>;

    if (!activeEvent) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-destructive"><XCircle className="mr-2 h-5 w-5" /> Tidak Ada Event Aktif</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Tidak ada event yang sedang dibuka untuk absensi.</p>
                        <Button asChild><Link to="/make-event">Kembali ke Manajemen Event</Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-background p-8 flex flex-col items-center">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">{activeEvent.event_name}</CardTitle>
                    <CardDescription>Arahkan QR Code peserta ke kamera untuk mencatat kehadiran.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CountdownTimer startTime={activeEvent.started_at} endTime={activeEvent.end_at} />

                    <div className="flex justify-between items-center">
                        <Button onClick={() => setIsCameraOn(!isCameraOn)} variant="outline">
                            {isCameraOn ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                            {isCameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
                        </Button>
                        <Button asChild variant="ghost"><Link to="/make-event">Kembali ke Manajemen Event</Link></Button>
                    </div>

                    <AttendanceScanner
                        activeEvent={activeEvent}
                        onScanSuccess={onScanSuccess}
                        isCameraOn={isCameraOn}
                    />

                    {lastScanned && <Alert variant="success"><CheckCircle className="h-4 w-4" /><AlertDescription>{lastScanned}</AlertDescription></Alert>}

                    <UsageTipsCard />

                </CardContent>
            </Card>
        </div>
    );
}

export default AttendancePage;