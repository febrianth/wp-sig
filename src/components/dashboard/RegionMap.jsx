import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const buildLookupKey = ({
    geoId,
    filterByCode,
    districtId
}) => {
    if (districtId) return `${districtId}.${geoId}`;
    if (filterByCode) return `${filterByCode}.${geoId}`;
    return geoId;
};

function RegionMap({
    className,
    geojsonUrl,
    aggregatedData = {},
    idKey,
    nameKey,
    onRegionClick,
    filterByCode,
    filterKey,
    districtId = null,
    districtKey = null,
    luarDaerahCount = 0,
    onMapLoaded
}) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const gradientIdRef = useRef(`legend-gradient-${Math.random().toString(36).slice(2, 9)}`);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    useEffect(() => {
        if (!geojsonUrl || !idKey || !nameKey || !containerRef.current) return;

        const { width, height } = containerRef.current.getBoundingClientRect();
        const svg = d3.select(svgRef.current).html('');
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        d3.json(geojsonUrl)
            .then(geojson => {
                let features = geojson.features ?? [];

                // Filter wilayah
                if (filterByCode && filterKey) {
                    features = features.filter(f =>
                        String(f.properties[filterKey]) === String(filterByCode)
                    );
                }

                if (districtId && districtKey) {
                    features = features.filter(f =>
                        String(f.properties[districtKey]) === String(districtId)
                    );
                }

                if (!features.length) {
                    svg.append('text')
                        .attr('x', width / 2)
                        .attr('y', height / 2)
                        .attr('text-anchor', 'middle')
                        .text('Tidak ada data peta.');
                    return;
                }

                const geoData = { type: 'FeatureCollection', features };

                const projection = d3.geoMercator().fitSize([width, height], geoData);
                const path = d3.geoPath().projection(projection);

                const unmappedCount = Number(aggregatedData?.[''] || 0);

                // Hapus key kosong dari data yang dipakai map & legend
                const cleanedAggregatedData = Object.fromEntries(
                    Object.entries(aggregatedData || {})
                        .filter(([key]) => key !== '' && key !== null)
                        .map(([key, value]) => [key, Number(value) || 0])
                );

                const values = Object.values(cleanedAggregatedData).filter(v => Number.isFinite(v));
                const maxCount = values.length ? d3.max(values) : 0;

                const colorScale = d3.scaleLinear()
                    .domain([0, maxCount])
                    .range(['#eff3ff', '#08519c'])
                    .clamp(true);

                // Info luar daerah
                if (!filterByCode && (luarDaerahCount > 0 || unmappedCount > 0)) {
                    const rows =
                        (luarDaerahCount > 0 ? 1 : 0) +
                        (unmappedCount > 0 ? 1 : 0);

                    const infoBox = svg.append('g')
                        .attr('transform', `translate(10, ${height - (rows * 16 + 14)})`);

                    infoBox.append('rect')
                        .attr('width', 230)
                        .attr('height', rows * 16 + 8)
                        .attr('fill', '#f0f0f0')
                        .attr('stroke', '#000')
                        .attr('stroke-width', 1);

                    let y = 18;

                    if (luarDaerahCount > 0) {
                        infoBox.append('text')
                            .attr('x', 10)
                            .attr('y', y)
                            .style('font-size', '12px')
                            .style('font-weight', 'bold')
                            .text(`Luar Daerah: ${luarDaerahCount}`);
                        y += 16;
                    }

                    if (unmappedCount > 0) {
                        infoBox.append('text')
                            .attr('x', 10)
                            .attr('y', y)
                            .style('font-size', '12px')
                            .style('font-weight', 'bold')
                            .text(`Belum Memiliki Wilayah: ${unmappedCount - luarDaerahCount}`);
                    }
                }

                svg.append('g')
                    .selectAll('path')
                    .data(features)
                    .join('path')
                    .attr('d', path)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 1)
                    .attr('fill', d => {
                        const geoId = d.properties[idKey];
                        const key = buildLookupKey({
                            geoId,
                            filterByCode,
                            districtId
                        });
                        const count = Number(cleanedAggregatedData[key]) || 0;
                        return count === 0 ? '#f0f0f0' : colorScale(count);
                    })
                    .style('cursor', onRegionClick ? 'pointer' : 'default')
                    .on('click', (_, d) => {
                        onRegionClick?.(d.properties[idKey]);
                    })
                    .on('mouseover', function (event, d) {
                        const geoId = d.properties[idKey];
                        const key = buildLookupKey({ geoId, filterByCode, districtId });
                        const count = Number(cleanedAggregatedData[key]) || 0;

                        setTooltip({
                            visible: true,
                            content: `${d.properties[nameKey]} | Jumlah: ${count}`,
                            x: event.pageX,
                            y: event.pageY
                        });

                        d3.select(this).attr('stroke-width', 2.5);
                    })
                    .on('mousemove', event =>
                        setTooltip(t => ({ ...t, x: event.pageX, y: event.pageY }))
                    )
                    .on('mouseout', function () {
                        setTooltip(t => ({ ...t, visible: false }));
                        d3.select(this).attr('stroke-width', 1);
                    });

                // Legend
                if (maxCount > 0 && !districtId) {
                    const legendHeight = 140;
                    const legend = svg.append('g')
                        .attr('transform', `translate(${width - 60}, 30)`);

                    const scale = d3.scaleLinear()
                        .domain([0, maxCount])
                        .range([legendHeight, 0]);

                    const defs = svg.append('defs');
                    const gradient = defs.append('linearGradient')
                        .attr('id', gradientIdRef.current)
                        .attr('x1', '0%').attr('y1', '100%')
                        .attr('x2', '0%').attr('y2', '0%');

                    gradient.append('stop').attr('offset', '0%').attr('stop-color', colorScale(0));
                    gradient.append('stop').attr('offset', '100%').attr('stop-color', colorScale(maxCount));

                    legend.append('rect')
                        .attr('width', 18)
                        .attr('height', legendHeight)
                        .style('fill', `url(#${gradientIdRef.current})`)
                        .attr('stroke', '#000');

                    legend.append('g')
                        .attr('transform', 'translate(18,0)')
                        .call(d3.axisRight(scale).ticks(5))
                        .selectAll('text')
                        .style('font-size', '10px');
                }
            })
            .finally(() => onMapLoaded?.());

    }, [
        geojsonUrl,
        aggregatedData,
        filterByCode,
        districtId,
        luarDaerahCount
    ]);

    return (
        <TooltipProvider>
            <div ref={containerRef} className={cn('relative w-full h-full', className)}>
                <svg ref={svgRef} className="w-full h-full" />

                <Tooltip open={tooltip.visible}>
                    <TooltipTrigger asChild>
                        <div style={{ position: 'fixed', top: tooltip.y, left: tooltip.x }} />
                    </TooltipTrigger>
                    <TooltipContent>
                        {tooltip.content}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}


export default RegionMap;
