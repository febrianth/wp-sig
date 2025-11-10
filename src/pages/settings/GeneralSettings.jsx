import React, { useState, useEffect, useCallback } from 'react';
import RegionCodeGuide from '@/components/settings/RegionCodeGuide';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// import { KeyRound, RefreshCw, Eye, EyeOff } from 'lucide-react';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
//     AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

function MapUploader({ title, description, fileType, currentUrl, onFileUpload }) {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const { toast } = useToast();

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setMessage('Mengunggah...');

        const formData = new FormData();
        formData.append('geojson_file', file);
        formData.append('file_type', fileType);

        try {
            const response = await fetch(sig_plugin_data.api_url + 'upload-geojson', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Upload gagal.');

            setMessage('Upload berhasil!');
            toast({
                title: "Sukses!",
                description: `Upload berhasil.`,
            });
            onFileUpload(fileType, result.url);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal unggah peta.",
                description: error.message,
            });
            setMessage(`Error: ${error.message}`);
        }
        setIsUploading(false);
    };

    return (
        <Card className="bg-muted/40">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Input id={`${fileType}-upload`} type="file" accept=".geojson,application/json" onChange={handleFileChange} disabled={isUploading} />
                {currentUrl && (
                    <p className="text-xs text-muted-foreground mt-2">
                        File tersimpan: <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="underline">{currentUrl}</a>
                    </p>
                )}
                {message && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
            </CardContent>
        </Card>
    );
}

// function ApiKeyCard({ apiKey, onRegenerate, isGenerating }) {
//     // 1. Buat state internal untuk mengontrol visibilitas
//     const [isKeyVisible, setIsKeyVisible] = useState(false);

//     // 2. Buat fungsi untuk toggle visibilitas
//     const toggleVisibility = () => {
//         setIsKeyVisible(prev => !prev);
//     };

//     return (
//         <Card>
//             <CardHeader>
//                 <CardTitle className="flex items-center">
//                     <KeyRound className="mr-2 h-5 w-5" /> API Key (Google Form)
//                 </CardTitle>
//                 <CardDescription>Gunakan key ini di Google Apps Script Anda untuk mengirim data.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//                 <div>
//                     <Label htmlFor="api_key">API Key Anda (Rahasia)</Label>
//                     {/* 3. Gunakan div 'relative' untuk menempatkan ikon di dalam input */}
//                     <div className="relative">
//                         <Input
//                             id="api_key"
//                             // 4. Ganti 'type' secara dinamis
//                             type={isKeyVisible ? "text" : "password"}
//                             value={apiKey || 'Membuat key...'}
//                             readOnly
//                             className="font-mono pr-10" // Beri ruang di kanan untuk ikon
//                         />
//                         {/* 5. Buat tombol untuk toggle ikon */}
//                         <Button
//                             type="button" // Pastikan 'type' adalah 'button'
//                             variant="ghost"
//                             size="sm"
//                             className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                             onClick={toggleVisibility}
//                         >
//                             {/* 6. Ganti ikon secara dinamis */}
//                             {isKeyVisible ? (
//                                 <EyeOff className="h-4 w-4" />
//                             ) : (
//                                 <Eye className="h-4 w-4" />
//                             )}
//                         </Button>
//                     </div>
//                 </div>

//                 <AlertDialog>
//                     <AlertDialogTrigger asChild>
//                         {/* Tombol ini sekarang hanya akan MEMBUKA dialog */}
//                         <Button
//                             variant="outline"
//                             disabled={isGenerating}
//                         >
//                             <RefreshCw className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
//                             {isGenerating ? 'Membuat...' : 'Buat Ulang API Key'}
//                         </Button>
//                     </AlertDialogTrigger>
//                     <AlertDialogContent>
//                         <AlertDialogHeader>
//                             <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
//                             <AlertDialogDescription>
//                                 Tindakan ini akan membuat API key baru dan membatalkan key yang lama.
//                                 Anda harus memperbarui key ini di Google Apps Script Anda agar tetap berfungsi.
//                             </AlertDialogDescription>
//                         </AlertDialogHeader>
//                         <AlertDialogFooter>
//                             {/* Tombol Batal */}
//                             <AlertDialogCancel>Batal</AlertDialogCancel>
//                             {/* Tombol Aksi, yang sekarang menjalankan fungsi onRegenerate */}
//                             <AlertDialogAction onClick={onRegenerate}>
//                                 Ya, Buat Ulang
//                             </AlertDialogAction>
//                         </AlertDialogFooter>
//                     </AlertDialogContent>
//                 </AlertDialog>
//             </CardContent>
//         </Card>
//     );
// }

function GeneralSettings() {
    const [settings, setSettings] = useState({
        map_files: {
            districts: '',
            villages: []
        },
        map_keys: {
            district_id: '',
            district_name: '',
            village_id: '',
            village_name: '',
            village_parent_district_id: ''
        },
        badge_thresholds: {
            gold: 3, silver: 2, bronze: 1
        }
    });

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    // const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(sig_plugin_data.api_url + 'settings', {
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce }
            });
            const data = await response.json();
            // Gabungkan dengan state default untuk memastikan semua key ada
            setSettings(prev => ({ ...prev, ...data }));
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal mengambil pengaturan.",
                description: error,
            });
            console.error("Gagal mengambil pengaturan:", error);
        }
        setLoading(false);
    }, []);

    // const handleRegenerateKey = async () => {
    //     setIsGenerating(true);
    //     try {
    //         const response = await fetch(sig_plugin_data.api_url + 'settings/regenerate-api-key', {
    //             method: 'POST',
    //             headers: { 'X-WP-Nonce': sig_plugin_data.nonce },
    //         });
    //         const result = await response.json();
    //         if (!response.ok) throw new Error(result.error || 'Gagal membuat key.');

    //         // Update state settings lokal dengan key baru
    //         setSettings(prev => ({ ...prev, api_key: result.api_key }));
    //         toast({ title: "Sukses!", description: "API Key baru telah dibuat." });
    //     } catch (error) {
    //         toast({ variant: "destructive", title: "Gagal", description: error.message });
    //     }
    //     setIsGenerating(false);
    // };

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleStateChange = (section, id, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [id]: value
            }
        }));
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setMessage('Menyimpan & memproses...');

        try {
            const response = await fetch(sig_plugin_data.api_url + 'process-geojson', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    map_files: settings.map_files,
                    map_keys: settings.map_keys,
                    badge_thresholds: settings.badge_thresholds,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Proses gagal.');

            setMessage('Sukses! Pengaturan peta telah diproses. Memuat ulang...');
            await fetchSettings(); // Ambil data terbaru dari server
            setMessage('Sukses! Pengaturan peta telah diperbarui.');
            toast({
                title: "Sukses!",
                description: `Pengaturan peta telah diperbarui.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal memproses peta.",
                description: error.message,
            });
            setMessage(`Error: ${error.message}`);
        }
        setIsSaving(false);
    };

    if (loading) return <p>Memuat pengaturan...</p>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold">Pengaturan Umum</h1>
                    <p className="text-muted-foreground">Konfigurasi sumber data peta dan pemetaan properti GeoJSON.</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                </Button>
            </div>

            {message && <p className="text-sm text-blue-800 mb-4">{message}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Kolom Kiri: Uploads */}
                <div className="space-y-6">
                    <MapUploader
                        title="File Peta Kecamatan"
                        description="Unggah satu file GeoJSON yang berisi poligon untuk semua kecamatan."
                        fileType="districts"
                        currentUrl={settings.map_files?.districts}
                        onFileUpload={(type, url) => handleStateChange('map_files', type, url)}
                    />
                    <MapUploader
                        title="File Peta Desa"
                        description="Unggah satu file GeoJSON yang berisi poligon untuk semua desa."
                        fileType="villages"
                        currentUrl={settings.map_files?.villages}
                        onFileUpload={(type, url) => handleStateChange('map_files', type, url)}
                    />

                    <RegionCodeGuide mapData={settings?.map_data} />
                </div>

                <div className="space-y-6">
                    {/* <ApiKeyCard
                        apiKey={settings?.api_key}
                        isGenerating={isGenerating}
                        onRegenerate={handleRegenerateKey}
                    /> */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Peringkat (Badge)</CardTitle>
                            <CardDescription>
                                Atur jumlah minimum event yang dihadiri untuk setiap peringkat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-4">
                                <Label htmlFor="badge_gold" className="flex-shrink-0">
                                    <Badge className="bg-amber-400">Gold</Badge>
                                </Label>
                                <Input
                                    id="gold"
                                    type="number"
                                    className="max-w-[100px]"
                                    value={settings.badge_thresholds.gold}
                                    onChange={(e) => handleStateChange('badge_thresholds', 'gold', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-4">
                                <Label htmlFor="badge_silver" className="flex-shrink-0">
                                    <Badge className="bg-gray-300">Silver</Badge>
                                </Label>
                                <Input
                                    id="silver"
                                    type="number"
                                    className="max-w-[100px]"
                                    value={settings.badge_thresholds.silver}
                                    onChange={(e) => handleStateChange('badge_thresholds', 'silver', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-4">
                                <Label htmlFor="badge_bronze" className="flex-shrink-0">
                                    <Badge className="bg-amber-700">Bronze</Badge>
                                </Label>
                                <Input
                                    id="bronze"
                                    type="number"
                                    className="max-w-[100px]"
                                    value={settings.badge_thresholds.bronze}
                                    onChange={(e) => handleStateChange('badge_thresholds', 'bronze', parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pemetaan Properti Kunci</CardTitle>
                            <CardDescription>Isi dengan nama properti dari file GeoJSON yang relevan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-md space-y-4">
                                <h3 className="text-sm font-semibold">Untuk File Peta Kecamatan</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="district_id" className="text-xs">Properti ID Kecamatan</Label>
                                        <Input id="district_id" placeholder="Contoh: id" value={settings.map_keys?.district_id || ''} onChange={(e) => handleStateChange('map_keys', e.target.id, e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="district_name" className="text-xs">Properti Nama Kecamatan</Label>
                                        <Input id="district_name" placeholder="Contoh: name" value={settings.map_keys?.district_name || ''} onChange={(e) => handleStateChange('map_keys', e.target.id, e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border rounded-md space-y-4">
                                <h3 className="text-sm font-semibold">Untuk File Peta Desa</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="village_id" className="text-xs">Properti ID Desa</Label>
                                        <Input id="village_id" placeholder="Contoh: id" value={settings.map_keys?.village_id || ''} onChange={(e) => handleStateChange('map_keys', e.target.id, e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="village_name" className="text-xs">Properti Nama Desa</Label>
                                        <Input id="village_name" placeholder="Contoh: name" value={settings.map_keys?.village_name || ''} onChange={(e) => handleStateChange('map_keys', e.target.id, e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="village_parent_district_id" className="text-xs">Properti ID Kecamatan (Induk)</Label>
                                    <Input id="village_parent_district_id" placeholder="Contoh: district_id" value={settings.map_keys?.village_parent_district_id || ''} onChange={(e) => handleStateChange('map_keys', e.target.id, e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>Pastikan data geojson memuat properti sesuai yang telah didefinisikan, dan ada properti penghubung dari parent ke children (Kecamatan ke Desa).</CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default GeneralSettings;