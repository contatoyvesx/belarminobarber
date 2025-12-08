import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'wouter';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [activeService, setActiveService] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showParticles, setShowParticles] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [aboutCarouselIndex, setAboutCarouselIndex] = useState(0);
  const [barbeariaScrollProgress, setBarbeariaScrollProgress] = useState(0);
  const barbeariaImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Calculate saturation progress for barbearia image
      if (barbeariaImageRef.current) {
        const rect = barbeariaImageRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate when element is 100% visible (top at 0 and bottom at windowHeight)
        const elementTop = rect.top;
        const elementBottom = rect.bottom;
        
        // If element is completely visible in viewport
        if (elementTop <= 0 && elementBottom >= windowHeight) {
          // Element is larger than viewport, check if it's centered
          const centerOffset = Math.abs(windowHeight / 2 - (elementTop + (elementBottom - elementTop) / 2));
          const maxOffset = windowHeight / 2;
          const progress = Math.max(0, 1 - (centerOffset / maxOffset));
          setBarbeariaScrollProgress(progress);
        } else if (elementTop >= 0 && elementBottom <= windowHeight) {
          // Element is smaller than viewport and completely visible
          setBarbeariaScrollProgress(1);
        } else {
          setBarbeariaScrollProgress(0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-advance portfolio carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % portfolio.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);


  const services = [
    {
      title: 'Corte Clássico',
      description: 'Corte tradicional com acabamento perfeito',
      price: 'R$ 45,00',
      icon: '✂️'
    },
    {
      title: 'Barba & Bigode',
      description: 'Modelagem e design de barba',
      price: 'R$ 35,00',
      icon: '🧔'
    },
    {
      title: 'Corte + Barba',
      description: 'Combo completo de grooming',
      price: 'R$ 70,00',
      icon: '💈'
    },
    {
      title: 'Pigmentação',
      description: 'Coloração de barba e cabelo',
      price: 'R$ 55,00',
      icon: '🎨'
    }
  ];

  const portfolio = [
    { title: 'Corte Fade', image: '/galeria1.png' },
    { title: 'Barba Desenhada', image: '/galeria2.png' },
    { title: 'Corte Moderno', image: '/galeria3.png' },
    { title: 'Estilo Retrô', image: '/galeria4.png' }
  ];

  const aboutImages = ['/sobre1.jpg', '/sobre2.jpg', '/sobre3.jpg'];

  // Auto-advance about carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAboutCarouselIndex((prev) => (prev + 1) % aboutImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [aboutImages.length]);

  const heroParticles = useMemo(
    () =>
      Array.from({ length: 24 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 6 + Math.random() * 12,
        blur: 2 + Math.random() * 6,
        opacity: 0.15 + Math.random() * 0.25,
        duration: 5 + Math.random() * 4,
        delay: Math.random() * 3
      })),
    []
  );

  const handleAgendarClick = () => {
    setMobileMenuOpen(false);
    window.location.href = '/agendar';
  };

  const handleContatoClick = () => {
    setMobileMenuOpen(false);
    window.open('https://wa.me/5511952861321', '_blank');
  };

  const handleInstagramClick = () => {
    setMobileMenuOpen(false);
    window.open('https://instagram.com/belarmino_barbershop', '_blank');
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % portfolio.length);
  };

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + portfolio.length) % portfolio.length);
  };

  const nextAboutSlide = () => {
    setAboutCarouselIndex((prev) => (prev + 1) % aboutImages.length);
  };

  const prevAboutSlide = () => {
    setAboutCarouselIndex((prev) => (prev - 1 + aboutImages.length) % aboutImages.length);
  };

  const goToSlide = (index: number) => {
    setCarouselIndex(index);
  };

  // Particle component
  const Particle = ({ index }: { index: number }) => {
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const randomDuration = 3 + Math.random() * 2;
    const randomSize = 2 + Math.random() * 4;

    return (
      <div
        className="absolute rounded-full bg-[#D9A66A] opacity-20"
        style={{
          width: `${randomSize}px`,
          height: `${randomSize}px`,
          left: `${randomX}%`,
          top: `${randomY}%`,
          animation: `float ${randomDuration}s ease-in-out infinite`,
          animationDelay: `${index * 0.1}s`
        }}
      />
    );
  };

  const navBackground = scrollY > 50 ? 'rgba(42, 9, 6, 0.65)' : 'rgba(42, 9, 6, 0.95)';

  return (
    <div className="min-h-screen bg-[#140000] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9A66A] rounded-full opacity-5 blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6e2317] rounded-full opacity-5 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#E8C8A3] rounded-full opacity-3 blur-3xl animate-pulse-scale"></div>
      </div>

      {/* Particle background */}
      {showParticles && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav
        className="fixed top-0 w-full bg-[#2a0906] border-b-2 border-[#D9A66A] z-50 shadow-lg backdrop-blur-md animate-slide-down transition-colors duration-300"
        style={{ backgroundColor: navBackground }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <img
              src="/ícone-fundotransparente.png"
              alt="Ícone Belarmino Barbershop"
              className="w-10 h-10 drop-shadow-[0_0_10px_rgba(217,166,106,0.6)]"
            />
            <h1 className="text-2xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all duration-300" style={{ fontFamily: "'Playfair Display', serif" }}>
              BELARMINO
            </h1>
          </div>
          <ul className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-wider">
            <li><a href="#servicos" className="text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition">Serviços</a></li>
            <li><a href="#portfolio" className="text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition">Portfolio</a></li>
            <li><a href="#contato" className="text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition">Contato</a></li>
            <li>
              <Link
                href="/agendar"
                className="text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition"
              >
                Agendar
              </Link>
            </li>
          </ul>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#D9A66A] text-2xl hover:animate-rotate-360 transition-all duration-300"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#2a0906] border-t border-[#D9A66A] animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#servicos" 
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition py-2 font-semibold uppercase tracking-wider"
              >
                Serviços
              </a>
              <a 
                href="#portfolio" 
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition py-2 font-semibold uppercase tracking-wider"
              >
                Portfolio
              </a>
              <a
                href="#contato"
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition py-2 font-semibold uppercase tracking-wider"
              >
                Contato
              </a>
              <Link
                href="/agendar"
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] hover:animate-color-shift transition py-2 font-semibold uppercase tracking-wider"
              >
                Agendar
              </Link>
              <button
                onClick={handleAgendarClick}
                className="w-full btn-retro cursor-pointer hover-lift transition-all-500 animate-pulse-scale mt-4"
              >
                Agendar
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#060200] to-[#160400] opacity-95"></div>
          <div
            className="absolute inset-0 opacity-45 mix-blend-screen"
            style={{
              background:
                'radial-gradient(circle at 20% 25%, rgba(217,166,106,0.25), transparent 40%), radial-gradient(circle at 70% 15%, rgba(255,255,255,0.08), transparent 35%), radial-gradient(circle at 40% 80%, rgba(110,35,23,0.2), transparent 45%)'
            }}
          ></div>
          {heroParticles.map((particle, index) => (
            <span
              key={`hero-particle-${index}`}
              className="absolute rounded-full bg-[#d9a66a] mix-blend-screen"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: particle.opacity,
                filter: `blur(${particle.blur}px)`,
                animation: `float ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`
              }}
            ></span>
          ))}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in-up">
            <img
              src="/belarmino-logo.png"
              alt="Belarmino Barbershop"
              className="mx-auto w-56 md:w-[26rem] drop-shadow-[0_0_25px_rgba(217,166,106,0.4)]"
            />
          </div>
          <p className="text-xl md:text-2xl text-[#E8C8A3] mb-8 animate-fade-in-up animate-color-shift" style={{ animationDelay: '0.2s' }}>
            Estilo Retrô, Qualidade Premium
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-12 animate-fade-in-up animate-shimmer" style={{ animationDelay: '0.4s' }}></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <button 
              onClick={handleAgendarClick}
              className="btn-retro cursor-pointer hover-lift transition-all-500 animate-pulse-scale"
            >
              Agendar Agora
            </button>
            <button 
              onClick={handleContatoClick}
              className="btn-retro-outline cursor-pointer hover-lift transition-all-500 hover:animate-border-glow"
            >
              Entre em Contato
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-wave">
          <div className="text-[#D9A66A] text-2xl">↓</div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#D9A66A] animate-fade-in-up text-shadow-gold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Nossos Serviços
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-16 animate-shimmer"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="card-retro cursor-pointer transform transition-all duration-300 hover:scale-105 hover-lift animate-border-glow group"
                onClick={handleAgendarClick}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                <div className="text-5xl mb-4 transition-all duration-300">{service.icon}</div>
                <h3 className="text-xl font-bold text-[#D9A66A] mb-3 group-hover:animate-neon-glow" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {service.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 group-hover:text-[#E8C8A3] transition-colors">{service.description}</p>
                <div className="pt-4 border-t border-[#6e2317] group-hover:border-[#D9A66A] transition-colors">
                  <p className="text-2xl font-bold text-[#E8C8A3] group-hover:animate-color-shift">{service.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section with Barber Image */}
      <section className="py-20 px-4 bg-[#140000] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg hover-glow transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D9A66A] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10 pointer-events-none"></div>
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {aboutImages.map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt={`Belarmino e esposa ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                      index === aboutCarouselIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={prevAboutSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center z-20 transition-colors"
                aria-label="Imagem anterior sobre"
              >
                ‹
              </button>
              <button
                onClick={nextAboutSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center z-20 transition-colors"
                aria-label="Próxima imagem sobre"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {aboutImages.map((_, index) => (
                  <span
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === aboutCarouselIndex ? 'bg-[#D9A66A]' : 'bg-white/40'
                    }`}
                  ></span>
                ))}
              </div>
            </div>
            <div className="animate-fade-in-up">
              <h2 
                className="text-4xl font-bold mb-6 text-[#D9A66A] text-shadow-gold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Sobre Belarmino
              </h2>
              <p className="text-gray-300 mb-4 leading-relaxed hover:text-[#E8C8A3] transition-colors">
                Há mais de 35 anos, a Barbearia Belarmino é referência em estilo e qualidade na região. Nossos barbeiros são profissionais experientes que combinam técnicas clássicas com tendências modernas.
              </p>
              <p className="text-gray-300 mb-6 leading-relaxed hover:text-[#E8C8A3] transition-colors">
                Cada cliente recebe atenção personalizada e um atendimento impecável. Utilizamos produtos premium e mantemos os mais altos padrões de higiene e profissionalismo.
              </p>
              <div className="flex gap-4">
                <div className="text-center group cursor-pointer">
                  <p className="text-3xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all">35+</p>
                  <p className="text-sm text-gray-400 group-hover:text-[#E8C8A3] transition-colors">Anos de Experiência</p>
                </div>
                <div className="text-center group cursor-pointer">
                  <p className="text-3xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all">1000+</p>
                  <p className="text-sm text-gray-400 group-hover:text-[#E8C8A3] transition-colors">Clientes Satisfeitos</p>
                </div>
                <div className="text-center group cursor-pointer">
                  <p className="text-3xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all">5⭐</p>
                  <p className="text-sm text-gray-400 group-hover:text-[#E8C8A3] transition-colors">Avaliação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section - Carousel */}
      <section id="portfolio" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#D9A66A] animate-fade-in-up text-shadow-gold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Galeria de Trabalhos
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-16 animate-shimmer"></div>

          {/* Carousel Container */}
          <div className="relative max-w-2xl mx-auto">
            {/* Main Carousel */}
            <div className="relative overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg hover-glow transition-all duration-300 group">
              <div className="aspect-square bg-gradient-to-br from-[#6e2317] to-[#2a0906] flex items-center justify-center overflow-hidden relative">
                {portfolio.map((item, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === carouselIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140000] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <p className="text-[#D9A66A] font-bold text-lg animate-slide-up">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-[#D9A66A] text-[#140000] rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-[#E8C8A3] hover:scale-110 transition-all duration-300 hover-lift"
              >
                ‹
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-[#D9A66A] text-[#140000] rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-[#E8C8A3] hover:scale-110 transition-all duration-300 hover-lift"
              >
                ›
              </button>
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-3 mt-6">
              {portfolio.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === carouselIndex
                      ? 'bg-[#D9A66A] w-6'
                      : 'bg-[#6e2317] hover:bg-[#D9A66A]'
                  }`}
                />
              ))}
            </div>

            {/* Slide Counter */}
            <div className="text-center mt-4 text-[#E8C8A3] font-semibold text-sm">
              {carouselIndex + 1} / {portfolio.length}
            </div>
          </div>
        </div>
      </section>

      {/* Barbearia Section */}
      <section className="py-20 px-4 bg-[#140000] relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-4xl font-bold text-center mb-4 text-[#D9A66A] text-shadow-gold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Nossa Barbearia
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-12 animate-shimmer"></div>

          <div 
            ref={barbeariaImageRef}
            className="relative overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg hover-glow transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#D9A66A] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10"></div>
            <img 
              src="/barbearia.png" 
              alt="Barbearia Belarmino" 
              className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500 group-hover:brightness-110"
              style={{
                filter: `saturate(${barbeariaScrollProgress * 100}%)`,
                transition: 'filter 1s ease-out'
              }}
            />
          </div>
        </div>
      </section>

      {/* Hours Section */}
      <section className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-4xl font-bold text-center mb-4 text-[#D9A66A] text-shadow-gold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Horários de Funcionamento
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-12 animate-shimmer"></div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card-retro hover-lift transition-all-500 group animate-border-glow">
              <h3 className="text-2xl font-bold text-[#D9A66A] mb-6 group-hover:animate-neon-glow" style={{ fontFamily: "'Playfair Display', serif" }}>
                Segunda a Sexta
              </h3>
              <p className="text-2xl font-bold text-[#E8C8A3] mb-2 group-hover:animate-color-shift">08:00 - 19:00</p>
              <p className="text-gray-400 group-hover:text-[#E8C8A3] transition-colors">Atendimento contínuo</p>
            </div>
            <div className="card-retro hover-lift transition-all-500 group animate-border-glow">
              <h3 className="text-2xl font-bold text-[#D9A66A] mb-6 group-hover:animate-neon-glow" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sábado
              </h3>
              <p className="text-2xl font-bold text-[#E8C8A3] mb-2 group-hover:animate-color-shift">08:00 - 17:00</p>
              <p className="text-gray-400 group-hover:text-[#E8C8A3] transition-colors">Sem intervalo</p>
            </div>
          </div>

          <div className="mt-8 card-retro text-center hover-lift transition-all-500 group animate-border-glow">
            <p className="text-gray-400 mb-2 group-hover:text-[#E8C8A3] transition-colors">Domingo: FECHADO</p>
            <p className="text-sm text-gray-500 group-hover:text-[#D9A66A] transition-colors">Agendamentos também pelo WhatsApp</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 px-4 bg-[#140000] relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-4xl font-bold mb-4 text-[#D9A66A] text-shadow-gold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Entre em Contato
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-12 animate-shimmer"></div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card-retro hover-lift transition-all-500 group animate-border-glow">
              <p className="text-3xl mb-4">📍</p>
              <h3 className="text-xl font-bold text-[#D9A66A] mb-2 group-hover:animate-neon-glow">Localização</h3>
              <p className="text-gray-300 group-hover:text-[#E8C8A3] transition-colors">Rua das Flores, 123<br/>Centro - São Paulo, SP</p>
            </div>
            <div className="card-retro cursor-pointer hover-lift transition-all-500 group animate-border-glow" onClick={handleContatoClick}>
              <p className="text-3xl mb-4">📞</p>
              <h3 className="text-xl font-bold text-[#D9A66A] mb-2 group-hover:animate-neon-glow">Telefone</h3>
              <p className="text-gray-300 group-hover:text-[#E8C8A3] transition-colors">(11) 95286-1321</p>
            </div>
            <div className="card-retro cursor-pointer hover-lift transition-all-500 group animate-border-glow" onClick={handleInstagramClick}>
              <p className="text-3xl mb-4">📷</p>
              <h3 className="text-xl font-bold text-[#D9A66A] mb-2 group-hover:animate-neon-glow">Instagram</h3>
              <p className="text-gray-300 group-hover:text-[#E8C8A3] transition-colors">@belarmino_barbershop</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="card-retro text-left p-8 space-y-4">
              <h3
                className="text-2xl font-bold text-[#D9A66A]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Agende do seu jeito
              </h3>
              <p className="text-gray-300 text-sm">
                Prefere falar com a equipe ou quer agendar online? Escolha abaixo e confirme seu horário rapidinho.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/agendar"
                  className="btn-retro w-full sm:w-auto text-center cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Agendar online
                </Link>
                <button
                  onClick={handleContatoClick}
                  className="btn-retro w-full sm:w-auto cursor-pointer bg-[#1b0402] border border-[#D9A66A] text-[#D9A66A] hover:bg-[#D9A66A] hover:text-[#140000]"
                >
                  Falar no WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2a0906] border-t-2 border-[#D9A66A] py-8 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="group">
              <h3 className="text-[#D9A66A] font-bold mb-4 flex items-center gap-2 group-hover:animate-neon-glow">
                <span className="text-2xl">💈</span>
                Belarmino
              </h3>
              <p className="text-gray-400 text-sm group-hover:text-[#E8C8A3] transition-colors">Estilo retrô, qualidade premium desde 1985.</p>
            </div>
            <div>
              <h4 className="text-[#D9A66A] font-bold mb-4 hover:animate-neon-glow transition-all">Links Rápidos</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#servicos" className="hover:text-[#D9A66A] hover:animate-color-shift transition">Serviços</a></li>
                <li><a href="#portfolio" className="hover:text-[#D9A66A] hover:animate-color-shift transition">Portfolio</a></li>
                <li><a href="#contato" className="hover:text-[#D9A66A] hover:animate-color-shift transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#D9A66A] font-bold mb-4 hover:animate-neon-glow transition-all">Redes Sociais</h4>
              <div className="flex gap-4">
                <button 
                  onClick={handleInstagramClick}
                  className="text-[#D9A66A] hover:text-[#E8C8A3] transition text-2xl cursor-pointer"
                >
                  📷
                </button>
                <button 
                  onClick={handleContatoClick}
                  className="text-[#D9A66A] hover:text-[#E8C8A3] transition text-2xl cursor-pointer"
                >
                  💬
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#6e2317] pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Barbearia Belarmino. Todos os direitos reservados.</p>
            <p className="mt-2">Feito com ❤️ em São Paulo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
