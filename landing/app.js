// W1 Brokers — landing page interactions
(function () {
  "use strict";

  const header = document.querySelector("[data-header]");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const navToggle = document.querySelector("[data-nav-toggle]");
  if (navToggle && header) {
    navToggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    header.querySelectorAll(".primary-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Animate counters once when the hero card scrolls into view
  const counters = document.querySelectorAll("[data-counter]");
  if (counters.length && "IntersectionObserver" in window) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.counter);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const duration = 1200;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = target * eased;
        el.textContent = value.toFixed(decimals);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    counters.forEach((el) => io.observe(el));
  }

  // Close other open <details> in the FAQ when one is opened
  const faq = document.querySelector("[data-faq]");
  if (faq) {
    faq.querySelectorAll("details").forEach((d) => {
      d.addEventListener("toggle", () => {
        if (!d.open) return;
        faq.querySelectorAll("details").forEach((other) => {
          if (other !== d) other.open = false;
        });
      });
    });
  }
})();
