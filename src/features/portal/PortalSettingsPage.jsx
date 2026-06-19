import { useEffect, useRef, useState } from 'react';
import { Copy, ExternalLink, Globe, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortalSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slug, setSlug] = useState('');
  const [depositPercent, setDepositPercent] = useState(0);
  const [input, setInput] = useState('0');

  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const whatsappInputRef = useRef(null);

  useEffect(() => {
    api.get('/portal-settings')
      .then((r) => {
        setSlug(r.data.data.slug);
        setDepositPercent(r.data.data.depositPercent);
        setInput(String(r.data.data.depositPercent));
      })
      .catch(() => toast.error('Could not load portal settings'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    const pct = Number(input);
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
      toast.error('Deposit must be a whole number between 0 and 100');
      return;
    }
    setIsSaving(true);
    try {
      await api.patch('/portal-settings', { depositPercent: pct });
      setDepositPercent(pct);
      toast.success('Portal settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendWhatsApp = () => {
    const digits = whatsappNumber.replace(/\D/g, '');
    if (digits.length < 9) {
      toast.error('Enter a valid phone number');
      return;
    }
    // Normalise: leading 0 → +233, bare 9 digits → +233, already has country code
    let normalized = digits;
    if (digits.startsWith('0') && digits.length === 10) normalized = `233${digits.slice(1)}`;
    else if (digits.length === 9) normalized = `233${digits}`;
    const text = encodeURIComponent(`Book your appointment here: ${portalUrl}`);
    window.open(`https://wa.me/${normalized}?text=${text}`, '_blank');
    setWhatsappOpen(false);
    setWhatsappNumber('');
  };

  // A public, customer-facing link should always be https on a real domain —
  // WhatsApp/phones silently upgrade http -> https when the link is tapped,
  // so mirroring window.location.origin (http in dev) produces a dead link
  // once shared. Only keep http for actual localhost testing.
  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const portalOrigin = isLocalDev ? window.location.origin : `https://${window.location.host}`;
  const portalUrl = slug ? `${portalOrigin}/book/${slug}` : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Self-Booking Portal"
        description="Configure the public portal where customers can book appointments."
      />

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          {/* Portal link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4 text-muted-foreground" />
                Your booking link
              </CardTitle>
              <CardDescription>
                Share this link with your customers so they can book online.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <span className="flex-1 truncate font-mono text-sm text-foreground">
                  {portalUrl ?? '—'}
                </span>
                {portalUrl && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      title="Copy link"
                      onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success('Link copied'); }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      title="Open portal"
                      onClick={() => window.open(portalUrl, '_blank')}
                    >
                      <ExternalLink className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-[#25D366] hover:text-[#25D366]"
                      title="Send via WhatsApp"
                      onClick={() => { setWhatsappNumber(''); setWhatsappOpen(true); }}
                    >
                      <MessageCircle className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deposit settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deposit requirement</CardTitle>
              <CardDescription>
                Require customers to pay a percentage of the service price when booking online.
                Set to <strong>0</strong> to allow free bookings with no upfront payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3 max-w-xs">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="deposit">Deposit percentage</Label>
                  <div className="relative">
                    <Input
                      id="deposit"
                      type="number"
                      min={0}
                      max={100}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
              {depositPercent > 0 && (
                <p className="text-sm text-muted-foreground">
                  Customers currently pay <span className="font-medium text-foreground">{depositPercent}%</span> upfront via Paystack when booking online.
                </p>
              )}
              {depositPercent === 0 && (
                <p className="text-sm text-muted-foreground">
                  No deposit required — customers can book without any upfront payment.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* WhatsApp number dialog */}
      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogContent className="sm:max-w-sm" onOpenAutoFocus={(e) => { e.preventDefault(); whatsappInputRef.current?.focus(); }}>
          <DialogHeader>
            <DialogTitle>Send booking link via WhatsApp</DialogTitle>
            <DialogDescription>
              Enter the customer's WhatsApp number and we'll open a chat with the booking link pre-filled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="wa-number">WhatsApp number</Label>
            <Input
              id="wa-number"
              ref={whatsappInputRef}
              type="tel"
              placeholder="0201234567"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendWhatsApp(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#25D366] text-white hover:bg-[#1ebe5a]"
              onClick={handleSendWhatsApp}
            >
              <Send className="mr-2 size-3.5" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
