import { FileText, ArrowUpRight } from "lucide-react";

// Pinned research feature. The arXiv feed below this one refreshes itself every
// few minutes, so anything of ours dropped into it would be pushed off within
// the hour. This block is deliberately hard-coded.
export function FeaturedResearch() {
  return (
    <section
      className="relative isolate w-full bg-[#FBFAF7] text-[#14201B] py-16 md:py-20"
      data-testid="section-featured-research"
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="inline-flex items-center gap-2 text-[#A8751C] font-bold uppercase tracking-[0.18em] text-xs mb-6">
          <FileText className="h-4 w-4" /> Our Research
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-2xl md:text-4xl font-bold leading-tight mb-4">
              The Universe of Universes: Benefit Yield Functions, Implosion
              Thresholds, and Infrastructure-Aware Optimization in Multi-LLM
              Systems
            </h2>
            <p className="text-sm font-semibold text-[#2C3E35] mb-1">
              Danielle Franklin and Vasu Raj Jain, Humanity + AI, Inc.
            </p>
            <p className="text-xs uppercase tracking-widest text-[#4B5F55] mb-6">
              arXiv:2609.15314 &middot; April 2026
            </p>
            <p className="text-[15px] leading-relaxed text-[#4B5F55] mb-7">
              Enterprise AI increasingly means consulting not one model but many,
              on the working assumption that more models yield more benefit. This
              paper shows that assumption has a limit. We introduce the Benefit
              Yield Function, the marginal performance gain per additional model
              added to an ensemble, and identify the implosion threshold: the
              ensemble size at which that gain crosses zero and aggregate
              performance begins to degrade.
            </p>
            <a
              href="https://arxiv.org/abs/2609.15314"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 h-11 bg-[#0E6B4A] text-[#FFFFFF] font-semibold hover:bg-[#0b573c] transition-colors"
              data-testid="link-featured-paper"
            >
              Read the paper on arXiv
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="lg:col-span-5 border border-black/10 bg-white p-6 md:p-8 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8751C] mb-5">
              What the paper contributes
            </h3>
            <ul className="space-y-4 text-sm text-[#4B5F55] leading-relaxed">
              <li>
                <span className="font-semibold text-[#14201B]">The Universe Graph.</span>{" "}
                A queryable knowledge graph of the LLM ecosystem, with model
                metadata nodes and provenance edges.
              </li>
              <li>
                <span className="font-semibold text-[#14201B]">The Benefit Yield Function.</span>{" "}
                A formal account of ensemble performance as a function of model
                count, plus three operational heuristics for estimating where it
                turns.
              </li>
              <li>
                <span className="font-semibold text-[#14201B]">Epistemic Hereditary Drift.</span>{" "}
                A probabilistic model of how hallucination and bias propagate
                through model lineages.
              </li>
              <li>
                <span className="font-semibold text-[#14201B]">Policy implications.</span>{" "}
                Direct consequences for multi-model AI acquisition and for the
                emerging science of testing AI-enabled systems.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

