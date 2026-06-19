import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpensesTab from './ExpensesTab';
import ExpenseCategoriesTab from './ExpenseCategoriesTab';

export default function ExpensesPage() {
  return (
    <div>
      <PageHeader title="Expenses" description="Track and categorize business expenses by branch." />
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <ExpensesTab />
        </TabsContent>
        <TabsContent value="categories">
          <ExpenseCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
