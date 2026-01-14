export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-black border-t border-[#f0f5fa] dark:border-gray-800 py-6 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm tracking-widest-label uppercase text-black/50 dark:text-[#c5b26f]/70">
            © {currentYear} Muha Meds & Dialed Moods. All rights reserved.
          </p>
          <p className="text-sm text-black/50 dark:text-[#c5b26f]/70 mt-4 md:mt-0">
            AI-Powered Lead Generation
          </p>
        </div>
      </div>
    </footer>
  );
}
