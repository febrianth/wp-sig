// src/pages/Manage.jsx
import React, { useState, useEffect } from 'react';
import { columns } from './members/columns'; 
import { DataTable } from '../components/custom/DataTable';
import { Button } from '../components/ui/button';
import { PlusCircle } from 'lucide-react';

function Manage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fungsi untuk mengambil data dari API
    async function fetchData() {
        setLoading(true);
        try {
            const response = await fetch(sig_plugin_data.api_url + 'members', {
                headers: { 'X-WP-Nonce': sig_plugin_data.nonce }
            });
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        }
        setLoading(false);
    }

    // Ambil data saat komponen pertama kali dimuat
    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <p>Memuat data member...</p>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-3xl font-bold">Manajemen Member</h2>
                    <p className="text-muted-foreground">Tambah, edit, atau hapus data member di sini.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Member
                </Button>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    );
}

export default Manage;