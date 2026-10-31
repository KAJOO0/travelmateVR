import type { Review } from '@/domain/types';

// Demo reviews, attached only to fictional sample listings and to experiences.
type R = [targetType: Review['targetType'], targetId: string, author: string, iso: string, rating: number, date: string, title: string, text: string];
const RAW: R[] = [
  ['listing', 'stay-serengeti-kijani-camp', 'Hannah', 'DE', 5, '2026-08-22', 'Woke up to wildebeest outside the tent', 'The camp was exactly where the herds were. Our guide Baraka found a leopard on day two. The bucket shower is better than it sounds!'],
  ['listing', 'stay-serengeti-kijani-camp', 'Marco', 'IT', 5, '2026-07-30', 'Small, quiet and well run', 'Only ten tents, so you never feel crowded. Food was excellent and the staff remembered everyone by name.'],
  ['listing', 'stay-serengeti-kijani-camp', 'Aisha', 'KE', 4, '2026-06-12', 'Great guiding, limited Wi-Fi', 'Wildlife viewing was superb. Wi-Fi only works in the mess tent, which honestly was fine.'],
  ['listing', 'stay-ngorongoro-rim-lodge', 'Claire', 'FR', 5, '2026-09-03', 'That view at breakfast', 'Cold at night but the fireplace and hot-water bottles made it cosy. We were first on the crater floor thanks to the early start.'],
  ['listing', 'stay-ngorongoro-rim-lodge', 'Wei', 'CN', 4, '2026-08-15', 'Comfortable and convenient', 'Large rooms, good food. A bit far from the main building if you have mobility issues.'],
  ['listing', 'stay-zanzibar-pwani-retreat', 'Sophie', 'GB', 5, '2026-09-18', 'Perfect end to our safari', 'The beach at Nungwi is beautiful and the sunsets are unreal. Lovely, friendly staff.'],
  ['listing', 'stay-zanzibar-pwani-retreat', 'Luca', 'IT', 4, '2026-08-02', 'Good value on the north coast', 'Clean rooms, great pool. The tide goes far out in the morning, so plan swims for the afternoon.'],
  ['listing', 'stay-stone-town-guesthouse', 'Jonas', 'DE', 5, '2026-07-11', 'Heart of Stone Town', 'Rooftop breakfast with the call to prayer in the background. Easy walk to everything.'],
  ['listing', 'stay-sabie-tented-camp', 'Thandi', 'ZA', 5, '2026-06-28', 'Peaceful and well equipped', 'The 360 preview was spot on. The deck view at sunrise is the best part.'],
  ['listing', 'safari-serengeti-migration-private', 'Daniel', 'US', 5, '2026-08-09', 'Saw a full river crossing', 'Our guide positioned us perfectly. Worth every dollar for a private vehicle.'],
  ['listing', 'safari-serengeti-migration-private', 'Mei', 'SG', 5, '2026-07-21', 'Seamless from start to finish', 'Flights, camps and park fees all handled. The balloon flight was the highlight.'],
  ['listing', 'safari-northern-circuit-group', 'Elena', 'ES', 4, '2026-09-06', 'Great value', 'Six days, three parks, a fun group. Some long drives, but the guide kept us entertained.'],
  ['listing', 'safari-northern-circuit-group', 'Kofi', 'GH', 5, '2026-08-25', 'Big Five in six days', 'We saw all of the Big Five including a rhino in the crater. Lodges were comfortable.'],
  ['listing', 'safari-ngorongoro-day', 'Anna', 'NL', 5, '2026-09-12', 'Rhinos and flamingos', 'One day is enough to see a huge amount. The picnic by the hippo pool was memorable.'],
  ['listing', 'safari-tarangire-day', 'Peter', 'AU', 5, '2026-08-01', 'Elephants everywhere', 'Our kids loved it. Easy day trip from Arusha.'],
  ['listing', 'activity-kilimanjaro-machame', 'Rahul', 'IN', 5, '2026-09-20', 'Made it to Uhuru!', 'The extra acclimatisation day made the difference. The crew was incredible and well treated.'],
  ['listing', 'activity-kilimanjaro-machame', 'Laura', 'CA', 4, '2026-07-05', 'Tough but unforgettable', 'Summit night is hard. Bring warmer gloves than you think. Guides were excellent.'],
  ['listing', 'activity-ngozi-hike', 'Joseph', 'TZ', 5, '2026-08-17', 'Hidden gem near Mbeya', 'Beautiful forest and a stunning lake. Our village guide knew every bird.'],
  ['listing', 'activity-zanzibar-snorkel', 'Isabelle', 'FR', 4, '2026-09-01', 'Lovely reefs', 'Clear water and we saw dolphins on the way back. Boat can be bumpy.'],
  ['listing', 'activity-table-mountain-hike', 'Sarah', 'GB', 5, '2026-03-14', 'Guide made it special', 'We learned so much about fynbos. Cableway down was a nice touch.'],
  ['listing', 'restaurant-stone-town-swahili', 'Matteo', 'IT', 5, '2026-08-28', 'Best octopus curry', 'Homely and delicious. Get there early on Fridays.'],
  ['listing', 'restaurant-stone-town-swahili', 'Yuki', 'JP', 4, '2026-07-19', 'Authentic and friendly', 'Simple setting, big flavours. Ask for the spiced tea.'],
  ['listing', 'transport-jro-transfer', 'Michael', 'US', 5, '2026-09-22', 'Driver waited through our delay', 'Flight was three hours late and the driver was still there with a sign. Great service.'],
  ['listing', 'local-maasai-boma-visit', 'Fatima', 'MA', 5, '2026-08-11', 'Respectful and genuine', 'It felt like a real exchange, not a show. Our host explained the beadwork colours.'],
  ['listing', 'local-stone-town-heritage-walk', 'Oliver', 'GB', 5, '2026-09-09', 'Must-do in Stone Town', 'Our guide grew up here and it showed. The slave market memorial was moving.'],
  ['listing', 'local-stone-town-heritage-walk', 'Lin', 'CN', 5, '2026-08-03', 'Learned so much', 'Three hours went quickly. Comfortable pace and lots of shade stops.'],
  ['listing', 'local-spice-cooking-class', 'Greta', 'DE', 5, '2026-07-26', 'Delicious day', 'We picked the spices ourselves and cooked a feast. Recipes emailed afterwards.'],
  ['listing', 'event-stone-town-music-night', 'Amina', 'TZ', 5, '2026-09-26', 'Wonderful taarab', 'Beautiful music in a beautiful courtyard. The introduction to the instruments was great.'],
  ['experience', 'serengeti-migration', 'Paul', 'US', 5, '2026-09-15', 'Convinced me to go', 'Watching this on my headset sold the trip to my whole family.'],
  ['experience', 'stone-town-walk', 'Chiara', 'IT', 5, '2026-09-02', 'Felt like being there', 'The narration about the fort was fascinating. Booked the walk right after.'],
  ['experience', 'table-mountain-summit', 'Ben', 'AU', 4, '2026-08-20', 'Great preview', 'Nice to check the view before deciding between hiking and the cableway.']
];

export const REVIEWS: Review[] = RAW.map(([targetType, targetId, author, countryIso, rating, date, title, text], i) => ({
  id: `rv-${i + 1}`, targetType, targetId, author, countryIso, rating, date, title, text, verifiedBooking: targetType === 'listing', lang: 'en'
}));
