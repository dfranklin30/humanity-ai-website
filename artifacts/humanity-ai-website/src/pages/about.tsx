import { PageMeta } from "@/components/page-meta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Award, Target, Eye, Heart, Rocket, Shield,
  Users, BookOpen, ArrowRight, Globe, Star, ExternalLink, PlayCircle
} from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import { EditorialMasthead } from "@/components/editorial-masthead";
import daniellePhoto from "@assets/image_1775903656206.png";
import jofiaPhoto from "@assets/image_1775903668936.png";
import williamPhoto from "@assets/william_portrait_opt.webp";
import nirmalPhoto from "@assets/1profile-pic_1776517679611.jpg";
import williamZhuPhoto from "@assets/william_zhu_portrait_opt.webp";
import mikePhoto from "@assets/mike_portrait_opt.webp";
import davidWoodPhoto from "@assets/David_Wood212_-_edit_may_2026_1779893283704.jpg";
import vasuPhoto from "@assets/headshot_Vasu_AI_Advertisting_1779900210920.jpeg";
import vinaPhoto from "@assets/image_1780429062430.png";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const values = [
  { icon: Shield, title: "Ethical Responsibility", desc: "We hold ourselves to the highest standards of ethical AI development and deployment." },
  { icon: Users, title: "Inclusivity", desc: "Technology should serve all of humanity, not just a privileged few." },
  { icon: Eye, title: "Transparency", desc: "Open communication and explainable AI systems build trust and accountability." },
  { icon: Heart, title: "Empathy", desc: "Human-centered design begins with deep understanding of human needs and experiences." },
  { icon: Rocket, title: "Innovation", desc: "We push boundaries while maintaining our commitment to responsible development." },
  { icon: Globe, title: "Global Impact", desc: "Our work transcends borders, aiming for positive change across communities worldwide." },
];

const timeline = [
  { year: "Aug 2024", title: "Founded", desc: "Humanity + AI, Inc. established as a nonprofit organization by Danielle A. Franklin." },
  { year: "2024", title: "Tech Leadership Community", desc: "Launched techleadershipcommunity.com to connect and mentor emerging tech leaders." },
  { year: "2025", title: "Project ROSIE", desc: "Initiated groundbreaking research in AI-assisted interspecies communication." },
  { year: "Nov 2025", title: "Marquis Who's Who", desc: "Danielle recognized for excellence in technology, defense, and nonprofit services." },
  { year: "2025", title: "Book Series", desc: "\"A Science of the Canine Mind\" two-volume series developed for winter release." },
  { year: "2026", title: "Community Growth", desc: "Expanding AI literacy programs and ethical AI workshops globally." },
];

function BoardCard({ slug, testId, children }: { slug: string; testId: string; children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const navigate = () => setLocation(`/about/board/${slug}`);
  return (
    <Card
      className="h-full overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      data-testid={testId}
      onClick={navigate}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(); } }}
      tabIndex={0}
      role="link"
    >
      {children}
    </Card>
  );
}

export default function About() {
  return (
    <div>
      <PageMeta
        title="About — Mission, Board & Story"
        description="Learn about Humanity + AI, Inc. — our mission to bridge humanity and artificial intelligence, our founding story, and the board of directors driving ethical AI education and community empowerment."
        canonical="/about"
      />
      <EditorialMasthead kicker="The Organization" title="About" tagline="Mission, Board & Story" />
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Target className="h-3.5 w-3.5" />
              About Us
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="text-about-title">
              Our Mission is to Ensure AI Serves{" "}
              <span className="text-primary">Humanity</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Humanity + AI, Inc. is a nonprofit organization dedicated to bridging the gap between technological advancement and human values, ensuring that artificial intelligence is developed responsibly and equitably.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div {...fadeIn}>
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/10 h-full">
                <h3 className="font-serif text-xl font-bold mb-4" data-testid="text-vision-statement">Vision Statement</h3>
                <blockquote className="text-lg text-muted-foreground italic leading-relaxed border-l-2 border-primary pl-4">
                  "We envision a world where artificial intelligence amplifies human potential, preserves our dignity, and enhances connection across all species. Technology should be a bridge, not a barrier."
                </blockquote>
                <p className="text-sm text-muted-foreground mt-4">- Danielle A. Franklin</p>
              </Card>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.2, duration: 0.5 }}>
              <Card className="p-8 h-full">
                <h3 className="font-serif text-xl font-bold mb-4" data-testid="text-mission-statement">Mission Statement</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To advance the responsible development and ethical deployment of artificial intelligence through research, education, community building, and advocacy, ensuring that AI technologies serve the well-being of all humanity.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-accent/30 via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Users className="h-3.5 w-3.5" />
              Leadership
            </div>
            <h2 className="font-serif text-3xl font-bold mb-4" data-testid="text-board-title">Meet Our Board Members</h2>
            <p className="text-muted-foreground">
              United by a shared passion for helping individuals thrive through exploratory, out-of-the-box projects that benefit humanity — our newly established board brings together expertise in AI architecture, ethics governance, adaptive technology, and strategic growth, fueled by grants and donations from our community partners.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <BoardCard slug="danielle-franklin" testId="card-board-danielle">
                <div className="h-64 overflow-hidden">
                  <img
                    src={daniellePhoto}
                    alt="Danielle A. Franklin"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-primary/5 text-primary border-primary/20">Seat 1 — Founder & Board Chair</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-danielle">Danielle A. Franklin</h3>
                  <p className="text-sm text-primary font-medium mb-3">Founder, Executive Director & Board Chair</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Defense technology executive and AI innovator with 20+ years driving mission-impact across OSD, SDA, U.S. Navy, MDA, and USSF. Chief Architect of SDA's $1.8B+ Proliferated Warfighter Space Architecture and author of the DoD Digital Engineering Body of Knowledge. Former NVIDIA DoD AI strategist. President of N Systems LLC and Founder of Doolittle Corporation, commercializing patent-pending AI technologies including ROSIE, TalkingDOG, BEN Logic, and F2FTX.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    M.S. Cybersecurity Policy · M.S. IT & Software Engineering · B.S. Aerospace Engineering — UMD · NVIDIA GPU Genius · Marquis Who's Who 2025 & 2026
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <BoardCard slug="jofia-jose-prakash" testId="card-board-jofia">
                <div className="h-64 overflow-hidden">
                  <img
                    src={jofiaPhoto}
                    alt="Jofiah Jose Prakash"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-500/20">Seat 2 — AI Ethics & Governance</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-jofia">Jofiah Jose Prakash</h3>
                  <p className="text-sm text-primary font-medium mb-3">AI Ethics & Governance Director</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Enterprise AI Architect with 15+ years of experience in software engineering and machine learning. Holds 4 AI patents and leads AI architecture at the American Chemical Society. AI Ethics Chair for The American Council for Ethical AI. M.S. in Computer Science. Active international conference speaker on LLMs, RAG, and agentic AI.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    Responsible AI Policy & Federal Alignment
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary text-xs font-medium">
                      <ArrowRight className="h-3.5 w-3.5" />
                      View Full Profile
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">4 AI Patents</span>
                    </div>
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <BoardCard slug="william-kreitzer" testId="card-board-william">
                <div className="h-64 overflow-hidden">
                  <img
                    src={williamPhoto}
                    alt="William Kreitzer"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Seat 3 — Finance & Fundraising Strategy</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-william">William Kreitzer</h3>
                  <p className="text-sm text-primary font-medium mb-3">Finance & Fundraising Strategist</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Oversees financial health, grant strategy, donor development, and budget planning. Leads efforts to secure and steward funding from foundations, federal sources, and philanthropic partners. Senior Manufacturing Engineer at Anduril Industries with over a decade of experience in advanced aerospace and defense at GE Aerospace and ZeroAvia. Founder of InclusiCare and InclusiGear. MBA from William Jewell College; B.S. Engineering Management from Arizona State University.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    Grant Strategy, Donor Development & Budget Planning
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <BoardCard slug="nirmal-jingar" testId="card-board-nirmal">
                <div className="h-64 overflow-hidden">
                  <img
                    src={nirmalPhoto}
                    alt="Nirmal Jingar"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20">Seat 4 — AI & Emerging Technology Strategy and Governance</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-nirmal">Nirmal Jingar</h3>
                  <p className="text-sm text-primary font-medium mb-3">AI & Emerging Technology Strategy and Governance Director</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Senior technology leader directing enterprise AI, platforms, and modernization at Wayfair, with cumulative impact of $300M+ across global supply chain and logistics systems. IEEE Senior Member, Forbes Technology Council member, and recognized AI governance voice with multiple patents in agentic AI and supply chain orchestration.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    Responsible AI Frameworks · Enterprise AI at Production Scale · MIT AI Strategy & Leadership
                  </p>
                  <a
                    href="https://www.youtube.com/watch?v=pxUChqiyp2Y"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-3 hover:underline"
                    data-testid="link-tedx-nirmal"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Watch TEDx Talk
                  </a>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <BoardCard slug="mike-klyce" testId="card-board-mike">
                <div className="h-64 overflow-hidden">
                  <img
                    src={mikePhoto}
                    alt="Mike Klyce"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-rose-500/5 text-rose-700 dark:text-rose-400 border-rose-500/20">Seat 5 — Chief Legal & AI Governance Officer</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-mike">Mike Klyce</h3>
                  <p className="text-sm text-primary font-medium mb-3">Chief Legal & AI Governance Officer (CLAGO)</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Founder & CEO of EnscribeAI and Founder of Artist in the Model. Duke Law-trained attorney and former Katten Muchin Rosenman partner working at the intersection of law, frontier AI, and human creativity — focused on rights-clear human training data, transparency, and human-AI alignment at global scale.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    AI Governance · Training-Data Rights & Provenance · Human-AI Alignment · Global AI Policy
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.05, duration: 0.5 }}
            >
              <BoardCard slug="david-wood" testId="card-board-david-wood">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={davidWoodPhoto}
                    alt="David Wood"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-md" data-testid="badge-new-board-david-wood">
                    Newly Appointed
                  </div>
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 border-indigo-500/20">Seat 6 — Strategic Partnerships & Human-Centered AI</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-david-wood">David Wood</h3>
                  <p className="text-sm text-primary font-medium mb-3">Board Director, Strategic Partnerships & Human-Centered AI</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Strategic coach, trusted advisor, and USMC veteran with 40+ years across startups, executive leadership, and federal technology sales. Founding Partner of Gladwood LLC, Senior Advisor at Neuroscale, Senior Board Advisor at the National Artificial Intelligence Association, and board member of Operation Beautiful Feet. M.S. Systems Engineering, Naval Postgraduate School; B.S. Business Administration & Computer Science, University of Florida.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    Strategic Partnerships · Human-Centered AI · Executive Coaching · Federal & GovTech
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <BoardCard slug="vasu-raj-jain" testId="card-board-vasu">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={vasuPhoto}
                    alt="Vasu Raj Jain"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-md" data-testid="badge-new-board-vasu">
                    Newly Appointed
                  </div>
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-teal-500/5 text-teal-700 dark:text-teal-400 border-teal-500/20">Seat 7 — Chief of AI in Advertising & Media</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-vasu">Vasu Raj Jain</h3>
                  <p className="text-sm text-primary font-medium mb-3">Chief of AI in Advertising & Media</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Senior Software Development Engineer at Amazon Ads, leading large-scale ad serving infrastructure that generates billions in annual revenue across Prime Video, live sports, and DOOH. Forbes Technology Council member and IAB Tech Lab contributor. Designs hybrid multi-tenant systems handling millions of requests per second and builds agentic AI solutions on MCP servers and RAG. M.S. Computer Science, University of Florida.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    AI Infrastructure · Agentic AI · Advertising & Media · Engineering Leadership
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.3, duration: 0.5 }}
            >
              <BoardCard slug="vina-torossian" testId="card-board-vina">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={vinaPhoto}
                    alt="Vina Torossian"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-md" data-testid="badge-new-board-vina">
                    Newly Appointed
                  </div>
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-fuchsia-500/5 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20">Seat 8 — Director, Human Authenticity, Leadership, Consciousness &amp; AI, and Board Treasurer</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-vina">Vina Torossian</h3>
                  <p className="text-sm text-primary font-medium mb-3">Director, Human Authenticity, Leadership, Consciousness &amp; AI, and Board Treasurer</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Vice President and Cash Management Relationship Leader at Northern Bank with 20+ years across global transaction banking, treasury strategy, and trade finance — stewarding a $200M+ commercial portfolio. Formerly RBC Investor & Treasury Services and Bank of America. Founder of the leadership consultancy Karaka, TEDx speaker, and international keynote presenter, fluent in English, Armenian, and French.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    Treasury Strategy · Capital & Liquidity · Institutional Partnerships · Leadership
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <BoardCard slug="william-zhu" testId="card-board-william-zhu">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={williamZhuPhoto}
                    alt="William Zhu"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-md" data-testid="badge-new-board-william-zhu">
                    Newly Appointed
                  </div>
                </div>
                <div className="p-6">
                  <Badge variant="outline" className="text-[10px] mb-3 bg-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-500/20">Seat 9 — Applied AI & Community Strategy</Badge>
                  <h3 className="font-semibold text-lg" data-testid="text-board-william-zhu">William Zhu</h3>
                  <p className="text-sm text-primary font-medium mb-3">Board Director, Applied AI & Community Strategy</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Applied AI builder, data scientist, and community organizer. Senior Data Scientist & Applied AI Engineer at Choice Hotels International — shipping ML and AI products across thousands of properties — and founding organizer of Washington, DC's AI Discussion Club, convening 900+ AI builders. Named a 2026 RealLIST Connector by Technical.ly.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    Applied AI Products · Community & Ecosystem Growth · Responsible AI Adoption · M.A. Computational Social Science, UChicago
                  </p>
                  <a
                    href="https://williamzhu.ai/projects"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-3 hover:underline"
                    data-testid="link-portfolio-william-zhu"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    williamzhu.ai
                  </a>
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Full Profile
                  </div>
                </div>
              </BoardCard>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold mb-4" data-testid="text-values-title">Our Values</h2>
            <p className="text-muted-foreground">
              These core values guide every decision we make and every initiative we pursue.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="p-6 h-full hover-elevate">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <v.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold mb-4 text-white" data-testid="text-timeline-title">Our Journey</h2>
            <p className="text-white/70">Key milestones in our mission to bridge humanity and AI.</p>
          </motion.div>
          <div className="max-w-2xl mx-auto space-y-0">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1.5" />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-white/15" />}
                </div>
                <div className="pb-8">
                  <div className="text-xs text-emerald-300 font-semibold mb-1">{item.year}</div>
                  <h3 className="font-semibold text-sm mb-1 text-white">{item.title}</h3>
                  <p className="text-sm text-white/70">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <h2 className="font-serif text-3xl font-bold mb-4">Be Part of the Movement</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Join us in shaping a future where AI and humanity thrive together.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/donate">
                <Button variant="secondary" size="lg" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Support Our Mission
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="gap-2 text-primary-foreground border-primary-foreground/30">
                  Contact Us
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
