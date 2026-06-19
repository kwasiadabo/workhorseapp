import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Shows a one-time temporary password returned by an admin-initiated
// password reset. The value only ever exists in the response of that one
// request, so this dialog is the only chance to copy/share it.
export default function TemporaryPasswordDialog({ open, onOpenChange, password, userName }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password ?? '');
      setCopied(true);
      toast.success('Password copied to clipboard');
    } catch {
      toast.error('Unable to copy to clipboard');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCopied(false);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Temporary password generated</DialogTitle>
          <DialogDescription>
            {userName ? `Share this temporary password with ${userName}` : 'Share this temporary password with the user'}{' '}
            through a secure channel. It won&apos;t be shown again, and they&apos;ll be required to set a new password on
            their next login.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input value={password ?? ''} readOnly className="font-mono" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="text-green-600" /> : <Copy />}
            <span className="sr-only">Copy password</span>
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
