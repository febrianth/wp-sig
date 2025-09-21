
import HeroSection from '../components/home/HeroSection';
import LogoCloud from '../components/home/LogoCloud';
import Testimonial from '../components/home/Testimonials';
import FeaturesGrid from '../components/home/Features';

function Home() {
  return (
    <div className="space-y-12">
      <HeroSection />
      <LogoCloud />
      <Testimonial />
      <FeaturesGrid />
    </div>
  );
}

export default Home;