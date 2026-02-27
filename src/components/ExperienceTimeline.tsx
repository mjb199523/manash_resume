// src/components/ExperienceTimeline.tsx
interface ExperienceItemProps {
    role: string;
    company: string;
    location: string;
    duration: string;
    description: string[];
}

export default function ExperienceTimeline({ experiences }: { experiences: ExperienceItemProps[] }) {
    return (
        <div className="relative border-l border-slate-700 ml-4 md:ml-6 mt-8">
            {experiences.map((exp, idx) => (
                <div key={idx} className="mb-10 ml-8 relative group">
                    <span className="absolute flex items-center justify-center w-4 h-4 rounded-full -left-[40px] md:-left-[42px] ring-4 ring-slate-900 bg-slate-500 group-hover:scale-125 transition-transform" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <h3 className="flex items-center text-lg font-bold text-white">
                            {exp.role}
                        </h3>
                        <span className="text-sm font-medium text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full w-fit">
                            {exp.duration}
                        </span>
                    </div>

                    <div className="mb-4 text-slate-400 font-medium text-sm flex gap-2 items-center">
                        <span className="text-slate-200">{exp.company}</span>
                        <span>&bull;</span>
                        <span>{exp.location}</span>
                    </div>

                    <ul className="list-disc list-outside ml-4 text-slate-400 space-y-2 text-sm leading-relaxed marker:text-slate-600">
                        {exp.description.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
