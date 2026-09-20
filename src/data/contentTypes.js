import { sections, items, tour, services } from "../utils/constants";

const withIds = (key, arr) => arr.map((item, index) => ({ id: `${key}-${index}`, ...item }));

export const CONTENT_TYPES = {
  sections: {
    label: "Wildlife / Cultural / Lifestyle",
    imageField: "img",
    fields: [
      { key: "title", label: "Title" },
      { key: "text", label: "Text", multiline: true },
    ],
    defaults: withIds("sections", sections),
  },
  items: {
    label: "Top Experience",
    imageField: "image",
    fields: [
      { key: "title", label: "Title" },
      { key: "text", label: "Text", multiline: true },
      { key: "badges", label: "Badges (comma-separated)", isBadges: true },
    ],
    defaults: withIds("items", items),
  },
  tour: {
    label: "Tour Operators",
    imageField: "image",
    fields: [{ key: "text", label: "Text", multiline: true }],
    defaults: withIds("tour", tour),
  },
  services: {
    label: "Services",
    imageField: "img",
    fields: [
      { key: "title", label: "Title" },
      { key: "text", label: "Text", multiline: true },
    ],
    defaults: withIds("services", services),
  },
};

export const COLLECTION_KEYS = Object.keys(CONTENT_TYPES);
