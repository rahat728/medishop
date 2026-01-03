import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { AdminHeader } from '@/components/layout';
import { MedicineForm } from '@/components/admin/medicines';

interface EditMedicinePageProps {
    params: Promise<{ id: string }>;
}

async function getMedicine(id: string) {
    try {
        await connectDB();
        const medicine = await Medicine.findById(id).lean();

        if (!medicine) {
            return null;
        }

        // Convert to plain object and serialize
        return JSON.parse(JSON.stringify(medicine));
    } catch (error) {
        console.error('Error fetching medicine:', error);
        return null;
    }
}

export default async function EditMedicinePage({ params }: EditMedicinePageProps) {
    const { id } = await params;
    const medicine = await getMedicine(id);

    if (!medicine) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Edit Medicine"
                subtitle={medicine.name}
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

            <MedicineForm mode="edit" initialData={medicine} />
        </div>
    );
}
