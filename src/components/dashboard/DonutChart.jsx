import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function DonutChart({ data }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || data.length === 0) {
            d3.select(svgRef.current).html(""); // Bersihkan SVG jika tidak ada data
            return;
        }

        const width = 350; // Ukuran dasar untuk rasio
        const height = 350;
        const margin = 40;
        const radius = Math.min(width, height) / 2 - margin;

        d3.select(svgRef.current).html(""); // Selalu bersihkan render sebelumnya

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`) // Membuat SVG responsif
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.schemeCategory10); // Skema warna D3

        const pie = d3.pie().value(d => d.value).sort(null);
        const data_ready = pie(data);

        const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
        const outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);

        // Gambar Slices
        svg.selectAll('path')
            .data(data_ready)
            .join('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.label))
            .attr('stroke', '#000') // Border Neobrutalism
            .style('stroke-width', '1.5px');

        // Tambahkan Label Persentase
        svg.selectAll('text')
            .data(data_ready)
            .join('text')
            .text(d => `${d.data.percentage.toFixed(0)}%`) // Tampilkan persentase
            .attr("transform", d => `translate(${outerArc.centroid(d)})`)
            .style("text-anchor", "middle")
            .style("font-size", 12)
            .style("fill", "#000")
            .style("font-weight", "bold");

    }, [data]); // Gambar ulang setiap kali data berubah

    return (
        <svg ref={svgRef} className="w-full h-auto max-h-[300px]"></svg>
    );
}

export default DonutChart;