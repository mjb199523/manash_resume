import Image from 'next/image';
import { Mail, Linkedin, Download, MapPin, Phone, Copy } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Section from '@/components/Section';
import ExperienceTimeline from '@/components/ExperienceTimeline';
import ProjectCard from '@/components/ProjectCard';
import CopyEmailButton from '@/components/CopyEmailButton';

// ----------------------------------------------------
// DUMMY DATA FOR MISSING PDF
// TODO: Replace these with actual details from the PDF when provided.
const skills = [
  "Project Management", "Agile & Scrum", "Risk Mitigation",
  "Stakeholder Communication", "Resource Allocation", "Process Optimization",
  "Budget Management", "Cross-Functional Leadership"
];

const toolsAndLanguages = [
  "JIRA", "Confluence", "Microsoft Project", "Trello", "Asana", "Tableau",
  "Python", "SQL", "Excel (Advanced)"
];

const experiences = [
  {
    role: "Product Delivery Manager",
    company: "ConveGenius",
    location: "Guwahati, Assam",
    duration: "Dec 2025 - Present",
    description: [
      "Leading the Assam State Vidya Samiksha Kendra (VSK) operation and delivery"
    ]
  },
  {
    role: "Project Management Consultant",
    company: "Grant Thornton Bharat LLP",
    location: "Shillong, Meghalaya",
    duration: "Aug 2024 - Dec 2024",
    description: [
      "Led strategic digital consulting engagements, advising clients on technology-driven transformation initiatives.",
      "Directed end-to-end project execution, ensuring timely delivery, quality outcomes, and alignment with business objectives.",
      "Spearheaded preparation of DPRs, MSRs, gap analysis, and market intelligence reports to support data-driven decision-making.",
      "Managed multi-stakeholder engagements, including government bodies, regulatory authorities, and private sector leaders.",
      "Contributed to state-level digital governance and IT modernization policy formulation.",
      "Oversaw risk management, regulatory compliance, and resolution of critical client escalations.",
      "Identified transformation challenges and drove implementation of scalable, sustainable digital solutions."
    ]
  },
  {
    role: "Technical Project Manager",
    company: "Wednesday Solutions",
    location: "Pune, Maharashtra",
    duration: "Aug 2022 - July 2024",
    description: [
      "Led end-to-end Agile product delivery, facilitating Scrum ceremonies and driving roadmap alignment.",
      "Translated business requirements into PRDs, user stories, and clear technical acceptance criteria.",
      "Owned backlog prioritization, sprint planning, estimation (Story Points), and velocity tracking.",
      "Resolved cross-functional blockers by collaborating with Engineering, QA, and DevOps teams.",
      "Managed multiple product streams, ensuring timely releases through structured release planning and CI/CD coordination.",
      "Led UAT cycles, validated deliverables, and ensured production readiness.",
      "Tracked product health via KPIs (velocity, budget, timelines, defect rates, stakeholder satisfaction).",
      "Utilized Jira for workflow management, reporting dashboards, and issue tracking."
    ]
  },
  {
    role: "Project Manager/Associate Business Analyst",
    company: "SoulpageIT Solutions",
    location: "Hyderabad, Telangana",
    duration: "Jul 2021 - July 2022",
    description: [
      "Organized Scrum meetings with developers and designers, assigned tasks, and reviewed progress.",
      "Gathered and analyzed requirements.",
      "Prepared BRDs, FRDs, SRS, User Stories, User Manuals, FAQs, and onboarding documents.",
      "Managed multiple projects and coordinated diverse stakeholders.",
      "Performed UAT/QA (mainly manual testing) and prepared test cases.",
      "Designed wireframes (using Balsamiq)."
    ]
  },
  {
    role: "Program Manager",
    company: "Social Welfare Department, Government of Assam (Contract)",
    location: "Guwahati, Assam",
    duration: "Sept 2019 - June 2021",
    description: [
      "Established a dedicated higher secondary institution for visually impaired students under government mandate.",
      "Managed recruitment, training, and capacity building of teachers and non-teaching staff.",
      "Coordinated state and central government schemes (Beti Bachao Beti Padhao, scholarships, stipends, uniforms, textbooks).",
      "Facilitated parental engagement and ensured welfare measures improved retention and outcomes.",
      "Drafted reports and policy documentation for state education authorities."
    ]
  }
];

const educationList = [
  {
    degree: "Master of Business Administration (MBA)",
    institute: "Top Tier Business School",
    location: "Delhi, India",
    duration: "2014 - 2016"
  },
  {
    degree: "Bachelor of Technology (B.Tech)",
    institute: "National Institute of Engineering",
    location: "Guwahati, India",
    duration: "2010 - 2014"
  }
];

const certifications = [
  "Project Management Professional (PMP)® - PMI",
  "Certified ScrumMaster (CSM)® - Scrum Alliance",
  "Six Sigma Green Belt"
];

const awards = [
  "Excellence in Project Delivery Award - 2022",
  "Innovator of the Year - 2019"
];

const publication = {
  title: "Handwritten Assamese Character Recognition",
  publisher: "IEEE Xplore",
  description: "A comprehensive study and algorithmic approach to recognizing handwritten Assamese characters utilizing deep learning frameworks."
};
// ----------------------------------------------------

// REAL PROMPT DATA
const projects = [
  {
    title: "OFFSTUMP BMI Calculator",
    description: "A health application that calculates Body Mass Index (BMI) dynamically and presents personalized insights based on user data.",
    link: "https://offstump-bmi.vercel.app/",
    tags: ["Next.js", "React", "Tailwind CSS", "Vercel"]
  },
  {
    title: "OFFSTUMP Website",
    description: "The official landing page and corporate website for OFFSTUMP, featuring a professional and highly responsive design.",
    link: "https://offstumpwebsite.vercel.app/",
    tags: ["Next.js", "React", "Tailwind CSS", "Vercel"]
  },
  {
    title: "OFFSTUMP CRM Dashboard",
    description: "A comprehensive Customer Relationship Management dashboard built for OFFSTUMP to track user interactions, leads, and business metrics.",
    link: "https://offstump-crm.vercel.app/dashboard",
    tags: ["Next.js", "React", "Tailwind CSS", "Vercel"]
  }
];

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-slate-500/30">
      <Navbar />

      {/* HERO SECTION */}
      <section id="about" className="pt-32 pb-16 md:pt-48 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
            Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500">Manashjyoti Barman</span>
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-slate-300 mb-6">
            Project Management Consultant
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-2xl">
            Passionate about driving projects from conception to successful deployment.
            Dedicated to optimizing processes, managing cross-functional teams, and delivering
            high-impact results that align with strategic business goals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <a
              href="/Manashjyoti_Barman_Resume.pdf"
              download
              className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-medium flex items-center transition-colors shadow-lg shadow-slate-900/50"
            >
              <Download size={18} className="mr-2" />
              Download Resume PDF
            </a>
            <a
              href="mailto:manashjyoti.barman07@gmail.com"
              className="px-6 py-3 rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white font-medium flex items-center transition-colors hover:border-slate-500"
            >
              <Mail size={18} className="mr-2" />
              Email
            </a>
            <a
              href="#" // TODO: Update based on PDF
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white font-medium flex items-center transition-colors hover:border-slate-500"
            >
              <Linkedin size={18} className="mr-2" />
              LinkedIn
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-slate-400">
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 text-slate-400" />
              Noida, India
            </div>
            <div className="flex items-center">
              <Phone size={16} className="mr-2 text-slate-400" />
              +91 8753912572
            </div>
          </div>
        </div>

        <div className="relative group shrink-0">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-600 to-slate-400 blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          {/* TODO: Update src to profile.jpg when actual extraction is available */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-slate-900 z-10 bg-slate-800">
            <Image
              src="/profile.png"
              alt="Manashjyoti Barman"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <Section id="skills" title="Skills & Competencies" className="bg-slate-900/20">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center mr-3 text-slate-300">⚡</span>
              Core Competencies
            </h3>
            <div className="flex flex-wrap gap-3">
              {skills.map(skill => (
                <span key={skill} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-500 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center mr-3 text-slate-300">🛠️</span>
              Tools & Languages
            </h3>
            <div className="flex flex-wrap gap-3">
              {toolsAndLanguages.map(tool => (
                <span key={tool} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-500 transition-colors">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* EXPERIENCE */}
      <Section id="experience" title="Professional Experience">
        <ExperienceTimeline experiences={experiences} />
      </Section>

      {/* PROJECTS */}
      <Section id="projects" title="Featured Projects" className="bg-slate-900/20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <ProjectCard key={idx} {...project} />
          ))}
        </div>
      </Section>

      {/* EDUCATION & CERTS */}
      <Section id="education" title="Education & Credentials">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Education */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">🎓 Education</h3>
            <div className="space-y-6">
              {educationList.map((edu, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-700">
                  <div className="absolute w-3 h-3 bg-slate-500 rounded-full -left-[7px] top-1.5 ring-4 ring-slate-900" />
                  <h4 className="font-bold text-lg text-slate-200">{edu.degree}</h4>
                  <p className="text-slate-400 font-medium text-sm my-1">{edu.institute}</p>
                  <p className="text-slate-500 text-xs">{edu.location} &bull; {edu.duration}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications & Awards */}
          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">📜 Certifications</h3>
              <ul className="space-y-3">
                {certifications.map((cert, idx) => (
                  <li key={idx} className="flex items-start text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 mr-3 mt-0.5">✓</span>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">🏆 Awards & Recognition</h3>
              <ul className="space-y-3">
                {awards.map((award, idx) => (
                  <li key={idx} className="flex items-center text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 mr-3">⭐</span>
                    {award}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* PUBLICATION */}
      <Section id="publication" title="Publication" className="bg-slate-900/20">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full blur-3xl group-hover:bg-slate-500/20 transition-all" />
          <h3 className="text-2xl font-bold text-white mb-2">{publication.title}</h3>
          <p className="text-slate-400 font-semibold mb-4 text-sm tracking-wide uppercase">Published in {publication.publisher}</p>
          <p className="text-slate-300 leading-relaxed max-w-3xl">
            {publication.description}
          </p>
        </div>
      </Section>

      {/* CONTACT */}
      <Section id="contact" title="Get In Touch">
        <div className="text-center max-w-2xl mx-auto pb-12">
          <h3 className="text-3xl font-bold text-white mb-6">Let's Work Together</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400">
              <Mail size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500 mb-1">Email directly at</p>
              <p className="text-lg font-bold text-white tracking-wide">manashjyoti.barman07@gmail.com</p>
            </div>
            {/* Copy Email Button logic */}
            <CopyEmailButton email="manashjyoti.barman07@gmail.com" />
          </div>
        </div>
      </Section>

      <footer className="py-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Manashjyoti Barman. All rights reserved.</p>
      </footer>
    </main>
  );
}
