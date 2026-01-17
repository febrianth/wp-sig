import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select Shadcn
import { ArrowLeft, PlusCircle, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import MemberForm from '@/components/manage/MemberForm';
import { generateColumns } from "./members/columns";
import { DataTable } from "@/components/custom/DataTable";
import { useToast } from "@/hooks/use-toast";
import RegionMap from '@/components/dashboard/RegionMap';
import AnalyzeCard from '@/components/dashboard/AnalyzeCard';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Pastikan global variable aman
const WP_DATA = (typeof sig_plugin_data !== 'undefined')
    ? sig_plugin_data
    : { api_url: '', nonce: '' };

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
    // --- Global State ---
    const [settings, setSettings] = useState(null);
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true); // Loading awal dashboard

    // --- Table State ---
    const [members, setMembers] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total_items: 0 });
    const [tableLoading, setTableLoading] = useState(false);

    // --- Filter State ---
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500); // Tunggu 500ms
    const [selectedEvent, setSelectedEvent] = useState("all"); // "all" string handling

    // --- Map State ---
    const [view, setView] = useState({ level: 'regency', code: null, parentCode: null });
    const [isMapLoading, setIsMapLoading] = useState(true);

    // --- Dialogs ---
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deletingMember, setDeletingMember] = useState(null);

    const { toast } = useToast();

    // 1. Fetch Initial Data
    useEffect(() => {
        const initData = async () => {
            try {
                const headers = { 'X-WP-Nonce': WP_DATA.nonce };
                const [sets, evs, sums] = await Promise.all([ 
                    fetch(WP_DATA.api_url + 'settings', { headers }).then(r => r.json()),
                    fetch(WP_DATA.api_url + 'events', { headers }).then(r => r.json()),
                    fetch(WP_DATA.api_url + 'members/summary', { headers }).then(r => r.json()),
                ]);

                setSettings(sets);
                setEvents(Object.values(evs));
                setSummary(sums);
            } catch (err) {
                console.error("Init Error", err);
                toast({ variant: "destructive", title: "Gagal memuat data awal" });
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    const fetchMembers = useCallback(async () => {
        setTableLoading(true);
        try {
            const url = new URL(WP_DATA.api_url + 'members');
            url.searchParams.set('page', page);
            url.searchParams.set('per_page', 10);

            if (debouncedSearch) url.searchParams.set('search', debouncedSearch);
            if (selectedEvent && selectedEvent !== "all") url.searchParams.set('event_id', selectedEvent);

            // Integrasi Filter Wilayah dari Map
            if (view.level === 'district' && view.code) {
                url.searchParams.set('district_id', view.code);
            } else if (view.level === 'village' && view.code) {
                // Asumsi format code di map: 'districtId.villageId' atau sejenisnya
                // Sesuaikan logika ini dengan format geojson Anda
                const villageId = view.code.includes('.') ? view.code : `${view.parentCode}.${view.code}`;
                url.searchParams.set('village_id', villageId);
            }

            const res = await fetch(url, { headers: { 'X-WP-Nonce': WP_DATA.nonce } });
            const json = await res.json();

            setMembers(json.data || []);
            setMeta(json.meta || { current_page: 1, last_page: 1, total_items: 0 });
        } catch (error) {
            console.error("Member Fetch Error", error);
        } finally {
            setTableLoading(false);
        }
    }, [page, debouncedSearch, selectedEvent, view]);

    // 2. Fetch Summary saat Event berubah
    const fetchSummary = useCallback(async () => {
        if (!summary) return; // Jangan fetch jika data awal belum siap

        try {
            const url = new URL(WP_DATA.api_url + 'members/summary');
            if (selectedEvent) {
                url.searchParams.set('event_id', selectedEvent);
            }

            const res = await fetch(url, {
                headers: { 'X-WP-Nonce': WP_DATA.nonce }
            });

            if (!res.ok) throw new Error("Gagal update summary");

            const data = await res.json();
            setSummary(data);
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    }, [selectedEvent]);

    // Initial Load
    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Effect: Reset page ke 1 jika Search/Event/Region berubah (kecuali page itu sendiri)
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedEvent, view]);


    // Trigger Summary Update ketika filter event berubah
    useEffect(() => {
        if (!loading) {
            fetchSummary();
        }
    }, [fetchSummary, loading]); // Added logic fix

    // Reset Map Loading ketika view berubah
    useEffect(() => {
        setIsMapLoading(true);
    }, [view]);

    // Computed: Aggregated Data untuk Map
    const aggregatedData = useMemo(() => {
        if (!summary) return {};

        if (view.level === 'regency') {
            return summary.by_district.reduce((acc, d) => {
                acc[d.district_id] = d.total;
                return acc;
            }, {});
        }

        return summary.by_village.reduce((acc, v) => {
            acc[v.village_id] = v.total;
            return acc;
        }, {});
    }, [summary, view.level]);

    const handleRegionClick = useCallback((clickedCode) => {
        setView(prev => {
            if (prev.level === 'regency') {
                return { level: 'district', code: clickedCode, parentCode: null };
            }
            if (prev.level === 'district') {
                return { level: 'village', code: clickedCode, parentCode: prev.code };
            }
            return prev;
        });
    }, []);

    const handleGoBack = useCallback(() => {
        if (isMapLoading) return;
        setIsMapLoading(true);

        if (view.level === 'village') {
            setView({ level: 'district', code: view.parentCode, parentCode: null });
        } else if (view.level === 'district') {
            setView({ level: 'regency', code: null, parentCode: null });
        }
    }, [view, isMapLoading]);

    const handleSave = async (formData) => {
        const isEditing = !!formData.id;
        const url = isEditing
            ? `${WP_DATA.api_url}members/${formData.id}`
            : `${WP_DATA.api_url}members`;
        const method = isEditing ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "X-WP-Nonce": WP_DATA.nonce,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.message || "Terjadi kesalahan saat menyimpan data.");
            }

            toast({
                title: "Sukses!",
                description: isEditing
                    ? `Data member "${formData.name}" berhasil diperbarui.`
                    : `Data member "${formData.name}" berhasil disimpan.`,
            });

            setIsDialogOpen(false);
            setEditingMember(null);
            await fetchMembers(); // Refresh data

        } catch (error) {
            toast({
                variant: "destructive",
                title: isEditing ? "Gagal Memperbarui" : "Gagal Menyimpan",
                description: error.message,
            });
        }
    };

    const handleDelete = async () => {
        if (!deletingMember) return;
        try {
            const response = await fetch(
                `${WP_DATA.api_url}members/${deletingMember.id}`,
                {
                    method: "DELETE",
                    headers: { "X-WP-Nonce": WP_DATA.nonce },
                }
            );
            if (!response.ok) throw new Error("Gagal menghapus data.");

            toast({
                title: "Sukses!",
                description: `Data member "${deletingMember.name}" telah berhasil dihapus.`,
            });
            setDeletingMember(null);
            await fetchMembers();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal hapus data",
                description: error.message,
            });
        }
    };

    const columns = useMemo(() => generateColumns({
        onEdit: (member) => { setEditingMember(member); setIsDialogOpen(true); },
        onDelete: (member) => setDeletingMember(member),
        settings: settings
    }), [settings]);

    // Logic untuk Properti Map & Judul Halaman
    const { pageTitle, mapProps, displayedTotal } = useMemo(() => {
        if (!settings?.map_files) return { pageTitle: '', mapProps: {}, displayedTotal: 0 };

        let title = '';
        let props = {};
        let total = 0;

        // Hitung Total Display
        if (summary) {
            if (view.level === 'village') {
                const village = summary.by_village.find(v => v.village_id === `${view.parentCode}.${view.code}`);
                total = village ? Number(village.total) : 0;
            } else if (view.level === 'district') {
                const district = summary.by_district.find(d => d.district_id === view.code);
                total = district ? Number(district.total) : 0;
            } else {
                total = Number(summary.meta.total_members || 0);
            }
        }

        // Tentukan Props Map berdasarkan Level
        switch (view.level) {
            case 'district':
                title = `Peta Kecamatan ${settings.map_data?.districts?.[view.code] || ''}`;
                props = {
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
                title = `Peta Desa ${villageInfo?.name || ''}, Kec. ${districtName}`;
                props = {
                    geojsonUrl: settings.map_files.villages,
                    idKey: settings.map_keys.village_id,
                    nameKey: settings.map_keys.village_name,
                    filterByCode: view.code,
                    filterKey: settings.map_keys.village_id,
                    districtId: view.parentCode,
                    districtKey: settings.map_keys.village_parent_district_id,
                    onRegionClick: null, // Akhir level, tidak bisa klik lagi
                };
                break;

            default: // regency
                title = 'Visualisasi Peta Daerah';
                props = {
                    geojsonUrl: settings.map_files.districts,
                    idKey: settings.map_keys.district_id,
                    nameKey: settings.map_keys.district_name,
                    onRegionClick: handleRegionClick,
                };
                break;
        }

        return { pageTitle: title, mapProps: props, displayedTotal: total };
    }, [settings, view, summary, handleRegionClick]);

    // --- RENDER START ---

    if (loading) return <div className="p-10 text-center">Memuat data...</div>;

    if (!settings?.map_files?.districts || !settings?.map_files?.villages) {
        return <SetupCta />;
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
                                    <div className="text-sm text-muted-foreground">
                                        Total {displayedTotal} Peserta
                                    </div>
                                    <div>
                                        {view.level !== 'regency' && (
                                            <Button
                                                onClick={handleGoBack}
                                                variant="outline"
                                                disabled={isMapLoading}
                                                size="sm"
                                            >
                                                <ArrowLeft className="mr-2 h-4 w-4" />
                                                {view.level === 'district' ? `Kembali ke Peta Daerah` : `Kembali ke Peta Kecamatan`}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow relative overflow-hidden rounded-b-xl">
                            {isMapLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20 transition-all">
                                    <div className="relative w-[90%] h-[500px] rounded-xl overflow-hidden shadow-sm border">
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                                    </div>
                                    <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2 animate-pulse">
                                        Memuat peta...
                                    </p>
                                </div>
                            )}

                            <RegionMap
                                {...mapProps}
                                aggregatedData={aggregatedData}
                                luarDaerahCount={summary?.meta?.outside_region || 0}
                                onMapLoaded={() => setIsMapLoading(false)}
                                className={`h-[550px] transition-opacity duration-500 ${isMapLoading ? 'opacity-0' : 'opacity-100'}`}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Bagian Donut Chart & Analytics */}
                <div className='lg:col-span-1'>
                    <AnalyzeCard
                        view={view}
                        summaryData={summary} // Pass summary jika diperlukan oleh komponen anak
                    />
                </div>
            </div>

            {/* Bagian Daftar Member */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Data Peserta</h2>
                        <p className="text-sm text-muted-foreground">
                            {view.code ? "Filter aktif berdasarkan wilayah peta." : "Menampilkan data seluruh wilayah."}
                        </p>
                    </div>

                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="relative w-full sm:w-[250px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, alamat..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Pilih Event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Event</SelectItem>
                                {events.map(ev => (
                                    <SelectItem key={ev.id} value={String(ev.id)}>{ev.event_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button onClick={() => { setEditingMember(null); setIsDialogOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Tambah</span>
                        </Button>
                    </div>
                </div>

                {/* Table Component */}
                <DataTable
                    columns={columns}
                    data={members}
                    meta={meta}
                    onPageChange={setPage}
                    loading={tableLoading} // Pass loading state
                />
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
                            Aksi ini akan menghapus data member bernama <strong>{deletingMember?.name}</strong>.
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default Dashboard;