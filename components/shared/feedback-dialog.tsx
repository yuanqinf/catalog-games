'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/client';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultReason?: string;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  defaultReason,
}: FeedbackDialogProps) {
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FEEDBACK_REASONS = [
    { value: 'broken', label: t('feedback_reason_broken') },
    { value: 'missing-game', label: t('feedback_reason_missing_game') },
    { value: 'add-dead-games', label: t('feedback_reason_add_dead_games') },
    { value: 'feature-idea', label: t('feedback_reason_feature_idea') },
    { value: 'other', label: t('feedback_reason_other') },
  ];

  // Update reason when dialog opens with defaultReason
  useEffect(() => {
    if (open) {
      setReason(defaultReason || '');
      setFeedback('');
    }
  }, [open, defaultReason]);

  const handleSubmit = async () => {
    if (!reason || !feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, feedback, locale: i18n.language }),
      });

      if (response.ok) {
        toast.success(t('feedback_success'));
        onOpenChange(false);
      } else {
        toast.error(t('feedback_error'));
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      toast.error(t('feedback_error'));
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('feedback_dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('feedback_dialog_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">
              {t('feedback_reason_label')}
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder={t('feedback_reason_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_REASONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="py-3"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="feedback" className="text-sm font-medium">
              {t('feedback_input_label')}
            </label>
            <Textarea
              id="feedback"
              placeholder={t('feedback_input_placeholder')}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('feedback_cancel_button')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!reason || !feedback.trim() || isSubmitting}
          >
            {isSubmitting
              ? t('feedback_submitting')
              : t('feedback_submit_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
