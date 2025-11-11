import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import MemberForm from '@/components/manage/MemberForm';
import { PlusCircle } from 'lucide-react';
import { generateColumns } from "./members/columns";
import { DataTable } from "@/components/custom/DataTable";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import RegionMap from '@/components/dashboard/RegionMap';
import DonutChartCard from '@/components/dashboard/DonutChartCard';


function SetupCta() {
    return (
        <div className="text-center p-10 border-2 border-dashed border-foreground/50 rounded-none bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background">
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

function Dashboard() {
    const [settings, setSettings] = useState(null);
    const [members, setMembers] = useState([]);
    const [events, setEvents] = useState([]); // <-- STATE BARU UNTUK DAFTAR EVENT
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState({ level: 'regency', code: null, parentCode: null });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deletingMember, setDeletingMember] = useState(null);
    const [isMapLoading, setIsMapLoading] = useState(true);

    const thresholds = settings?.badge_thresholds || { gold: 3, silver: 2, bronze: 1 };

    const { toast } = useToast();

    // Fungsi untuk mengambil data (sekarang hanya sekali)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsRes, membersRes, eventsRes] = await Promise.all([
                fetch(sig_plugin_data.api_url + 'settings', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } }),
                fetch(sig_plugin_data.api_url + 'members', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } }),
                fetch(sig_plugin_data.api_url + 'events', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } })
            ]);
            const settingsData = await settingsRes.json();
            const membersData = await membersRes.json();
            const eventsData = await eventsRes.json();
            setSettings(settingsData);
            setMembers(membersData);
            setEvents(eventsData);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    function getBadgeForEventCount(count) {
        let badgedata;

        // Use switch (true) for sequential conditional checking (ranges)
        switch (true) {
            case (count >= thresholds.gold):
                badgedata = { text: 'Gold', classname: 'bg-amber-400' };
                break;

            case (count >= thresholds.silver):
                badgedata = { text: 'Silver', classname: 'bg-gray-300' };
                break;

            case (count >= thresholds.bronze):
                badgedata = { text: 'Bronze', classname: 'bg-amber-700' };
                break;

            default:
                badgedata = { text: 'New', classname: 'bg-white' };
                break;
        }

        return badgedata;
    }

    const filteredMembers = useMemo(() => {
        const rankedMembers = members.map(member => ({
            ...member,
            badge: getBadgeForEventCount(member.event_count || 0)
        }));

        if (!view.code) return rankedMembers; // Tampilan awal, tampilkan semua
        if (view.level === 'district') return rankedMembers.filter(m => m.district_id === view.code);
        if (view.level === 'village') return rankedMembers.filter(m => m.village_id === `${view.parentCode}.${view.code}`);
        return rankedMembers;
    }, [view, members]);

    const luarDaerahCount = useMemo(() => {
        return members.filter(m => m.is_outside_region == 1).length;
    }, [members]);

    const aggregatedData = useMemo(() => {
        // Jangan jalankan agregasi jika settings atau members belum ada
        if (!members.length || !settings?.map_keys) return {};

        let keyToAggregateBy = null;
        if (view.level === 'regency') {
            keyToAggregateBy = 'district_id';
        } else if (view.level === 'district' || view.level === 'village') {
            keyToAggregateBy = 'village_id';
        }

        if (!keyToAggregateBy) return {};

        return members.reduce((acc, member) => {
            const region = member[keyToAggregateBy];
            if (region) acc[region] = (acc[region] || 0) + 1;
            return acc;
        }, {});
    }, [members, settings, view.level]);

    const handleRegionClick = (clickedCode) => {
        if (isMapLoading) return;
        setIsMapLoading(true);

        if (view.level === 'regency') {
            setView({ level: 'district', code: clickedCode, parentCode: null });
        }
        else if (view.level === 'district') {
            setView({ level: 'village', code: clickedCode, parentCode: view.code });
        }
    };

    const handleGoBack = () => {
        if (isMapLoading) return;
        setIsMapLoading(true);

        if (view.level === 'village') {
            setView({ level: 'district', code: view.parentCode, parentCode: null });
        } else if (view.level === 'district') {
            setView({ level: 'regency', code: null, parentCode: null });
        }
    };

    const handleSave = async (formData) => {
        const isEditing = !!formData.id;
        const url = isEditing
            ? `${sig_plugin_data.api_url}members/${formData.id}`
            : `${sig_plugin_data.api_url}members`;
        const method = isEditing ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "X-WP-Nonce": sig_plugin_data.nonce,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error("Gagal menyimpan data.");

            toast({
                title: "Sukses!",
                description: isEditing ? `Data member "${formData.name}" telah berhasil diperbarui.` : `Data member "${formData.name}" telah berhasil disimpan.`,
            });
            setIsDialogOpen(false);
            setEditingMember(null);
            await fetchData(); // Panggil fungsi fetchData yang sudah stabil
        } catch (error) {
            toast({
                variant: "destructive",
                title: isEditing ? "Gagal Memperbarui" : "Gagal Menyimpan",
                description: error,
            });
            console.error("Error saving data:", error);
        }
    };

    const handleDelete = async () => {
        if (!deletingMember) return;
        try {
            const response = await fetch(
                `${sig_plugin_data.api_url}members/${deletingMember.id}`,
                {
                    method: "DELETE",
                    headers: { "X-WP-Nonce": sig_plugin_data.nonce },
                }
            );
            if (!response.ok) throw new Error("Gagal menghapus data.");

            toast({
                title: "Sukses!",
                description: `Data member "${deletingMember.name}" telah berhasil dihapus.`,
            });
            setDeletingMember(null);
            await fetchData(); // Panggil fungsi fetchData yang sudah stabil
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal hapus data",
                description: error,
            });
            console.error("Error deleting data:", error);
        }
    };

    const columns = useMemo(() => generateColumns({
        onEdit: (member) => { setEditingMember(member); setIsDialogOpen(true); },
        onDelete: (member) => setDeletingMember(member),
        settings: settings
    }), [settings]);

    if (loading) return <p>Memuat data...</p>;
    if (!settings?.map_files?.districts || !settings?.map_files?.villages) {
        return <SetupCta />;
    }

    let mapProps = {};
    let pageTitle = "Visualisasi Peta Kabupaten";

    switch (view.level) {
        case 'district':
            pageTitle = `Peta Kecamatan ${settings.map_data?.districts?.[view.code] || ''}`;

            mapProps = {
                geojsonUrl: settings.map_files.villages,
                idKey: settings.map_keys.village_id,
                nameKey: settings.map_keys.village_name,
                filterByCode: view.code,
                filterKey: settings.map_keys.village_parent_district_id,
                onRegionClick: handleRegionClick,
            };
            break;
        case 'village':
            const villageInfo = settings.map_data?.villages?.[`${view.parentCode}.${view.code}`];
            const districtName = settings.map_data?.districts?.[view.parentCode] || '';
            pageTitle = `Peta Desa ${villageInfo?.name || ''}, Kec. ${districtName}`;

            mapProps = {
                geojsonUrl: settings.map_files.villages,
                idKey: settings.map_keys.village_id,
                nameKey: settings.map_keys.village_name,
                filterByCode: view.code,
                filterKey: settings.map_keys.village_id,
                districtId: view.parentCode,
                districtKey: settings.map_keys.village_parent_district_id,
                onRegionClick: null,
            };
            break;
        default: // 'regency'
            pageTitle = "Visualisasi Peta Kabupaten";

            mapProps = {
                geojsonUrl: settings.map_files.districts,
                idKey: settings.map_keys.district_id,
                nameKey: settings.map_keys.district_name,
                onRegionClick: handleRegionClick,
            };
            break;
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Bagian Maps */}
                <div className='lg:col-span-2'>
                    <Card className="h-[700px] flex flex-col bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background">
                        <CardHeader>
                            <CardTitle>{pageTitle}</CardTitle>
                            <CardDescription>
                                <div className="flex justify-between items-center">
                                    <div>
                                        {view.code ? `Total ${filteredMembers.length} member.` : `Total ${members.length} member.`}
                                    </div>
                                    <div>
                                        {view.level !== 'regency' && (
                                            <Button 
                                                onClick={handleGoBack} 
                                                variant="outline"
                                                disabled={isMapLoading}
                                            >
                                                <ArrowLeft className="mr-2 h-4 w-4" />
                                                {view.level === 'district' ? `Kembali ke Peta Kabupaten` : `Kembali ke Peta Kecamatan`}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow relative">
                            {isMapLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-sm z-20">
                                    <div className="relative w-[90%] h-[500px] rounded-xl overflow-hidden shadow-lg">
                                        {/* Efek shimmer (gradasi bergerak) */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                                        <div className="absolute inset-0 border border-gray-300/30 rounded-xl"></div>

                                        {/* Placeholder untuk elemen peta */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between">
                                            <div className="h-6 w-32 bg-gray-300/60 rounded-md"></div>
                                            <div className="h-6 w-16 bg-gray-300/60 rounded-md"></div>
                                        </div>
                                    </div>

                                    <p className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
                                        <svg
                                            className="animate-spin h-4 w-4 text-primary"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8z"
                                            ></path>
                                        </svg>
                                        Memuat peta, mohon tunggu sebentar...
                                    </p>
                                </div>
                            ) : null}

                            <RegionMap
                                {...mapProps}
                                aggregatedData={aggregatedData}
                                onRegionClick={handleRegionClick}
                                onMapLoaded={() => setIsMapLoading(false)}
                                className={`h-[550px] transition-opacity duration-300 ${isMapLoading ? 'opacity-0' : 'opacity-100'}`}
                                luarDaerahCount={luarDaerahCount}
                            />
                        </CardContent>

                    </Card>
                </div>

                {/* Bagian Donut Chart */}
                <div className='lg:col-span-1'>
                    <DonutChartCard
                        filteredMembers={filteredMembers} // Kirim member yang sudah diproses
                        events={events}
                        className="h-[700px] bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background"
                    />
                </div>
            </div>

            {/* Bagian Daftar Member */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">Manajemen Peserta</h2>
                        <p className="text-muted-foreground">
                            {view.code ? `Menampilkan ${filteredMembers.length} member untuk wilayah terpilih.` : `Menampilkan total ${members.length} member.`}
                        </p>
                    </div>
                    <Button onClick={() => { setEditingMember(null); setIsDialogOpen(true); }} disabled={!settings?.map_data}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah Peserta
                    </Button>
                </div>
                {/* Kirim data yang SUDAH DIFILTER ke DataTable */}
                <DataTable columns={columns} data={filteredMembers} />
            </div>

            {/* Dialog untuk Tambah/Edit Member */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingMember ? "Edit Peserta" : "Tambah Peserta Baru"}
                        </DialogTitle>
                    </DialogHeader>
                    {settings && (
                        <MemberForm
                            settings={settings}
                            allEvents={events}
                            initialData={editingMember}
                            onSave={handleSave}
                            onCancel={() => setIsDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* AlertDialog untuk Konfirmasi Hapus */}
            <AlertDialog
                open={!!deletingMember}
                onOpenChange={() => setDeletingMember(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Aksi ini akan menghapus data member bernama "
                            {deletingMember?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default Dashboard;