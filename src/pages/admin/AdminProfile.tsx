import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProfileEditor } from '@/components/shared/ProfileEditor';

export default function AdminProfile() {
  return (
    <AdminLayout title="Minha Conta" subtitle="Gerencie seu perfil e credenciais">
      <div className="max-w-2xl">
        <ProfileEditor variant="admin" showPhone={true} />
      </div>
    </AdminLayout>
  );
}
