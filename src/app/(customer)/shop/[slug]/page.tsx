import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    Package,
    Truck,
    Shield,
    AlertTriangle,
    Star,
    Check,
} from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { Badge, Card, CardContent } from '@/components/ui';
import { ProductCard } from '@/components/customer';
import { AddToCartButton } from './AddToCartClient';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
    try {
        await connectDB();

        const medicine = await Medicine.findOne({
            slug,
            isActive: true,
        }).lean();

        if (!medicine) {
            return null;
        }

        // Get related products
        const related = await Medicine.find({
            category: (medicine as any).category,
            _id: { $ne: (medicine as any)._id },
            isActive: true,
            stock: { $gt: 0 },
        })
            .select('name slug price compareAtPrice image category manufacturer stock')
            .limit(4)
            .lean();

        return {
            medicine: JSON.parse(JSON.stringify(medicine)),
            related: JSON.parse(JSON.stringify(related)),
        };
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;
    const data = await getProduct(slug);

    if (!data) {
        notFound();
    }

    const { medicine, related } = data;
    const inStock = medicine.stock > 0;
    const discountPercentage = medicine.compareAtPrice && medicine.compareAtPrice > medicine.price
        ? Math.round(((medicine.compareAtPrice - medicine.price) / medicine.compareAtPrice) * 100)
        : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-8">
                <Link href="/shop" className="text-gray-500 hover:text-primary-600">
                    Shop
                </Link>
                <span className="text-gray-300">/</span>
                <Link
                    href={`/shop?category=${encodeURIComponent(medicine.category)}`}
                    className="text-gray-500 hover:text-primary-600"
                >
                    {medicine.category}
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">{medicine.name}</span>
            </nav>

            {/* Product Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                {/* Image */}
                <div className="relative">
                    <div className="aspect-square bg-white border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center p-8">
                        {medicine.image ? (
                            <img
                                src={medicine.image}
                                alt={medicine.name}
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <Package className="w-32 h-32 text-gray-200" />
                        )}
                    </div>

                    {/* Badges */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                        {discountPercentage > 0 && (
                            <Badge variant="error" size="lg">
                                -{discountPercentage}% OFF
                            </Badge>
                        )}
                        {medicine.isFeatured && (
                            <Badge variant="warning" size="lg">
                                <Star className="w-4 h-4 mr-1 fill-current" />
                                Featured
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div>
                    <div className="mb-4">
                        <Link
                            href={`/shop?category=${encodeURIComponent(medicine.category)}`}
                            className="text-primary-600 text-sm font-medium hover:underline"
                        >
                            {medicine.category}
                        </Link>
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {medicine.name}
                    </h1>

                    <p className="text-gray-500 mb-6 font-medium">
                        By {medicine.manufacturer}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-3 mb-6">
                        <span className="text-4xl font-bold text-gray-900">
                            ${medicine.price.toFixed(2)}
                        </span>
                        {medicine.compareAtPrice && medicine.compareAtPrice > medicine.price && (
                            <span className="text-xl text-gray-400 line-through">
                                ${medicine.compareAtPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    {/* Stock Status */}
                    <div className="mb-8">
                        {inStock ? (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full text-sm font-medium border border-green-100">
                                <Check className="w-4 h-4" />
                                <span>In Stock ({medicine.stock} units)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full text-sm font-medium border border-red-100">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Out of Stock</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="prose prose-primary max-w-none text-gray-600 mb-8 leading-relaxed">
                        {medicine.description}
                    </div>

                    {/* Add to Cart */}
                    <AddToCartButton
                        productId={medicine._id}
                        productName={medicine.name}
                        inStock={inStock}
                    />

                    {/* Delivery & Security Features */}
                    <div className="grid grid-cols-3 gap-4 mt-12 py-8 border-y border-gray-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                                <Truck className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Fast Delivery</p>
                            <p className="text-xs text-gray-500 mt-1">Within 24 hours</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                                <Shield className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Genuine</p>
                            <p className="text-xs text-gray-500 mt-1">Verified pharmacy</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                                <Package className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Secure</p>
                            <p className="text-xs text-gray-500 mt-1">Tamp-proof pack</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Details Section */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Detailed Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Dosage & Directions */}
                    {(medicine.dosage || medicine.directions) && (
                        <Card className="h-full">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                                    Dosage & Directions
                                </h3>
                                {medicine.dosage && (
                                    <div className="mb-6">
                                        <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Dosage</p>
                                        <p className="text-gray-600 leading-relaxed">{medicine.dosage}</p>
                                    </div>
                                )}
                                {medicine.directions && (
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Directions</p>
                                        <p className="text-gray-600 leading-relaxed">{medicine.directions}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Active Ingredients & Warnings */}
                    <div className="space-y-8">
                        {medicine.activeIngredients?.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                                        Active Ingredients
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {medicine.activeIngredients.map((ingredient: string, i: number) => (
                                            <Badge key={i} variant="info" size="sm">{ingredient}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {medicine.warnings?.length > 0 && (
                            <Card className="border-red-100 bg-red-50/10">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2 border-b border-red-100 pb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        Important Warnings
                                    </h3>
                                    <ul className="space-y-3">
                                        {medicine.warnings.map((warning: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-700 text-sm leading-relaxed">
                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                                                {warning}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {related.length > 0 && (
                <section className="pt-16 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Related Products
                        </h2>
                        <Link
                            href={`/shop?category=${encodeURIComponent(medicine.category)}`}
                            className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                        >
                            View All
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {related.map((product: any) => (
                            <ProductCard
                                key={product._id}
                                product={{
                                    ...product,
                                    _id: product._id.toString(),
                                    inStock: product.stock > 0,
                                    discountPercentage: product.compareAtPrice && product.compareAtPrice > product.price
                                        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                                        : 0,
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
