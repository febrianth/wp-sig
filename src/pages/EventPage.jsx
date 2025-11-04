import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle, XCircle, Clock, History, ThumbsDown, RotateCcw, Camera, UserSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import QrReaderComponent from '@/components/events/QrCodeReader';

function CountdownTimer({ startTime, endTime }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [status, setStatus] = useState('pending'); // 'pending', 'active', 'expired'

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(startTime).getTime();
            const end = new Date(endTime).getTime();

            if (now < start) {
                setStatus('pending');
                const diff = start - now;
                // Hitung mundur menuju event DIMULAI
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setTimeLeft(`Akan dimulai dalam: ${days}h : ${hours}j`);
            } else if (now > end) {
                setStatus('expired');
                setTimeLeft("Waktu event telah habis.");
                clearInterval(interval);
            } else {
                setStatus('active');
                const diff = end - now;
                // Hitung mundur menuju event BERAKHIR
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${days}h : ${hours}j : ${minutes}m : ${seconds}d`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    const getVariant = () => {
        if (status === 'active') return 'default';
        if (status === 'pending') return 'default'; // Bisa diubah jika ada varian 'pending'
        if (status === 'expired') return 'destructive';
    }

    return (
        <Alert variant={getVariant()}>
            <Clock className="h-4 w-4" />
            <AlertTitle>
                {status === 'active' && 'Sisa Waktu Pendaftaran'}
                {status === 'pending' && 'Pendaftaran Belum Dibuka'}
                {status === 'expired' && 'Pendaftaran Ditutup'}
            </AlertTitle>
            <AlertDescription className="font-mono text-lg">{timeLeft || "Menghitung..."}</AlertDescription>
        </Alert>
    );
}

function PendingMembersTable({ settings, event, onStatusChange, isUpdatingId }) {

    const getRegionName = (districtId, villageId) => {
        if (!settings?.map_data) return `...`;
        const district = settings.map_data.districts?.[districtId] || `[${districtId || 'N/A'}]`;
        const village = settings.map_data.villages?.[villageId]?.name || `[${villageId || 'N/A'}]`;
        return `${village}, ${district}`;
    };

    const pendingMembers = event.pending_members || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Member Menunggu Persetujuan ({pendingMembers.length})</CardTitle>
                <CardDescription>
                    Member yang mendaftar via form publik akan muncul di sini. Setujui atau tolak pendaftaran mereka.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Wilayah</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingMembers.length > 0 ? (
                                pendingMembers.map((member) => (
                                    <TableRow key={member.member_event_id}>
                                        <TableCell>{member.name}</TableCell>
                                        <TableCell className="text-xs">{getRegionName(member.district_id, member.village_id)}</TableCell>
                                        <TableCell>
                                            {member.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                                            {member.status === 'rejected' && <Badge variant="destructive">Ditolak</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {member.status === 'pending' ? (
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"
                                                    disabled={isUpdatingId === member.member_event_id}
                                                    onClick={() => onStatusChange(member.member_event_id, 'rejected')}>
                                                    <ThumbsDown className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                                    disabled={isUpdatingId === member.member_event_id}
                                                    onClick={() => onStatusChange(member.member_event_id, 'pending')}>
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Belum ada member yang mendaftar.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Komponen BARU: Scanner Absensi ---
function AttendanceScanner({ activeEvent, onScanSuccess }) {
    const { toast } = useToast();

    const handleScan = (result) => {
        if (result) {
            try {
                // Library ini otomatis mem-parse, tapi kita pastikan lagi
                const data = (typeof result.data === 'string') ? JSON.parse(result.data) : result.data;

                if (data.id) {
                    onScanSuccess(data.id, activeEvent.id);
                } else {
                    toast({ variant: "destructive", title: "QR Code Tidak Valid" });
                }
            } catch (e) {
                toast({ variant: "destructive", title: "Error Membaca QR" });
            }
        }
    };

    const handleError = (err) => {
        console.error(err);
        toast({ variant: "destructive", title: "Error Kamera", description: "Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin." });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Camera className="mr-2 h-5 w-5" /> Pindai Absensi (Check-in)</CardTitle>
                <CardDescription>Pilih event yang aktif, lalu pindai QR Code member untuk mencatat kehadiran.</CardDescription>
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
                        <QrReaderComponent/>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// --- Komponen BARU: Tips Penggunaan ---
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

function SettingsCta() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                    <Info className="mr-2 h-5 w-5" /> Konfigurasi Belum Selesai
                </CardTitle>
                <CardDescription>
                    Fitur ini memerlukan API Key dan Pengaturan Peta untuk bisa berfungsi.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    Silakan lengkapi pengaturan di halaman Pengaturan Umum terlebih dahulu untuk mengaktifkan fitur ini.
                </p>
                <Button asChild>
                    <Link to="/settings">Pergi ke Halaman Pengaturan</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function EventHistoryCard({ history }) {
    if (!history || history.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5" /> Histori Event Selesai</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Event</TableHead>
                            <TableHead>Total Hadir</TableHead>
                            <TableHead>Tanggal Selesai</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((event, index) => (
                            <TableRow key={index}>
                                <TableCell>{event.event_name}</TableCell>
                                <TableCell>{event.total_attendees}</TableCell>
                                <TableCell>{new Date(event.end_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Komponen Utama Halaman Event
function EventPage() {
    const [settings, setSettings] = useState(null);
    const [activeEvent, setActiveEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [formData, setFormData] = useState({ event_name: '', started_at: '', end_at: '' });
    const [history, setHistory] = useState([]); // State baru untuk histori
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(null); // State untuk loading tombol reject
    const { toast } = useToast();

    // Fungsi untuk mengambil data event aktif dan settings
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsRes, eventRes, historyRes] = await Promise.all([
                fetch(sig_plugin_data.api_url + 'settings', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } }),
                fetch(sig_plugin_data.api_url + 'event-schedule', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } }),
                fetch(sig_plugin_data.api_url + 'events/history', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } })
            ]);

            const settingsData = await settingsRes.json();
            setSettings(settingsData);
            setHistory(await historyRes.json()); // Simpan histori

            let eventData = null;
            if (eventRes.ok) {
                const eventText = await eventRes.text();

                if (eventText) {
                    eventData = JSON.parse(eventText);
                }
            } else {
                throw new Error('Gagal mengambil data event.');
            }

            if (eventData) {
                setActiveEvent(eventData);
                setFormData({
                    event_name: eventData.event_name || '',
                    started_at: eventData.started_at ? eventData.started_at.replace(' ', 'T') : '',
                    end_at: eventData.end_at ? eventData.end_at.replace(' ', 'T') : '',
                });
            } else {
                setActiveEvent(null);
                setFormData({ event_name: '', started_at: '', end_at: '' });
            }
        } catch (error) {
            console.error("Gagal mengambil data:", error);
            toast({ variant: "destructive", title: "Error", description: "Gagal memuat data event." });
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleMemberStatusChange = async (memberEventId, newStatus) => {
        setIsUpdatingStatus(memberEventId); // Tampilkan loading di tombol
        try {
            const response = await fetch(sig_plugin_data.api_url + 'member-event/status', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_event_id: memberEventId, status: newStatus }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Gagal mengubah status ke ${newStatus}`);

            setActiveEvent(result); // Perbarui data event dengan data baru dari server
            toast({ title: "Status Diperbarui", description: `Peserta telah ditandai sebagai ${newStatus}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Gagal", description: error.message });
        }
        setIsUpdatingStatus(null); // Hentikan loading
    };

    const handleScanSuccess = async (memberId, eventId) => {
        try {
            const response = await fetch(sig_plugin_data.api_url + 'check-in', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, event_id: eventId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Check-in gagal.');
            
            toast({ title: "Check-in Berhasil!", description: result.message });
        } catch (error) {
            toast({ variant: "destructive", title: "Check-in Gagal", description: error.message });
        }
    };

    // Fungsi untuk menyimpan atau memperpanjang jadwal
    const handleSaveSchedule = async () => {
        setIsSaving(true);
        try {
            // Siapkan payload. Jika ada event aktif, sertakan ID-nya.
            const payload = {
                ...formData,
                id: activeEvent ? activeEvent.id : null
            };

            const response = await fetch(sig_plugin_data.api_url + 'event-schedule', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload), // Kirim payload yang berisi ID
            });

            const result = await response.json();
            if (!response.ok) {
                // Tangani pesan error dari WP_Error
                const errorMessage = result.message || result.error || 'Gagal menyimpan jadwal.';
                throw new Error(errorMessage);
            }

            // Perbarui state dengan data baru dari server
            setActiveEvent(result);
            setFormData({
                event_name: result.event_name || '',
                started_at: result.started_at ? result.started_at.replace(' ', 'T') : '',
                end_at: result.end_at ? result.end_at.replace(' ', 'T') : '',
            });

            // Tampilkan pesan toast yang jelas berdasarkan respons 'action_status'
            const message = result.action_status === 'updated'
                ? 'Jadwal event berhasil diperbarui.'
                : 'Event baru berhasil dibuat dan diaktifkan.';

            toast({ title: "Sukses!", description: message });

        } catch (error) {
            toast({ variant: "destructive", title: "Gagal", description: error.message });
        }
        setIsSaving(false);
    };

    // Fungsi untuk menyelesaikan event
    const handleFinishEvent = async () => {
        setIsFinishing(true);
        try {
            const response = await fetch(sig_plugin_data.api_url + 'event-schedule/finish', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce },
            });
            if (!response.ok) throw new Error('Gagal menyelesaikan event.');

            await fetchData();
            toast({ title: "Event Selesai", description: "Semua member pending telah disetujui." });
        } catch (error) {
            toast({ variant: "destructive", title: "Gagal", description: error.message });
        }
        setIsFinishing(false);
    };

    const getRegionName = (districtId, villageId) => {
        if (!settings?.map_data) return `...`; // Tampilkan placeholder jika settings belum siap
        const district = settings.map_data.districts?.[districtId] || `[${districtId || 'N/A'}]`;
        const village = settings.map_data.villages?.[villageId]?.name || `[${villageId || 'N/A'}]`;
        return `${village}, ${district}`;
    };

    if (loading) return <p>Memuat data...</p>;

    if (!settings?.api_key || !settings?.map_data?.districts) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Buat dan Jadwalkan Event</h1>
                <SettingsCta />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Buat dan Jadwalkan Event</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Kolom Kiri: Manajemen */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Atur Jadwal Event Aktif</CardTitle>
                            <CardDescription>Definisikan event yang sedang dibuka untuk pendaftaran via Google Form.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="event_name">Nama Event</Label>
                                <Input id="event_name" value={formData.event_name} onChange={handleChange} placeholder="Contoh: Pelatihan GIS Dasar 2025" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="started_at">Waktu Mulai</Label>
                                    <Input id="started_at" type="datetime-local" value={formData.started_at} onChange={handleChange} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="end_at">Waktu Selesai</Label>
                                    <Input id="end_at" type="datetime-local" value={formData.end_at} onChange={handleChange} />
                                </div>
                            </div>
                            <Button onClick={handleSaveSchedule} disabled={isSaving}>
                                {isSaving ? 'Menyimpan...' : (activeEvent ? 'Perbarui Jadwal' : 'Buka Pendaftaran')}
                            </Button>
                        </CardContent>
                    </Card>
                    <AttendanceScanner
                        activeEvent={activeEvent}
                        onScanSuccess={handleScanSuccess}
                    />
                    <UsageTipsCard />
                </div>

                {/* Kolom Kanan: Status Event Aktif */}
                <div className="space-y-6">
                    {!activeEvent ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-destructive">
                                        <XCircle className="mr-2 h-5 w-5" /> API Pendaftaran Ditutup
                                    </CardTitle>
                                    <CardDescription>Tidak ada event yang sedang dibuka untuk pendaftaran . API tidak akan menerima data masuk.</CardDescription>
                                </CardHeader>
                            </Card>
                            {/* Tampilkan Kartu Histori */}
                            <EventHistoryCard history={history} />
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <CheckCircle className="mr-2 h-5 w-5" /> API Pendaftaran Aktif
                                    </CardTitle>
                                    <CardDescription>Event <strong>{activeEvent.event_name}</strong> sedang menerima data.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <CountdownTimer startTime={formData.started_at} endTime={formData.end_at} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button disabled={isFinishing}>
                                                {isFinishing ? 'Memproses...' : 'Selesaikan Event & Setujui Peserta'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini akan menutup event, menyetujui semua member 'pending', dan API  akan berhenti menerima data untuk event ini.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleFinishEvent}>Ya, Selesaikan</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <hr />
                                    <h4 className="font-bold">Peserta Pending ({activeEvent.pending_members?.length || 0})</h4>
                                    <div className="border rounded-md max-h-60 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>No. Telepon</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activeEvent.pending_members?.length > 0 ? (
                                                    activeEvent.pending_members.map((member, index) => (
                                                        <TableRow key={member.member_event_id}>
                                                            <TableCell>{member.name}</TableCell>
                                                            <TableCell className="text-xs">
                                                                {getRegionName(member.district_id, member.village_id)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {member.status === 'pending' && <Badge className="bg-yellow-200">Pending</Badge>}
                                                                {member.status === 'rejected' && <Badge className="bg-red-200">Ditolak</Badge>}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {member.status === 'pending' ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive h-8 w-8"
                                                                        disabled={isUpdatingStatus === member.member_event_id}
                                                                        onClick={() => handleMemberStatusChange(member.member_event_id, 'rejected')}
                                                                    >
                                                                        <ThumbsDown className="h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        disabled={isUpdatingStatus === member.member_event_id}
                                                                        onClick={() => handleMemberStatusChange(member.member_event_id, 'pending')}
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center">Belum ada member yang mendaftar.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                            <PendingMembersTable
                                settings={settings}
                                event={activeEvent}
                                onStatusChange={handleMemberStatusChange}
                                isUpdatingId={isUpdatingStatus}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventPage;