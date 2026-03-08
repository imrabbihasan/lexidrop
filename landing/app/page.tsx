import Image from "next/image";
import Link from "next/link";
import { BookOpen, BrainCircuit, ShieldCheck, Download, Github, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-primary/30 font-sans">

      {/* Navigation (Optional, keeping it minimal) */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <BookOpen size={18} />
          </div>
          LexiDrop
        </div>
        <nav className="flex gap-4">
          <Link href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">How it Works</Link>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center text-center px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-slate-50 to-slate-50 dark:from-primary/20 dark:via-slate-950 dark:to-slate-950 -z-10"></div>

          <div className="animate-[fade-in-up_0.8s_ease-out_forwards] max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Now available for Microsoft Edge
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Master Chinese and English <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Context Instantly.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
              The AI side-panel dictionary built for Bengali students. Get translations, grammar guides, and quizzes without leaving your tab.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href=""
                className="group flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
              >
                <Download size={20} />
                Get for Microsoft Edge - Free
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-full font-medium text-lg transition-all shadow-sm hover:shadow-md"
              >
                <Github size={20} />
                View Source on GitHub
              </Link>
            </div>
          </div>

          {/* Hero Visual / Placeholder */}
          <div className="mt-16 md:mt-24 w-full max-w-5xl mx-auto px-4 opacity-0 animate-[fade-in_1s_ease-out_0.5s_forwards]">
            <div className="relative rounded-2xl md:rounded-3xl bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden aspect-video flex items-center justify-center group/placeholder">
              {/* Abstract UI representation */}
              <div className="absolute top-0 left-0 right-0 h-10 md:h-12 bg-slate-300 dark:bg-slate-700 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="mx-auto w-1/3 h-4 bg-white/50 dark:bg-black/20 rounded-md"></div>
              </div>

              <div className="flex w-full h-full pt-10 md:pt-12">
                <div className="flex-1 p-8 hidden sm:block">
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4 opacity-50">
                    <div className="w-3/4 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
                {/* 
                  Instead of a full image, I'll use a stylized div representing the LexiDrop sidepanel to keep things clean.
                */}
                <div className="w-80 h-full border-l border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 shrink-0 transition-transform group-hover/placeholder:-translate-x-2">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center">
                      <BookOpen size={14} />
                    </div>
                    <span className="font-semibold text-sm">LexiDrop AI</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                      <div className="text-xl font-bold mb-1">Context</div>
                      <div className="text-sm text-slate-500 mb-2">/ˈkɒntekst/ • noun</div>
                      <div className="text-sm">The circumstances that form the setting for an event, statement, or idea.</div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <div className="flex items-center gap-2 text-primary font-medium text-xs mb-2 uppercase tracking-wider">
                        <BrainCircuit size={12} /> AI Insight
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
                      <div className="w-4/5 h-2 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Learn Smarter, Not Harder</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Everything you need to master languages without flipping through dictionary tabs.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-primary/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">Context, Not Just Translation</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  AI doesn't just translate words; it generates personalized grammar rules, usage examples, and nuanced explanations based on what you highlight.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BrainCircuit size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">Active Recall Quizzes</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Solidify your memory. LexiDrop auto-generates multiple-choice questions for every saved word, testing your retention right when you need it.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">100% Free & Private</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Zero server tracking. Bring Your Own Key (BYOK). Connect your own OpenRouter or DeepSeek API key and keep all your learning data local.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Three simple steps to supercharge your study flow.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 text-center relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl font-bold text-primary mb-6 shadow-sm">
                  1
                </div>
                <h3 className="text-lg font-bold mb-2">Install & Connect</h3>
                <p className="text-slate-600 dark:text-slate-400">Install the extension and securely enter your free API key.</p>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl font-bold text-primary mb-6 shadow-sm">
                  2
                </div>
                <h3 className="text-lg font-bold mb-2">Highlight Anywhere</h3>
                <p className="text-slate-600 dark:text-slate-400">Highlight confusing text on any webpage or document.</p>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl font-bold text-primary mb-6 shadow-sm">
                  3
                </div>
                <h3 className="text-lg font-bold mb-2">Right-Click & Learn</h3>
                <p className="text-slate-600 dark:text-slate-400">Click "Save to LexiDrop" and let AI break down the context for you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 bg-primary text-white text-center px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to elevate your learning?</h2>
            <p className="text-blue-100 text-lg mb-10">Join student learners who are mastering languages faster with context-aware AI.</p>
            <Link
              href=""
              className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-slate-50 px-8 py-4 rounded-full font-medium text-lg transition-all shadow-xl hover:scale-105"
            >
              <Download size={20} />
              Get LexiDrop for Edge - Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 py-12 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <BookOpen size={20} className="text-primary" />
            LexiDrop
          </div>

          <div className="text-slate-500 text-sm">
            &copy; 2026 LexiDrop. All rights reserved.
          </div>

          <div className="flex gap-6 text-sm font-medium">
            <Link href="/privacy" className="text-slate-500 hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="mailto:contact@lexidrop.com" className="text-slate-500 hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
