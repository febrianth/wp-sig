// src/components/dashboard/IndonesiaMap.jsx

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3'; // Impor semua fungsi dari library d3

// Data tiruan (mock data) untuk visualisasi.
// Nantinya, data ini akan datang dari API.
const mockData = [
    { province: 'JAWA TIMUR', value: 87 },
    { province: 'JAWA BARAT', value: 91 },
    { province: 'DKI JAKARTA', value: 21 },
    { province: 'SULAWESI SELATAN', value: 24 },
    { province: 'BANTEN', value: 23 },
    { province: 'SUMATERA UTARA', value: 30 },
];

function IndonesiaMap() {
    // `useRef` adalah hook React untuk mendapatkan referensi langsung ke elemen DOM (dalam kasus ini, SVG kita).
    // Ini memungkinkan D3 untuk "mengambil alih" dan memanipulasi elemen tersebut.
    const svgRef = useRef(null);

    // `useEffect` adalah hook yang akan berjalan setelah komponen dirender.
    // Ini adalah tempat yang tepat untuk menjalankan kode D3 yang memanipulasi DOM.
    // Array kosong `[]` di akhir berarti hook ini hanya akan berjalan sekali.
    useEffect(() => {
        // --- Di sinilah semua "sihir" D3 terjadi ---

        const width = 800;
        const height = 400;

        // 1. Pilih elemen SVG menggunakan referensi yang sudah kita buat.
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        // 2. Buat Skala Warna
        // Skala ini akan mengubah nilai (jumlah member) menjadi warna.
        const colorScale = d3.scaleQuantize()
            .domain([0, 100]) // Anggap nilai maksimal adalah 100
            .range(['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15']); // Dari terang ke gelap

        // 3. Atur Proyeksi Peta
        // Proyeksi mengubah koordinat geografis (lintang/bujur) menjadi koordinat piksel (x,y) di layar.
        const projection = d3.geoMercator()
            .center([118, -2]) // Center point untuk Indonesia
            .scale(850) // Zoom level
            .translate([width / 2, height / 2]); // Posisikan di tengah SVG

        // 4. Buat Path Generator
        // Ini adalah fungsi yang mengambil data GeoJSON dan mengubahnya menjadi atribut 'd' untuk tag <path> SVG.
        const pathGenerator = d3.geoPath().projection(projection);

        // 5. Muat dan Gambar Peta
        // Kita memuat file GeoJSON dari folder public yang sudah kita siapkan.
        d3.json('http://localhost/wordpress/wp-content/plugins/wp-sig/public/maps/indonesia-provinsi.geojson').then(data => {
            svg.selectAll('path')
                .data(data.features) // 'features' adalah array dari setiap provinsi di GeoJSON
                .join('path') // Ini adalah pola D3 untuk membuat elemen <path> untuk setiap provinsi
                .attr('d', pathGenerator) // Gunakan path generator untuk menggambar bentuk provinsi
                .attr('stroke', '#666') // Warna garis batas
                .attr('fill', (d) => {
                    // Logika untuk mewarnai provinsi berdasarkan mock data
                    const provinceName = d.properties.Provinsi; // Sesuaikan dengan properti di file GeoJSON Anda
                    const provinceData = mockData.find(p => p.province.toUpperCase() === provinceName.toUpperCase());
                    return provinceData ? colorScale(provinceData.value) : '#ccc'; // Beri warna data atau warna default
                })
                .append('title') // Tambahkan tooltip sederhana bawaan browser
                .text(d => {
                    const provinceName = d.properties.Provinsi;
                    const provinceData = mockData.find(p => p.province.toUpperCase() === provinceName.toUpperCase());
                    return `${provinceName}: ${provinceData ? provinceData.value : 'No data'}`;
                });
        });

    }, []); // <-- Array dependensi kosong, jalankan sekali saja.

    // Komponen ini akan merender elemen SVG yang akan dimanipulasi oleh D3.js
    return (
        <div className="border-2 border-foreground shadow-neo p-4 bg-white">
            <svg ref={svgRef}></svg>
        </div>
    );
}

export default IndonesiaMap;