import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowRight, Plus, Menu } from "lucide-react";
import { useHomepageSettings } from "./useHomepageSettings";

export default function HomePage({
  onExploreClick,
}: {
  onExploreClick: () => void;
  cartItemsCount?: number;
  onNavigateToCart?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToProfile?: () => void;
}) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { settings, loading } = useHomepageSettings();

  // IntersectionObserver — reveal cards as they enter the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("card-visible");
        });
      },
      { threshold: 0.1 }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/*
       * HOW THE SCROLL EFFECT WORKS
       * ─────────────────────────────────────────────────────────
       * 1. The hero wrapper is `position: sticky; top: 60px`.
       *    It stays pinned under the nav bar while the page scrolls.
       *    Its z-index is LOW (z-0) so the sheet can cover it.
       *
       * 2. The white content sheet is a totally normal flow element
       *    that comes AFTER the hero in the DOM.
       *    It has a negative margin-top so it starts slightly overlapping
       *    the hero (rounded peek effect).
       *    Its z-index is HIGH (z-10) so it paints over the hero.
       *
       * 3. When the user scrolls, the sheet moves UP naturally and
       *    covers the stuck hero. No JS required for this at all.
       *
       * 4. The outer wrapper has `background: #eaeaec` (same as the
       *    app shell bg) so the area "behind" the hero looks correct.
       * ─────────────────────────────────────────────────────────
       */}

      <div className="w-full bg-[#eaeaec]">

        {/* ── HERO (sticky — stays pinned as sheet slides over it) ── */}
        <div
          className="sticky z-0"
          style={{ top: 60, height: "65vh" }}
        >
          {/* Rounded card — 20px radius */}
          <div
            className="absolute inset-0 mx-4 overflow-hidden shadow-md"
            style={{ borderRadius: 20 }}
          >
            <img
              src={settings.heroImage}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Menu button — below the hero card, inside the sticky zone */}
          <div className="absolute bottom-3 left-7" style={{ zIndex: 2 }}>
            <button
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm
                         text-gray-800 px-4 py-2 rounded-full shadow-md
                         text-[11px] font-black tracking-widest uppercase
                         hover:bg-white active:scale-95 transition-all"
            >
              <Menu size={16} strokeWidth={2.5} />
              Menu
            </button>
          </div>
        </div>

        {/* ── WHITE SHEET (normal flow — scrolls up over the sticky hero) ── */}
        <div
          className="relative z-10 bg-white"
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -40, /* overlap the hero peek so sheet starts inside it */
          }}
        >
          {/* Drag pill */}
          <div className="flex justify-center pt-3 pb-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Explore button */}
          <div className="px-6 pt-5 pb-6 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onExploreClick}
              className="bg-[#f51c27] font-heading w-full max-w-[280px] rounded-full
                         py-4 text-[18px] font-black text-white
                         shadow-[0_8px_16px_rgba(245,28,39,0.3)]
                         hover:bg-[#d90429] transition-all"
            >
              EXPLORE MENU
            </motion.button>
          </div>

          {/* ── Crowd Favorites ── */}
          <div className="pb-12 px-5">
            <p className="text-[#f51c27] text-[10px] font-bold tracking-[0.2em] mb-1">
              CROWD FAVORITES
            </p>
            <h2 className="font-heading text-[32px] leading-[1.05] font-black uppercase text-black mb-6">
              Try out our<br />crowd favorites
            </h2>

            <div className="flex flex-col gap-4">
              {settings.crowdFavorites.map((item, i) => (
                <div
                  key={item.id}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className="food-reveal-card relative w-full aspect-[4/5] max-h-[340px] rounded-[16px] overflow-hidden shadow-sm cursor-pointer"
                  style={{ transitionDelay: `${i * 70}ms` }}
                  onClick={onExploreClick}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="font-heading text-white text-[28px] leading-[1.05] font-black italic drop-shadow-md pr-2">
                        {item.title}
                      </h3>
                      <p className="text-white/80 text-[12px] font-medium mt-1">
                        {item.subtitle}
                      </p>
                    </div>
                    <button
                      className={`shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center
                        ${item.action === "add"
                          ? "bg-[#f51c27] text-white shadow-lg"
                          : "bg-white text-[#f51c27]"}`}
                    >
                      {item.action === "add"
                        ? <Plus size={24} strokeWidth={3} />
                        : <ArrowRight size={24} strokeWidth={3} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* ── About Section ── */}
          {(settings.aboutHeading || settings.aboutSubheading) && (
            <div className="pb-16 px-5 fade-in-section">
              <div className="bg-[#1c1c1a] rounded-[24px] p-8 text-center flex flex-col items-center shadow-md relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#f51c27] opacity-20 rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#f51c27] opacity-10 rounded-tr-full" />
                
                <div className="relative z-10 w-full flex flex-col items-center">
                  <div className="w-12 h-1 bg-[#f51c27] rounded-full mb-6" />
                  
                  {settings.aboutHeading && (
                    <h2 className="font-heading text-[32px] md:text-[36px] leading-[1.1] font-black uppercase text-white mb-4 tracking-wide">
                      {settings.aboutHeading}
                    </h2>
                  )}
                  {settings.aboutSubheading && (
                    <p className="text-gray-300 text-[15px] md:text-[16px] leading-[1.7] max-w-[480px]">
                      {settings.aboutSubheading}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <footer className="w-full py-12 flex flex-col items-center bg-white border-t border-gray-100">
            <div className="w-[140px] h-[50px] mb-8 grayscale hover:grayscale-0 transition-all duration-300">
              <img src={settings.logoImage} alt="Tasty Hot Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex justify-center gap-8 text-[11px] font-bold tracking-widest text-black mb-8 px-4 flex-wrap">
              <button onClick={onExploreClick} className="uppercase hover:text-[#f51c27] transition-colors">HOME</button>
              <button onClick={onExploreClick} className="uppercase hover:text-[#f51c27] transition-colors">MENU</button>
              <button className="uppercase hover:text-[#f51c27] transition-colors">LOCATIONS</button>
              <button className="uppercase hover:text-[#f51c27] transition-colors">ABOUT US</button>
            </div>
            <p className="text-[10px] text-gray-400">© 2026 Tasty Hot. All rights reserved.</p>
            <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
              <a href="#" className="hover:text-gray-800">Privacy Policy</a>
              <a href="#" className="hover:text-gray-800">Terms of Service</a>
            </div>
          </footer>

        </div>{/* end white sheet */}
      </div>

      {/* Card reveal styles */}
      <style>{`
        .food-reveal-card {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .food-reveal-card.card-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </>
  );
}
