import type { ClimateProfile, LocalizedText } from '@/domain/types';

// Practical information. Entry rules change: the UI always tells travellers to confirm with official sources.
export const COUNTRY_INFO: Record<string, { entry: LocalizedText; emergency: string; timezone: string; languages: string[]; currency: string }> = {
  tanzania: {
    entry: { en: 'Most visitors need a visa. Apply for the Tanzania eVisa on the official immigration portal before you travel. A yellow fever certificate is required if you arrive from, or transit through, a country with yellow fever risk.' },
    emergency: '112', timezone: 'EAT (UTC+3)', languages: ['Swahili', 'English'], currency: 'TZS'
  },
  zanzibar: {
    entry: { en: 'Zanzibar is part of Tanzania, so Tanzanian visa rules apply. International visitors must also hold Zanzibar inbound travel insurance, bought online before arrival.' },
    emergency: '112', timezone: 'EAT (UTC+3)', languages: ['Swahili', 'English'], currency: 'TZS'
  },
  kenya: {
    entry: { en: 'Most visitors must apply online for an Electronic Travel Authorisation (eTA) before travelling. The East Africa Tourist Visa covers Kenya, Uganda and Rwanda.' },
    emergency: '999 / 112', timezone: 'EAT (UTC+3)', languages: ['Swahili', 'English'], currency: 'KES'
  },
  uganda: {
    entry: { en: 'Most visitors need an e-visa, applied for online. The East Africa Tourist Visa covers Uganda, Kenya and Rwanda. Gorilla permits must be booked well in advance.' },
    emergency: '999 / 112', timezone: 'EAT (UTC+3)', languages: ['English', 'Swahili'], currency: 'UGX'
  },
  rwanda: {
    entry: { en: 'Many nationalities can get a visa on arrival. The East Africa Tourist Visa covers Rwanda, Uganda and Kenya. Gorilla permits are issued by the Rwanda Development Board.' },
    emergency: '112', timezone: 'CAT (UTC+2)', languages: ['Kinyarwanda', 'English', 'French'], currency: 'RWF'
  },
  'south-africa': {
    entry: { en: 'Many nationalities can visit visa-free for up to 90 days; others apply for a visa in advance. Your passport needs two blank pages.' },
    emergency: '10111 / 112', timezone: 'SAST (UTC+2)', languages: ['English', 'isiZulu', 'Afrikaans', '+8'], currency: 'ZAR'
  },
  botswana: {
    entry: { en: 'Many nationalities can visit visa-free for up to 90 days. Check whether yellow fever vaccination proof is needed for your route.' },
    emergency: '999 / 112', timezone: 'CAT (UTC+2)', languages: ['English', 'Setswana'], currency: 'BWP'
  },
  namibia: {
    entry: { en: 'Many nationalities now need a visa, available online in advance or on arrival at main entry points.' },
    emergency: '10111', timezone: 'CAT (UTC+2)', languages: ['English', 'Oshiwambo', 'Afrikaans'], currency: 'NAD'
  },
  zambia: {
    entry: { en: 'Many nationalities can visit visa-free. The KAZA UniVisa covers Zambia and Zimbabwe, including day trips across Victoria Falls.' },
    emergency: '999 / 112', timezone: 'CAT (UTC+2)', languages: ['English', 'Bemba', 'Nyanja'], currency: 'ZMW'
  },
  zimbabwe: {
    entry: { en: 'Visa rules depend on nationality; many visitors can get a visa on arrival. The KAZA UniVisa covers Zimbabwe and Zambia.' },
    emergency: '999 / 112', timezone: 'CAT (UTC+2)', languages: ['English', 'Shona', 'Ndebele'], currency: 'ZWG'
  },
  // ---- Global showcase ----
  indonesia: {
    entry: { en: 'Many nationalities can buy a visa on arrival or an e-VOA online before travel; others need a visa in advance. Bali charges a tourist levy for international visitors, paid online or on arrival.' },
    emergency: '112', timezone: 'WITA (UTC+8) in Bali', languages: ['Indonesian', 'Balinese'], currency: 'IDR'
  },
  vietnam: {
    entry: { en: 'An e-visa of up to 90 days is available to all nationalities online. Citizens of a number of countries can visit visa-free for a set period.' },
    emergency: '113 police · 115 ambulance', timezone: 'ICT (UTC+7)', languages: ['Vietnamese'], currency: 'VND'
  },
  cambodia: {
    entry: { en: 'Most visitors can apply for an e-visa online or get a visa on arrival. An Angkor Pass is needed to visit the Angkor temples.' },
    emergency: '117 police · 119 ambulance', timezone: 'ICT (UTC+7)', languages: ['Khmer'], currency: 'KHR (USD widely used)'
  },
  jordan: {
    entry: { en: 'Many nationalities can get a visa on arrival. The Jordan Pass, bought before you travel, includes entry to Petra and waives the visa fee for eligible stays.' },
    emergency: '911', timezone: 'UTC+3', languages: ['Arabic'], currency: 'JOD'
  },
  uae: {
    entry: { en: 'Citizens of many countries receive a visa on arrival free of charge; others must apply in advance, often through their airline or hotel.' },
    emergency: '999 police · 998 ambulance', timezone: 'GST (UTC+4)', languages: ['Arabic', 'English'], currency: 'AED'
  },
  oman: {
    entry: { en: 'Citizens of many countries can visit visa-free for short stays; others apply for an e-visa online before travel.' },
    emergency: '9999', timezone: 'GST (UTC+4)', languages: ['Arabic', 'English'], currency: 'OMR'
  },
  greece: {
    entry: { en: 'Schengen rules apply. Many non-EU visitors can stay up to 90 days in any 180 without a visa; check whether you need an ETIAS travel authorisation before you go.' },
    emergency: '112', timezone: 'EET (UTC+2)', languages: ['Greek'], currency: 'EUR'
  },
  slovenia: {
    entry: { en: 'Schengen rules apply. Many non-EU visitors can stay up to 90 days in any 180 without a visa; check whether you need an ETIAS travel authorisation before you go.' },
    emergency: '112', timezone: 'CET (UTC+1)', languages: ['Slovene'], currency: 'EUR'
  },
  portugal: {
    entry: { en: 'Madeira is part of Portugal and Schengen rules apply. Many non-EU visitors can stay up to 90 days in any 180 without a visa; check whether you need an ETIAS travel authorisation.' },
    emergency: '112', timezone: 'WET (UTC+0) in Madeira', languages: ['Portuguese'], currency: 'EUR'
  }
};

/** Typical monthly daytime highs (°C) and rainfall (mm). Indicative only. */
export const CLIMATE: Record<ClimateProfile, { high: number[]; rain: number[] }> = {
  'northern-tz': { high: [29, 29, 28, 26, 24, 23, 23, 24, 26, 28, 28, 28], rain: [70, 80, 140, 220, 110, 20, 10, 10, 15, 30, 90, 90] },
  // Ngorongoro crater rim, about 2,300 m: much cooler than the lowland parks.
  'crater-highlands': { high: [22, 22, 21, 20, 19, 18, 18, 19, 20, 21, 21, 21], rain: [90, 90, 140, 190, 80, 15, 10, 10, 15, 35, 100, 110] },
  coast: { high: [31, 32, 32, 30, 29, 28, 28, 28, 29, 30, 31, 31], rain: [70, 60, 140, 330, 240, 50, 40, 40, 40, 90, 170, 120] },
  'western-tz': { high: [28, 28, 28, 28, 29, 29, 29, 30, 31, 31, 29, 28], rain: [130, 140, 170, 140, 40, 5, 2, 5, 20, 60, 140, 150] },
  'southern-highlands': { high: [24, 24, 24, 23, 22, 21, 21, 22, 25, 26, 26, 24], rain: [180, 180, 190, 140, 30, 2, 1, 1, 5, 20, 80, 170] },
  'southern-tz': { high: [29, 29, 28, 28, 27, 26, 26, 28, 30, 32, 32, 30], rain: [140, 130, 150, 80, 10, 0, 0, 0, 0, 5, 40, 120] },
  'kenya-mara': { high: [28, 28, 27, 25, 25, 24, 24, 25, 27, 28, 27, 27], rain: [80, 80, 120, 190, 120, 50, 40, 50, 50, 70, 110, 100] },
  'great-lakes': { high: [21, 21, 21, 20, 20, 20, 20, 21, 21, 21, 20, 20], rain: [100, 110, 160, 190, 140, 40, 30, 60, 110, 130, 140, 110] },
  cape: { high: [26, 27, 25, 23, 20, 18, 18, 18, 19, 21, 24, 25], rain: [15, 15, 20, 50, 80, 90, 90, 80, 40, 30, 15, 15] },
  okavango: { high: [32, 31, 31, 30, 28, 25, 25, 28, 33, 35, 34, 32], rain: [110, 80, 70, 25, 5, 0, 0, 0, 0, 20, 50, 90] },
  namib: { high: [32, 31, 30, 28, 25, 23, 23, 25, 28, 30, 31, 32], rain: [10, 15, 15, 5, 0, 0, 0, 0, 0, 0, 5, 5] },
  zambezi: { high: [29, 29, 29, 29, 27, 25, 25, 28, 32, 34, 33, 30], rain: [170, 150, 90, 25, 3, 0, 0, 0, 1, 20, 80, 170] },
  highveld: { high: [26, 26, 25, 22, 20, 17, 18, 20, 23, 24, 25, 26], rain: [120, 100, 90, 50, 20, 10, 10, 10, 25, 70, 110, 120] },
  bali: { high: [31, 31, 31, 32, 31, 30, 29, 30, 31, 32, 32, 31], rain: [345, 275, 230, 90, 95, 65, 55, 40, 45, 115, 180, 285] },
  halong: { high: [20, 20, 22, 27, 31, 32, 32, 31, 30, 28, 25, 22], rain: [25, 30, 50, 90, 190, 290, 350, 400, 280, 130, 40, 20] },
  'siem-reap': { high: [31, 33, 35, 35, 34, 33, 32, 32, 31, 31, 30, 30], rain: [5, 10, 30, 75, 170, 230, 250, 250, 270, 190, 60, 10] },
  // Wadi Musa, about 1,100 m: cool winters, hot dry summers.
  petra: { high: [12, 14, 17, 22, 27, 30, 32, 32, 30, 25, 19, 14], rain: [40, 35, 30, 10, 3, 0, 0, 0, 0, 5, 15, 30] },
  dubai: { high: [24, 25, 29, 33, 38, 40, 41, 41, 39, 35, 30, 26], rain: [16, 25, 22, 7, 0, 0, 0, 0, 0, 1, 3, 15] },
  muscat: { high: [25, 26, 29, 34, 38, 40, 38, 35, 35, 34, 30, 27], rain: [10, 20, 10, 10, 0, 0, 0, 0, 0, 2, 10, 10] },
  santorini: { high: [14, 14, 16, 19, 23, 27, 29, 29, 26, 22, 18, 15], rain: [65, 50, 40, 15, 8, 1, 0, 1, 8, 25, 45, 65] },
  bled: { high: [3, 6, 11, 15, 20, 24, 26, 25, 20, 15, 8, 3], rain: [80, 80, 110, 130, 130, 150, 130, 140, 150, 170, 170, 120] },
  madeira: { high: [19, 19, 20, 20, 21, 23, 24, 26, 26, 24, 22, 20], rain: [90, 75, 70, 40, 20, 5, 2, 3, 25, 80, 100, 100] }
};
