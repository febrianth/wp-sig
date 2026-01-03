import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from 'lucide-react';
import CountdownTimer from '@/components/events/countDownTimer';
import { Checkbox } from "@/components/ui/checkbox";

function RegistrationForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        full_address: '',
        is_outside_region: 0,
        district_id: '',
        village_id: '',
    });
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    const [filteredVillages, setFilteredVillages] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Mulai loading untuk fetch event
    const [error, setError] = useState(null);
    const [activeEvent, setActiveEvent] = useState(null); // State untuk event
    const { toast } = useToast();

    // Ambil data wilayah (kecamatan & desa) saat komponen dimuat
    useEffect(() => {
        async function fetchData() {
            try {
                // Ambil data wilayah
                const wilayahRes = await fetch(sig_public_data.api_url + 'wilayah-data');
                const wilayahData = await wilayahRes.json();
                if (!wilayahRes.ok) throw new Error('Gagal memuat data wilayah.');

                const districtOptions = Object.entries(wilayahData.districts || {}).map(([id, name]) => ({ value: id, label: name }));
                const villageOptions = Object.entries(wilayahData.villages || {}).map(([id, villageObj]) => ({
                    value: id, label: villageObj.name, districtId: villageObj.parent_district
                }));
                setDistricts(districtOptions);
                setVillages(villageOptions);

                // Ambil data event aktif
                const eventRes = await fetch(
                    sig_public_data.api_url + 'event-schedule-public',
                    {
                        headers: { 'X-WP-Nonce': sig_public_data.nonce }
                    }
                );
                const eventText = await eventRes.text();
                const eventData = eventText ? JSON.parse(eventText) : null;
                setActiveEvent(eventData); // Simpan event (bisa null)

            } catch (err) {
                setError(err.message);
            }
            setIsLoading(false);
        }
        fetchData();
    }, []);

    if (isLoading) {
        return <p className="text-center">Memuat formulir...</p>;
    }

    if (!activeEvent) {
        return (
            <Card className="max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center text-destructive">
                        <XCircle className="mr-2 h-5 w-5" /> Pendaftaran Ditutup
                    </CardTitle>
                    <CardDescription>Saat ini tidak ada event yang sedang membuka pendaftaran. Silakan cek kembali nanti.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const handleOutsideRegionChange = (checked) => {
        const newValue = checked ? 1 : 0;
        setFormData((prev) => ({
            ...prev,
            is_outside_region: newValue,
            district_id: newValue ? '' : prev.district_id,
            village_id: newValue ? '' : prev.village_id,
        }));
        if (checked) setFilteredVillages([]);
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        if (id === 'phone_number') {
            setFormData(prev => ({ ...prev, [id]: value.replace(/[^0-9+]/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSelectChange = (id, value) => {
        if (id === 'district_id') {
            setFormData(prev => ({ ...prev, district_id: value, village_id: "" }));
            setFilteredVillages(villages.filter(v => v.districtId === value));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(sig_public_data.api_url + 'public-register', {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': sig_public_data.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Registrasi gagal.');

            onSuccess(result); // Kirim seluruh data sukses (termasuk ID) ke parent
        } catch (error) {
            toast({ variant: "destructive", title: "Registrasi Gagal", description: error.message });
        }
        setIsLoading(false);
    };

    if (error) {
        return (
            <Alert variant="destructive" className="max-w-md mx-auto">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="max-w-lg mx-auto bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background">
            <CardHeader>
                <CardTitle>Formulir Registrasi Event</CardTitle>

                <CardDescription>
                    {activeEvent?.registration_flow_mode === 'qr_once' && (
                        <>Silakan melakukan pendaftaran untuk mendapatkan QR Code.
                            QR Code ini akan digunakan untuk absensi pada Event.</>
                    )}

                    {activeEvent?.registration_flow_mode === 'manual_or_repeat' && (
                        <>Anda sedang mendaftar dan melakukan absensi untuk event:{" "}
                            <br/><strong>{activeEvent.event_name}</strong></>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Tampilkan Countdown */}
                <CountdownTimer startTime={activeEvent.started_at} endTime={activeEvent.end_at} />

                {/* Tampilkan form */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1">
                        <Label htmlFor="name">Nama Lengkap (Wajib)</Label>
                        <Input id="name" onChange={handleChange} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="phone_number">Nomor Telepon (Wajib)</Label>
                        <Input id="phone_number" type="tel" value={formData.phone_number || ''} onChange={handleChange} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="full_address">Alamat Lengkap</Label>
                        <Textarea id="full_address" onChange={handleChange} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_outside_region"
                            checked={!!formData.is_outside_region}
                            onCheckedChange={handleOutsideRegionChange}
                        />
                        <Label htmlFor="is_outside_region" className="text-sm font-medium">
                            Saya berasal dari luar daerah
                        </Label>
                    </div>
                    {!formData.is_outside_region && (
                        <>
                            <div className="space-y-1">
                                <Label>Kecamatan</Label>
                                <Select onValueChange={(value) => handleSelectChange('district_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Kecamatan..." /></SelectTrigger>
                                    <SelectContent>
                                        {districts.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Desa/Kelurahan</Label>
                                <Select onValueChange={(value) => handleSelectChange('village_id', value)} disabled={!formData.district_id}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Desa..." /></SelectTrigger>
                                    <SelectContent>
                                        {filteredVillages.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
export default RegistrationForm;