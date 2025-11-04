import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function FileUploadField({ title, description, fileType, currentFileUrl }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setMessage(''); // Reset pesan saat file baru dipilih
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage('Pilih file terlebih dahulu.');
            return;
        }

        setIsUploading(true);
        setMessage('Mengunggah file...');

        // FormData adalah cara standar untuk mengirim file melalui fetch
        const formData = new FormData();
        formData.append('geojson_file', selectedFile); // 'geojson_file' harus cocok dengan yang dibaca di PHP
        formData.append('file_type', fileType);       // 'file_type' juga

        try {
            const response = await fetch(sig_plugin_data.api_url + 'upload-geojson', {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': sig_plugin_data.nonce,
                    // 'Content-Type' TIDAK perlu di-set, browser akan menanganinya untuk FormData
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Terjadi kesalahan saat mengunggah.');
            }

            setMessage(`Sukses! File tersimpan di: ${result.url}`);
            // Di aplikasi nyata, Anda akan memperbarui state global atau memanggil fungsi callback
            // untuk memperbarui URL yang ditampilkan secara dinamis.
            
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor={`file-${fileType}`}>Pilih File GeoJSON (.geojson)</Label>
                        <Input id={`file-${fileType}`} type="file" accept=".geojson" onChange={handleFileChange} />
                    </div>
                    {currentFileUrl && (
                        <div className="text-sm text-muted-foreground">
                            <p>File saat ini: <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="underline">{currentFileUrl}</a></p>
                        </div>
                    )}
                    <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
                        {isUploading ? 'Mengunggah...' : 'Unggah File'}
                    </Button>
                    {message && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export default FileUploadField;