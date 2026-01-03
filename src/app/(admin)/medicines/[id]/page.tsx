import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Edit,
    Package,
    Tag,
    Building,
    AlertTriangle,
    Star,
} from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { AdminHeader } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

interface ViewMedicinePageProps {
    params: Promise<{ id: string }>;
}

async function getMedicine(id: string) {
    try {
        await connectDB();
        const medicine = await Medicine.findById(id).lean();

        if (!medicine) {
            return null;
        }

        return JSON.parse(JSON.stringify(medicine));
    } catch (error) {
        console.error('Error fetching medicine:', error);
        return null;
    }
}

export default async function ViewMedicinePage({ params }: ViewMedicinePageProps) {
    const { id } = await params;
    const medicine = await getMedicine(id);

    if (!medicine) {
        notFound();
    }

    const isLowStock = medicine.stock <= medicine.lowStockThreshold && medicine.stock > 0;
    const isOutOfStock = medicine.stock === 0;

    return (
        <div className="space-y-6">
            <AdminHeader
                title={medicine.name}
                subtitle={`SKU: ${medicine.slug}`}
                actions={
                    <div className="flex items-center gap-3">
                        <Link
                            href="/medicines"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                        <Link href={`/medicines/${medicine._id}/edit`}>
                            <Button leftIcon={<Edit className="w-4 h-4" />}>
                                Edit
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-6">
                                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {medicine.image ? (
                                        <img
                                            src={medicine.image}
                                            alt={medicine.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={medicine.isActive ? 'success' : 'default'}>
                                            {medicine.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        {medicine.isFeatured && (
                                            <Badge variant="warning">
                                                <Star className="w-3 h-3 mr-1" />
                                                Featured
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-600">{medicine.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Tag className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Category</p>
                                        <p className="font-medium">{medicine.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Building className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Manufacturer</p>
                                        <p className="font-medium">{medicine.manufacturer}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {medicine.activeIngredients?.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Active Ingredients</p>
                                    <div className="flex flex-wrap gap-2">
                                        {medicine.activeIngredients.map((ingredient: string, i: number) => (
                                            <Badge key={i} variant="default">{ingredient}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {medicine.dosage && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Dosage</p>
                                    <p className="text-gray-600">{medicine.dosage}</p>
                                </div>
                            )}

                            {medicine.directions && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Directions</p>
                                    <p className="text-gray-600">{medicine.directions}</p>
                                </div>
                            )}

                            {medicine.warnings?.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Warnings</p>
                                    <div className="space-y-1">
                                        {medicine.warnings.map((warning: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm">{warning}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                ${medicine.price.toFixed(2)}
                            </div>
                            {medicine.compareAtPrice && medicine.compareAtPrice > medicine.price && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-400 line-through">
                                        ${medicine.compareAtPrice.toFixed(2)}
                                    </span>
                                    <Badge variant="success">
                                        {Math.round(((medicine.compareAtPrice - medicine.price) / medicine.compareAtPrice) * 100)}% off
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Inventory */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-600">Stock</span>
                                <span className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                    {medicine.stock}
                                </span>
                            </div>

                            {isOutOfStock && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Out of stock!</span>
                                </div>
                            )}

                            {isLowStock && (
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Low stock alert</span>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Low stock threshold</span>
                                    <span className="font-medium">{medicine.lowStockThreshold}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    {medicine.tags?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Tags</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {medicine.tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="default">#{tag}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
