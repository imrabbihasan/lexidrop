import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Languages,
  Volume2,
} from "lucide-react";
import type { ReactNode } from "react";

type Feature = {
  icon: ReactNode;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: <Languages size={18} />,
    title: "Instant Translation",
    description: "See clear meaning the moment you highlight text.",
  },
  {
    icon: <BrainCircuit size={18} />,
    title: "Contextual Explanation",
    description: "Get short explanations that match the sentence you are reading.",
  },
  {
    icon: <BookOpen size={18} />,
    title: "Quick Vocabulary Quiz",
    description: "Review important words with a fast recall prompt.",
  },
  {
    icon: <Volume2 size={18} />,
    title: "Text-to-Speech Pronunciation",
    description: "Play pronunciation without leaving the page.",
  },
];

const steps = [
  {
    number: "01",
    title: "Highlight text",
    description: "Select a word or phrase.",
  },
  {
    number: "02",
    title: "Open LexiDrop",
    description: "The side panel appears instantly.",
  },
  {
    number: "03",
    title: "Read with clarity",
    description: "See translation and explanation.",
  },
];

function LogoMark({ className }: { className: string }) {
  return <img src="/logo.png" alt="LexiDrop logo" className={className} />;
}

function ProductMockup() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1120] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex h-11 items-center gap-2 border-b border-white/10 bg-[#0f182c] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        <div className="ml-3 h-6 flex-1 rounded-full bg-white/5 px-3 text-xs text-slate-400 flex items-center">
          supplier-portal.cn
        </div>
      </div>

      <div className="grid min-h-[24rem] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <p className="mb-4 text-xs uppercase tracking-[0.18em] text-slate-500">Web page</p>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Suppliers confirmed a revised delivery window for the next shipment.
            </p>
            <p>
              The highlighted term{" "}
              <span className="rounded-md bg-[#dff7ff]/12 px-1.5 py-1 text-[#e8fbff] ring-1 ring-[#dff7ff]/25">
                chain resilience
              </span>{" "}
              refers to how stable the supply flow remains under pressure.
            </p>
            <p>
              Buyers requested clearer packaging notes and faster customs processing.
            </p>
          </div>
        </div>

        <div className="bg-[#09101d] p-4">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center gap-3">
              <LogoMark className="h-9 w-9 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">LexiDrop</p>
                <p className="text-xs text-slate-400">Side panel</p>
              </div>
            </div>

            <div className="mb-3 flex gap-2 text-[11px]">
              <span className="rounded-full border border-[#dff7ff]/35 bg-[#dff7ff]/10 px-3 py-1 text-[#eefbff]">
                Translation
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-slate-400">
                Explain
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-slate-400">
                Audio
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#c8f2ff]">
                  Translation
                </p>
                <p className="mt-2 text-sm text-white">
                  <span className="font-semibold">chain resilience</span> means the ability to stay stable during disruption.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#c8f2ff]">
                  Explanation
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Here it describes a supply system that can keep operating under pressure.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#c8f2ff]">
                    Pronunciation
                  </p>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#d9f5ff] text-[#07101b]">
                    <Volume2 size={14} />
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">Play and hear the phrase instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const installUrl =
    "https://microsoftedge.microsoft.com/addons/detail/lexidrop-ai-vocabulary-t/kkidkhomhljchjdhbbggjjchhnnipnji";

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(188,242,255,0.12),_transparent_35%),radial-gradient(circle_at_80%_18%,_rgba(255,201,224,0.08),_transparent_24%),radial-gradient(circle_at_30%_100%,_rgba(189,204,255,0.08),_transparent_28%)]" />

      <main>
        <section className="px-6 pb-20 pt-8 sm:pt-10">
          <div className="mx-auto max-w-6xl">
            <header className="mb-16 flex items-center justify-between">
              <div className="inline-flex items-center gap-3">
                <LogoMark className="h-10 w-10 shrink-0" />
                <span className="text-sm font-semibold tracking-tight text-white">LexiDrop</span>
              </div>
            </header>

            <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-xl">
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#bfeeff]">
                  AI reading assistant
                </p>
                <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                  Understand Chinese websites without leaving the page.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                  Highlight any text and get instant translation and explanation while you browse.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={installUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#d9f5ff] px-6 py-3 text-sm font-semibold text-[#07101b] transition hover:bg-[#eefbff]"
                  >
                    Install Extension
                  </a>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition hover:border-[#d9f5ff]/40"
                  >
                    See How It Works
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>

              <ProductMockup />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#bfeeff]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Three small steps
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#bfeeff]">
                    {step.number}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#bfeeff]">
                Key features
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Focused tools for better reading
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dff7ff]/10 text-[#c8f2ff] ring-1 ring-[#dff7ff]/20">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-8 py-12 text-center sm:px-12">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Read and understand foreign text effortlessly.
              </h2>
              <div className="mt-8">
                <a
                  href={installUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-[#d9f5ff] px-6 py-3 text-sm font-semibold text-[#07101b] transition hover:bg-[#eefbff]"
                >
                  Install LexiDrop
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-400">Works with Chrome and Edge.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-medium text-white">LexiDrop</p>
              <p className="text-sm text-slate-400">Read with clarity.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <a href="#" className="transition hover:text-[#d9f5ff]">
              Privacy
            </a>
            <a href="#" className="transition hover:text-[#d9f5ff]">
              Contact
            </a>
            <a
              href="https://github.com/imrabbihasan/lexidrop.git"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[#d9f5ff]"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
