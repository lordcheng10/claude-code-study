document.addEventListener('DOMContentLoaded', () => {
  hljs.highlightAll();

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const scrollTopBtn = document.getElementById('scrollTop');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  document.getElementById('content').addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('active'));
          const active = document.querySelector(
            `.nav-link[data-section="${entry.target.id}"]`
          );
          if (active) {
            active.classList.add('active');
            active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      });
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));

  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  });
});
