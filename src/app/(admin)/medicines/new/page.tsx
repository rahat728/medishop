import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdminHeader } from '@/components/layout';
import { MedicineForm } from '@/components/admin/medicines';

export default function NewMedicinePage() {
    return (
        <div className="space-y-6">
            <AdminHeader
                title="Add New Medicine"
                subtitle="Create a new medicine product"
                actions={
                    <Link
                        href="/medicines"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to list
                    </Link>
                }
            />

            <MedicineForm mode="create" />
        </div>
    );
}
