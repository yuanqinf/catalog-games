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
  metacritic_user_score?: number;
  featured_comment_tags?: string[];
  player_count?: number;

  average_play_time?: number;
}

export const mockMonthlyBestGamesData: GameData[] = [
  {
    id: 'elden-ring',
    name: 'ELDEN RING',
    description: 'An Epic Drama Born from a Myth Created by George R.R. Martin',
    genre: ['Action RPG'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    images: {
      banner:
        'https://preview.redd.it/znxzjlws0i471.jpg?width=1920&format=pjpg&auto=webp&s=2514f6dd7c16a0ed3aa0c93cd80b134cd8853178',
      thumbnail: 'https://egy4gamers.com/storage/2024/07/Elden-Ring.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=E3Huy2cdih0'],
    release_date: '2022-02-25',
    steam_recent_review: 'very positive',
    steam_all_review: 'very positive',
    metacritic_user_score: 8.3,
    catalog_rating: {
      story: 5,
      music: 5,
      graphics: 5,
      gameplay: 4,
      longevity: 3,
    },
    catalog_rating_count: 150000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Best Souls-like',
      'Best Open World',
      'Best Fantasy',
    ],
    player_count: 50000000,
  },
  {
    id: 'black-myth-wukong',
    name: 'Black Myth: Wukong',
    description: 'An action RPG rooted in Chinese mythology',
    genre: ['Action RPG'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'Game Science',
    publisher: 'Game Science',
    images: {
      banner:
        'https://cdn1.epicgames.com/spt-assets/ca9ef1bcf2f54043baac351366aec677/black-myth-wukong-jz9yr.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_ap/cover/b/black-myth/black-myth-wukong_fmws.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=7gYaZgn2pW8'],
    release_date: '2024-08-20',
    steam_recent_review: 'very positive',
    steam_all_review: 'overwhelmingly positive',
    metacritic_user_score: 8.2,
    catalog_rating: {
      story: 5,
      music: 5,
      graphics: 5,
      gameplay: 4,
      longevity: 2,
    },
    catalog_rating_count: 10000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Most Anticipated',
      'Stunning Visuals',
      'Next-Gen Souls-like',
    ],
    player_count: 25000000,
  },
  {
    id: 'baldurs-gate-3',
    name: "BALDUR'S GATE 3",
    description:
      'A story-rich, party-based RPG set in the universe of Dungeons & Dragons,',
    genre: ['RPG'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    images: {
      banner:
        'https://cdn.wccftech.com/wp-content/uploads/2023/08/Baldurs-Gate-3-header-1920x1080.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_ap/cover/b/baldurs-ga/baldurs-gate-iii_9c7e.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=zg0_ulgtRqA'],
    release_date: '2023-08-03',
    steam_recent_review: 'overwhelmingly positive',
    steam_all_review: 'overwhelmingly positive',
    metacritic_user_score: 9.2,
    catalog_rating: {
      story: 5,
      music: 3,
      graphics: 4,
      gameplay: 4,
      longevity: 4,
    },
    catalog_rating_count: 10000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Best RPG',
      'Masterclass in Storytelling',
      'Top Turn-Based Combat',
    ],
    player_count: 20000000,
  },
  {
    id: 'cyberpunk-2077',
    name: 'CYBERPUNK 2077',
    description:
      'A storydriven, open world RPG of the dark future from CD PROJEKT RED',
    genre: ['Action RPG'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt Red',
    images: {
      banner:
        'https://wallpapercat.com/w/full/1/7/f/2618-1920x1080-desktop-1080p-cyberpunk-2077-background.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_ap/cover/c/cyberpunk-/cyberpunk-2077-ultimate-edition_t3xe.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=qIcTM8WXFjk'],
    release_date: '2020-12-10',
    steam_recent_review: 'very positive',
    steam_all_review: 'very positive',
    metacritic_user_score: 7.9,
    catalog_rating: {
      story: 5,
      music: 4,
      graphics: 5,
      gameplay: 4,
      longevity: 4,
    },
    catalog_rating_count: 10000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Best Comeback',
      'Immersive Sci-Fi',
      'Narrative Powerhouse',
    ],
    player_count: 32000000,
  },
  {
    id: 'the-legend-of-zelda-breath-of-the-wild',
    name: 'The Legend of Zelda: Breath of the Wild',
    description:
      'A 2017 action-adventure game developed and published by Nintendo',
    genre: ['Adventure'],
    platforms: ['switch'],
    developer: 'Nintendo',
    publisher: 'Nintendo',
    images: {
      banner:
        'https://zelda.nintendo.com/breath-of-the-wild/assets/media/wallpapers/desktop-1.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_pk/cover/t/the-legend/the-legend-of-zelda-breath-of-the-wild-nintendo-switch-2-edi_bf37.600.png',
    },
    videos: ['https://www.youtube.com/watch?v=zw47_q9wbBE'],
    release_date: '2017-03-03',
    metacritic_user_score: 8.9,
    catalog_rating: {
      story: 5,
      music: 5,
      graphics: 5,
      gameplay: 5,
      longevity: 5,
    },
    catalog_rating_count: 10000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Game of the Decade',
      'Best Exploration',
      'Revolutionary Open World',
    ],
    player_count: 40000000,
  },
];

export const mockMonthlyWorstGamesData: GameData[] = [
  {
    id: 'concord',
    name: 'Concord',
    description:
      'A PvP sci-fi shooter with vibrant characters and team-based gameplay.',
    genre: ['Multiplayer Shooter'],
    platforms: ['pc', 'ps5'],
    developer: 'Firewalk Studios',
    publisher: 'Firewalk Studios',
    images: {
      banner:
        'https://blog.playstation.com/tachyon/2024/05/b06a8cc47aebcaeaff8cf93d58435221e8b1b616.jpg',
      thumbnail:
        'https://sm.ign.com/t/ign_nordic/cover/f/firewalk-s/firewalk-studios-probablymonsters-project_q9ua.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=UroOs1dAq3k'],
    release_date: '2024-08-23',
    metacritic_user_score: 1.7,
    catalog_rating: {
      story: 1.2,
      music: 1.4,
      graphics: 1.6,
      gameplay: 0.7,
      longevity: 1.3,
    },
    catalog_rating_count: 1000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Overwatch Clone',
      'Overpriced',
      'Woke Criticism',
      'Outdated Gameplay',
      'Bad Story',
    ],
    player_count: 0,
  },
  {
    id: 'dragon-age-the-veilguard',
    name: 'Dragon Age: The Veilguard',
    description:
      'The next chapter in the Dragon Age franchise with new heroes and darker threats.',
    genre: ['Action RPG'],
    platforms: ['pc', 'ps5', 'xbox'],
    developer: 'BioWare',
    publisher: 'BioWare',
    images: {
      banner:
        'https://cdn1.epicgames.com/offer/4583306dbdc34076ac7ac2bf19bf7096/EGS_DragonAgeTheVeilguard_Bioware_S1_2560x1440-0c5844de6318595b22d3dece8fff0fb6_2560x1440-0c5844de6318595b22d3dece8fff0fb6',
      thumbnail:
        'https://sm.ign.com/t/ign_mear/cover/d/dragon-age/dragon-age-the-veilguard_yngr.600.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=dZq1B3z1t2Y'],
    release_date: '2024-12-10',
    steam_recent_review: 'mixed',
    steam_all_review: 'mixed',
    metacritic_user_score: 3.9,
    catalog_rating: {
      story: 1,
      music: 2,
      graphics: 3,
      gameplay: 1,
      longevity: 2,
    },
    catalog_rating_count: 10000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Corporate/Soulless Design',
      'Shallow Gameplay',
      'Button-Mashing Combat',
      'Forced Political Correctness',
    ],
    player_count: 2000000,
  },
  {
    id: 'overwatch-2',
    name: 'Overwatch 2',
    description:
      'A free-to-play, team-based action game set in the optimistic future, where every match is the ultimate 5v5 battlefield brawl.',
    genre: ['FPS'],
    platforms: ['pc', 'ps5', 'xbox', 'switch'],
    developer: 'Blizzard Entertainment',
    publisher: 'Blizzard Entertainment',
    images: {
      banner: 'https://images7.alphacoders.com/124/1249649.png',
      thumbnail:
        'https://images.nintendolife.com/1558f6cd6d6fe/overwatch-2-cover.cover_large.jpg',
    },
    videos: ['https://www.youtube.com/watch?v=dqPB3cJpA9k'],
    release_date: '2022-10-04',
    steam_recent_review: 'mixed',
    steam_all_review: 'overwhelmingly negative',
    metacritic_user_score: 1.8,
    catalog_rating: {
      story: 1,
      music: 2,
      graphics: 2,
      gameplay: 1,
      longevity: 3,
    },
    catalog_rating_count: 10000,
    game_engine: 'Sample Engine',
    featured_comment_tags: [
      'Overpromised and Underdelivered',
      'Poor Sequel Execution',
      'Cash Grab',
      'Embarrassing Reputation Damage',
    ],
    player_count: 25000000,
  },
];

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
    player_count: 0,
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
    player_count: 0,
  },
];

export const allGamesData: GameData[] = [
  ...mockMonthlyBestGamesData,
  ...mockMonthlyWorstGamesData,
  ...mockUpcomingGamesData,
];
