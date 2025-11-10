// src/components/member/EventTimeline.jsx
import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";

function EventTimeline({ events }) {
    // 1. Kelompokkan event berdasarkan tahun
    const eventsByYear = useMemo(() => {
        return events.reduce((acc, event) => {
            const year = new Date(event.started_at).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(event);
            return acc;
        }, {});
    }, [events]);

    // 2. Urutkan tahun dari terbaru ke terlama
    const sortedYears = Object.keys(eventsByYear).sort((a, b) => b - a);

    return (
        <div className="relative pl-6">
            {/* Garis vertikal timeline */}
            <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-800" />
            
            <div className="space-y-8">
                {sortedYears.map(year => (
                    <div key={year} className="relative">
                        {/* Lingkaran tahun */}
                        <div className="absolute -left-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground font-bold bg-bg">
                            {year}
                        </div>
                        {/* Konten event untuk tahun tsb */}
                        <div className="pl-12 space-y-4 pt-1">
                            {eventsByYear[year].map((event, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="font-medium"><span className='font-bold'>{event.event_name}</span> <span>({event.started_at})</span></span>
                                    {event.status === 'verified' && <Badge className="bg-green-200">Hadir</Badge>}
                                    {event.status === 'pending' && <Badge variant="bg-yellow-200">Pending</Badge>}
                                    {event.status === 'rejected' && <Badge variant="bg-red-200">Ditolak</Badge>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EventTimeline;