import { useState } from "react";
import toast from "react-hot-toast";
import { useSiteContent } from "../../context/SiteContentContext";
import { compressImage, MAX_VIDEO_BYTES } from "../../utils/imageCompress";

const HeroEditor = () => {
  const { hero, updateHero } = useSiteContent();
  const [saving, setSaving] = useState(false);

  const handlePosterChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const compressed = await compressImage(file);
      await updateHero({ poster: compressed });
      toast.success("Hero image updated");
    } catch {
      toast.error("Could not process that image");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(`Video must be under ${MAX_VIDEO_BYTES / (1024 * 1024)}MB`);
      e.target.value = "";
      return;
    }
    setSaving(true);
    try {
      await updateHero({ video: file });
      toast.success("Hero video updated");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Hero (landing page)</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm text-mutedText/70">Poster image</p>
          <img src={hero.posterSrc} alt="Hero poster" className="mb-3 h-40 w-full rounded-xl object-cover" />
          <input type="file" accept="image/*" disabled={saving} onChange={handlePosterChange} className="text-sm text-mutedText/70" />
        </div>
        <div>
          <p className="mb-2 text-sm text-mutedText/70">Video</p>
          <video src={hero.videoSrc} controls className="mb-3 h-40 w-full rounded-xl object-cover" />
          <input type="file" accept="video/*" disabled={saving} onChange={handleVideoChange} className="text-sm text-mutedText/70" />
          <p className="mt-1 text-xs text-mutedText/50">Max {MAX_VIDEO_BYTES / (1024 * 1024)}MB, not compressed.</p>
        </div>
      </div>
    </div>
  );
};

export default HeroEditor;
