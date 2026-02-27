'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyEmailButton({ email }: { email: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="mt-6 sm:mt-0 sm:ml-6 px-6 py-3 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center min-w-[160px]"
        >
            {copied ? (
                <>
                    <Check size={18} className="mr-2 text-slate-600" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy size={18} className="mr-2" />
                    Copy Email
                </>
            )}
        </button>
    );
}
