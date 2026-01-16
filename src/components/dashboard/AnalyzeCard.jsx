import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import * as d3 from 'd3';

function HierarchicalBarChart({ data }) {
    const ref = useRef();
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    const showTooltip = (event, d) => {
        setTooltip({
            visible: true,
            content: `${d.label} | ${d.value} peserta`,
            x: event.pageX + 12,
            y: event.pageY - 12,
        });
    };

    const moveTooltip = (event) => {
        setTooltip((prev) => ({
            ...prev,
            x: event.pageX + 12,
            y: event.pageY - 12,
        }));
    };

    const hideTooltip = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        if (!data || data.length === 0) return;

        const svg = d3.select(ref.current);
        svg.selectAll('*').remove();

        // Dynamic width (responsive)
        const containerWidth = ref.current.parentElement.clientWidth || 360;
        const width = containerWidth;
        const barHeight = 32;

        const margin = {
            top: 20,
            right: 40,
            bottom: 20,
            left: width < 400 ? 110 : 160,
        };

        const height = data.length * barHeight + margin.top + margin.bottom;
        svg.attr("width", width).attr("height", height);

        const innerWidth = width - margin.left - margin.right - 32;

        const maxValue = d3.max(data, d => d.value);

        const x = d3.scaleLinear()
            .domain([0, maxValue * 1.1]) // buffer 10%
            .range([0, innerWidth])
            .nice();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // ---- TEXT ELLIPSIS ----
        const maxLabelWidth = margin.left - 20;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = "16px sans-serif";

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
            .attr("rx", 6)
            .style("cursor", "pointer")
            .on("mouseenter", function (event, d) {
                d3.select(this).attr("opacity", 0.8);
                showTooltip(event, d);
            })
            .on("mousemove", moveTooltip)
            .on("mouseleave", function () {
                d3.select(this).attr("opacity", 1);
                hideTooltip();
            });


        // Value labels
        g.selectAll("text.value")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "value")
            .attr("x", (d) => x(d.value) + 6)
            .attr("y", (_, i) => i * barHeight + 18)
            .text((d) => d.value)
            .style("font-size", "16px");

        // Event text (left)
        svg.append("g")
            .attr("transform", `translate(10, ${margin.top})`)
            .selectAll("text.label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("y", (_, i) => i * barHeight + 18)
            .text((d) => truncateText(d.label))
            .style("font-size", "16px")
            .style("fill", "#333")
            .style("cursor", "pointer")
            .on("mouseenter", function (event, d) {
                d3.select(this).style("font-weight", "bold");
                showTooltip(event, d);
            })
            .on("mousemove", moveTooltip)
            .on("mouseleave", function () {
                d3.select(this).style("font-weight", "normal");
                hideTooltip();
            });
    }, [data]);

    return (
        <div className="w-full overflow-x-auto">
            <svg ref={ref} className="min-w-[360px]" />
            {tooltip.visible && (
                <div
                    className="
                        fixed z-50
                        border-2 border-black
                        bg-blue-300
                        px-3 py-1
                        text-sm font-bold
                        shadow-[4px_4px_0px_0px_black]
                        pointer-events-none
                        "
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
}

function DonutChart({ data }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) {
            d3.select(svgRef.current).html("");
            return;
        }

        const width = 420;
        const height = 420;
        const margin = 32;
        const radius = Math.min(width, height) / 2 - margin;

        d3.select(svgRef.current).html("");

        const svg = d3
            .select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const color = d3
            .scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.schemeCategory10);

        const pie = d3
            .pie()
            .value(d => d.value)
            .sort(null);

        const arc = d3
            .arc()
            .innerRadius(radius * 0.65)
            .outerRadius(radius);

        const labelArc = d3
            .arc()
            .innerRadius(radius * 0.8)
            .outerRadius(radius * 0.8);

        const dataReady = pie(data);

        // === SLICE ===
        svg.selectAll("path")
            .data(dataReady)
            .join("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.label))
            .attr("stroke", "#000")
            .style("stroke-width", "0.8px");

        // === PERCENT LABEL ===
        svg.selectAll("text")
            .data(dataReady)
            .join("text")
            .text(d => `${d.data.percentage}%`)
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#111");
    }, [data]);

    return (
        <div className="flex justify-center items-center w-full">
            <svg ref={svgRef} className="w-[280px] h-[280px]" />
        </div>
    );
}

function BadgeLegend({ data }) {
    if (!Array.isArray(data)) return null;

    return (
        <div className="w-full max-w-md space-y-3">
            {data.map((item, i) => (
                <div
                    key={i}
                    className="
                        flex items-center gap-2
                        rounded-xl border
                        bg-background
                        px-4 py-2
                        shadow-sm
                    "
                >
                    {/* COLOR DOT */}
                    <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: d3.schemeCategory10[i % 10] }}
                    />

                    {/* LABEL */}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                            {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {item.value} peserta
                        </p>
                    </div>

                    {/* PERCENT */}
                    <span
                        className="
                            text-sm font-semibold
                            tabular-nums
                            rounded-lg
                            px-3 py-1
                            bg-muted
                        "
                    >
                        {item.percentage}%
                    </span>
                </div>
            ))}
        </div>
    );
}

/**
 * Membuat filter region dari state view peta
 */
function buildRegionFilter(view) {
    if (!view || view.level === 'regency') return {};

    if (view.level === 'district') {
        return {
            region_level: 'district',
            region_code: view.code
        };
    }

    if (view.level === 'village') {
        return {
            region_level: 'village',
            region_code: `${view.parentCode}.${view.code}`
        };
    }

    return {};
}

export default function AnalyzeCard({ view, eventId }) {
    const [chartType, setChartType] = useState('events');

    /**
     * FILTER OBJECT → UNTUK PARAM FETCH
     */
    const filters = useMemo(() => ({
        ...buildRegionFilter(view),
        ...(eventId ? { event_id: eventId } : {})
    }), [
        view?.level,
        view?.code,
        view?.parentCode,
        eventId
    ]);

    /**
     * QUERY KEY → HARUS PRIMITIF & STABIL
     */
    const queryKeyBase = useMemo(() => ([
        view?.level || 'regency',
        view?.code || 'all',
        eventId || 'all'
    ]), [view?.level, view?.code, eventId]);

    /**
     * ANALYSIS EVENT
     */
    const eventQuery = useQuery({
        queryKey: ['analysis-events', ...queryKeyBase],
        queryFn: async () => {
            const params = new URLSearchParams(filters).toString();

            const res = await fetch(
                `${sig_plugin_data.api_url}analysis/events?${params}`,
                {
                    headers: {
                        'X-WP-Nonce': sig_plugin_data.nonce
                    }
                }
            );

            if (!res.ok) throw new Error('Failed fetch analysis events');

            return res.json();
        }
    });

    /**
     * ANALYSIS BADGE
     */
    const badgeQuery = useQuery({
        queryKey: ['analysis-badges', ...queryKeyBase],
        queryFn: async () => {
            const params = new URLSearchParams(filters).toString();

            const res = await fetch(
                `${sig_plugin_data.api_url}analysis/badges?${params}`,
                {
                    headers: {
                        'X-WP-Nonce': sig_plugin_data.nonce
                    }
                }
            );

            if (!res.ok) throw new Error('Failed fetch analysis badges');

            return res.json();
        }
    });

    return (
        <Card className="h-[700px] flex flex-col bg-[linear-gradient(to_right,#8080804D_1px,transparent_1px),linear-gradient(to_bottom,#80808090_1px,transparent_1px)] [background-size:40px_40px] bg-secondary-background">
            <CardHeader>
                <CardTitle>Analisis Peserta</CardTitle>
                <CardDescription>
                    {chartType === 'events' ? 'Top Event Paling Banyak Diikuti Berdasarkan Wilayah Terpilih' : 'Distribusi Peringkat Peserta Berdasarkan Wilayah Terpilih'}
                </CardDescription>

                <div className="flex gap-2 pt-2">
                    <Button
                        size="sm"
                        variant={chartType === 'events' ? 'default' : 'outline'}
                        onClick={() => setChartType('events')}
                    >
                        By Event
                    </Button>

                    <Button
                        size="sm"
                        variant={chartType === 'badges' ? 'default' : 'outline'}
                        onClick={() => setChartType('badges')}
                    >
                        By Peringkat
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-grow flex flex-col items-center justify-center">
                {chartType === 'events' && (
                    eventQuery.isLoading
                        ? <p className="text-muted-foreground">Memuat data…</p>
                        : (
                            <HierarchicalBarChart data={eventQuery.data || []} />
                        )
                )}

                {chartType === 'badges' && (
                    badgeQuery.isLoading
                        ? <p className="text-muted-foreground">Memuat data…</p>
                        : (
                            <>
                                <DonutChart data={badgeQuery.data.data || []} />
                                <BadgeLegend data={badgeQuery.data.data || []} />
                            </>
                        )
                )}

            </CardContent>
        </Card>
    );
}



