import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type * as Leaflet from 'leaflet';
import { usePreferences } from '@/app/providers/PreferencesProvider';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  title: string;
  subtitle?: string;
  href?: string;
}

interface Props {
  points: MapPoint[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  /** Draws a route through the points in order (itineraries). */
  route?: boolean;
  label: string;
  className?: string;
}

// Map provider is isolated here. The default is the keyless OpenStreetMap tile server (fine for previews and
// light traffic; dark mode darkens it with a CSS filter). For production traffic set VITE_MAP_TILES_LIGHT/DARK
// to a provider with a domain-restricted public key (MapTiler, Stadia, Mapbox), plus VITE_MAP_ATTRIBUTION.
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const env = import.meta.env;
const TILES = {
  light: (env.VITE_MAP_TILES_LIGHT as string | undefined) || OSM,
  dark: (env.VITE_MAP_TILES_DARK as string | undefined) || ''
};
const ATTRIBUTION = (env.VITE_MAP_ATTRIBUTION as string | undefined) || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function MapView({ points, activeId, onSelect, route, label, className = 'map' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resolvedTheme } = usePreferences();
  const el = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const tiles = useRef<Leaflet.TileLayer | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  // Load Leaflet only when the map scrolls into view.
  useEffect(() => {
    if (!el.current) return;
    const io = new IntersectionObserver(es => { if (es[0]?.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(el.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !el.current) return;
    let cancelled = false;
    void Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([mod]) => {
      if (cancelled || !el.current) return;
      const lf = (mod as unknown as { default: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet);
      L.current = lf;
      map.current = lf.map(el.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true, worldCopyJump: true });
      layer.current = lf.layerGroup().addTo(map.current);
      setReady(true);
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; setReady(false); };
  }, [visible]);

  useEffect(() => {
    if (!ready || !map.current || !L.current) return;
    tiles.current?.remove();
    const darkTiles = resolvedTheme === 'dark' && TILES.dark;
    tiles.current = L.current.tileLayer(darkTiles || TILES.light, {
      attribution: ATTRIBUTION, maxZoom: 18,
      // No dedicated dark style configured: darken the light tiles instead.
      className: resolvedTheme === 'dark' && !darkTiles ? 'tm-tiles-dim' : ''
    }).addTo(map.current);
  }, [ready, resolvedTheme]);

  useEffect(() => {
    if (!ready || !map.current || !L.current || !layer.current) return;
    const lf = L.current;
    layer.current.clearLayers();
    markers.current.clear();
    // Points within ~20 km of each other (several listings at one park) share an anchor and are stacked
    // vertically, so labels never collide.
    const groups: { lat: number; lng: number; ids: string[] }[] = [];
    const groupOf = new Map<string, (typeof groups)[number]>();
    points.forEach(p => {
      let g = groups.find(x => Math.abs(x.lat - p.lat) < 0.18 && Math.abs(x.lng - p.lng) < 0.18);
      if (!g) groups.push((g = { lat: p.lat, lng: p.lng, ids: [] }));
      g.ids.push(p.id);
      groupOf.set(p.id, g);
    });
    const byId = new Map(points.map(p => [p.id, p]));
    const pin = (label: string, dy = 0) => lf.divIcon({ className: '', html: `<span class="tm-pin-slot" style="top:${dy}px"><span class="tm-pin">${esc(label)}</span></span>`, iconSize: [0, 0] });
    const wireLinks = (m: Leaflet.Marker) => m.on('popupopen', e => {
      (e.popup.getElement() as HTMLElement | undefined)?.querySelectorAll<HTMLAnchorElement>('a[data-href]').forEach(a =>
        a.addEventListener('click', ev => { ev.preventDefault(); navigate(a.dataset.href!); }));
    });
    const entry = (p: MapPoint) => `<b>${esc(p.title)}</b>${p.subtitle ? `<br>${esc(p.subtitle)}` : ''}${p.href ? `<br><a href="${esc(p.href)}" data-href="${esc(p.href)}">${esc(t('map.open'))}</a>` : ''}`;
    for (const g of groups) {
      if (g.ids.length > 4) {
        // Too many to stack: one count pin whose popup lists every place.
        const items = g.ids.map(id => byId.get(id)!);
        const m = lf.marker([g.lat, g.lng], { icon: pin(t('map.count', { count: items.length })), title: items[0]!.subtitle ?? items[0]!.title, keyboard: true });
        m.bindPopup(`<div class="tm-pop-list">${items.map(entry).join('<hr>')}</div>`, { maxHeight: 260 });
        wireLinks(m).addTo(layer.current);
        g.ids.forEach(id => markers.current.set(id, m));
        continue;
      }
      g.ids.forEach((id, i) => {
        const p = byId.get(id)!;
        const m = lf.marker([g.lat, g.lng], { icon: pin(p.label, (i - (g.ids.length - 1) / 2) * 40), title: p.title, keyboard: true, alt: p.title });
        m.bindPopup(entry(p));
        m.on('click', () => onSelect?.(p.id));
        wireLinks(m).addTo(layer.current!);
        markers.current.set(p.id, m);
      });
    }
    if (route && points.length > 1) lf.polyline(points.map(p => [p.lat, p.lng] as [number, number]), { color: '#00a6f4', weight: 3, dashArray: '6 8' }).addTo(layer.current);
    if (points.length) {
      const bounds = lf.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
      map.current.fitBounds(bounds.pad(0.25), { maxZoom: points.length === 1 ? 9 : 8 });
    } else map.current.setView([-6.3, 34.8], 5);
  }, [ready, points, route, onSelect, navigate, t]);

  useEffect(() => {
    markers.current.forEach((m, id) => {
      const pin = m.getElement()?.querySelector('.tm-pin');
      pin?.classList.toggle('on', id === activeId);
      if (id === activeId) m.setZIndexOffset(1000); else m.setZIndexOffset(0);
    });
  }, [activeId, ready, points]);

  return <div ref={el} className={className} role="region" aria-label={label} />;
}
