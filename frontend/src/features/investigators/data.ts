export type Investigator = {
  id: string;
  /** Short visual description, used for alt text and accessible labels. */
  description: string;
  image: Artwork;
  /** Head-to-toe artwork for spotlight scenes; falls back to `image`. */
  fullBody?: Artwork;
  /** Rendered height of `image` in the dashboard picker card (Figma, per figure). */
  pickerHeight: number;
};

type Artwork = { src: string; width: number; height: number };

/** Selectable investigators, in the order shown on the dashboard. */
export const investigators: Investigator[] = [
  {
    id: "officer-1",
    description: "Blond investigator in a black field jacket",
    image: { src: "/investigators/officer1.png", width: 777, height: 941 },
    pickerHeight: 212.6,
    fullBody: { src: "/investigators/gray2_full.png", width: 1268, height: 3072 },
  },
  {
    id: "officer-2",
    description: "Investigator with a high curly ponytail, arms crossed",
    image: { src: "/investigators/officer2.png", width: 667, height: 974 },
    pickerHeight: 249.2,
    fullBody: { src: "/investigators/female_officer1.png", width: 1288, height: 3072 },
  },
  {
    id: "officer-3",
    description: "Grey-haired veteran investigator with glasses",
    image: { src: "/investigators/officer3.png", width: 567, height: 883 },
    pickerHeight: 228.8,
    fullBody: { src: "/investigators/gray_full.png", width: 1080, height: 3072 },
  },
  {
    id: "officer-4",
    description: "Auburn-haired investigator holding a tablet",
    image: { src: "/investigators/officer4.png", width: 638, height: 987 },
    pickerHeight: 243.8,
    fullBody: { src: "/investigators/lady2_full.png", width: 1096, height: 2920 },
  },
];

/** Shown when the player hasn't picked anyone yet (the investigator used in the designs). */
export const defaultInvestigatorId = "officer-2";

export function getInvestigator(id: string | undefined): Investigator | undefined {
  return investigators.find((investigator) => investigator.id === id);
}

/** The lead investigator ("Tracy") shown beside the picker. */
export const featuredInvestigator = {
  description: "Tracy, the lead TRACE investigator, reviewing a case on a tablet",
  /** Close-up (cropped at the thighs), used for portraits. */
  image: { src: "/investigators/default-officer.png", width: 2484, height: 3612 },
  /** Full-length art from the Figma file, used where Tracy stands beside content. */
  fullBody: { src: "/investigators/tracy-full.png", width: 1306, height: 816 },
};
