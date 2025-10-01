import React, { useState, useEffect } from 'react';
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

function GeneralSettings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    // State untuk menampung input dari form
    const [fileUrls, setFileUrls] = useState({ districts: '', villages: '' });
    const [keyMappings, setKeyMappings] = useState({
        district_id: '', district_name: '',
        village_id: '', village_name: ''
    });

    async function fetchSettings() {
        try {
            const response = await fetch(sig_plugin_data.api_url + 'settings', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } });
            const data = await response.json();
            setSettings(data);
            if (data.map_files) setFileUrls(data.map_files);
            if (data.map_keys) setKeyMappings(data.map_keys);
        } catch (error) { console.error("Gagal mengambil pengaturan:", error); }
        setLoading(false);
    }

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleFileUpload = async (event, fileType) => {
        const file = event.target.files[0];
        if (!file) return;
        setMessage(`Mengunggah file ${fileType}...`);
        
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
            
            setFileUrls(prev => ({ ...prev, [fileType]: result.url }));
            setMessage(`Upload ${fileType} berhasil!`);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setMessage('Memproses peta, ini mungkin butuh beberapa saat...');

        try {
            const response = await fetch(sig_plugin_data.api_url + 'process-geojson', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce, 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_urls: fileUrls, key_mappings: keyMappings }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Proses gagal.');
            setMessage('Sukses! Peta telah diproses. Memuat ulang pengaturan...');

            await fetchSettings();
            setMessage('Sukses! Pengaturan peta telah diperbarui.');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
        setIsSaving(false);
    };

    const handleKeyMappingChange = (e) => {
        const { id, value } = e.target;
        setKeyMappings(prev => ({ ...prev, [id]: value }));
    };

    if (loading) return <p>Memuat pengaturan...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Pengaturan Peta & Data</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Konfigurasi Peta</CardTitle>
                    <CardDescription>Unggah file GeoJSON untuk setiap tingkatan peta dan petakan propertinya.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* District File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="districts-upload" className="font-bold">Peta Kecamatan</Label>
                        <p className="text-sm text-muted-foreground">Satu file GeoJSON yang hanya berisi poligon semua kecamatan.</p>
                        <Input id="districts-upload" type="file" accept=".geojson" onChange={(e) => handleFileUpload(e, 'districts')} />
                        {fileUrls.districts && <p className="text-xs text-muted-foreground mt-1">File tersimpan: {fileUrls.districts}</p>}
                    </div>

                    {/* Village File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="villages-upload" className="font-bold">Peta Desa</Label>
                        <p className="text-sm text-muted-foreground">Satu file GeoJSON yang berisi poligon semua desa.</p>
                        <Input id="villages-upload" type="file" accept=".geojson" onChange={(e) => handleFileUpload(e, 'villages')} />
                        {fileUrls.villages && <p className="text-xs text-muted-foreground mt-1">File tersimpan: {fileUrls.villages}</p>}
                    </div>

                    {/* Key Mapping Section */}
                    <div>
                        <Label className="font-bold">Pemetaan Properti Kunci</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2 p-4 border rounded-md">
                            <div className="space-y-1">
                                <Label htmlFor="district_id" className="text-xs">Properti ID Kecamatan</Label>
                                <Input id="district_id" placeholder="Contoh: district_code" value={keyMappings.district_id} onChange={handleKeyMappingChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="district_name" className="text-xs">Properti Nama Kecamatan</Label>
                                <Input id="district_name" placeholder="Contoh: district" value={keyMappings.district_name} onChange={handleKeyMappingChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="village_id" className="text-xs">Properti ID Desa</Label>
                                <Input id="village_id" placeholder="Contoh: village_code" value={keyMappings.village_id} onChange={handleKeyMappingChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="village_name" className="text-xs">Properti Nama Desa</Label>
                                <Input id="village_name" placeholder="Contoh: village" value={keyMappings.village_name} onChange={handleKeyMappingChange} />
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div>
                        <Button onClick={handleSaveSettings} disabled={isSaving}>
                            {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                        </Button>
                        {message && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default GeneralSettings;