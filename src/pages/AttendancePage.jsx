import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import QrReaderComponent from '@/components/events/QrCodeReader';
import { Camera, CameraOff, XCircle, Info, CheckCircle, ArrowLeft } from 'lucide-react';
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
        <Card >
            <CardHeader>
                <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5" /> Alur Kerja Peserta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                    <strong>1. Pendaftaran Peserta Baru:</strong>
                    Bagi yang belum memiliki QR Code, silakan melakukan pendaftaran terlebih dahulu melalui formulir registrasi. Setelah berhasil mendaftar, sistem akan memberikan QR Code unik sebagai tanda identitas peserta.
                </p>

                <p>
                    <strong>2. Proses Check-in Kehadiran:</strong>
                    Arahkan QR Code Anda ke kamera pemindai di halaman ini. Tunggu hingga sistem berhasil membaca dan mencatat kehadiran Anda secara otomatis.
                </p>

                <p>
                    <strong>3. Peserta yang Belum Pernah Mengikuti:</strong>
                    Jika ini pertama kalinya Anda mengikuti kegiatan, pastikan untuk mendaftar terlebih dahulu agar mendapatkan QR Code sebelum melakukan check-in.
                </p>

                <p>
                    <strong>4. Lupa atau Kehilangan QR Code:</strong>
                    Bagi peserta yang sudah pernah mengikuti namun lupa atau kehilangan QR Code, dapat menghubungi petugas untuk membantu mencarikan dan menampilkan ulang QR Code tersebut.
                </p>
            </CardContent>
        </Card>
    );
}

function AttendancePage() {
    const [settings, setSettings] = useState(null);
    const [activeEvent, setActiveEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [lastScanned, setLastScanned] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const headers = {
            'X-WP-Nonce': sig_plugin_data.nonce,
        };

        Promise.all([
            fetch(sig_plugin_data.api_url + 'event-schedule', { headers }),
            fetch(sig_plugin_data.api_url + 'settings', { headers }),
        ])
            .then(async ([eventRes, settingsRes]) => {
                const eventText = await eventRes.text();
                const settingsText = await settingsRes.text();

                return {
                    event: eventText ? JSON.parse(eventText) : null,
                    settings: settingsText ? JSON.parse(settingsText) : null,
                };
            })
            .then(({ event, settings }) => {
                setActiveEvent(event);
                setSettings(settings);
            })
            .catch((error) => {
                console.error('Gagal memuat data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Terjadi kesalahan',
                    description: 'Gagal memuat data event atau pengaturan.',
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const onScanSuccess = async (memberId, eventId) => {
        try {
            const response = await fetch(sig_plugin_data.api_url + 'check-in', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, event_id: eventId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Check-in gagal.');

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
                <Card className="max-w-lg bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background">
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

    if (!settings.registration_flow_mode !== 'qr_code_once') {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="max-w-lg bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background">
                    <CardHeader>
                        <CardTitle className="flex items-center text-destructive"><XCircle className="mr-2 h-5 w-5" /> Fitur Tidak Tersedia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Fitur hanya untuk tipe registrasi Qr Code. tipe registrasi dapat diubah di Pengaturan.</p>
                        <Button asChild><Link to="/make-event">Kembali ke Manajemen Event</Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-background p-8 flex flex-col items-center">
            <Card className="w-full max-w-2xl bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">{activeEvent.event_name}</CardTitle>
                    <CardDescription>Arahkan QR Code peserta ke kamera untuk mencatat kehadiran.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CountdownTimer startTime={activeEvent.started_at} endTime={activeEvent.end_at} />

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                        <Button
                            onClick={() => setIsCameraOn(!isCameraOn)}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            {isCameraOn ? (
                                <CameraOff className="mr-2 h-4 w-4" />
                            ) : (
                                <Camera className="mr-2 h-4 w-4" />
                            )}
                            {isCameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
                        </Button>

                        <Button asChild variant="ghost" className="w-full sm:w-auto">
                            <Link to="/make-event">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali ke Manajemen Event
                            </Link>
                        </Button>
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