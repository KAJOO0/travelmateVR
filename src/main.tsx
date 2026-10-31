import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@/i18n';
import '@/services/overlays';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/layout.css';
import { routes } from '@/app/routes';
import { initPwa } from '@/app/pwa';
import { PreferencesProvider } from '@/app/providers/PreferencesProvider';
import { WishlistProvider } from '@/app/providers/WishlistProvider';

initPwa();
const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <PreferencesProvider>
        <WishlistProvider>
          <RouterProvider router={router} />
        </WishlistProvider>
      </PreferencesProvider>
    </Suspense>
  </StrictMode>
);
