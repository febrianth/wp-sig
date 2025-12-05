import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Map, Database, LineChart } from 'lucide-react';

const features = [
    {
        icon: Map,
        title: "Peta Interaktif & Data Lokasi (GIS)",
        description: "Bikin data lokasi (event, peserta, dll.) jadi hidup di peta interaktif yang super keren! Kamu bisa atur layer data biar visualisasinya makin informatif."
    },
    {
        icon: Database,
        title: "Manajemen Event Anti-Pusing",
        description: "Urus semua event-mu di satu tempat. Mulai dari registrasi, penjadwalan, semua super simpel dari dashboard WordPress-mu. Selamat tinggal keribetan data!"
    },
    {
        icon: LineChart,
        title: "Absen QR Code Super Smooth",
        description: "Lupakan absen manual! Peserta tinggal scan QR code, dan data langsung tercatat akurat di sistem. Proses check-in cepat, dan kamu bisa langsung lihat data analisis kehadirannya."
    },
];
function FeaturesGrid() {
    return (
        <section className="container mx-auto py-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-3">Fitur Unggulan WP-SIG</h2>
                <p className="text-lg text-muted-foreground">Solusi lengkap untuk kebutuhan sistem informasi geografis kamu</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <Card key={index} className="text-center">
                        <CardHeader>
                            <div className="mx-auto bg-secondary w-16 h-16 flex items-center justify-center mb-4">
                                <feature.icon className="w-8 h-8 text-foreground" />
                            </div>
                            <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}

export default FeaturesGrid;