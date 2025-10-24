'use client';

import { dark } from '@clerk/themes';
import { SignInButton } from '@clerk/nextjs';
import { useTranslation } from '@/lib/i18n/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SignInDialog = ({ open, onOpenChange }: SignInDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('game_detail_sign_in_to_react')}</DialogTitle>
          <DialogDescription>
            {t('game_detail_sign_in_to_react_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <SignInButton mode="modal" appearance={{ baseTheme: dark }}>
            <Button
              onClick={() => {
                onOpenChange(false);
              }}
            >
              {t('auth_login')}
            </Button>
          </SignInButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
