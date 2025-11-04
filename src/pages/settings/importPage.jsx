import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Download, Upload } from 'lucide-react';

function ImportPage() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // 'idle', 'processing', 'success', 'error'
    const [summary, setSummary] = useState(null);
    const { toast } = useToast();

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleImport = async () => {
        if (!file) {
            toast({ variant: "destructive", title: "File belum dipilih", description: "Harap pilih file Excel untuk diunggah." });
            return;
        }

        setStatus('processing');
        setSummary(null); // Reset ringkasan sebelumnya
        const formData = new FormData();
        formData.append('excel_file', file);

        try {
            const response = await fetch(sig_plugin_data.api_url + 'import-excel', {
                method: 'POST',
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Impor gagal. Periksa format file Anda.');

            setStatus('success');
            setSummary(result);
            toast({ title: "Impor Selesai!", description: `${result.successful} dari ${result.total} data berhasil diimpor.` });
        } catch (error) {
            setStatus('error');
            setSummary({ errors: [error.message] });
            toast({ variant: "destructive", title: "Impor Gagal", description: error.message });
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Import Peserta dari Excel</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Kolom Kiri: Instruksi & Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle>Langkah 1: Download Template</CardTitle>
                        <CardDescription>
                            Unduh dan isi template Excel untuk memastikan data Anda sesuai dengan format yang dibutuhkan sistem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" asChild>
                            {/* Pastikan path ke template Anda benar */}
                            <a href={sig_plugin_data.WP_SIG_PLUGIN_URL + 'public/template-impor-member.xlsx'} download>
                                <Download className="mr-2 h-4 w-4" /> Download Template
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Langkah 2: Unggah & Proses File</CardTitle>
                            <CardDescription>
                                Pilih file Excel (.xlsx) yang sudah Anda isi sesuai template.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                            <Button onClick={handleImport} disabled={status === 'processing'}>
                                {status === 'processing' ? 'Memproses...' : <><Upload className="mr-2 h-4 w-4" /> Mulai Impor</>}
                            </Button>
                        </CardContent>
                    </Card>
                    {/* Kolom Kanan: Hasil & Ringkasan */}
                    {summary && (
                        <Card className={status === 'error' ? 'border-destructive' : ''}>
                            <CardHeader>
                                <CardTitle>Ringkasan Impor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {status === 'success' && (
                                    <div className="space-y-2">
                                        <p>Total Baris Data: <span className="font-bold">{summary.total}</span></p>
                                        <p className="text-green-600">Berhasil Diimpor: <span className="font-bold">{summary.successful}</span></p>
                                        <p className="text-red-600">Gagal: <span className="font-bold">{summary.failed}</span></p>
                                    </div>
                                )}
                                {summary.errors?.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-bold text-destructive">Detail Error (5 baris pertama):</h4>
                                        <ul className="list-disc list-inside text-xs text-muted-foreground mt-2">
                                            {summary.errors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    );
}

export default ImportPage;