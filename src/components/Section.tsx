import FadeInSection from './FadeInSection';

export default function Section({
    id,
    title,
    children,
    className = ""
}: {
    id: string;
    title?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section id={id} className={`py-16 md:py-24 scroll-mt-16 ${className}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <FadeInSection>
                    {title && (
                        <h2 className="text-3xl font-bold mb-8 text-white relative flex items-center">
                            {title}
                            <div className="ml-6 flex-1 h-[1px] bg-slate-800"></div>
                        </h2>
                    )}
                    {children}
                </FadeInSection>
            </div>
        </section>
    );
}
