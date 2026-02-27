'use client';
import { ExternalLink, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface ProjectCardProps {
    title: string;
    description: string;
    link: string;
    tags: string[];
}

export default function ProjectCard({ title, description, link, tags }: ProjectCardProps) {
    return (
        <div className="group relative rounded-2xl bg-slate-900/50 border border-slate-800 p-6 hover:bg-slate-800/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-slate-300 transition-colors">
                        {title}
                    </h3>
                    <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                        {description}
                    </p>
                </div>
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-full hover:bg-slate-600 hover:text-white transition-colors"
                    aria-label={`View ${title} live demo`}
                >
                    <ExternalLink size={20} />
                </a>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800/50 rounded-full border border-slate-700/50"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center text-sm font-semibold text-slate-300 hover:text-white group/link w-fit"
            >
                Live Demo
                <ArrowRight size={16} className="ml-1 transform transition-transform group-hover/link:translate-x-1" />
            </a>
        </div>
    );
}
