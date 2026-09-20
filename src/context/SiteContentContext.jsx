import { createContext, useContext, useEffect, useRef, useState } from "react";
import { idbGet, idbSet } from "../utils/siteContentDb";
import { CONTENT_TYPES, COLLECTION_KEYS } from "../data/contentTypes";
import defaultPoster from "../assets/img/mainImage.png";
import defaultVideo from "../assets/videos/fishing.mp4";

const SiteContentContext = createContext(null);

let nextId = 1;
const genId = () => `sc-${Date.now()}-${nextId++}`;

const toDisplay = (value) => (value instanceof Blob ? URL.createObjectURL(value) : value);

const toDisplayCollection = (key, rawArray) =>
  rawArray.map((item) => ({ ...item, [CONTENT_TYPES[key].imageField]: toDisplay(item[CONTENT_TYPES[key].imageField]) }));

export const SiteContentProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [heroRaw, setHeroRaw] = useState({ video: null, poster: null });
  const [heroDisplay, setHeroDisplay] = useState({ videoSrc: defaultVideo, posterSrc: defaultPoster });
  const [collectionsRaw, setCollectionsRaw] = useState(() =>
    Object.fromEntries(COLLECTION_KEYS.map((k) => [k, null]))
  );
  const [display, setDisplay] = useState(() =>
    Object.fromEntries(COLLECTION_KEYS.map((k) => [k, CONTENT_TYPES[k].defaults]))
  );
  const createdUrls = useRef([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [heroStored, ...collectionEntries] = await Promise.all([
        idbGet("hero"),
        ...COLLECTION_KEYS.map((key) => idbGet(key)),
      ]);
      if (cancelled) return;

      if (heroStored) {
        setHeroRaw(heroStored);
        setHeroDisplay({
          videoSrc: heroStored.video ? toDisplay(heroStored.video) : defaultVideo,
          posterSrc: heroStored.poster ? toDisplay(heroStored.poster) : defaultPoster,
        });
      }

      const newCollectionsRaw = {};
      const newDisplay = {};
      COLLECTION_KEYS.forEach((key, i) => {
        const stored = collectionEntries[i];
        newCollectionsRaw[key] = stored;
        newDisplay[key] = stored ? toDisplayCollection(key, stored) : CONTENT_TYPES[key].defaults;
      });
      setCollectionsRaw((prev) => ({ ...prev, ...newCollectionsRaw }));
      setDisplay((prev) => ({ ...prev, ...newDisplay }));
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateHero = async ({ video, poster }) => {
    const next = { ...heroRaw };
    if (video !== undefined) next.video = video;
    if (poster !== undefined) next.poster = poster;
    await idbSet("hero", next);
    setHeroRaw(next);
    setHeroDisplay({
      videoSrc: next.video ? toDisplay(next.video) : defaultVideo,
      posterSrc: next.poster ? toDisplay(next.poster) : defaultPoster,
    });
  };

  const getBaseCollection = (key) => collectionsRaw[key] ?? CONTENT_TYPES[key].defaults;

  const saveCollection = async (key, nextRaw) => {
    await idbSet(key, nextRaw);
    setCollectionsRaw((prev) => ({ ...prev, [key]: nextRaw }));
    setDisplay((prev) => ({ ...prev, [key]: toDisplayCollection(key, nextRaw) }));
  };

  const addItem = (key, item) => saveCollection(key, [...getBaseCollection(key), { id: genId(), ...item }]);

  const updateItem = (key, id, updates) =>
    saveCollection(
      key,
      getBaseCollection(key).map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

  const deleteItem = (key, id) =>
    saveCollection(key, getBaseCollection(key).filter((item) => item.id !== id));

  return (
    <SiteContentContext.Provider
      value={{ loaded, hero: heroDisplay, updateHero, content: display, addItem, updateItem, deleteItem }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error("useSiteContent must be used within SiteContentProvider");
  return ctx;
};
