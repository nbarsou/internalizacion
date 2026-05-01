'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { updateUserExpiryAction } from '../actions';

interface UpdateExpiryPickerProps {
  userId: string;
  expiresAt: Date | null;
}

export function UpdateExpiryPicker({
  userId,
  expiresAt,
}: UpdateExpiryPickerProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDate, setOptimisticDate] = useOptimistic(expiresAt);

  function handleDateChange(newDate: Date | undefined) {
    const date = newDate ?? null;

    startTransition(async () => {
      setOptimisticDate(date);

      // Serialize: Date → ISO string → server converts back to Date
      const serialized = date ? date.toISOString() : '';
      const result = await updateUserExpiryAction(userId, serialized);

      if (result?.type === 'success') {
        toast.success(result.message);
      } else if (result?.type === 'error') {
        toast.error(result.message);
      }
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={isPending}
          data-empty={!optimisticDate}
          className={cn(
            'h-8 w-40 justify-start text-left text-xs font-normal',
            'data-[empty=true]:text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          {optimisticDate
            ? format(optimisticDate, 'PPP', { locale: es })
            : 'Sin expiración'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={optimisticDate ?? undefined}
          onSelect={handleDateChange}
          disabled={(date) => date < new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
