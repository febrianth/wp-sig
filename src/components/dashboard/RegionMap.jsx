import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function RegionMap({ className, geojsonUrl, aggregatedData, idKey, nameKey, onRegionClick, filterByCode, filterKey, districtId = null, districtKey = null, luarDaerahCount, onMapLoaded }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    useEffect(() => {
        if (!geojsonUrl || !idKey || !nameKey) {
            console.warn('[RegionMap] Render dibatalkan: Props kunci (geojsonUrl, idKey, nameKey) belum siap.');
            return;
        }

        const { width, height } = containerRef.current.getBoundingClientRect();
        const svg = d3.select(svgRef.current).html("").attr('viewBox', `0 0 ${width} ${height}`);

        d3.json(geojsonUrl).then(geojson => {
            let features = geojson.features;

            if (filterByCode && filterKey) {
                if (districtId && districtKey) {
                    features = geojson.features.filter(f => String(f.properties[districtKey]) === String(districtId));
                }
                features = features.filter(f => String(f.properties[filterKey]) === String(filterByCode));
            }

            if (!filterByCode && luarDaerahCount > 0) {
                // Buat grup baru untuk kotak info
                const infoBox = svg.append('g')
                    .attr('transform', `translate(10, ${height - 40})`); // Posisi di kiri bawah

                infoBox.append('rect')
                    .attr('width', 150)
                    .attr('height', 30)
                    .attr('fill', '#f0f0f0') // Warna abu-abu seperti wilayah 0
                    .attr('stroke', '#000')
                    .attr('stroke-width', 1);

                infoBox.append('text')
                    .attr('x', 10)
                    .attr('y', 20)
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text(`Luar Daerah: ${luarDaerahCount}`);
            }

            const filteredGeojson = { type: 'FeatureCollection', features };
            if (features.length === 0) {
                svg.append('text').attr('x', width / 2).attr('y', height / 2).attr('text-anchor', 'middle').text('Tidak ada data peta untuk ditampilkan.');
                return;
            }

            const projection = d3.geoMercator().fitSize([width, height], filteredGeojson);
            const pathGenerator = d3.geoPath().projection(projection);

            const maxCount = d3.max(Object.values(aggregatedData)) || 0;
            const colorScale = d3.scaleLinear().domain([0, maxCount]).range(["#eff3ff", "#08519c"]);

            svg.append('g')
                .selectAll('path')
                .data(filteredGeojson.features)
                .join('path')
                .attr('d', pathGenerator)
                .attr('stroke', '#000').attr('stroke-width', 1)
                .attr('fill', d => {
                    const idFromGeoJson = d.properties[idKey];
                    let lookupKey = idFromGeoJson;
                    if (filterByCode && filterKey && !districtId && !districtKey) {
                        lookupKey = `${filterByCode}.${idFromGeoJson}`;
                    } else if (districtId && districtKey) {
                        lookupKey = `${districtId}.${idFromGeoJson}`;
                    }
                    const count = aggregatedData[lookupKey] || 0;
                    return count === 0 ? '#f0f0f0' : colorScale(count);
                })
                .style('cursor', onRegionClick ? 'pointer' : 'default')
                .on('click', (event, d) => {
                    if (typeof onRegionClick === 'function') {
                        onRegionClick(d.properties[idKey]);
                    }
                })
                .on('mouseover', function (event, d) {
                    const idFromGeoJson = d.properties[idKey];
                    let lookupKey = idFromGeoJson;
                    if (filterByCode && filterKey && !districtId && !districtKey) {
                        lookupKey = `${filterByCode}.${idFromGeoJson}`;
                    } else if (districtId && districtKey) {
                        lookupKey = `${districtId}.${idFromGeoJson}`;
                    }
                    const regionName = d.properties[nameKey];
                    const count = aggregatedData[lookupKey] || 0;
                    setTooltip({ visible: true, content: `${regionName} Jumlah: ${count}`, x: event.pageX, y: event.pageY });
                    d3.select(this).attr('stroke-width', 2.5);
                })
                .on('mousemove', (event) => setTooltip(prev => ({ ...prev, x: event.pageX, y: event.pageY })))
                .on('mouseout', function () {
                    setTooltip(prev => ({ ...prev, visible: false }));
                    d3.select(this).attr('stroke-width', 1);
                });

            if (maxCount > 0 && !districtId && !districtKey) {
                const legendHeight = 150, legendWidth = 20;
                const legendGroup = svg.append('g').attr('transform', `translate(${width - 70}, 30)`);
                const legendScale = d3.scaleLinear().domain([0, maxCount]).range([legendHeight, 0]);

                const defs = svg.append('defs');
                const linearGradient = defs.append('linearGradient').attr('id', 'legend-gradient').attr('x1', '0%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');

                // Gunakan range warna dari skala kita untuk gradien
                linearGradient.append('stop').attr('offset', '0%').attr('stop-color', colorScale.range()[0]);
                linearGradient.append('stop').attr('offset', '100%').attr('stop-color', colorScale.range()[1]);

                legendGroup.append('rect')
                    .attr('width', legendWidth)
                    .attr('height', legendHeight)
                    .style('fill', 'url(#legend-gradient)')
                    .attr('stroke', '#000')
                    .attr('stroke-width', 1);

                const yAxis = d3.axisRight(legendScale).ticks(Math.min(maxCount, 5), "s");
                legendGroup.append('g').attr('transform', `translate(${legendWidth}, 0)`).call(yAxis)
                    .selectAll('text').style('font-size', '10px');
            }

        }).then(() => {
            if (typeof onMapLoaded === 'function') {
                onMapLoaded();
            }
        }).catch(err => console.error("Gagal memuat GeoJSON:", err));

    }, [geojsonUrl, aggregatedData, idKey, nameKey, onRegionClick, filterByCode, filterKey, luarDaerahCount]);
    return (
        <TooltipProvider>
            <div
                ref={containerRef}
                className={cn("w-full h-full relative", className)}
            >
                <svg ref={svgRef} className="w-full h-full" />

                <Tooltip open={tooltip.visible}>
                    <TooltipTrigger asChild>
                        <div style={{ position: 'fixed', top: tooltip.y, left: tooltip.x, pointerEvents: 'none' }} />
                    </TooltipTrigger>
                    <TooltipContent sideOffset={15}>
                        <p>{tooltip.content}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

export default RegionMap;