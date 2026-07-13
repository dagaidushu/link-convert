/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME, APP_VERSION } from '../constants.js';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer class="mt-12 py-8 border-t border-gray-200/70 dark:border-gray-800/80 bg-white/35 dark:bg-gray-950/30 backdrop-blur-sm">
            <div class="max-w-6xl mx-auto px-4 sm:px-6">
                <div class="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                    <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-600 dark:text-gray-400 text-center md:text-left">
                        <span class="text-sm">© {currentYear} {APP_NAME}. All rights reserved.</span>
                        <span class="hidden md:inline text-gray-300 dark:text-gray-700">|</span>
                        <span class="text-xs px-2 py-0.5 rounded-lg format-pill font-mono">
                            v{APP_VERSION}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
