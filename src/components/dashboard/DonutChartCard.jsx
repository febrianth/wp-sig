import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import DonutChart from "@/components/dashboard/DonutChart"
import * as d3 from 'd3';
import { cn } from '@/lib/utils';

function DonutChartCard({ filteredMembers, events, className }) {
    const [chartType, setChartType] = useState('events');

    const { eventData, badgeData } = useMemo(() => {
        const totalMembersInFilter = filteredMembers.length > 0 ? filteredMembers.length : 1;

        // --- 1. Kalkulasi Data Event ---
        let totalEventParticipants = 0;
        const eventCounts = filteredMembers.reduce((acc, member) => {
            (member.event_ids || []).forEach(eventId => {
                const eventName = events[eventId]?.event_name || `Event ID ${eventId}`;
                acc[eventName] = (acc[eventName] || 0) + 1;
                totalEventParticipants++;
            });
            return acc;
        }, {});
        
        const sortedEvents = Object.entries(eventCounts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value); // Urutkan dari terbesar

        const top5Events = sortedEvents.slice(0, 5);
        const otherEventsValue = sortedEvents.slice(5).reduce((acc, d) => acc + d.value, 0);

        if (otherEventsValue > 0) {
            top5Events.push({ label: 'Event Lain', value: otherEventsValue });
        }

        const calculatedEventData = top5Events.map(d => ({
            ...d,
            percentage: (d.value / (totalEventParticipants || 1)) * 100
        }));

        // --- 2. Kalkulasi Data Badge ---
        const badgeCounts = filteredMembers.reduce((acc, member) => {
            const badgeName = member.badge.text;
            acc[badgeName] = (acc[badgeName] || 0) + 1;
            return acc;
        }, { 'Gold': 0, 'Silver': 0, 'Bronze': 0, 'New': 0 });

        const calculatedBadgeData = Object.entries(badgeCounts)
            .map(([label, value]) => ({
                label,
                value,
                percentage: (value / totalMembersInFilter) * 100
            }))
            .filter(d => d.value > 0); // Hanya tampilkan yang ada datanya

        return { eventData: calculatedEventData, badgeData: calculatedBadgeData };

    }, [filteredMembers, events]);
    
    const data = chartType === 'events' ? eventData : badgeData;
    
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(d3.schemeCategory10);

    return (
        <Card className={cn("flex flex-col", className)}>
            <CardHeader>
                <CardTitle>Analisis Peserta</CardTitle>
                <CardDescription>
                    Agregasi data berdasarkan {chartType === 'events' ? 'Top 5 Event (+ Event Lain)' : 'Peringkat'}.
                </CardDescription>
                <div className="flex pt-2">
                    <Button variant={chartType === 'events' ? 'default' : 'outline'} onClick={() => setChartType('events')} size="sm">
                        By Event
                    </Button>
                    <Button variant={chartType === 'badges' ? 'default' : 'outline'} onClick={() => setChartType('badges')} size="sm" className="ml-2">
                        By Peringkat
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
                {data.length > 0 ? (
                    <>
                        <DonutChart data={data} />
                        <div className="p-4 w-full text-sm space-y-1 mt-4">
                            {data.map(d => (
                                <div key={d.label} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 mr-2" style={{ backgroundColor: color(d.label) }} />
                                        <span className="truncate max-w-[150px]">{d.label}</span>
                                    </div>
                                    <span className="font-bold">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-muted-foreground">Tidak ada data untuk ditampilkan.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default DonutChartCard;