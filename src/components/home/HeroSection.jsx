import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CheckCircle2, ArrowRight } from 'lucide-react';

function HeroSection() {
  return (
    <section className="container mx-auto py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        {/* Kolom Teks */}
        <div className="flex flex-col items-start text-left">
          <Badge variant="default">WP-SIG</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sistem Informasi Geografis Terdepan Berbasis WordPress
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Platform GIS yang mudah digunakan untuk mengelola data spasial, membuat peta interaktif, dan menganalisis informasi geografis dengan WordPress.
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
              <span className="font-medium">Pemetaan data real-time</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
              <span className="font-medium">Analisis spasial otomatis</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
              <span className="font-medium">Integrasi WordPress seamless</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg">Docs</Button>
            <Button size="lg" variant="secondary">
              Cara Kerja <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kolom Gambar */}
        <div className="flex justify-center">
          <div className="bg-white border-2 border-foreground shadow-neo p-2">
             <img 
               src="https://placehold.co/600x500/dfe5f2/000000?text=WP-SIG+Dashboard" 
               alt="WP-SIG Dashboard" 
               className="w-full h-auto"
             />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;