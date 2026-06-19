import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import PaginationBar from '@/components/shared/PaginationBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranches } from '@/features/branches/useBranches';
import { useAudiencePreview, useSendCampaign, useSmsCampaigns } from './useSms';

const MAX_MESSAGE_LENGTH = 480;

const AUDIENCE_LABELS = { all: 'All clients', branch: 'By branch' };

function ComposeCard() {
  const [message, setMessage] = useState('');
  const [audienceType, setAudienceType] = useState('all');
  const [branchId, setBranchId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const audienceParams = { audienceType, ...(audienceType === 'branch' && branchId ? { branchId } : {}) };
  const audienceReady = audienceType === 'all' || Boolean(branchId);
  const { data: preview } = useAudiencePreview(audienceParams, { enabled: audienceReady });

  const sendCampaign = useSendCampaign();

  const canSend = message.trim().length > 0 && audienceReady;

  const handleSend = () => {
    sendCampaign.mutate(
      { message: message.trim(), ...audienceParams },
      {
        onSuccess: () => {
          toast.success('Campaign queued for sending');
          setMessage('');
          setConfirmOpen(false);
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message ?? 'Failed to send campaign');
          setConfirmOpen(false);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-4" /> Compose campaign
        </CardTitle>
        <CardDescription>Send a promotional or informational SMS to your clients.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sms-message">Message</Label>
          <Textarea
            id="sms-message"
            placeholder="e.g. We're running a 20% discount this weekend — book now!"
            value={message}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{message.length}/{MAX_MESSAGE_LENGTH} characters</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select
              value={audienceType}
              onValueChange={(value) => {
                setAudienceType(value);
                if (value === 'all') setBranchId('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{AUDIENCE_LABELS[audienceType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                <SelectItem value="branch">By branch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audienceType === 'branch' && (
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch">
                    {branches.find((b) => b.id === branchId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {audienceReady ? `Will send to ${preview?.recipientCount ?? 0} client${preview?.recipientCount === 1 ? '' : 's'}` : 'Select a branch to see recipient count'}
          </p>
          <Button disabled={!canSend} onClick={() => setConfirmOpen(true)}>
            Send campaign
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Send this SMS campaign?"
        description={`This will send your message to ${preview?.recipientCount ?? 0} client${preview?.recipientCount === 1 ? '' : 's'}. This cannot be undone.`}
        confirmLabel="Send"
        variant="default"
        onConfirm={handleSend}
        isLoading={sendCampaign.isPending}
      />
    </Card>
  );
}

export default function SmsCampaignsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSmsCampaigns({ page, limit: 25 });
  const campaigns = data?.data ?? [];

  const columns = [
    {
      key: 'message',
      header: 'Message',
      render: (row) => <span className="line-clamp-2 max-w-md">{row.message}</span>,
    },
    { key: 'audienceType', header: 'Audience', render: (row) => AUDIENCE_LABELS[row.audienceType] ?? row.audienceType },
    { key: 'recipientCount', header: 'Recipients', render: (row) => row.recipientCount },
    {
      key: 'sender',
      header: 'Sent by',
      render: (row) => (row.sender ? `${row.sender.firstName} ${row.sender.lastName}` : '—'),
    },
    { key: 'sentAt', header: 'Sent at', render: (row) => format(new Date(row.sentAt), 'd MMM yyyy, h:mm a') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="SMS Campaigns" description="Send promotional or informational SMS messages to your clients." />

      <ComposeCard />

      <Card className="p-0 overflow-hidden">
        <div className="border-b p-4">
          <h3 className="font-semibold">Campaign history</h3>
        </div>
        <DataTable columns={columns} data={campaigns} isLoading={isLoading} emptyMessage="No campaigns sent yet." />
        <PaginationBar meta={data?.meta} onPageChange={setPage} />
      </Card>
    </div>
  );
}
