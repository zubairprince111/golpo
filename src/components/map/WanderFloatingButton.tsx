import { useState } from "react";
import { Shuffle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function WanderFloatingButton({
  onWander,
}: {
  onWander: () => void;
}) {
  const [animating, setAnimating] = useState(false);

  function handleClick() {
    setAnimating(true);
    onWander();
    setTimeout(() => setAnimating(false), 700);
  }

  return (
    <div className="fixed bottom-20 right-4 z-[590] sm:bottom-24 sm:right-6 pointer-events-auto">
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        title="Wander to random story"
        aria-label="Wander to random story"
        className={cn(
          "flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full amou-glass-pill shadow-lg transition-all duration-200 hover:bg-white text-[#1D1D1F]",
        )}
      >
        <Shuffle
          className={cn(
            "h-4 w-4 sm:h-5 sm:w-5 text-[#3A3A3C] transition-transform duration-500",
            animating && "rotate-180 scale-110 text-black",
          )}
          strokeWidth={2}
        />
      </motion.button>
    </div>
  );
}
