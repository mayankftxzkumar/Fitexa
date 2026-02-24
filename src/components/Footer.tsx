import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-[#050505] text-[#F5F1E8] py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <Link href="/" className="flex items-center justify-center md:justify-start gap-3 text-2xl font-bold tracking-tight text-white mb-2">
                        <Image src="/logo.png" alt="Fitexa Logo" width={28} height={28} className="rounded-md" unoptimized />
                        Fitexa
                    </Link>
                    <p className="text-sm text-white/50">
                        &copy; {new Date().getFullYear()} Fitexa. All rights reserved.
                    </p>
                </div>

                <div className="flex gap-8">
                    <Link href="#" className="font-medium text-white/60 hover:text-white transition-colors text-sm">
                        Terms
                    </Link>
                    <Link href="#" className="font-medium text-white/60 hover:text-white transition-colors text-sm">
                        Privacy
                    </Link>
                    <Link href="#" className="font-medium text-white/60 hover:text-white transition-colors text-sm">
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    );
}
