import AgendarWizard from "@/components/AgendarWizard";

export default function Agendar() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#140000] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-[#D9A66A]/10 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-5%] h-80 w-80 rounded-full bg-[#6e2317]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D9A66A]/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[#d1aa74]">Belarmino Barbershop</p>
          <h1 className="mt-2 text-4xl font-black text-[#F5E9D9] sm:text-5xl">Agendar horário</h1>
          <p className="mt-3 text-base text-[#E8C8A3]">
            Complete as etapas e garanta seu horário com a equipe Belarmino.
          </p>
        </div>

        <AgendarWizard />
      </div>
    </div>
  );
}
