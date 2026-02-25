import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from 'lucide-react';
import CountdownTimer from '@/components/events/countDownTimer';
import RegionFields from '@/components/shared/RegionFields';
import { useRegionFields, sanitizePhoneNumber } from '@/hooks/use-region-fields';

function RegistrationForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        full_address: '',
        is_outside_region: 0,
        district_id: '',
        village_id: '',
    });
    const [mapData, setMapData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeEvent, setActiveEvent] = useState(null);
    const { toast } = useToast();

    const { districts, filteredVillages } = useRegionFields(mapData, formData.district_id);

    useEffect(() => {
        async function fetchData() {
            try {
                const wilayahRes = await fetch(sig_public_data.api_url + 'wilayah-data');
                const wilayahData = await wilayahRes.json();
                if (!wilayahRes.ok) throw new Error('Gagal memuat data wilayah.');

                setMapData(wilayahData);

                const eventRes = await fetch(
                    sig_public_data.api_url + 'event-schedule-public',
                    { headers: { 'X-WP-Nonce': sig_public_data.nonce } }
                );
                const eventText = await eventRes.text();
                const eventData = eventText ? JSON.parse(eventText) : null;
                setActiveEvent(eventData);
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
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        if (id === 'phone_number') {
            setFormData(prev => ({ ...prev, [id]: sanitizePhoneNumber(value) }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleDistrictChange = (value) => {
        setFormData(prev => ({ ...prev, district_id: value, village_id: "" }));
    };

    const handleVillageChange = (value) => {
        setFormData(prev => ({ ...prev, village_id: value }));
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

            onSuccess(result);
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
                <CountdownTimer startTime={activeEvent.started_at} endTime={activeEvent.end_at} />

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

                    <RegionFields
                        isOutsideRegion={formData.is_outside_region}
                        districtId={formData.district_id}
                        villageId={formData.village_id}
                        districts={districts}
                        filteredVillages={filteredVillages}
                        onOutsideRegionChange={handleOutsideRegionChange}
                        onDistrictChange={handleDistrictChange}
                        onVillageChange={handleVillageChange}
                    />

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
export default RegistrationForm;
