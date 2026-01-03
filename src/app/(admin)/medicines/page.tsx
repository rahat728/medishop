import { Suspense } from 'react';
import { MedicineList } from '@/components/admin/medicines';
import { PageLoader } from '@/components/ui';

export default function MedicinesPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <MedicineList />
        </Suspense>
    );
}
