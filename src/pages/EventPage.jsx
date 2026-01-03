import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info, CheckCircle, XCircle, History, ThumbsDown, Camera, UserCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CountdownTimer from '@/components/events/countDownTimer';

function PendingMembersTable({ settings, members, onStatusChange, isUpdatingId }) {
    const getRegionName = (districtId, villageId) => {
        if (!settings?.map_data) return `...`;
        const district = settings.map_data.districts?.[districtId] || `[${districtId || 'N/A'}]`;
        const village = settings.map_data.villages?.[villageId]?.name || `[${villageId || 'N/A'}]`;
        return `${village}, ${district}`;
    };

    return (
        <Card >
            <CardHeader>
                <CardTitle>Daftar Peserta Baru ({members.length})</CardTitle>
                <CardDescription>Setujui peserta baru agar mereka dapat melakukan check-in.</CardDescription>
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
                            {members.length > 0 ? (
                                members.map((member) => {

                                    const renderStatusBadge = () => {
                                        if (member.status === "pending")
                                            return <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full">Pending</span>;

                                        if (member.status === "verified")
                                            return <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">Terverifikasi</span>;

                                        if (member.status === "rejected")
                                            return <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">Ditolak</span>;

                                        return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">Unknown</span>;
                                    };

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                {member.name}
                                                <br />
                                                <span className="text-xs text-muted-foreground">
                                                    {member.phone_number}
                                                </span>
                                            </TableCell>

                                            {member.is_outside_region == 1 ? (
                                                <TableCell className="text-xs">Dari Luar Daerah</TableCell>
                                            ) : (
                                                <TableCell className="text-xs">
                                                    {getRegionName(member.district_id, member.village_id)}
                                                </TableCell>
                                            )}

                                            {/* Kolom Status */}
                                            <TableCell>
                                                {renderStatusBadge()}
                                            </TableCell>

                                            {/* Kolom Aksi */}
                                            <TableCell className="text-right flex justify-end items-center gap-2">

                                                {/* Tombol REJECT: hanya muncul jika status pending */}
                                                {member.status === "pending" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="bg-red-200 h-8 w-8"
                                                        disabled={isUpdatingId === member.id}
                                                        onClick={() => onStatusChange(member.id, 'rejected')}
                                                    >
                                                        <ThumbsDown className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Tombol APPROVE: muncul kalau status pending ATAU rejected */}
                                                {(member.status === "pending" || member.status === "rejected") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="bg-green-200 h-8 w-8"
                                                        disabled={isUpdatingId === member.id}
                                                        onClick={() => onStatusChange(member.id, 'verified')}
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                    </Button>
                                                )}

                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Tidak ada peserta baru.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function PendingAttendanceManual({ settings, members, onStatusChange, isUpdatingId }) {
    const getRegionName = (districtId, villageId) => {
        if (!settings?.map_data) return `...`;
        const district = settings.map_data.districts?.[districtId] || `[${districtId || 'N/A'}]`;
        const village = settings.map_data.villages?.[villageId]?.name || `[${villageId || 'N/A'}]`;
        return `${village}, ${district}`;
    };

    return (
        <Card >
            <CardHeader>
                <CardTitle>Daftar Kehadiran Peserta ({members.length})</CardTitle>
                <CardDescription>Verifikasi kehadiran peserta.</CardDescription>
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
                            {members.length > 0 ? (
                                members.map((member) => {

                                    const renderStatusBadge = () => {
                                        if (member.attendance_status === "pending")
                                            return <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full">Pending</span>;

                                        if (member.attendance_status === "verified")
                                            return <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">Terverifikasi</span>;

                                        if (member.attendance_status === "rejected")
                                            return <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">Ditolak</span>;

                                        return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">Unknown</span>;
                                    };

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                {member.name}
                                                <br />
                                                <span className="text-xs text-muted-foreground">
                                                    {member.phone_number}
                                                </span>
                                            </TableCell>

                                            {member.is_outside_region == 1 ? (
                                                <TableCell className="text-xs">Dari Luar Daerah</TableCell>
                                            ) : (
                                                <TableCell className="text-xs">
                                                    {getRegionName(member.district_id, member.village_id)}
                                                </TableCell>
                                            )}

                                            {/* Kolom Status */}
                                            <TableCell>
                                                {renderStatusBadge()}
                                            </TableCell>

                                            {/* Kolom Aksi */}
                                            <TableCell className="text-right flex justify-end items-center gap-2">

                                                {/* Tombol REJECT: hanya muncul jika status pending */}
                                                {member.attendance_status === "pending" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="bg-red-200 h-8 w-8"
                                                        disabled={isUpdatingId === member.id}
                                                        onClick={() => onStatusChange(member.id, 'rejected')}
                                                    >
                                                        <ThumbsDown className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Tombol APPROVE: muncul kalau status pending ATAU rejected */}
                                                {(member.attendance_status === "pending" || member.attendance_status === "rejected") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="bg-green-200 h-8 w-8"
                                                        disabled={isUpdatingId === member.id}
                                                        onClick={() => onStatusChange(member.id, 'verified')}
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                    </Button>
                                                )}

                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Tidak ada peserta baru.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function PendingAttendancesTable({ settings, attendances, onStatusChange, isUpdatingId }) {
    const getRegionName = (districtId, villageId) => {
        if (!settings?.map_data) return `...`;
        const district = settings.map_data.districts?.[districtId] || `[${districtId || 'N/A'}]`;
        const village = settings.map_data.villages?.[villageId]?.name || `[${villageId || 'N/A'}]`;
        return `${village}, ${district}`;
    };

    return (
        <Card >
            <CardHeader>
                <CardTitle>Daftar kehadiran masuk ({attendances.length})</CardTitle>
                <CardDescription>Setujui kehadiran peserta yang telah melakukan check-in.</CardDescription>
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
                            {attendances.length > 0 ? (
                                attendances.map((member) => {

                                    const renderStatusBadge = () => {
                                        if (member.status === "pending")
                                            return <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full">Pending</span>;

                                        if (member.status === "verified")
                                            return <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">Terverifikasi</span>;

                                        if (member.status === "rejected")
                                            return <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">Ditolak</span>;

                                        return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">Unknown</span>;
                                    };

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                {member.name}
                                                <br />
                                                <span className="text-xs text-muted-foreground">{member.phone_number}</span>
                                            </TableCell>

                                            {member.is_outside_region == 1 ? (
                                                <TableCell className="text-xs">Dari Luar Daerah</TableCell>
                                            ) : (
                                                <TableCell className="text-xs">
                                                    {getRegionName(member.district_id, member.village_id)}
                                                </TableCell>
                                            )}

                                            {/* Kolom STATUS */}
                                            <TableCell>
                                                {renderStatusBadge()}
                                            </TableCell>

                                            {/* Kolom Aksi */}
                                            <TableCell className="text-right flex justify-end items-center gap-2">

                                                {/* Tombol REJECT -> muncul hanya jika pending */}
                                                {member.status === "pending" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="bg-red-200 h-8 w-8"
                                                        disabled={isUpdatingId === member.member_event_id}
                                                        onClick={() => onStatusChange(member.member_event_id, "rejected")}
                                                    >
                                                        <ThumbsDown className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Tombol APPROVE -> muncul jika pending ATAU rejected */}
                                                {(member.status === "pending" || member.status === "rejected") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="bg-green-200 h-8 w-8"
                                                        disabled={isUpdatingId === member.member_event_id}
                                                        onClick={() => onStatusChange(member.member_event_id, "verified")}
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                    </Button>
                                                )}

                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Tidak ada peserta baru.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>

                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function UsageTipsCard() {
    return (
        <Card >
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
                    <strong>3. Lupa Barcode:</strong> Jika member lupa QR Code, Anda bisa mencarinya di halaman "Dashboard", ke kolom aksi dan "lihat detail member".
                </p>
            </CardContent>
        </Card>
    );
}

function SettingsCta() {
    return (
        <Card >
            <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                    <Info className="mr-2 h-5 w-5" /> Konfigurasi Belum Selesai
                </CardTitle>
                <CardDescription>
                    Fitur ini memerlukan Pengaturan Peta untuk bisa berfungsi.
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
        <Card >
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
    const [history, setHistory] = useState([]);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(null); // State untuk loading tombol reject
    const { toast } = useToast();
    const [isReloading, setIsReloading] = useState(false);


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

    const handleReload = async () => {
        setIsReloading(true);
        await fetchData();
        setIsReloading(false);
        toast({ title: "Data Diperbarui", description: "Data pending berhasil dimuat ulang." });
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

    const handleMemberVerify = async (memberId, newStatus) => {
        setIsUpdatingStatus(memberId);
        try {
            const response = await fetch(sig_plugin_data.api_url + 'member/verify', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, status: newStatus }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gagal mengubah status');

            setActiveEvent(result);
            toast({ title: "Status Member Diperbarui" });
        } catch (error) { toast({ variant: "destructive", title: "Gagal", description: error.message }); }
        setIsUpdatingStatus(null);
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

    if (loading) return <p>Memuat data...</p>;

    if (!settings?.map_data?.districts) {
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
                    <Card >
                        <CardHeader>
                            <CardTitle>Atur Jadwal Event Aktif</CardTitle>
                            <CardDescription>Definisikan event yang sedang dibuka untuk pendaftaran via Form.</CardDescription>
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

                    <UsageTipsCard />
                </div>

                {/* Kolom Kanan: Status Event Aktif */}
                <div className="space-y-6">
                    {activeEvent ? (
                        <>
                            <Card >
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <CheckCircle className="mr-2 h-5 w-5" /> Status Pendaftaran Aktif
                                    </CardTitle>
                                    <CardDescription>
                                        Event <strong>{activeEvent.event_name}</strong> sedang menerima data. <br />
                                        <strong>Tipe Pendaftaran : {settings.registration_flow_mode == 'qr_code' ? 'QR Code' : 'Manual / Nomor HP'}</strong>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <CountdownTimer startTime={formData.started_at} endTime={formData.end_at} />

                                    {settings.registration_flow_mode == 'qr_code_once' && (
                                        <Button asChild className="w-full">
                                            <Link to="/absensi"><Camera className="mr-2 h-4 w-4" /> Buka Halaman Absensi</Link>
                                        </Button>
                                    )}

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <div className="flex flex-col sm:flex-row gap-2 w-full">

                                                <Button disabled={isFinishing} className="w-full sm:w-auto">
                                                    <CheckCircle />
                                                    {isFinishing ? 'Memproses...' : 'Selesaikan Event & Setujui Peserta'}
                                                </Button>

                                                <Button
                                                    onClick={handleReload}
                                                    disabled={isReloading}
                                                    className="w-full sm:w-auto"
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    {isReloading ? "Memuat..." : "Reload Data Peserta"}
                                                </Button>

                                            </div>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini akan menutup event, menyetujui semua peserta dan absensi peserta berstatus 'pending'.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleFinishEvent}>Ya, Selesaikan</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                </CardContent>
                            </Card>

                            {settings.registration_flow_mode == 'qr_code_once' && (
                                <>
                                    <PendingMembersTable
                                        settings={settings}
                                        members={activeEvent?.pending_members || []}
                                        onStatusChange={handleMemberVerify}
                                        isUpdatingId={isUpdatingStatus}
                                    />
                                    <PendingAttendancesTable
                                        settings={settings}
                                        attendances={activeEvent.pending_attendance || []}
                                        onStatusChange={handleMemberStatusChange}
                                        isUpdatingId={isUpdatingStatus}
                                    />
                                </>
                            )}

                            {settings.registration_flow_mode == 'manual_or_repeat' && (
                                <PendingAttendanceManual
                                    settings={settings}
                                    members={activeEvent?.pending_attendance_manual || []}
                                    onStatusChange={handleMemberVerify}
                                    isUpdatingId={isUpdatingStatus}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <Card >
                                <CardHeader>
                                    <CardTitle className="flex items-center text-destructive">
                                        <XCircle className="mr-2 h-5 w-5" /> Form Pendaftaran Ditutup
                                    </CardTitle>
                                    <CardDescription>Tidak ada event yang sedang dibuka untuk pendaftaran . Form tidak akan menerima data masuk.</CardDescription>
                                </CardHeader>
                            </Card>

                            <EventHistoryCard history={history} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventPage;