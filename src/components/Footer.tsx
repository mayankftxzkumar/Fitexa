import Link from 'next/link';
import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-fitexa-black text-fitexa-beige py-12 border-t border-fitexa-beige/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                <div className="mb-6 md:mb-0">
                    <Link href="/" className="text-3xl font-black text-fitexa-green tracking-tighter">
                        Fitexa.in
                    </Link>
                    <p className="mt-2 text-sm text-fitexa-beige/60">
                        &copy; {new Date().getFullYear()} Fitexa. All rights reserved.
                    </p>
                </div>

                <div className="flex space-x-8">
                    <Link href="#" className="font-medium text-fitexa-beige/70 hover:text-fitexa-green transition-colors">
                        Terms
                    </Link>
                    <Link href="#" className="font-medium text-fitexa-beige/70 hover:text-fitexa-green transition-colors">
                        Privacy
                    </Link>
                    <Link href="#" className="font-medium text-fitexa-beige/70 hover:text-fitexa-green transition-colors">
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    );
}
