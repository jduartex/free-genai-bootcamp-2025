import { useEffect, useState } from "react";

/**
 * Determines if the current viewport width qualifies as mobile (768 pixels or less).
 *
 * This hook initializes a state that represents whether the window's inner width is at most 768 pixels.
 * It sets up an event listener on the window resize event to update this state dynamically, ensuring
 * that the mobile status remains accurate as the viewport changes. The initial state is set based on
 * the window's current width when the hook is first used.
 *
 * @returns True if the viewport width is 768 pixels or less, false otherwise.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
