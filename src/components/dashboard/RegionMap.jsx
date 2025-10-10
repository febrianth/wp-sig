import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";

function RegionMap({ className, geojsonUrl, aggregatedData, idKey, nameKey, onRegionClick, filterByDistrictCode, filterKey }) {
    const svgRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    useEffect(() => {
        if (!geojsonUrl || !idKey || !nameKey) return;

        const width = 800, height = 600;
        const svg = d3.select(svgRef.current).html("").attr('viewBox', `0 0 ${width} ${height}`);

        d3.json(geojsonUrl).then(geojson => {
            let features = geojson.features;
            let keyForCount = ``;
            if (filterByDistrictCode && filterKey) {
                features = geojson.features.filter(f => f.properties[filterKey] === filterByDistrictCode);
                keyForCount = `${filterByDistrictCode}.`;
            }
            const filteredGeojson = { type: 'FeatureCollection', features };
            if (features.length === 0) {
                svg.append('text').attr('x', width / 2).attr('y', height / 2).attr('text-anchor', 'middle').text('Tidak ada data peta untuk ditampilkan.');
                return;
            }

            const projection = d3.geoMercator().fitSize([width, height], filteredGeojson);
            const pathGenerator = d3.geoPath().projection(projection);

            // --- PERBAIKAN 1: Perhitungan Agregasi & Skala Warna ---
            // aggregatedData yang dikirim dari Dashboard sudah benar, kita tinggal cari nilai tertingginya.
            const maxCount = d3.max(Object.values(aggregatedData)) || 0;
            console.log(aggregatedData);
            console.log(features);
            console.log(filteredGeojson);

            // Gunakan skala linear untuk kontrol penuh dari putih ke biru tua
            const colorScale = d3.scaleLinear()
                .domain([0, maxCount])
                .range(["#eff3ff", "#08519c"]); // Dari biru sangat muda ke biru tua

            // --- GAMBAR PETA ---
            svg.append('g')
                .selectAll('path')
                .data(filteredGeojson.features)
                .join('path')
                .attr('d', pathGenerator)
                .attr('stroke', '#000')
                .attr('stroke-width', 1)
                .attr('fill', d => {
                    const count = aggregatedData[`${keyForCount}${d.properties[idKey]}`] || 0;
                    return count === 0 ? '#f0f0f0' : colorScale(count); // Abu-abu muda jika 0
                })
                .style('cursor', 'pointer')
                .on('click', (event, d) => {
                    if (typeof onRegionClick === 'function') onRegionClick(`${keyForCount}${d.properties[idKey]}`);
                })
                .on('mouseover', function (event, d) {
                    const regionName = d.properties[nameKey];
                    const count = aggregatedData[`${keyForCount}${d.properties[idKey]}`] || 0;
                    setTooltip({ visible: true, content: `${regionName} : ${count}`, x: event.pageX, y: event.pageY });
                    d3.select(this).attr('stroke-width', 2.5);
                })
                .on('mousemove', (event) => setTooltip(prev => ({ ...prev, x: event.pageX, y: event.pageY })))
                .on('mouseout', function () {
                    setTooltip(prev => ({ ...prev, visible: false }));
                    d3.select(this).attr('stroke-width', 1);
                });

            // --- PERBAIKAN 3: Legenda akan otomatis muncul karena maxCount sudah benar ---
            if (maxCount > 0) {
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

        }).catch(err => console.error("Gagal memuat GeoJSON:", err));

    }, [geojsonUrl, aggregatedData, idKey, nameKey, onRegionClick, filterByDistrictCode, filterKey]);

    return (
        <TooltipProvider>
            <div className={cn("border-2 border-foreground shadow-neo p-4 bg-white relative", className)}>
                <svg ref={svgRef}></svg>
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