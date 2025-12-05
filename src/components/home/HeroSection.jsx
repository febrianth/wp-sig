import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

function HeroSection() {
  return (
    <section className="container mx-auto py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        {/* Kolom Teks */}
        <div className="flex flex-col items-start text-left">
          <Badge variant="default">WP-SIG</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sistem Informasi Geografis Berbasis WordPress
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Bikin Manajemen Event dan Peta Jadi Gampang di WordPress!
          </p> 
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
              <span className="font-medium">Visualisasi Data GIS yang Informatif</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
              <span className="font-medium">Sistem Manajemen Event Anti-Ribet</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
              <span className="font-medium">Absen QR Code Super Cepat, Seamless di WordPress!</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <NavLink to="/dashboard">
              <Button size="lg">Mulai</Button>
            </NavLink>
            <Button size="lg" variant="secondary">
              Cara Kerja <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kolom Gambar */}
        <div className="flex justify-center">
          <div className="bg-white border-2 border-foreground  p-2">
             <img 
               src="https://wordpress.org/files/2023/02/alternative.png" 
               alt="WP-SIG logo" 
               className="w-full h-auto"
             />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;