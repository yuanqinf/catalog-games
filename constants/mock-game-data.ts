type catalog_rating = {
  story: number;
  music: number;
  graphics: number;
  gameplay: number;
  longevity: number;
};

type SteamReview =
  | 'overwhelmingly positive'
  | 'very positive'
  | 'mostly positive'
  | 'positive'
  | 'mixed'
  | 'mostly negative'
  | 'very negative'
  | 'overwhelmingly negative'
  | 'no user reviews';

export interface GameData {
  id: string;
  name: string;
  storyline?: string;
  description: string;
  genre: string[];
  platforms: ('pc' | 'ps5' | 'xbox' | 'switch')[];
  developer: string;
  publisher: string;
  game_engine: string;
  videos?: string[];
  release_date?: string;
  update_date?: string;

  images: {
    banner: string;
    thumbnail: string;
  };

  catalog_rating?: catalog_rating;
  catalog_rating_count?: number;

  steam_all_review?: SteamReview;
  steam_recent_review?: SteamReview;
  igdb_user_rating?: number;
  featured_comment_tags?: string[];
  average_play_time?: number;
}

export const mockUpcomingGamesData: GameData[] = [
  {
    id: 'borderlands-4',
    name: 'Borderlands 4',
    description:
      'The looter-shooter franchise returns with even more chaotic action, wild humor, and insane weapons.',
    genre: ['Action RPG'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'Gearbox Software',
    publisher: 'Gearbox Software',
    images: {
      banner:
        'https://cdn1.epicgames.com/spt-assets/20d989fc07a447b2af3c59e4fd5f49c7/borderlands-4-14saz.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_pk/cover/b/borderland/borderlands-4_fchm.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=z4qeqPZJTaE'],
    release_date: '2025-09-12',
    catalog_rating: {
      story: 0,
      music: 0,
      graphics: 0,
      gameplay: 0,
      longevity: 0,
    },
    catalog_rating_count: 0,
    game_engine: 'Unreal Engine 5',
    featured_comment_tags: ['Not enough user reviews'],
  },
  {
    id: 'metal-gear-solid-delta',
    name: 'Metal Gear Solid Delta: Snake Eater',
    description:
      'The legendary stealth-action classic returns fully rebuilt for a new generation.',
    genre: ['Stealth Action'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'Konami',
    publisher: 'Konami',
    images: {
      banner:
        'https://cdn.wccftech.com/wp-content/uploads/2023/10/Metal-Gear-Solid-Delta-Snake-Eater.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_za/cover/m/metal-gear/metal-gear-solid-delta-snake-eater_hdn4.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=sKMayCD1u3w'],
    release_date: '2025-08-28',
    steam_all_review: 'no user reviews',
    catalog_rating: {
      story: 0,
      music: 0,
      graphics: 0,
      gameplay: 0,
      longevity: 0,
    },
    catalog_rating_count: 0,
    game_engine: 'Sample Engine',
    featured_comment_tags: ['Not enough user reviews'],
  },
  {
    id: 'donkey-kong-bananza',
    name: 'Donkey Kong Bananza',
    description:
      'The Kong family embarks on a new adventure filled with jungle platforming, bananas, and boss battles.',
    genre: ['Platformer'],
    platforms: ['switch'],
    developer: 'Nintendo',
    publisher: 'Nintendo',
    images: {
      banner:
        'https://cdn.wccftech.com/wp-content/uploads/2025/04/WCCFdonkeykongbananza1.jpg',
      thumbnail:
        'https://i.pinimg.com/736x/e7/22/45/e72245d795703573503a861c14de9c34.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=mIddsPkdX9U'],
    release_date: '2025-07-17',
    steam_all_review: 'no user reviews',
    catalog_rating: {
      story: 0,
      music: 0,
      graphics: 0,
      gameplay: 0,
      longevity: 0,
    },
    catalog_rating_count: 0,
    game_engine: 'Sample Engine',
    featured_comment_tags: ['Not enough user reviews'],
  },
  {
    id: 'wuchang-fallen-feathers',
    name: 'WUCHANG: Fallen Feathers',
    description:
      'A dark soulslike action RPG set in ancient China filled with mystical creatures and deadly combat.',
    genre: ['Action RPG'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'Leenzee Games',
    publisher: 'Leenzee Games',
    images: {
      banner:
        'https://cdn1.epicgames.com/spt-assets/61237a4bad9f482a9ad1a1ac74520bba/wuchang-fallen-feathers-199kj.jpg',
      thumbnail:
        'https://image.api.playstation.com/vulcan/ap/rnd/202503/2515/7a30e03231f8ea811a225b4b4e21ffdc8bf260e41145f196.png',
    },
    videos: ['https://www.youtube.com/watch?v=tZ_JjhLdlwk'],
    release_date: '2025-07-12',
    steam_all_review: 'no user reviews',
    catalog_rating: {
      story: 0,
      music: 0,
      graphics: 0,
      gameplay: 0,
      longevity: 0,
    },
    catalog_rating_count: 0,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Beautiful Visuals',
      'Hardcore Combat',
      'Atmospheric',
    ],
  },
  {
    id: 'slay-the-spire-2',
    name: 'Slay the Spire 2',
    description:
      'The deckbuilding roguelike returns with new cards, new classes, and deeper strategic gameplay.',
    genre: ['Roguelike Deckbuilder'],
    platforms: ['pc', 'ps5', 'xbox', 'switch'],
    developer: 'MegaCrit',
    publisher: 'MegaCrit',
    images: {
      banner: 'https://www.megacrit.com/images/sts2_key_art_16x9-scaled.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_nordic/cover/s/slay-the-s/slay-the-spire-2_8ypg.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=ttVtllHkb4E'],
    release_date: '2025-08-10',
    steam_all_review: 'no user reviews',
    catalog_rating: {
      story: 0,
      music: 0,
      graphics: 0,
      gameplay: 0,
      longevity: 0,
    },
    catalog_rating_count: 0,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Highly Addictive',
      'Deep Strategy',
      'Endless Replayability',
    ],
  },
];
