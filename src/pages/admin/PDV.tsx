import { AdminLayout } from '@/components/admin/AdminLayout';
import { PDVLayout } from '@/components/admin/pdv/PDVLayout';

export default function PDV() {
  return (
    <AdminLayout 
      title="PDV" 
      subtitle="Ponto de Venda"
    >
      <PDVLayout />
    </AdminLayout>
  );
}
