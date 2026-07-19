import "./_group.css";
import "./NarrativeScroll.css";
import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Heart, Sparkles, Calendar, Clock, MapPin,
  ExternalLink, UserPlus, BookOpen, GraduationCap,
  Brain, Globe, Lightbulb, Users, Shield, Microscope
} from "lucide-react";
import { PILLARS, STATS, BOARD, POSTS, FEATURED_EVENT } from "./_data";

const ICONS: Record<string, React.ElementType> = {
  Shield, GraduationCap, Microscope, Users, BookOpen, Brain, Globe, Lightbulb
};

const SECTIONS = [
  { id: "hero", label: "The Beginning" },
  { id: "mission", label: "Our Mission" },
  { id: "pillars", label: "The Approach" },
  { id: "people", label: "The People" },
  { id: "proof", label: "The Evidence" },
  { id: "action", label: "The Future" }
];

export function NarrativeScroll() {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const eventDate = new Date(FEATURED_EVENT.date + "T00:00:00");

  return (
    <div className="font-sans narrative-container relative">
      {/* Sticky Progress Rail - Visible on large screens */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-24 flex-col justify-center items-center z-50 pointer-events-none">
        <div className="flex flex-col gap-6 items-center">
          {SECTIONS.map((sec, i) => (
            <div key={sec.id} className="relative flex items-center justify-center w-8 h-8">
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  activeSection === sec.id 
                    ? 'bg-primary scale-150' 
                    : 'bg-muted-foreground/30'
                }`}
              />
              {activeSection === sec.id && (
                <span className="absolute left-10 text-xs font-medium text-primary whitespace-nowrap opacity-100 transition-opacity">
                  {sec.label}
                </span>
              )}
            </div>
          ))}
          {/* Connecting line */}
          <div className="absolute top-4 bottom-4 w-px bg-border/50 -z-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-24">
        {/* HERO: The Problem & The Call */}
        <section id="hero" className="min-h-screen flex flex-col justify-center py-20 px-6 sm:px-12 lg:px-24">
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-12"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Nonprofit Organization
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8"
            >
              Where Humanity <br />
              <span className="text-primary italic">Meets Artificial Intelligence.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl text-muted-foreground max-w-2xl leading-relaxed mb-12 font-serif"
            >
              Bridging the gap between humanity and AI through ethical development, education, and community building. Together, we shape a future where technology serves all.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" className="h-14 px-8 text-base rounded-full gap-2">
                Learn Our Mission
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full gap-2 border-primary/20 hover:bg-primary/5">
                <Heart className="h-5 w-5 text-primary" />
                Support Our Work
              </Button>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-border/50 max-w-5xl"
          >
            {STATS.map((stat, i) => (
              <div key={i}>
                <div className="font-serif text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* MISSION: The Organization Context (Dark Section) */}
        <section id="mission" className="section-dark min-h-screen flex items-center py-32 px-6 sm:px-12 lg:px-24">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-8 text-primary/80">01. The Mission</h2>
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div>
                <h3 className="font-serif text-4xl sm:text-5xl font-bold mb-8 leading-tight">
                  About Humanity + AI, Inc.
                </h3>
                <div className="space-y-6 text-lg sm:text-xl text-muted-foreground font-serif leading-relaxed">
                  <p>
                    Founded in August 2024 by Danielle A. Franklin, a distinguished engineer and technologist with a celebrated career in U.S. defense and aerospace sectors, Humanity + AI, Inc. is a nonprofit dedicated to ensuring that artificial intelligence serves humanity.
                  </p>
                  <p>
                    Recognized by Marquis Who's Who for excellence in technology, defense, and nonprofit services, our organization brings deep technical expertise to the critical conversation about AI's role in society.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Brain, label: "AI Research" },
                  { icon: Globe, label: "Global Impact" },
                  { icon: BookOpen, label: "Education" },
                  { icon: Lightbulb, label: "Innovation" },
                ].map((item, i) => (
                  <div key={i} className="aspect-square bg-white/5 rounded-2xl flex flex-col items-center justify-center p-6 border border-white/10">
                    <item.icon className="h-10 w-10 mb-4 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS: The Approach */}
        <section id="pillars" className="min-h-screen py-32 px-6 sm:px-12 lg:px-24 bg-card">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-16 text-primary">02. The Approach</h2>
            
            <div className="space-y-24">
              {PILLARS.map((pillar, i) => {
                const Icon = ICONS[pillar.iconName];
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7 }}
                    className="grid md:grid-cols-12 gap-8 md:gap-16 items-start"
                  >
                    <div className="md:col-span-3 flex justify-end">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div className="md:col-span-9 pt-4">
                      <h3 className="font-serif text-3xl sm:text-4xl font-bold mb-6">{pillar.title}</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">{pillar.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PEOPLE: The Board */}
        <section id="people" className="min-h-screen py-32 px-6 sm:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
              <div>
                <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-primary">03. The People</h2>
                <h3 className="font-serif text-4xl sm:text-5xl font-bold max-w-2xl leading-tight">
                  Passionate leaders united by a shared mission to help individuals thrive.
                </h3>
              </div>
              <Badge variant="outline" className="px-4 py-2 text-sm bg-primary/5 text-primary border-primary/20 rounded-full w-fit">
                Newly Established Board
              </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {BOARD.map((member, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="group"
                >
                  <div className="aspect-[3/4] mb-8 overflow-hidden rounded-xl bg-muted">
                    <img 
                      src={member.photo} 
                      alt={member.name} 
                      className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                    />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{member.seat}</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{member.highlight}</span>
                  </div>
                  <h4 className="font-serif text-2xl font-bold mb-2">{member.name}</h4>
                  <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wide">{member.title}</p>
                  <p className="text-muted-foreground leading-relaxed mb-6">{member.bio}</p>
                  <Button variant="link" className="px-0 text-primary hover:no-underline group/btn">
                    Read Full Profile <ArrowRight className="ml-2 h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PROOF: Events & Insights */}
        <section id="proof" className="min-h-screen py-32 px-6 sm:px-12 lg:px-24 bg-card border-t">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-16 text-primary">04. The Evidence</h2>
            
            {/* Featured Event */}
            <div className="mb-32">
              <h3 className="font-serif text-3xl font-bold mb-10">Gathering the Community</h3>
              <Card className="overflow-hidden border-0 shadow-2xl rounded-2xl">
                <div className="grid lg:grid-cols-2">
                  <div className="relative h-64 lg:h-auto">
                    <img src={FEATURED_EVENT.imageUrl} alt="Event" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                        Upcoming {FEATURED_EVENT.type}
                      </span>
                      <h4 className="font-serif text-3xl text-white font-bold">{FEATURED_EVENT.title}</h4>
                    </div>
                  </div>
                  <div className="p-10 lg:p-16 flex flex-col justify-center bg-background">
                    <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                      {FEATURED_EVENT.description}
                    </p>
                    
                    <div className="space-y-6 mb-12">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Date</p>
                          <p className="font-semibold">{eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Time</p>
                          <p className="font-semibold">{FEATURED_EVENT.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Location</p>
                          <p className="font-semibold">{FEATURED_EVENT.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <Button size="lg" className="rounded-full px-8 gap-2">
                        <UserPlus className="h-4 w-4" /> Sign Up
                      </Button>
                      <Button size="lg" variant="outline" className="rounded-full px-8 gap-2">
                        <ExternalLink className="h-4 w-4" /> Join Link
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Insights */}
            <div>
              <div className="flex items-end justify-between mb-12 border-b pb-6">
                <h3 className="font-serif text-3xl font-bold">Latest Insights</h3>
                <Button variant="ghost" className="gap-2">Read All <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid md:grid-cols-3 gap-10">
                {POSTS.map((post, i) => (
                  <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[4/3] mb-6 overflow-hidden rounded-xl">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="text-xs font-bold text-primary uppercase tracking-wider mb-3">{post.category}</div>
                    <h4 className="font-serif text-xl font-bold mb-4 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6">{post.excerpt}</p>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By {post.author}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ACTION: The Future (Primary Blue Section) */}
        <section id="action" className="min-h-screen py-32 px-6 sm:px-12 lg:px-24 section-primary flex flex-col justify-center">
          <div className="max-w-5xl mx-auto w-full">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-16 text-primary-foreground/70">05. The Future</h2>
            
            <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-primary-foreground text-sm font-medium mb-8">
                  <GraduationCap className="h-4 w-4" />
                  Free Learning Hub
                </div>
                <h3 className="font-serif text-4xl sm:text-5xl font-bold mb-8 leading-tight">
                  Learn AI at Your Own Pace.
                </h3>
                <p className="text-xl text-primary-foreground/80 leading-relaxed mb-10 font-serif">
                  Our Learning Hub features the PJMF AI Journey framework, curated free courses from top educators, open source tools, and resources for every stage. No paywalls, no gatekeeping.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    "12+ Free Courses", "3 Learning Paths", 
                    "8+ Open Source Tools", "All Skill Levels"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-full border border-white/20 flex items-center justify-center p-12">
                  <div className="w-full h-full rounded-full border border-white/30 flex items-center justify-center p-12">
                     <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-col text-center">
                        <GraduationCap className="h-16 w-16 mb-4 opacity-80" />
                        <span className="font-serif font-bold text-2xl">Start<br/>Learning</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-20 border-t border-white/20">
              <h3 className="font-serif text-5xl font-bold mb-8">Join Our Community</h3>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-12">
                Whether you're a tech leader, researcher, student, or simply passionate about responsible AI, there's a place for you.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" variant="secondary" className="h-16 px-10 text-lg rounded-full gap-2">
                  <Sparkles className="h-5 w-5" /> Explore AI Hub
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full gap-2 border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  Get In Touch
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}