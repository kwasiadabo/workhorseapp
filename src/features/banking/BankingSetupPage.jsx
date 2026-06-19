import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BanksTab from './BanksTab';
import BankAccountsTab from './BankAccountsTab';

export default function BankingSetupPage() {
  return (
    <div>
      <PageHeader
        title="Banks & Accounts"
        description="Configure the financial institutions and bank accounts your business uses."
      />
      <Tabs defaultValue="banks">
        <TabsList>
          <TabsTrigger value="banks">Banks</TabsTrigger>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
        </TabsList>
        <TabsContent value="banks">
          <BanksTab />
        </TabsContent>
        <TabsContent value="accounts">
          <BankAccountsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
