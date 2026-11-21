import { addDaysIso, ItineraryDayPlan, Sanctuary } from './sanctuaries';

interface StateItineraryTemplate {
  day1Title: string;
  day1Morning: string;
  day1Afternoon: string;
  day1Evening: string;
  day2Title: string;
  day2Morning: string;
  day2Afternoon: string;
  day2Evening: string;
  day3Title: string;
  day3Morning: string;
  day3Afternoon: string;
  day3Evening: string;
}

const STATE_ITINERARIES: Record<string, StateItineraryTemplate> = {
  Assam: {
    day1Title: 'Tea Garden Arrival & Brahmaputra Sunset',
    day1Morning: 'Check-in welcome with fresh Assam second-flush orthodox tea on the timber veranda.',
    day1Afternoon: 'Guided stroll through heritage tea slopes and orchid garden courtyards.',
    day1Evening: 'River-breeze dinner featuring bamboo-steamed herbs and Assam black-pepper dishes.',
    day2Title: 'Kaziranga Rhino Range & Majuli Island Craft',
    day2Morning: '05:30 open-jeep safari across Kaziranga Eastern Range grasslands for one-horned rhinos.',
    day2Afternoon: 'Scenic ferry crossing to Majuli Island Satra monasteries and bamboo mask studio.',
    day2Evening: 'Eri silk weaving showcase and folk Borgeet music around the courtyard fire.',
    day3Title: 'Sunrise Birding & Heritage Keepsake',
    day3Morning: 'Dawn hornbill and swamp-deer viewing deck walk with host naturalist.',
    day3Afternoon: 'Tea tasting and direct artisan weavers visit before afternoon departure.',
    day3Evening: 'Safe onward transfer to Jorhat or Guwahati corridor.',
  },
  Meghalaya: {
    day1Title: 'Khasi Ridge Arrival & Waterfall Overlook',
    day1Morning: 'Check-in at your sunlit Sohra-Dawki loft with Khasi wildflower honey tea.',
    day1Afternoon: 'Panorama trail walk to Nohkalikai & Seven Sisters misty canyon ledges.',
    day1Evening: 'Warm pinewood hearth supper with locally harvested Sohra turmeric specialties.',
    day2Title: 'Dawki Crystal Boating & Living Root Bridge',
    day2Morning: 'Early morning wooden boat glide over transparent turquoise waters of the Umngot River.',
    day2Afternoon: 'Guided hike across Nongriat century-old Double-Decker Living Root Bridges.',
    day2Evening: 'Starlight reflection on the pine terrace with Khasi acoustic storytelling.',
    day3Title: 'Mawlynnong Clean Village & Departure',
    day3Morning: 'Sunrise sky-walk trail above the emerald plains and bamboo orchard gardens.',
    day3Afternoon: 'Artisan cane craft market visit before comfortable Shillong ridge transfer.',
    day3Evening: 'Evening return with digital trail pass keepsake.',
  },
  'Arunachal Pradesh': {
    day1Title: 'Monpa Pine Acclimatization & Monastery Courtyard',
    day1Morning: 'Arrive to hot butter tea and solar-warmed Monpa stone chalet check-in.',
    day1Afternoon: 'Gentle acclimatization walk past fluttering prayer wheels and pine ridges.',
    day1Evening: 'Himalayan thukpa and roasted buckwheat supper beside the hearth.',
    day2Title: 'Tawang Monastery Dawn & Sela Pass High Lakes',
    day2Morning: 'Sunrise visit to 400-year-old Tawang Monastery golden rooftops and morning chants.',
    day2Afternoon: 'Scenic drive across snow-crowned Sela Pass (4,170m) and sapphire Paradise Lake.',
    day2Evening: 'Thangka mineral-pigment studio showcase with your host.',
    day3Title: 'Ziro Pine Trails & Apatani Village Morning',
    day3Morning: 'Crisp mountain sunrise deck coffee overlooking snow-dusted Himalayan ranges.',
    day3Afternoon: 'Visit local Monpa handmade paper & woodcraft cooperative before departure.',
    day3Evening: 'Scenic descent along Bomdila orchid corridor.',
  },
  Nagaland: {
    day1Title: 'Khonoma Green Village & Angami Welcome',
    day1Morning: 'Check into your cedar-and-oak lodge with warm Naga highland ginger brew.',
    day1Afternoon: 'Guided walk through terraced paddy fields and Khonoma conservation stone gates.',
    day1Evening: 'Woodfire Naga hearth dinner with acoustic folk songs and shawl heritage stories.',
    day2Title: 'Dzuko Valley Lily Ridge Expedition',
    day2Morning: 'Early ridge ascent via Viswema trailhead into blooming bamboo & wild lily meadows.',
    day2Afternoon: 'Picnic lunch beside Dzuko crystal mountain streams and panoramic valley overlooks.',
    day2Evening: 'Return to the lodge for warm herbal soak and roasted hill millet supper.',
    day3Title: 'Hornbill Heritage Craft & Kohima Farewell',
    day3Morning: 'Sunrise birding walk listening for Blyth’s tragopan calls in misty ridges.',
    day3Afternoon: 'Local bamboo basketry and handloom visit before Dimapur/Kohima departure.',
    day3Evening: 'Onward journey with Naga woven keepsake.',
  },
  Sikkim: {
    day1Title: 'Alpine Chalet Arrival & Khangchendzonga Light',
    day1Morning: 'Warm cardamom tea welcome at your Sikkim pine chalet with mountain views.',
    day1Afternoon: 'Short alpine meadow walk and permit briefing with Lepcha hosts.',
    day1Evening: 'Hand-folded Himalayan momos and organic millet tongba beside copper kettles.',
    day2Title: 'Tsomgo Glacial Lake & Nathula Silk Route',
    day2Morning: '07:00 ascent to mirror-still sapphire Tsomgo Lake ringed by prayer flags.',
    day2Afternoon: 'Permit-arranged excursion along the historic Nathula mountain pass corridor.',
    day2Evening: 'Sikkimese cardamom orchard tasting and stargazing deck session.',
    day3Title: 'Dzongu Orchid Sanctuary & Departure',
    day3Morning: 'Golden sunrise over snow peaks directly from your sunlit reading alcove.',
    day3Afternoon: 'Stop at Rumtek artisan weaving collective on the way to Gangtok.',
    day3Evening: 'Smooth onward transfer to Pakyong or Bagdogra route.',
  },
  Manipur: {
    day1Title: 'Loktak Lakeshore Check-in & Sunset Deck',
    day1Morning: 'Arrive at the lakeside bamboo cottage overlooking Loktak floating lotus coves.',
    day1Afternoon: 'Learn Moirang Phee geometric handloom traditions in the host courtyard.',
    day1Evening: 'Meitei black-rice Chak-hao kheer and smoked lake-herb dinner on the water deck.',
    day2Title: 'Sunrise Phumdi Canoe & Keibul Lamjao Park',
    day2Morning: '05:30 hand-paddled wooden dugout glide between circular green phumdi islands.',
    day2Afternoon: 'Boardwalk safari inside Keibul Lamjao National Park spotting rare Sangai deer.',
    day2Evening: 'Golden lake sunset photography and Lai Haraoba cultural storytelling.',
    day3Title: 'INA Heritage Trail & Imphal Market',
    day3Morning: 'Peaceful misty sunrise tea watching fishermen cast nets over mirror waters.',
    day3Afternoon: 'Visit historic Moirang museum and Ima Keithel artisan market before departure.',
    day3Evening: 'Evening drop to Imphal corridor.',
  },
  Mizoram: {
    day1Title: 'Reiek Cloud Ridge Check-in & Bamboo Terrace',
    day1Morning: 'Welcome to your sunlit Mizo timber cabin above terraced emerald valleys.',
    day1Afternoon: 'Gentle walk to Reiek Heritage Village and traditional bamboo courtyard homes.',
    day1Evening: 'Mizo Bai stew dinner with bamboo-flute melodies under crisp mountain skies.',
    day2Title: 'Phawngpui Blue Mountain & Rhododendron Hike',
    day2Morning: 'Guided ridge hike along Phawngpui cliffs lined with scarlet rhododendrons.',
    day2Afternoon: 'Scenic overlook picnic facing sweeping Vantawng cascade valleys.',
    day2Evening: 'Puan textile demonstration and warm ginger-lemongrass tea by candlelight.',
    day3Title: 'Orchid Trail Sunrise & Aizawl Panorama',
    day3Morning: 'Early ridge mist watch as sunlit clouds drift below the oak sky balcony.',
    day3Afternoon: 'Local handloom cooperative stop before scenic transfer toward Aizawl.',
    day3Evening: 'Onward flight or valley connection.',
  },
  Tripura: {
    day1Title: 'Rudrasagar Lake Villa & Palace Twilight',
    day1Morning: 'Check into your coral-and-oak villa facing sparkling Rudrasagar waters.',
    day1Afternoon: 'Sip fresh Queen Pineapple juice on the arched veranda overlooking the lake.',
    day1Evening: 'Lantern-lit lakeside Mui Borok heritage dinner watching Neermahal illuminate.',
    day2Title: 'Neermahal Water Palace Boat & Unakoti Carvings',
    day2Morning: '08:30 private wooden boat glide around Neermahal’s royal coral-and-white arches.',
    day2Afternoon: 'Guided excursion to ancient sandstone rock-cut reliefs at Unakoti forest hills.',
    day2Evening: 'Fine Tripura split-bamboo craft atelier session with your host.',
    day3Title: 'Lake Sunrise & Royal Heritage Market',
    day3Morning: 'Morning reflection walk along Rudrasagar’s lotus shoreline.',
    day3Afternoon: 'Visit Ujjayanta Palace gardens and cane craft market before Agartala transfer.',
    day3Evening: 'Farewell with artisan bamboo keepsake.',
  },
};

export function generateThreeDayItinerary(
  sanctuary: Sanctuary,
  checkIn: string
): ItineraryDayPlan[] {
  const tpl = STATE_ITINERARIES[sanctuary.state] ?? STATE_ITINERARIES.Assam;
  return [
    {
      day: 1,
      date: checkIn,
      title: tpl.day1Title,
      morning: `Arrival at ${sanctuary.title} (${sanctuary.location}): ${tpl.day1Morning}`,
      afternoon: tpl.day1Afternoon,
      evening: tpl.day1Evening,
    },
    {
      day: 2,
      date: addDaysIso(checkIn, 1),
      title: tpl.day2Title,
      morning: tpl.day2Morning,
      afternoon: tpl.day2Afternoon,
      evening: tpl.day2Evening,
    },
    {
      day: 3,
      date: addDaysIso(checkIn, 2),
      title: tpl.day3Title,
      morning: tpl.day3Morning,
      afternoon: tpl.day3Afternoon,
      evening: tpl.day3Evening,
    },
  ];
}
