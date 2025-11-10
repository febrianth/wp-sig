// src/components/settings/RegionCodeGuide.jsx
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info } from 'lucide-react';

function RegionCodeGuide({ mapData }) {
    const totalDistricts = Object.keys(mapData?.districts || {}).length;
    const totalVillages = Object.keys(mapData?.villages || {}).length;

    const nestedData = useMemo(() => {
        if (!mapData?.districts || !mapData?.villages) {
            return [];
        }

        const districts = Object.entries(mapData.districts).map(([id, name]) => ({ id, name }));
        const villages = Object.entries(mapData.villages).map(([id, data]) => ({
            id: id,
            name: data.name,
            districtId: data.parent_district 
        }));

        return districts.map(district => ({
            ...district,
            villages: villages.filter(village => village.districtId === district.id)
        })).sort((a, b) => a.name.localeCompare(b.name)); // Urutkan kecamatan berdasarkan nama

    }, [mapData]); // Dependensi: hitung ulang hanya jika mapData berubah

    // Jangan tampilkan komponen sama sekali jika tidak ada data untuk ditampilkan
    if (totalDistricts === 0) {
        return null;
    }

    return (
        <Card >
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Info className="mr-2 h-5 w-5" /> Panduan Kode Wilayah
                </CardTitle>
                <CardDescription>
                    Gunakan kode ini di file Excel. Total: <strong>{totalDistricts}</strong> Kecamatan dan <strong>{totalVillages}</strong> Desa/Kelurahan.
                </CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto text-sm">
                <Accordion type="single" collapsible className="w-full">
                    {/* 3. Render data yang sudah terstruktur */}
                    {nestedData.map(district => (
                        <AccordionItem value={district.id} key={district.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    {/* Tampilkan nama kecamatan & jumlah desa di dalamnya */}
                                    <span>{district.name} ({district.villages.length} Desa)</span>
                                    <code className="text-muted-foreground">{district.id}</code>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {district.villages.length > 0 ? (
                                    <ul className="list-none pl-4 space-y-1">
                                        {/* Urutkan desa berdasarkan nama */}
                                        {district.villages.sort((a, b) => a.name.localeCompare(b.name)).map(village => (
                                            <li key={village.id} className="flex justify-between">
                                                <span>{village.name}</span>
                                                <code className="text-muted-foreground">{village.id}</code>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="pl-4 text-muted-foreground">Tidak ada data desa untuk kecamatan ini.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}

export default RegionCodeGuide;