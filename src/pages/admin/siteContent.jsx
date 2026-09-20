import * as Tabs from "@radix-ui/react-tabs";
import HeroEditor from "../../components/admin/HeroEditor";
import CollectionEditor from "../../components/admin/CollectionEditor";
import { CONTENT_TYPES, COLLECTION_KEYS } from "../../data/contentTypes";

const tabTriggerClass =
  "rounded-xl px-4 py-2 text-sm font-medium text-mutedText/70 transition data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:text-white";

const SiteContent = () => (
  <div>
    <h1 className="mb-6 text-2xl font-semibold">Site Content</h1>
    <Tabs.Root defaultValue="hero">
      <Tabs.List className="mb-6 flex flex-wrap gap-2 border-b border-primary/20 pb-4">
        <Tabs.Trigger value="hero" className={tabTriggerClass}>
          Hero
        </Tabs.Trigger>
        {COLLECTION_KEYS.map((key) => (
          <Tabs.Trigger key={key} value={key} className={tabTriggerClass}>
            {CONTENT_TYPES[key].label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="hero">
        <HeroEditor />
      </Tabs.Content>
      {COLLECTION_KEYS.map((key) => (
        <Tabs.Content key={key} value={key}>
          <CollectionEditor contentKey={key} />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  </div>
);

export default SiteContent;
