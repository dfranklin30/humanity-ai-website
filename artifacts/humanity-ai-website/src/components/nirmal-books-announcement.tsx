import { Link } from "wouter";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import nirmalPhoto from "@assets/1profile-pic_1776517679611.jpg";

const BOOKS = [
  {
    title: "Artificial Intelligence for Supply Chain Optimization and Decision-Making",
    slug: "nirmal-jingar-ai-supply-chain-optimization",
    cover: "/uploads/book_nirmal_ai_supply_chain.png",
  },
  {
    title: "Large Language Models for Intelligent Supply Chain Systems",
    slug: "nirmal-jingar-llms-intelligent-supply-chain",
    cover: "/uploads/book_nirmal_llm_supply_chain.png",
  },
];

/** Homepage announcement: two new books from board director Nirmal Jingar, now in the Library. */
export function NirmalBooksAnnouncement() {
  return (
    <section
      className="py-12 border-b border-foreground/10"
      data-testid="block-announcement-nirmal-books"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-3 flex lg:block justify-center">
          <div className="relative w-48 lg:w-full aspect-[3/4] overflow-hidden bg-muted">
            <img
              src={nirmalPhoto}
              alt="Nirmal Jingar"
              className="w-full h-full object-cover object-top"
              data-testid="img-announcement-nirmal"
            />
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            New in the Library · Board Author
          </div>
          <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-4">
            Two new books from{" "}
            <span className="italic font-light text-primary">Nirmal Jingar</span>
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed font-serif mb-3">
            Our AI & Emerging Technology Strategy and Governance Director has
            shared two 2026 titles with the Humanity + AI community: a
            practitioner's guide to AI-driven supply chain decisions, and a deep
            look at how large language models are reshaping intelligent supply
            chain systems.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed font-serif mb-6">
            Nirmal directs enterprise AI at Wayfair, is an IEEE Senior Member and
            Forbes Technology Council member, and holds patents in agentic AI and
            supply chain orchestration.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/blog">
              <Button className="rounded-none font-serif italic" data-testid="link-announcement-nirmal-library">
                <BookOpen className="h-4 w-4 mr-2" />
                Visit the Library
              </Button>
            </Link>
            <Link href="/about/board/nirmal-jingar">
              <Button
                variant="outline"
                className="rounded-none font-serif italic border-foreground/20"
                data-testid="link-announcement-nirmal-profile"
              >
                Read Nirmal's Profile
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          {BOOKS.map((b) => (
            <Link key={b.slug} href={`/blog/${b.slug}`}>
              <div className="group cursor-pointer" data-testid={`card-announcement-book-${b.slug}`}>
                <div className="aspect-[7/10] overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                  <img
                    src={b.cover}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <p className="mt-3 text-xs font-serif leading-snug text-foreground/80 group-hover:text-primary">
                  {b.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
