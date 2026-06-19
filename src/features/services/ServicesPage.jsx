import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServicesTab from './ServicesTab';
import ServiceCategoriesTab from './ServiceCategoriesTab';

export default function ServicesPage() {
  return (
    <div>
      <PageHeader title="Services" description="Manage the services your business offers." />
      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="categories">
          <ServiceCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
