import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, User, MapPin, Phone, Calendar } from 'lucide-react';
import { QRCode } from "react-qrcode-logo";
import EventTimeline from "@/components/events/eventsTimeLine";
import { Badge } from "@/components/ui/badge";

function MemberDetailPage() {
    const { memberId } = useParams();
    const [member, setMember] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

   const memberBadge = useMemo(() => {
        if (!member || !settings?.badge_thresholds) return null;

        const thresholds = settings.badge_thresholds;
        const count = member.event_count || 0;

        const sortedThresholds = Object.entries(thresholds)
            .map(([name, value]) => ({ name, value: Number(value) }))
            .sort((a, b) => b.value - a.value);

        for (const threshold of sortedThresholds) {
            if (count >= threshold.value) {
                let className = '';
                if (threshold.name === 'gold') className = 'bg-amber-400';
                if (threshold.name === 'silver') className = 'bg-gray-300';
                if (threshold.name === 'bronze') className = 'bg-amber-700';
                
                return { 
                    text: threshold.name.charAt(0).toUpperCase() + threshold.name.slice(1), 
                    className: className 
                };
            }
        }
        return { text: 'New', className: 'bg-white' };
    }, [member, settings]); // Hitung ulang jika member atau settings berubah

    useEffect(() => {
        async function fetchMemberDetail() {
            setLoading(true);
            try {
                const [memberRes, settingsRes] = await Promise.all([
                    fetch(sig_plugin_data.api_url + `members/${memberId}`, { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } }),
                    fetch(sig_plugin_data.api_url + 'settings', { headers: { 'X-WP-Nonce': sig_plugin_data.nonce } })
                ]);
               if (!memberRes.ok) throw new Error('Member tidak ditemukan.');
                if (!settingsRes.ok) throw new Error('Gagal memuat pengaturan.');

                const memberData = await memberRes.json();
                const settingsData = await settingsRes.json();
                
                setMember(memberData);
                setSettings(settingsData);
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            }
            setLoading(false);
        }
        fetchMemberDetail();
    }, [memberId, toast]);

    const getRegionName = () => {
        if (!member?.map_data) return "Data wilayah tidak ada";
        if (member.is_outside_region == 1) {
            return 'Dari luar Daerah';
        }
        const district = member.map_data.districts?.[member.district_id] || `[${member.district_id}]`;
        const village = member.map_data.villages?.[member.village_id]?.name || `[${member.village_id}]`;
        return `${village}, ${district}`;
    };

    if (loading) return <p>Memuat data member...</p>;
    if (!member) return <p>Member tidak ditemukan.</p>;
    
    const qrValue = JSON.stringify({ id: member.id }); // Data untuk di-scan

    return (
        <div className="space-y-6">
            <Button asChild variant="outline">
                <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard</Link>
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Kiri: Info & QR Code */}
                <div className="lg:col-span-1 space-y-6">
                    <Card >
                       <CardHeader>
                            {/* 5. Tampilkan Badge di samping nama */}
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl">{member.name}</CardTitle>
                                {memberBadge && (
                                    <Badge className={memberBadge.className}>{memberBadge.text}</Badge>
                                )}
                            </div>
                            <CardDescription>ID Member: {member.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center text-sm">
                                <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
                                <span>{member.phone_number || "No. Telepon tidak ada"}</span>
                            </div>
                            <div className="flex items-start text-sm">
                                <MapPin className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <span>{getRegionName()}<br/>{member.full_address || "Alamat tidak ada"}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card >
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <QrCode className="mr-2 h-5 w-5" /> QR Code Absensi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <div className="p-4 bg-white border-2 border-foreground shadow-neo">
                                <QRCode value={qrValue} size={200} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Kolom Kanan: Riwayat Event */}
                <div className="lg:col-span-2">
                    <Card >
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5" /> Riwayat Event ({member.event_count})
                            </CardTitle>
                            <CardDescription>Daftar event yang pernah diikuti atau didaftari.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EventTimeline events={member.events} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default MemberDetailPage;