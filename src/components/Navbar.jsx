/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME } from '../constants.js';

export const Navbar = () => {
    return (
        <nav class="fixed top-0 w-full tool-nav backdrop-blur-xl z-50 transition-all duration-300">
            <div class="max-w-6xl mx-auto px-4 sm:px-6">
                <div class="flex items-center justify-between h-16">
                    <a href="#" class="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-300 transition-colors">
                        <img src="/favicon.ico?v=8" alt={APP_NAME + ' logo'} class="w-12 h-12 rounded-lg object-cover shadow-sm" />
                        <span>{APP_NAME}</span>
                    </a>
                    <div class="flex items-center gap-2">
                        <button
                            class="w-9 h-9 rounded-lg format-pill hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center justify-center"
                            x-on:click="toggleDarkMode()"
                            aria-label="Toggle dark mode"
                        >
                            <i class="fas" x-bind:class="darkMode ? 'fa-sun' : 'fa-moon'"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
