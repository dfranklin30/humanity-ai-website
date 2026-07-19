import React from "react";
import "./_group.css";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  UserPlus,
  Shield,
  GraduationCap,
  Microscope,
  Users,
  BookOpen,
  Brain,
  Globe,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { PILLARS, STATS, BOARD, POSTS, FEATURED_EVENT } from "./_data";
import { motion } from "framer-motion";

const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  GraduationCap,
  Microscope,
  Users,
};

export function EditorialMagazine() {
  const featuredEvent = FEATURED_EVENT;
  const featuredEventDate = new Date(featuredEvent.date + "T00:00:00");

  return (
    <div className="font-sans bg-[#FAF9F6] text-foreground min-h-screen selection:bg-primary/20 selection:text-primary">
      {/* Magazine Header / Masthead */}
      <header className="border-b border-foreground/10 py-6 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Nonprofit Organization
            <Sparkles className="h-3 w-3" />
          </div>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-[7rem] leading-none tracking-tight text-center font-bold text-foreground">
            Humanity + AI
          </h1>
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground uppercase tracking-widest border-t border-b border-foreground/10 py-2 w-full justify-center">
            <span>Issue 01</span>
            <span className="hidden sm:inline">•</span>
            <span>Where Humanity Meets Artificial Intelligence</span>
            <span className="hidden sm:inline">•</span>
            <span>Est. 2024</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Top Fold Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start border-b border-foreground/10 pb-16">
          {/* Left Column: Lead Story (Mission & CTAs) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <div>
              <h2 className="font-serif text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-8">
                Where Humanity <br /> Meets <span className="italic font-light text-primary">Artificial Intelligence.</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-10 font-serif">
                Bridging the gap between humanity and AI through ethical
                development, education, and community building. Together, we shape
                a future where technology serves all.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-8 border-t border-foreground/10">
              <Button size="lg" className="rounded-none px-8 font-serif italic tracking-wide">
                Learn Our Mission
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-none px-8 font-serif italic tracking-wide border-foreground/20 hover:bg-foreground hover:text-background transition-colors">
                <Heart className="h-4 w-4 mr-2" />
                Support Our Work
              </Button>
            </div>
          </div>

          {/* Right Column: Featured Visual & About Brief */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <div className="relative group overflow-hidden">
              <div className="aspect-[4/3] bg-muted relative">
                 {/* Reusing featured event image for hero editorial feel */}
                <img 
                  src={featuredEvent.imageUrl} 
                  alt="AI and Humanity" 
                  className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 mix-blend-multiply"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3 font-semibold">
                Cover Feature
              </div>
            </div>

            <div className="bg-primary/5 p-6 md:p-8 border border-primary/10">
              <h3 className="font-serif text-2xl font-bold mb-4 text-primary">The Organization</h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                Founded in August 2024 by Danielle A. Franklin, a distinguished engineer and technologist with a celebrated career in U.S. defense and aerospace sectors, Humanity + AI, Inc. is a nonprofit dedicated to ensuring that artificial intelligence serves humanity.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Recognized by Marquis Who's Who for excellence in technology, defense, and nonprofit services, our organization brings deep technical expertise to the critical conversation about AI's role in society.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-foreground/10">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tighter">
                {stat.value}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Middle Section: Pillars & Featured Event */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-16 border-b border-foreground/10">
          {/* Left: Event */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-6">
              <Calendar className="h-4 w-4" />
              Upcoming Gathering
            </div>
            <div className="border border-foreground/10 p-6 md:p-8 relative bg-white">
              <div className="absolute top-0 right-0 p-4 border-l border-b border-foreground/10 bg-[#FAF9F6] text-center min-w-[80px]">
                <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                  {featuredEventDate.toLocaleString("en-US", { month: "short" })}
                </span>
                <span className="block font-serif text-3xl font-bold text-foreground leading-none mt-1">
                  {featuredEventDate.getDate()}
                </span>
              </div>
              
              <div className="mb-4">
                <span className="text-xs px-3 py-1 border border-foreground/20 font-serif italic text-muted-foreground">
                  {featuredEvent.type}
                </span>
              </div>
              <h3 className="font-serif text-3xl font-bold leading-tight mb-4 pr-16">{featuredEvent.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 font-serif">
                {featuredEvent.description}
              </p>
              
              <div className="space-y-3 text-sm text-foreground/80 mb-8 border-t border-foreground/10 pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  {featuredEvent.time}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  {featuredEvent.location}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="rounded-none font-serif italic flex-1">
                  <UserPlus className="h-4 w-4 mr-2" /> Sign Up
                </Button>
                <Button variant="outline" className="rounded-none font-serif italic flex-1 border-foreground/20">
                  <ExternalLink className="h-4 w-4 mr-2" /> Join Link
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Pillars */}
          <div className="lg:col-span-7">
            <div className="mb-8">
              <h2 className="font-serif text-3xl font-bold">The Four Pillars</h2>
              <p className="text-muted-foreground mt-2 font-serif italic">Foundational principles guiding our work in responsible AI.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10">
              {PILLARS.map((pillar, i) => {
                const Icon = PILLAR_ICONS[pillar.iconName];
                return (
                  <div key={i} className="group cursor-default">
                    <div className="mb-4 flex items-center justify-between border-b border-foreground/10 pb-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <h3 className="font-serif text-lg font-bold">{pillar.title}</h3>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">0{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed font-serif group-hover:text-foreground transition-colors">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Board & Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-16 border-b border-foreground/10 items-start">
          {/* Left: The Board */}
          <div className="lg:col-span-5">
            <div className="mb-8 flex items-baseline justify-between border-b border-foreground/10 pb-4">
              <h2 className="font-serif text-3xl font-bold">The Board</h2>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Leadership</span>
            </div>
            
            <div className="space-y-8">
              {BOARD.map((member, i) => (
                <div key={i} className="flex gap-6 group cursor-pointer items-start">
                  <div className="w-24 h-32 shrink-0 bg-muted overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover object-top mix-blend-multiply" />
                    <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{member.seat}</span>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{member.highlight}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-primary transition-colors">{member.name}</h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground/60 mb-2">{member.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 font-serif">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Latest Insights */}
          <div className="lg:col-span-7 lg:border-l lg:border-foreground/10 lg:pl-12">
            <div className="mb-8 flex items-baseline justify-between border-b border-foreground/10 pb-4">
              <h2 className="font-serif text-3xl font-bold">Latest Insights</h2>
              <Button variant="ghost" className="text-xs uppercase tracking-widest font-semibold hover:bg-transparent hover:text-primary p-0 h-auto rounded-none">
                Read All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            <div className="grid gap-10">
              {POSTS.map((post, i) => (
                <div key={post.id} className={`grid sm:grid-cols-3 gap-6 group cursor-pointer ${i !== POSTS.length - 1 ? 'border-b border-foreground/5 pb-10' : ''}`}>
                  <div className="sm:col-span-1 aspect-[4/3] sm:aspect-square overflow-hidden bg-muted relative grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-multiply" />
                  </div>
                  <div className="sm:col-span-2 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs uppercase tracking-widest font-bold text-primary">{post.category}</span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{post.author}</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-muted-foreground font-serif leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary flex items-center">
                      Read Article <ArrowRight className="h-3 w-3 ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Hub & Community Closing */}
        <div className="py-16">
          <div className="bg-foreground text-background p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            
            <div className="grid lg:grid-cols-2 gap-16 relative z-10">
              <div>
                <div className="text-xs uppercase tracking-widest font-bold text-primary mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Free Training
                </div>
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-white">Learn AI at <br/>Your Own Pace</h2>
                <p className="text-white/70 leading-relaxed mb-8 font-serif text-lg max-w-md">
                  Our Learning Hub features the PJMF AI Journey framework, curated free courses from top educators, open source tools, and resources for every stage. No paywalls, no gatekeeping.
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 mb-10">
                  {[
                    { icon: BookOpen, label: "12+ Free Courses", sub: "YouTube verified" },
                    { icon: Brain, label: "3 Learning Paths", sub: "Beginner to Advanced" },
                    { icon: Lightbulb, label: "8+ Open Source Tools", sub: "Industry standard" },
                    { icon: Users, label: "All Skill Levels", sub: "Everyone welcome" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className="h-5 w-5 text-primary" />
                        <span className="font-serif font-bold text-white">{item.label}</span>
                      </div>
                      <span className="text-xs text-white/50 uppercase tracking-widest pl-8">{item.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="lg:border-l lg:border-white/10 lg:pl-16 flex flex-col justify-center">
                <h2 className="font-serif text-4xl font-bold mb-6 text-white">Join Our Community</h2>
                <p className="text-white/70 mb-10 font-serif text-lg leading-relaxed">
                  Whether you're a tech leader, researcher, student, or simply passionate about responsible AI, there's a place for you in our community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="rounded-none font-serif italic text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Sparkles className="h-4 w-4 mr-2" /> Explore AI Hub
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-none font-serif italic text-lg px-8 border-white/20 text-white hover:bg-white hover:text-foreground">
                    Get In Touch
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
