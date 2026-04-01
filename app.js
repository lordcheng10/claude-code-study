document.addEventListener('DOMContentLoaded', () => {
  hljs.highlightAll();

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const scrollTop = document.getElementById('scrollTop');
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

  const observerOptions = {
    rootMargin: '-80px 0px -60% 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove('active'));
        const activeLink = document.querySelector(
          `.nav-link[data-section="${entry.target.id}"]`
        );
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollTop.classList.add('visible');
    } else {
      scrollTop.classList.remove('visible');
    }
  });

  scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  });
});
