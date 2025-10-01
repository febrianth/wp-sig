import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function RegionMap({ geojsonUrl, aggregatedData, idKey, nameKey, onRegionClick, filterByDistrictCode }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!geojsonUrl || !idKey || !nameKey) return;

        const width = 800, height = 600;
        const svg = d3.select(svgRef.current).html("").attr('viewBox', `0 0 ${width} ${height}`);

        const tooltip = d3.select('body').selectAll('.d3-tooltip').data([null]).join('div')
            .attr('class', 'd3-tooltip')
            .style('position', 'absolute').style('z-index', '10').style('visibility', 'hidden')
            .style('background', 'white').style('padding', '5px').style('border', '1px solid #333');

        d3.json(geojsonUrl).then(geojson => {
            // Filter fitur jika diperlukan (untuk menampilkan desa di satu kecamatan saja)
            let features = geojson.features;
            if (filterByDistrictCode) {
                // Asumsi key untuk kecamatan di data desa Anda adalah properti district_id
                const districtIdKeyForFilter = idKey.replace('village_code', 'district_code');
                features = geojson.features.filter(f => f.properties[districtIdKeyForFilter] === filterByDistrictCode);
            }
            const filteredGeojson = { type: 'FeatureCollection', features };

            if(features.length === 0) return; // Hentikan jika tidak ada fitur untuk digambar

            const projection = d3.geoMercator().fitSize([width, height], filteredGeojson);
            const pathGenerator = d3.geoPath().projection(projection);

            const colorScale = d3.scaleQuantize()
                .domain([0, d3.max(Object.values(aggregatedData)) || 10])
                .range(['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15']);

            svg.selectAll('path')
                .data(filteredGeojson.features)
                .join('path')
                .attr('d', pathGenerator)
                .attr('stroke', '#333')
                .attr('fill', d => {
                    const count = aggregatedData[d.properties[idKey]] || 0;
                    return colorScale(count);
                })
                .style('cursor', 'pointer')
                .on('click', (event, d) => {
                    if (onRegionClick) {
                        onRegionClick(d.properties[idKey]);
                    }
                })
                .on('mouseover', /* ... (kode mouseover Anda sama, gunakan nameKey) ... */)
                .on('mousemove', /* ... (kode mousemove Anda sama) ... */)
                .on('mouseout', /* ... (kode mouseout Anda sama) ... */);
        });

    }, [geojsonUrl, aggregatedData, idKey, nameKey, onRegionClick, filterByDistrictCode]);

    return (
        <div className="border-2 border-foreground shadow-neo p-4 bg-white">
            <svg ref={svgRef}></svg>
        </div>
    );
}

export default RegionMap;