import "./_group.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Brain, Users, Shield, BookOpen, Lightbulb,
  Heart, Sparkles, Globe, GraduationCap, Microscope,
  Calendar, Clock, MapPin, ExternalLink, UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { PILLARS, STATS, BOARD, POSTS, FEATURED_EVENT } from "./_data";

const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, GraduationCap, Microscope, Users,
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export function Current() {
  const featuredEvent = FEATURED_EVENT;
  const featuredEventDate = new Date(featuredEvent.date + "T00:00:00");

  return (
    <div className="font-sans bg-background text-foreground">
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-primary/5 via-background to-accent/20 dark:from-primary/10 dark:via-background dark:to-accent/10 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="max-w-3xl">
            <motion.div {...fadeIn}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Nonprofit Organization
              </div>
            </motion.div>
            <motion.h1
              {...fadeIn}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Where Humanity
              <br />
              Meets <span className="text-primary">Artificial Intelligence</span>
            </motion.h1>
            <motion.p
              {...fadeIn}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8"
            >
              Bridging the gap between humanity and AI through ethical development, education, and community building. Together, we shape a future where technology serves all.
            </motion.p>
            <motion.div
              {...fadeIn}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <Button size="lg" className="gap-2">
                Learn Our Mission
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Heart className="h-4 w-4" />
                Support Our Work
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-4 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div key={i} {...stagger} transition={{ delay: i * 0.1, duration: 0.4 }} className="text-center py-4">
                <div className="font-serif text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Calendar className="h-3.5 w-3.5" />
              Upcoming Event
            </div>
            <h2 className="font-serif text-3xl font-bold mb-3">Don't miss our next gathering</h2>
            <p className="text-muted-foreground">Join the Humanity + AI community for an upcoming live conversation.</p>
          </motion.div>
          <motion.div {...fadeIn} transition={{ delay: 0.1, duration: 0.5 }}>
            <Card className="overflow-hidden hover-elevate">
              <div className="relative w-full bg-primary/5 overflow-hidden">
                <img src={featuredEvent.imageUrl} alt={featuredEvent.title} className="w-full h-56 sm:h-72 object-cover" />
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-md shadow-md px-3 py-2 flex flex-col items-center min-w-[60px]">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {featuredEventDate.toLocaleString("en-US", { month: "short" }).toUpperCase()}
                  </span>
                  <span className="text-2xl font-bold text-foreground leading-none">
                    {featuredEventDate.getDate()}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-3 py-1 rounded-full font-medium shadow-sm bg-purple-100 text-purple-700">
                    {featuredEvent.type}
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="font-serif text-2xl font-bold mb-3">{featuredEvent.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-5">{featuredEvent.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{featuredEventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{featuredEvent.time}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{featuredEvent.location}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button className="gap-1.5"><UserPlus className="h-4 w-4" />Sign up to attend</Button>
                  <Button variant="outline" className="gap-1.5"><ExternalLink className="h-4 w-4" />Join Event Link</Button>
                  <Button variant="ghost" className="gap-1.5">See all events<ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold mb-4">Our Pillars</h2>
            <p className="text-muted-foreground">Four foundational pillars guide our work in shaping the future of responsible AI.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.iconName];
              return (
                <motion.div key={i} {...stagger} transition={{ delay: i * 0.1, duration: 0.4 }}>
                  <Card className="p-6 h-full hover-elevate">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 text-sm">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-4">About Humanity + AI, Inc.</h2>
              <p className="text-primary-foreground/80 leading-relaxed mb-4">
                Founded in August 2024 by Danielle A. Franklin, a distinguished engineer and technologist with a celebrated career in U.S. defense and aerospace sectors, Humanity + AI, Inc. is a nonprofit dedicated to ensuring that artificial intelligence serves humanity.
              </p>
              <p className="text-primary-foreground/80 leading-relaxed mb-6">
                Recognized by Marquis Who's Who for excellence in technology, defense, and nonprofit services, our organization brings deep technical expertise to the critical conversation about AI's role in society.
              </p>
              <Button variant="secondary" className="gap-2">Read More<ArrowRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brain, label: "AI Research" },
                { icon: Globe, label: "Global Impact" },
                { icon: BookOpen, label: "Education" },
                { icon: Lightbulb, label: "Innovation" },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
                  <item.icon className="h-8 w-8 mx-auto mb-2 text-primary-foreground/90" />
                  <span className="text-sm font-medium text-primary-foreground/90">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 text-xs bg-primary/5 text-primary border-primary/20">Newly Established</Badge>
            <h2 className="font-serif text-3xl font-bold mb-4">Meet Our Board Members</h2>
            <p className="text-muted-foreground">
              Passionate leaders united by a shared mission to help individuals thrive through innovative projects that benefit humanity.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {BOARD.map((member, i) => (
              <motion.div key={i} {...stagger} transition={{ delay: i * 0.12, duration: 0.4 }}>
                <Card className="overflow-hidden hover-elevate cursor-pointer">
                  <div className="h-52 overflow-hidden">
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-foreground font-medium">{member.seat}</span>
                      <span className="text-[10px] text-primary font-medium">{member.highlight}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{member.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{member.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{member.bio}</p>
                    <div className="flex items-center gap-2 text-primary text-xs font-medium">
                      <ArrowRight className="h-3.5 w-3.5" />
                      View Profile
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeIn} className="text-center mt-8">
            <Button variant="outline" className="gap-2">Learn More About Our Board<ArrowRight className="h-4 w-4" /></Button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-2">Latest Insights</h2>
              <p className="text-muted-foreground">Thought leadership from our founder and community.</p>
            </div>
            <Button variant="outline" className="gap-2 hidden sm:flex">View All<ArrowRight className="h-4 w-4" /></Button>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POSTS.map((post, i) => (
              <motion.div key={post.id} {...stagger} transition={{ delay: i * 0.1, duration: 0.4 }}>
                <Card className="h-full hover-elevate cursor-pointer group">
                  <div className="h-40 overflow-hidden rounded-t-lg">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-primary font-medium mb-2">{post.category}</div>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">{post.author}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <GraduationCap className="h-3.5 w-3.5" />
                Free Training
              </div>
              <h2 className="font-serif text-3xl font-bold mb-4">Learn AI at Your Own Pace</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our Learning Hub features the PJMF AI Journey framework, curated free courses from top YouTube educators, open source tools, and resources for every stage. No paywalls, no gatekeeping.
              </p>
              <Button size="lg" className="gap-2"><GraduationCap className="h-4 w-4" />Explore Learning Hub</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, label: "12+ Free Courses", sub: "YouTube verified" },
                { icon: Brain, label: "3 Learning Paths", sub: "Beginner to Advanced" },
                { icon: Lightbulb, label: "8+ Open Source Tools", sub: "Industry standard" },
                { icon: Users, label: "All Skill Levels", sub: "Everyone welcome" },
              ].map((item, i) => (
                <motion.div key={i} {...stagger} transition={{ delay: i * 0.1, duration: 0.4 }}>
                  <Card className="p-4 text-center h-full">
                    <item.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-muted-foreground mb-8">
              Whether you're a tech leader, researcher, student, or simply passionate about responsible AI, there's a place for you in our community.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="gap-2"><Sparkles className="h-4 w-4" />Explore AI Hub</Button>
              <Button size="lg" variant="outline" className="gap-2">Get In Touch</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
