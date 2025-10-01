import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/custom/DataTable';
import { columns } from './members/columns';
import { Button } from '../components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";

function Manage() {
    const [data, setData] = useState([]);
    const [settings, setSettings] = useState(null); // State untuk pengaturan
    const [loading, setLoading] = useState(true);

    // Fungsi gabungan untuk mengambil data member dan pengaturan
    async function fetchData() {
        setLoading(true);
        try {
            // Ambil kedua data secara bersamaan
            const [membersRes, settingsRes] = await Promise.all([
                fetch(sig_plugin_data.api_url + 'members', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } }),
                fetch(sig_plugin_data.api_url + 'settings', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } })
            ]);
            const membersData = await membersRes.json();
            const settingsData = await settingsRes.json();
            setData(membersData);
            setSettings(settingsData);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    // Cek apakah data wilayah (kecamatan/desa) sudah siap
    const isWilayahDataReady = settings?.map_data?.districts && settings?.map_data?.villages;

    if (loading) {
        return <p>Memuat data...</p>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-3xl font-bold">Manajemen Member</h2>
                    <p className="text-muted-foreground">Tambah, edit, atau hapus data member di sini.</p>
                </div>

                {/* Tombol Cerdas dengan Tooltip */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {/* Beri `span` sebagai pembungkus agar tooltip tetap bekerja saat tombol disabled */}
                            <span tabIndex="0">
                                <Button disabled={!isWilayahDataReady}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Member
                                </Button>
                            </span>
                        </TooltipTrigger>
                        {!isWilayahDataReady && (
                            <TooltipContent>
                                <p>Harap konfigurasikan peta di halaman Pengaturan terlebih dahulu.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

            </div>
            <DataTable columns={columns} data={data} />
        </div>
    );
}

export default Manage;