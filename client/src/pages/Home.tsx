import { useEffect, useMemo, useState } from "react";

const highlightMetrics = [
  {
    title: "8.500 m²",
    subtitle: "de painéis montados",
    detail: "Soluções de EPS em obras residenciais, comerciais e industriais.",
  },
  {
    title: "48 h",
    subtitle: "para projetos executivos",
    detail: "Equipe própria para detalhamento, corte e montagem sob medida.",
  },
  {
    title: "25%",
    subtitle: "mais eficiência térmica",
    detail: "Ambientes confortáveis e com menor consumo energético.",
  },
];

const services = [
  {
    name: "Painéis Estruturais",
    description:
      "Montagem de paredes e lajes com EPS, aço galvanizado e revestimentos de alto desempenho.",
  },
  {
    name: "Casas Modulares",
    description:
      "Sistemas completos que reduzem o prazo de obra, entregando acabamento premium em tempo recorde.",
  },
  {
    name: "Projetos Sob Medida",
    description:
      "Dimensionamento estrutural, cortes personalizados e logística integrada para cada obra.",
  },
  {
    name: "Consultoria Técnica",
    description:
      "Acompanhamento desde a fundação até o acabamento, garantindo qualidade e segurança.",
  },
];

const advantages = [
  {
    title: "Leve e robusto",
    text: "Painéis leves reduzem cargas na fundação, mas entregam rigidez e desempenho estrutural.",
  },
  {
    title: "Conforto total",
    text: "Isolamento térmico e acústico superior, ideal para climas quentes e frios.",
  },
  {
    title: "Obra limpa",
    text: "Menos entulho, menos água, menos desperdício. Mais produtividade no canteiro.",
  },
  {
    title: "Sustentabilidade",
    text: "Materiais recicláveis e eficiência energética que reduzem o impacto ambiental.",
  },
];

const projects = [
  {
    name: "Residencial Alto Padrão",
    location: "Atibaia / SP",
    description:
      "Estrutura completa em EPS com pé-direito duplo, grandes vãos e fachadas contemporâneas.",
    data: ["420 m²", "5 suítes", "Entrega em 90 dias"],
  },
  {
    name: "Centro Comercial",
    location: "Campinas / SP",
    description:
      "Lajes nervuradas e divisórias acústicas para operações comerciais com fluxo intenso.",
    data: ["1.800 m²", "8 lojas", "Climatização otimizada"],
  },
  {
    name: "Residencial Compacto",
    location: "Mogi das Cruzes / SP",
    description:
      "Casas inteligentes com baixo consumo energético e excelente conforto acústico.",
    data: ["120 m²", "Painéis 150 mm", "Obra seca"],
  },
];

const process = [
  {
    title: "Planejamento",
    detail: "Análise técnica, compatibilização de projetos e cronograma executivo detalhado.",
  },
  {
    title: "Produção",
    detail: "Corte dos painéis, reforços e armações em fábrica com controle de qualidade.",
  },
  {
    title: "Montagem",
    detail: "Equipe especializada monta, arma e aplica revestimentos com prazos reduzidos.",
  },
  {
    title: "Entrega",
    detail: "Inspeções finais, ajustes finos e suporte pós-obra para garantir a excelência.",
  },
];

export default function Home() {
  const [navSolid, setNavSolid] = useState(false);
  const [currentProject, setCurrentProject] = useState(0);

  useEffect(() => {
    const handleScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
    }, 5200);
    return () => clearInterval(interval);
  }, []);

  const activeProject = useMemo(() => projects[currentProject], [currentProject]);

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-foreground accent-gradient">
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
          navSolid ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[var(--brand-gold)] text-[#0f0f0f] font-extrabold flex items-center justify-center shadow-lg">
              EE
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-silver)]">Construtora EPS</p>
              <h1 className="text-xl font-extrabold">Emporium EPS</h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-[var(--brand-silver)]">
            <a href="#solucoes" className="hover:text-white transition-colors">
              Soluções
            </a>
            <a href="#projetos" className="hover:text-white transition-colors">
              Projetos
            </a>
            <a href="#processo" className="hover:text-white transition-colors">
              Como entregamos
            </a>
            <a href="#contato" className="button-outline">
              Fale conosco
            </a>
          </div>
        </div>
      </header>

      <main className="pt-24 md:pt-32 pb-20 overflow-hidden">
        <section className="container relative grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center py-12">
          <div className="absolute -left-10 -top-10 h-64 w-64 bg-[var(--brand-gold)] blur-[120px] opacity-20" />
          <div className="absolute right-0 top-10 h-64 w-64 bg-[var(--brand-silver)] blur-[120px] opacity-10" />

          <div className="space-y-6 relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-[var(--brand-silver)] border border-white/10">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-gold)] animate-pulse" />
              Estruturas eficientes em EPS
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Obras mais rápidas, leves e confortáveis com o sistema da Emporium EPS.
            </h2>
            <p className="text-lg text-[var(--brand-silver)] max-w-2xl">
              Executamos paredes, lajes e fechamentos com painéis de EPS, aço galvanizado e revestimentos de alto desempenho.
              Entregamos projetos completos com precisão industrial e acabamento impecável.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                className="button-primary text-center"
                href="https://wa.me/5500000000000?text=Quero%20um%20or%C3%A7amento%20com%20EPS"
                target="_blank"
                rel="noreferrer"
              >
                Solicitar orçamento
              </a>
              <a className="button-outline text-center" href="#projetos">
                Ver projetos em EPS
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {highlightMetrics.map((item) => (
                <div key={item.title} className="card-glass shine-border rounded-2xl px-4 py-4">
                  <p className="text-2xl font-extrabold text-[var(--brand-gold)]">{item.title}</p>
                  <p className="text-sm uppercase tracking-widest text-[var(--brand-silver)]">{item.subtitle}</p>
                  <p className="text-sm text-[var(--brand-silver)] mt-2 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative rounded-3xl overflow-hidden card-glass p-8 grid-overlay">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-silver)]">Painel EPS</p>
                    <h3 className="text-2xl font-bold">Sistema estrutural avançado</h3>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-[var(--brand-gold)] text-[#0f0f0f] font-bold shadow-lg">
                    Garantia 10 anos
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-black/50 border border-white/5 p-4">
                    <p className="text-sm text-[var(--brand-silver)]">Isolamento térmico</p>
                    <p className="text-xl font-bold">R-3,5 W/m²K</p>
                  </div>
                  <div className="rounded-xl bg-black/50 border border-white/5 p-4">
                    <p className="text-sm text-[var(--brand-silver)]">Isolamento acústico</p>
                    <p className="text-xl font-bold">Até 48 dB</p>
                  </div>
                  <div className="rounded-xl bg-black/50 border border-white/5 p-4">
                    <p className="text-sm text-[var(--brand-silver)]">Resistência ao fogo</p>
                    <p className="text-xl font-bold">Classe REI 60</p>
                  </div>
                  <div className="rounded-xl bg-black/50 border border-white/5 p-4">
                    <p className="text-sm text-[var(--brand-silver)]">Produtividade</p>
                    <p className="text-xl font-bold">-35% no prazo</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-[var(--brand-gold)]/20 via-transparent to-transparent border border-white/10 p-5">
                  <p className="text-sm text-[var(--brand-silver)]">Materiais</p>
                  <p className="font-semibold">
                    Núcleo em EPS de alta densidade, malhas eletrossoldadas galvanizadas, conectores metálicos e revestimentos cimentícios
                    com fibras estruturais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solucoes" className="container py-12 space-y-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-silver)]">Soluções</p>
              <h3 className="text-3xl md:text-4xl font-extrabold">Construção inteligente com EPS</h3>
            </div>
            <a className="button-outline" href="#contato">
              Enviar projeto
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <article key={service.name} className="card-glass shine-border rounded-3xl p-6 flex flex-col gap-3 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-bold">{service.name}</h4>
                  <span className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--brand-gold)] font-bold">
                    •
                  </span>
                </div>
                <p className="text-[var(--brand-silver)] leading-relaxed">{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container py-12 space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            {advantages.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/5 bg-white/5 p-5 hover:border-[var(--brand-gold)]/50 transition-colors">
                <p className="text-sm uppercase tracking-[0.25em] text-[var(--brand-silver)]">Diferencial</p>
                <h4 className="text-xl font-semibold mt-2">{item.title}</h4>
                <p className="text-[var(--brand-silver)] mt-2 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="projetos" className="container py-12 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-silver)]">Projetos</p>
              <h3 className="text-3xl md:text-4xl font-extrabold">Resultados com o sistema Emporium EPS</h3>
            </div>
            <div className="flex gap-2">
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentProject(idx)}
                  className={`h-2 w-10 rounded-full transition-all ${
                    idx === currentProject ? "bg-[var(--brand-gold)] w-12" : "bg-white/20"
                  }`}
                  aria-label={`Ir para projeto ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 card-glass">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10" />
            <div className="grid md:grid-cols-2 gap-0 relative z-10">
              <div className="p-8 space-y-4">
                <span className="inline-flex px-3 py-1 rounded-full bg-[var(--brand-gold)]/15 text-[var(--brand-gold)] text-xs font-bold uppercase tracking-[0.2em]">
                  {activeProject.location}
                </span>
                <h4 className="text-3xl font-extrabold">{activeProject.name}</h4>
                <p className="text-[var(--brand-silver)] leading-relaxed">{activeProject.description}</p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {activeProject.data.map((info) => (
                    <div key={info} className="rounded-xl bg-black/40 border border-white/5 p-4 text-center">
                      <p className="font-semibold">{info}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative p-8 bg-gradient-to-br from-black via-[var(--brand-carbon)] to-black grid place-items-center">
                <div className="h-60 w-60 rounded-[28px] bg-gradient-to-br from-[var(--brand-gold)]/40 via-transparent to-transparent border border-[var(--brand-gold)]/50 grid place-items-center rotate-3">
                  <div className="h-48 w-48 rounded-3xl bg-[var(--brand-carbon)] grid place-items-center text-center px-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                    <p className="text-lg font-semibold leading-relaxed">
                      Painéis EPS + estrutura metálica garantindo velocidade, leveza e isolamento em cada ambiente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="processo" className="container py-12 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-silver)]">Processo</p>
              <h3 className="text-3xl md:text-4xl font-extrabold">Da ideia à entrega com controle total</h3>
            </div>
            <a className="button-outline" href="https://wa.me/5500000000000" target="_blank" rel="noreferrer">
              Falar com especialista
            </a>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {process.map((step, idx) => (
              <div key={step.title} className="card-glass rounded-2xl p-5 flex flex-col gap-3 border border-white/10">
                <span className="h-10 w-10 rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-gold)] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h4 className="text-xl font-bold">{step.title}</h4>
                <p className="text-[var(--brand-silver)] leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contato" className="container py-14">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--brand-gold)]/30 bg-gradient-to-r from-black via-[var(--brand-carbon)] to-black p-10">
            <div className="absolute inset-0 grid-overlay opacity-40" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-3 max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-silver)]">Contato</p>
                <h3 className="text-3xl md:text-4xl font-extrabold">Vamos construir o próximo projeto em EPS?</h3>
                <p className="text-[var(--brand-silver)]">
                  Envie o projeto ou fale com nosso time técnico. Planejamos cortes, logística e montagem para acelerar sua obra.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a className="button-primary text-center" href="mailto:contato@emporiumeps.com.br">
                  contato@emporiumeps.com.br
                </a>
                <a className="button-outline text-center" href="https://wa.me/5500000000000" target="_blank" rel="noreferrer">
                  WhatsApp Emporium EPS
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
