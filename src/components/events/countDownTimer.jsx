import React, { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

export default function CountdownTimer({ startTime, endTime }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [status, setStatus] = useState('pending');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(startTime).getTime();
            const end = new Date(endTime).getTime();

            if (now < start) {
                setStatus('pending');
                const diff = start - now;
                // Hitung mundur menuju event DIMULAI
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setTimeLeft(`Akan dimulai dalam: ${days}h : ${hours}j`);
            } else if (now > end) {
                setStatus('expired');
                setTimeLeft("Waktu event telah habis.");
                clearInterval(interval);
            } else {
                setStatus('active');
                const diff = end - now;
                // Hitung mundur menuju event BERAKHIR
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${days}h : ${hours}j : ${minutes}m : ${seconds}d`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    const getVariant = () => {
        if (status === 'active') return 'default';
        if (status === 'pending') return 'default';
        if (status === 'expired') return 'destructive';
    }

    return (
        <Alert variant={getVariant()}>
            <Clock className="h-4 w-4" />
            <AlertTitle>
                {status === 'active' && 'Sisa Waktu Pendaftaran'}
                {status === 'pending' && 'Pendaftaran Belum Dibuka'}
                {status === 'expired' && 'Pendaftaran Ditutup'}
            </AlertTitle>
            <AlertDescription className="font-mono text-lg">{timeLeft || "Menghitung..."}</AlertDescription>
        </Alert>
    );
}