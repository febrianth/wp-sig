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

function RegistrationForm({ onSuccess }) {
    const [formData, setFormData] = useState({});
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    const [filteredVillages, setFilteredVillages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    // Ambil data wilayah (kecamatan & desa) saat komponen dimuat
    useEffect(() => {
        async function fetchWilayah() {
            try {
                const response = await fetch(sig_public_data.api_url + 'wilayah-data');
                const data = await response.json();
                if (!response.ok) throw new Error('Gagal memuat data wilayah.');
                
                const districtOptions = Object.entries(data.districts || {}).map(([id, name]) => ({ value: id, label: name }));
                const villageOptions = Object.entries(data.villages || {}).map(([id, villageObj]) => ({
                    value: id, label: villageObj.name, districtId: villageObj.parent_district
                }));
                
                setDistricts(districtOptions);
                setVillages(villageOptions);
            } catch (err) {
                setError(err.message);
            }
        }
        fetchWilayah();
    }, []);

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
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Formulir Registrasi Peserta</CardTitle>
                <CardDescription>Silakan isi data Anda untuk mendaftar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
export default RegistrationForm;