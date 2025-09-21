import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Map, Database, LineChart } from 'lucide-react'; 

const features = [
    { icon: Map, title: "Peta Interaktif", description: "Buat dan kelola peta interaktif dengan layer data yang dapat dikustomisasi." },
    { icon: Database, title: "Manajemen Data Spasial", description: "Kelola data geografis dengan mudah melalui interface WordPress yang familiar." },
    { icon: LineChart, title: "Analisis Spasial", description: "Lakukan analisis geografis mendalam dengan tools yang terintegrasi." },
];

function FeaturesGrid() {
    return (
        <section className="container mx-auto py-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-3">Fitur Unggulan WP-SIG</h2>
                <p className="text-lg text-muted-foreground">Solusi lengkap untuk kebutuhan sistem informasi geografis Anda</p>
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