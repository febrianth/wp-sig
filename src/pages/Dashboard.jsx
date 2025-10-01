import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import RegionMap from '../components/dashboard/RegionMap'; 
import { ArrowLeft } from 'lucide-react';

function Dashboard() {
    const [settings, setSettings] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    // State untuk melacak tampilan peta saat ini (level apa dan kode wilayah mana)
    const [view, setView] = useState({ level: 'district', code: null });

    useEffect(() => {
        // Fungsi untuk mengambil data settings dan member (tetap sama)
        async function fetchData() {
            setLoading(true);
            try {
                const [settingsRes, membersRes] = await Promise.all([
                    fetch(sig_plugin_data.api_url + 'settings', 
                        { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } }),
                    fetch(sig_plugin_data.api_url + 'members', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } })
                ]);
                const settingsData = await settingsRes.json();
                const membersData = await membersRes.json();
                setSettings(settingsData);
                setMembers(membersData);
            } catch (error) {
                console.error("Gagal mengambil data:", error);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    // Proses agregasi data berdasarkan level tampilan saat ini
    const aggregatedData = useMemo(() => {
        if (!members.length || !settings) return {};
        const key = view.level === 'district' ? settings.map_keys?.district_id : settings.map_keys?.village_id;
        if (!key) return {};

        return members.reduce((acc, member) => {
            const region = member[key];
            if (region) acc[region] = (acc[region] || 0) + 1;
            return acc;
        }, {});
    }, [members, settings, view]);

    // Fungsi yang dipanggil saat user mengklik wilayah di peta
    const handleRegionClick = (clickedCode) => {
        if (view.level === 'district') {
            setView({ level: 'village', code: clickedCode });
        }
    };

    // Fungsi untuk tombol "Kembali"
    const handleGoBack = () => {
        setView({ level: 'district', code: null });
    }

    if (loading) return <p>Memuat data...</p>;
    if (!settings?.map_files?.districts || !settings?.map_files?.villages) {
        // Tampilkan CTA jika salah satu atau kedua file peta belum di-upload
        return (
            <div className="text-center p-10 border-2 border-dashed border-foreground/50 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Selamat Datang di SIG Plugin!</h2>
                <p className="text-muted-foreground mb-4">
                    Untuk memulai, Anda perlu mengunggah dan mengkonfigurasi data peta untuk wilayah Anda.
                </p>
                <Button asChild>
                    <Link to="/settings">Pergi ke Halaman Pengaturan</Link>
                </Button>
            </div>
        );
    }

    // Tentukan file GeoJSON dan properti kunci mana yang akan digunakan
    const isDistrictView = view.level === 'district';
    const geojsonUrl = isDistrictView ? settings.map_files.districts : settings.map_files.villages;
    const idKey = isDistrictView ? settings.map_keys.district_id : settings.map_keys.village_id;
    const nameKey = isDistrictView ? settings.map_keys.district_name : settings.map_keys.village_name;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">Visualisasi Peta Wilayah</h1>
                {!isDistrictView && (
                    <Button onClick={handleGoBack} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Peta Kecamatan
                    </Button>
                )}
            </div>
            <RegionMap 
                geojsonUrl={geojsonUrl} 
                aggregatedData={aggregatedData}
                idKey={idKey}
                nameKey={nameKey}
                onRegionClick={handleRegionClick}
                filterByDistrictCode={!isDistrictView ? view.code : null}
            />
        </div>
    );
}

export default Dashboard;