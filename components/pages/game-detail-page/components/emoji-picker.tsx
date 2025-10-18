'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFaceGrinTongue,
  faFaceGrinBeamSweat,
  faFaceSurprise,
  faFaceSadTear,
  faFaceRollingEyes,
  faFaceMeh,
  faFaceGrimace,
  faFaceAngry,
  faFaceDizzy,
  faFaceFrown,
  faFaceFlushed,
  faFaceTired,
  faHeartCrack,
  faBug,
  faPoop,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { PopoverContent } from '@/components/ui/popover';

export const availableEmojis = [
  { icon: faFaceAngry, name: 'angry' },
  { icon: faFaceFrown, name: 'frown' },
  { icon: faFaceTired, name: 'tired' },
  { icon: faFaceDizzy, name: 'dizzy' },
  { icon: faFaceSurprise, name: 'surprised' },
  { icon: faFaceGrinBeamSweat, name: 'grin-beam-sweat' },
  { icon: faFaceSadTear, name: 'sad-tear' },
  { icon: faFaceRollingEyes, name: 'rolling-eyes' },
  { icon: faFaceMeh, name: 'meh' },
  { icon: faFaceGrimace, name: 'grimace' },
  { icon: faFaceFlushed, name: 'flushed' },
  { icon: faFaceGrinTongue, name: 'grin-tongue' },
  { icon: faHeartCrack, name: 'heart-crack' },
  { icon: faBug, name: 'bug' },
  { icon: faPoop, name: 'poop' },
];

export const getEmojiIcon = (name: string) => {
  const emojiMap: Record<string, unknown> = {
    angry: faFaceAngry,
    frown: faFaceFrown,
    tired: faFaceTired,
    dizzy: faFaceDizzy,
    surprised: faFaceSurprise,
    'grin-beam-sweat': faFaceGrinBeamSweat,
    'sad-tear': faFaceSadTear,
    'rolling-eyes': faFaceRollingEyes,
    meh: faFaceMeh,
    grimace: faFaceGrimace,
    flushed: faFaceFlushed,
    'grin-tongue': faFaceGrinTongue,
    'heart-crack': faHeartCrack,
    bug: faBug,
    poop: faPoop,
  };
  return emojiMap[name];
};

interface EmojiPickerContentProps {
  onEmojiClick: (icon: unknown, name: string) => void;
}

export function EmojiPickerContent({ onEmojiClick }: EmojiPickerContentProps) {
  return (
    <PopoverContent className="w-80 p-4" align="start">
      <div className="grid grid-cols-5 gap-2">
        {availableEmojis.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            size="icon"
            onClick={() => onEmojiClick(item.icon, item.name)}
            className="h-12 w-12 transition-transform hover:scale-125"
          >
            <FontAwesomeIcon
              icon={item.icon}
              className="!h-6 !w-6 text-yellow-400"
            />
          </Button>
        ))}
      </div>
    </PopoverContent>
  );
}
