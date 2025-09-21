function LogoCloud() {
  const logos = ["Pemerintah", "Universitas", "Lembaga Riset", "Konsultan", "NGO"];

  return (
    <section className="container mx-auto py-12">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">Dipercaya oleh organisasi terkemuka</p>
      </div>
      <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap">
        {logos.map((logo, index) => (
          <img 
            key={index}
            src={`https://placehold.co/120x60/f0f0f0/a0a0a0?text=${logo}`}
            alt={logo}
            className="h-10 opacity-50"
          />
        ))}
      </div>
    </section>
  );
}

export default LogoCloud;