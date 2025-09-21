function Testimonial() {
    return (
        <section className="bg-primary text-primary-foreground py-20">
            <div className="container mx-auto text-center max-w-3xl">
                <blockquote className="text-2xl font-medium mb-6">
                    "WP-SIG mengubah cara kami mengelola data geografis. Sekarang semua informasi spasial terintegrasi dengan website WordPress kami."
                </blockquote>
                <div className="flex items-center justify-center">
                    <img src="https://placehold.co/60x60/ffffff/000000?text=AS" alt="Dr. Ahmad Spatial" className="rounded-full mr-4 border-2 border-primary-foreground" />
                    <div className="text-left">
                        <div className="font-bold">Dr. Ahmad Spatial</div>
                        <div className="opacity-80">Kepala Divisi GIS, Badan Informasi Geospasial</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Testimonial;