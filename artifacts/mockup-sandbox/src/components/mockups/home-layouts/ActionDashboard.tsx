import "./_group.css";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight, Brain, Users, Shield, BookOpen, Lightbulb,
  Heart, Sparkles, Globe, GraduationCap, Microscope,
  Calendar, Clock, MapPin, ExternalLink, UserPlus,
  Activity, PlayCircle, Newspaper, MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { PILLARS, STATS, BOARD, POSTS, FEATURED_EVENT } from "./_data";

const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, GraduationCap, Microscope, Users,
};

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
};

const stagger = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export function ActionDashboard() {
  const featuredEvent = FEATURED_EVENT;
  const featuredEventDate = new Date(featuredEvent.date + "T00:00:00");

  return (
    <div className="font-sans bg-muted/30 text-foreground min-h-screen">
      {/* Tight Hero Banner */}
      <header className="bg-primary text-primary-foreground py-8 md:py-12 border-b border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground text-xs font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Nonprofit Organization
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Where Humanity <br className="hidden md:block" />
                Meets Artificial Intelligence
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 pb-1">
              <Button variant="secondary" className="gap-2">
                Learn Our Mission
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Heart className="h-4 w-4" />
                Support Our Work
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Panel - Top CTAs */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-card to-card">
              <div>
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg mb-1">Donate Now</h3>
                <p className="text-sm text-muted-foreground mb-4">Support our mission to build ethical AI for humanity.</p>
              </div>
              <Button className="w-full justify-between" variant="secondary">
                Make a Contribution <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer bg-primary/5 border-primary/20">
              <div>
                <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">Next Event</h3>
                  <Badge variant="secondary" className="text-[10px] h-5 bg-background">
                    {featuredEventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{featuredEvent.title}</p>
              </div>
              <Button className="w-full justify-between">
                Register to Attend <UserPlus className="h-4 w-4" />
              </Button>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer">
              <div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg mb-1">Explore Programs</h3>
                <p className="text-sm text-muted-foreground mb-4">Access our free learning hub and training paths.</p>
              </div>
              <Button className="w-full justify-between" variant="outline">
                View Learning Hub <PlayCircle className="h-4 w-4" />
              </Button>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer">
              <div>
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg mb-1">Join Community</h3>
                <p className="text-sm text-muted-foreground mb-4">Connect with researchers, students, and AI leaders.</p>
              </div>
              <Button className="w-full justify-between" variant="outline">
                Get In Touch <Users className="h-4 w-4" />
              </Button>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Dashboard: Programs & Pillars */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold">Programs & Initiatives</h2>
                <Button variant="link" className="text-sm h-auto p-0">View All</Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {PILLARS.map((pillar, i) => {
                  const Icon = PILLAR_ICONS[pillar.iconName];
                  return (
                    <Card key={i} className="p-5 hover:bg-accent/10 transition-colors">
                      <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-sm mb-1">{pillar.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{pillar.desc}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Learning Hub Spotlight */}
            <section>
              <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <div className="grid md:grid-cols-5 h-full">
                  <div className="md:col-span-3 p-8 flex flex-col justify-center">
                    <Badge className="w-fit bg-white/20 text-white hover:bg-white/20 mb-4 border-0">Free Training</Badge>
                    <h2 className="font-serif text-2xl font-bold mb-3">AI Learning Hub</h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      Access curated courses from top educators, open source tools, and learning paths. No paywalls, no gatekeeping.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <BookOpen className="h-4 w-4 text-blue-400" /> 12+ Free Courses
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Brain className="h-4 w-4 text-purple-400" /> 3 Learning Paths
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Lightbulb className="h-4 w-4 text-yellow-400" /> 8+ OS Tools
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="h-4 w-4 text-green-400" /> All Skill Levels
                      </div>
                    </div>
                    <Button className="w-fit bg-white text-slate-900 hover:bg-slate-200">
                      Start Learning <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <div className="md:col-span-2 bg-slate-800/50 p-8 flex items-center justify-center border-l border-white/10">
                     <div className="relative w-full aspect-square max-w-[200px] rounded-full border-4 border-dashed border-white/20 flex items-center justify-center">
                        <GraduationCap className="h-20 w-20 text-white/50" />
                        <div className="absolute -bottom-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">PJMF Framework</div>
                     </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* Featured Event Detailed */}
            <section>
               <h2 className="text-xl font-serif font-bold mb-4">Upcoming Event Details</h2>
               <Card className="overflow-hidden">
                <div className="grid md:grid-cols-3">
                  <div className="h-48 md:h-auto md:col-span-1 relative">
                    <img src={featuredEvent.imageUrl} alt={featuredEvent.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                       <Badge className="bg-primary hover:bg-primary border-0">{featuredEvent.type}</Badge>
                    </div>
                  </div>
                  <div className="p-6 md:col-span-2 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold mb-2">{featuredEvent.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{featuredEvent.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          {featuredEventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          {featuredEvent.time}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {featuredEvent.location}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button size="sm">Register</Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <ExternalLink className="h-3 w-3" /> Event Link
                      </Button>
                    </div>
                  </div>
                </div>
               </Card>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Live Impact Counters */}
            <Card className="p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Organization Impact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((stat, i) => (
                  <div key={i} className="bg-muted/50 p-3 rounded-lg text-center">
                    <div className="font-serif text-xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* About / Mission Sidebar */}
            <Card className="p-5 bg-primary text-primary-foreground">
              <h3 className="font-serif text-lg font-bold mb-3">Our Mission</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                Founded in 2024 by Danielle A. Franklin, Humanity + AI, Inc. ensures that artificial intelligence serves humanity. 
                Recognized by Marquis Who's Who, we bring deep technical expertise to AI's role in society.
              </p>
              <Button variant="secondary" size="sm" className="w-full text-xs">Read Full Story</Button>
            </Card>

            {/* Board Sidebar */}
            <Card className="p-5">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-bold">Leadership</h3>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">View All</Button>
               </div>
               <div className="space-y-4">
                 {BOARD.map((member, i) => (
                   <div key={i} className="flex gap-3 items-center group cursor-pointer">
                     <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border border-border">
                       <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{member.name}</h4>
                       <p className="text-xs text-muted-foreground truncate">{member.title}</p>
                     </div>
                     <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                 ))}
               </div>
            </Card>

            {/* Latest Insights List */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  Latest Insights
                </h3>
              </div>
              <div className="space-y-0">
                {POSTS.map((post, i) => (
                  <React.Fragment key={post.id}>
                    {i > 0 && <Separator className="my-3" />}
                    <div className="group cursor-pointer">
                      <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">{post.category}</div>
                      <h4 className="text-sm font-semibold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 text-xs">Read All Articles</Button>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
