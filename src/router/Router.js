/* Router.js - Clean URL routing with History API */

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.init();
  }

  init() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.handleRoute();
    });

    // Handle initial load
    this.handleRoute();

    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"], a[href^="#"]');
      if (link && !link.hasAttribute('target')) {
        const href = link.getAttribute('href');
        if (href.startsWith('/') || href.startsWith('#')) {
          e.preventDefault();
          this.navigate(href);
        }
      }
    });
  }

  async handleRoute() {
    try {
      const path = window.location.pathname;

      if (path === '/' || path === '/index.html') {
        if (this.routes.home) {
          await this.routes.home();
        }
      } else if (path === '/collection') {
        if (this.routes.collection) {
          await this.routes.collection();
        }
      } else if (path === '/wishlist') {
        if (this.routes.wishlist) {
          await this.routes.wishlist();
        }
      } else if (path === '/admin') {
        if (this.routes.admin) {
          await this.routes.admin();
        }
      } else if (path === '/admin-login') {
        if (this.routes.adminLogin) {
          await this.routes.adminLogin();
        }
      } else if (path.startsWith('/product')) {
        const slug = path.replace(/^\/product\/?/, '').replace(/\/$/, '');
        if (!slug) {
          if (this.routes.notFound) {
            await this.routes.notFound();
          }
          return;
        }
        if (this.routes.product) {
          await this.routes.product(slug);
        }
      } else {
        if (this.routes.notFound) {
          await this.routes.notFound();
        }
      }
    } catch (error) {
      console.error('Routing error:', error);
      if (window.showErrorNotification) {
        window.showErrorNotification('Failed to load page. Please try again.');
      }
      // Fallback to home
      if (this.routes.home) {
        await this.routes.home();
      }
    }
  }

  navigate(path) {
    if (path.startsWith('#')) {
      // Handle legacy hash URLs
      if (path === '#home') {
        path = '/';
      } else if (path.startsWith('#product-')) {
        const id = path.replace('#product-', '');
        path = `/product/${id}`;
      }
    }

    // Show progress bar
    const progressBar = document.getElementById('page-progress');
    if (progressBar) {
      progressBar.classList.add('active');
      progressBar.style.width = '30%';
    }

    // Add exit animation to main content
    const main = document.getElementById('main');
    if (main) {
      main.classList.add('page-exit');

      // Progress to 60%
      if (progressBar) {
        setTimeout(() => (progressBar.style.width = '60%'), 50);
      }

      // Wait for exit animation before navigating
      setTimeout(() => {
        window.history.pushState({}, '', path);
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Progress to 90%
        if (progressBar) {
          progressBar.style.width = '90%';
        }

        this.handleRoute();

        // Remove exit class after navigation
        requestAnimationFrame(() => {
          main.classList.remove('page-exit');

          // Complete progress bar
          if (progressBar) {
            progressBar.style.width = '100%';
            setTimeout(() => {
              progressBar.classList.remove('active');
              progressBar.style.width = '0%';
            }, 300);
          }
        });
      }, 150);
    } else {
      window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.handleRoute();

      // Complete progress bar
      if (progressBar) {
        progressBar.style.width = '100%';
        setTimeout(() => {
          progressBar.classList.remove('active');
          progressBar.style.width = '0%';
        }, 300);
      }
    }
  }
}
