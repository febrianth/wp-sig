import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import DonutChart from "@/components/dashboard/DonutChart";
import * as d3 from 'd3';
import { cn } from '@/lib/utils';

// ============================
// Hierarchical Bar Chart
// ============================
function HierarchicalBarChart({ data }) {
    const ref = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const svg = d3.select(ref.current);
        svg.selectAll('*').remove();

        // Dynamic width (responsive)
        const containerWidth = ref.current.parentElement.clientWidth || 360;
        const width = containerWidth;
        const barHeight = 32;

        // Margin kiri lebih kecil di mobile
        const margin = {
            top: 20,
            right: 20,
            bottom: 20,
            left: width < 400 ? 110 : 160,
        };

        const height = data.length * barHeight + margin.top + margin.bottom;
        svg.attr("width", width).attr("height", height);

        const x = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.value)])
            .range([0, width - margin.left - margin.right]);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // ---- TEXT ELLIPSIS ----
        const maxLabelWidth = margin.left - 20;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = "12px sans-serif";

        const truncateText = (text) => {
            if (ctx.measureText(text).width <= maxLabelWidth) return text;

            let truncated = text;
            while (ctx.measureText(truncated + "...").width > maxLabelWidth) {
                truncated = truncated.slice(0, -1);
            }
            return truncated + "...";
        };

        const labels = data.map((d) => truncateText(d.label));

        // Bars
        g.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("y", (_, i) => i * barHeight)
            .attr("height", barHeight - 8)
            .attr("width", (d) => x(d.value))
            .attr("fill", (_, i) => d3.schemeCategory10[i % 10])
            .attr("rx", 6);

        // Value labels
        g.selectAll("text.value")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "value")
            .attr("x", (d) => x(d.value) + 6)
            .attr("y", (_, i) => i * barHeight + 18)
            .text((d) => d.value)
            .style("font-size", "12px");

        // Event text (left)
        svg.append("g")
            .attr("transform", `translate(10, ${margin.top})`)
            .selectAll("text.label")
            .data(labels)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("y", (_, i) => i * barHeight + 18)
            .text((d) => d)
            .style("font-size", "12px")
            .style("fill", "#333");

    }, [data]);

    return (
        <div className="w-full overflow-x-auto">
            <svg ref={ref} className="min-w-[360px]" />
        </div>
    );
}


// ======================================================
// MAIN CARD COMPONENT (Events = Bar Chart, Badges = Donut)
// ======================================================
export default function DonutChartCard({ filteredMembers, events, className }) {
    const [chartType, setChartType] = useState('events');

    const { eventData, badgeData } = useMemo(() => {
        const totalMembersInFilter = filteredMembers.length > 0 ? filteredMembers.length : 1;

        // ==============================
        // 1. EVENT DATA → BAR CHART
        // ==============================
        const eventCounts = filteredMembers.reduce((acc, member) => {
            (member.event_ids || []).forEach((eventId) => {
                const eventName = events[eventId]?.event_name || `Event ${eventId}`;
                acc[eventName] = (acc[eventName] || 0) + 1;
            });
            return acc;
        }, {});

        const sortedEventData = Object.entries(eventCounts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Ambil Top 10 Event

        // ==============================
        // 2. BADGE DATA → DONUT CHART
        // ==============================
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
            .filter((d) => d.value > 0);

        return {
            eventData: sortedEventData,
            badgeData: calculatedBadgeData,
        };
    }, [filteredMembers, events]);

    return (
        <Card className={cn('flex flex-col', className)}>
            <CardHeader>
                <CardTitle>Analisis Peserta</CardTitle>
                <CardDescription>
                    {chartType === 'events' ? 'Top 10 Event Paling Banyak Diikuti' : 'Distribusi Peringkat Peserta'}
                </CardDescription>

                <div className="flex pt-2">
                    <Button
                        variant={chartType === 'events' ? 'default' : 'outline'}
                        onClick={() => setChartType('events')}
                        size="sm"
                    >
                        By Event
                    </Button>
                    <Button
                        variant={chartType === 'badges' ? 'default' : 'outline'}
                        onClick={() => setChartType('badges')}
                        size="sm"
                        className="ml-2"
                    >
                        By Peringkat
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
                {chartType === 'events' ? (
                    eventData.length > 0 ? (
                        <HierarchicalBarChart data={eventData} />
                    ) : (
                        <p className="text-muted-foreground">Tidak ada data event.</p>
                    )
                ) : chartType === 'badges' ? (
                    badgeData.length > 0 ? (
                        <>
                            <DonutChart data={badgeData} />
                            <div className="p-4 w-full text-sm space-y-1 mt-4">
                                {badgeData.map((d) => (
                                    <div key={d.label} className="flex items-center justify-between">
                                        <span className="truncate max-w-[150px]">{d.label}</span>
                                        <span className="font-bold">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground">Tidak ada data peringkat.</p>
                    )
                ) : null}
            </CardContent>
        </Card>
    );
}