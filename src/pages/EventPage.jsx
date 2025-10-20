import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useToast } from "../hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Copy, Info, CheckCircle, XCircle, Clock, History, ThumbsDown, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog"; // Impor Alert Dialog

// Komponen Countdown Timer
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

function ApiDocumentation({ settings }) {
    const { toast } = useToast();
    const submitUrl = sig_plugin_data.api_url + 'submit';
    const dataUrl = sig_plugin_data.api_url + 'wilayah-data';
    const apiKey = settings?.api_key || 'API_KEY_ANDA';

    // Skrip Google Apps Script yang lengkap
    const appsScriptCode = `/* * ===================================================================
 * SKRIP GOOGLE APPS SCRIPT UNTUK WP-SIG (COPY-PASTE)
 * ===================================================================
 * 1. Buka Google Form Anda.
 * 2. Klik ikon tiga titik -> Script editor.
 * 3. Hapus semua kode yang ada dan ganti dengan kode di bawah ini.
 * 4. Atur Trigger: Klik ikon Jam -> Add Trigger -> Pilih 'onFormSubmit' -> 
 * Select event source 'From form' -> Select event type 'On form submit'.
 * 5. Simpan dan jalankan otorisasi.
 * ===================================================================
 */

// --- KONFIGURASI ANDA ---
// Ganti dengan URL dan API Key dari tab "Referensi API" di plugin Anda.
var API_URL = "${submitUrl}";
var API_KEY = "${apiKey}";
var DATA_WILAYAH_URL = "${dataUrl}";

// --- NAMA PERTANYAAN DI GOOGLE FORM ANDA ---
// Ganti string di bawah ini agar SAMA PERSIS dengan judul pertanyaan di GForm Anda.
var NAMA_LENGKAP = "Nama Lengkap";
var NO_TELEPON = "Nomor Telepon";
var ALAMAT_LENGKAP = "Alamat Lengkap";
var KECAMATAN = "Kecamatan"; // Ini adalah dropdown kecamatan
var DESA = "Desa/Kelurahan"; // Ini adalah dropdown desa

/**
 * Fungsi ini berjalan saat form dibuka untuk mengisi dropdown wilayah.
 */
function onOpen(e) {
  try {
    var form = FormApp.getActiveForm();
    
    // Ambil data wilayah dari API WordPress Anda
    var response = UrlFetchApp.fetch(DATA_WILAYAH_URL);
    var data = JSON.parse(response.getContentText());
    
    var districts = data.districts || {};
    var villages = data.villages || {};
    
    // Buat daftar pilihan kecamatan
    var districtNames = Object.values(districts);
    
    // Temukan item pertanyaan "Kecamatan" dan "Desa"
    var districtItem = getFormItemByName(form, KECAMATAN);
    var villageItem = getFormItemByName(form, DESA);
    
    if (districtItem && districtItem.getType() == FormApp.ItemType.LIST) {
      districtItem.asListItem().setChoiceValues(districtNames);
    }
    
    // (Jika Anda ingin mengisi pilihan desa secara dinamis, itu jauh lebih kompleks
    //  dan memerlukan add-on. Untuk saat ini, kita akan fokus pada ID.)

  } catch (error) {
    Logger.log("Gagal mengisi data wilayah: " + error.toString());
  }
}

/**
 * Fungsi ini berjalan saat form disubmit.
 */
function onFormSubmit(e) {
  try {
    var formResponse = e.namedValues;
    
    // Ambil data wilayah lagi untuk mencari ID
    var response = UrlFetchApp.fetch(DATA_WILAYAH_URL);
    var data = JSON.parse(response.getContentText());
    
    var districts = data.districts || {};
    var villages = data.villages || {};

    // Dapatkan nama kecamatan & desa yang dipilih dari form
    var selectedDistrictName = formResponse[KECAMATAN] ? formResponse[KECAMATAN][0] : null;
    var selectedVillageName = formResponse[DESA] ? formResponse[DESA][0] : null;

    // "Cari" ID berdasarkan nama yang dipilih
    var districtId = findKeyByValue(districts, selectedDistrictName);
    var villageId = findKeyByValue(villages, selectedVillageName, districtId);

    // Siapkan payload untuk dikirim ke API
    var payload = {
      name: formResponse[NAMA_LENGKAP] ? formResponse[NAMA_LENGKAP][0] : null,
      phone_number: formResponse[NO_TELEPON] ? formResponse[NO_TELEPON][0] : null,
      full_address: formResponse[ALAMAT_LENGKAP] ? formResponse[ALAMAT_LENGKAP][0] : null,
      district_id: districtId,
      village_id: villageId
    };

    var options = {
      'method': 'post',
      'contentType': 'application/json',
      'headers': { 'X-API-KEY': API_KEY },
      'payload': JSON.stringify(payload)
    };
    
    // Kirim data ke API WordPress
    UrlFetchApp.fetch(API_URL, options);

  } catch (error) {
    Logger.log("Gagal mengirim data: " + error.toString());
    // (Opsional) Kirim notifikasi error ke admin
  }
}

// --- FUNGSI PEMBANTU ---
function getFormItemByName(form, title) {
  var items = form.getItems();
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() === title) {
      return items[i];
    }
  }
  return null;
}

function findKeyByValue(obj, value, parentDistrictId) {
  if (!value) return null;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && obj[key].name === value && obj[key].district_id === parentDistrictId) {
        return key; // Untuk desa (cek nama dan parent)
      } else if (obj[key] === value && !parentDistrictId) {
        return key; // Untuk kecamatan (cek nama saja)
      }
    }
  }
  return null;
}
`;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ description: "Tersalin ke clipboard!" });
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dokumentasi Integrasi Google Form</CardTitle>
                <CardDescription>Gunakan info di bawah ini untuk menghubungkan Google Form Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="script">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="script">Setup Cepat (Script)</TabsTrigger>
                        <TabsTrigger value="api">Referensi API</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Skrip Siap Pakai */}
                    <TabsContent value="script" className="mt-4">
                        <p className="text-sm text-muted-foreground mb-4">Salin dan tempel seluruh skrip ini ke dalam Google Apps Script Editor di Google Form Anda.</p>
                        <div className="relative">
                            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-[400px]">
                                {appsScriptCode}
                            </pre>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(appsScriptCode)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Referensi Teknis API */}
                    <TabsContent value="api" className="mt-4 space-y-6">
                        <div className="space-y-2">
                            <Label>API Endpoint Submit (POST)</Label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={submitUrl} className="font-mono" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(submitUrl)}><Copy className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>API Key (Header: X-API-KEY)</Label>
                            <div className="flex items-center gap-2">
                                <Input type="password" readOnly value={apiKey} className="font-mono" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey)}><Copy className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>API Data Wilayah (GET - Publik)</Label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={dataUrl} className="font-mono" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(dataUrl)}><Copy className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Gunakan endpoint ini untuk mengambil "kamus data" ID kecamatan dan desa.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Contoh Payload Body (POST /submit)</Label>
                            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                {`{
  "name": "Nama dari Form",
  "phone_number": "+628123...",
  "full_address": "Alamat dari Form",
  "district_id": "07",
  "village_id": "07.2001"
}`}
                            </pre>
                        </div>
                    </TabsContent>
                </Tabs>
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
            toast({ title: "Status Diperbarui", description: `Member telah ditandai sebagai ${newStatus}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Gagal", description: error.message });
        }
        setIsUpdatingStatus(null); // Hentikan loading
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
                <h1 className="text-3xl font-bold mb-6">Manajemen Event Pendaftaran GForm</h1>
                <SettingsCta />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Manajemen Event Pendaftaran GForm</h1>

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

                    {/* Kolom Kanan: status event */}
                    {!activeEvent ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-destructive">
                                    <XCircle className="mr-2 h-5 w-5" /> API Pendaftaran Ditutup
                                </CardTitle>
                                <CardDescription>Tidak ada event yang sedang dibuka untuk pendaftaran GForm. API tidak akan menerima data masuk.</CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
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
                                            {isFinishing ? 'Memproses...' : 'Selesaikan Event & Setujui Member'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tindakan ini akan menutup event, menyetujui semua member 'pending', dan API GForm akan berhenti menerima data untuk event ini.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleFinishEvent}>Ya, Selesaikan</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <hr />
                                <h4 className="font-bold">Member Pending ({activeEvent.pending_members?.length || 0})</h4>
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
                                                            {member.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                                                            {member.status === 'rejected' && <Badge variant="destructive">Ditolak</Badge>}
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
                    )}
                </div>

                {/* Kolom Kanan: Status Event Aktif */}
                <div className="space-y-6">
                    {/* Kolom Kanan: Dokumentasi */}
                    <ApiDocumentation settings={settings} />
                    <EventHistoryCard history={history} /> {/* Tampilkan Kartu Histori */}
                </div>
            </div>
        </div>
    );
}

export default EventPage;