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
import { AddToCartClient } from './AddToCartClient';

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
            category: medicine.category,
            _id: { $ne: medicine._id },
            isActive: true,
            stock: { $gt: 0 },
        })
            .select('name slug price compareAtPrice image category manufacturer stock description')
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

    const cartProduct = {
        _id: medicine._id.toString(),
        name: medicine.name,
        slug: medicine.slug,
        price: medicine.price,
        compareAtPrice: medicine.compareAtPrice,
        image: medicine.image,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        stock: medicine.stock,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-900 text-white">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-8 bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-nowrap">
                <Link href="/shop" className="text-gray-300 hover:text-primary-200 transition-colors">
                    Shop
                </Link>
                <span className="text-gray-300">/</span>
                <Link
                    href={`/shop?category=${encodeURIComponent(medicine.category)}`}
                    className="text-gray-300 hover:text-primary-200 transition-colors"
                >
                    {medicine.category}
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium truncate">{medicine.name}</span>
            </nav>

            {/* Product Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                {/* Image */}
                <div className="relative">
                    <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
                        {medicine.image ? (
                            <img
                                src={medicine.image}
                                alt={medicine.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-32 h-32 text-gray-200" />
                            </div>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {discountPercentage > 0 && (
                            <Badge variant="error" className="shadow-lg text-lg px-3 py-1">
                                -{discountPercentage}% OFF
                            </Badge>
                        )}
                        {medicine.isFeatured && (
                            <Badge variant="warning" className="shadow-lg">
                                <Star className="w-4 h-4 mr-1 fill-current" />
                                Featured
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <div className="mb-4">
                        <Link
                            href={`/shop?category=${encodeURIComponent(medicine.category)}`}
                            className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-semibold rounded-full hover:bg-primary-100 transition-colors"
                        >
                            {medicine.category}
                        </Link>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                        {medicine.name}
                    </h1>

                    <p className="text-lg text-gray-300 mb-6">
                        Manufactured by <span className="text-gray-900 font-medium">{medicine.manufacturer}</span>
                    </p>

                    {/* Price Section */}
                    <div className="mb-8 p-6 bg-gray-800 rounded-2xl border border-gray-700 shadow-sm">
                        <div className="flex items-baseline gap-3 mb-4">
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
                        <div className="mb-6">
                            {inStock ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                                    <Check className="w-5 h-5" />
                                    <span className="font-semibold">In Stock</span>
                                    <span className="text-green-700 opacity-75">• {medicine.stock} units left</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-fit">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-semibold">Out of Stock</span>
                                </div>
                            )}
                        </div>

                        {/* Add to Cart */}
                        <AddToCartClient product={cartProduct} />
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Product Description</h2>
                        <p className="text-gray-600 leading-relaxed">
                            {medicine.description}
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-100 mt-auto">
                        <div className="text-center group">
                            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-100 transition-colors">
                                <Truck className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Fast Delivery</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-100 transition-colors">
                                <Shield className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">100% Genuine</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-100 transition-colors">
                                <Package className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Secure Pack</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Details Sections */}
            <div className="mb-20 text-white">
                <h2 className="text-2xl font-bold text-white mb-8 pb-2 border-b-2 border-primary-500 w-fit">
                    Safety & Usage Information
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Dosage & Directions */}
                    {(medicine.dosage || medicine.directions) && (
                        <Card className="border-none shadow-sm bg-gray-50/50">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-primary-500 rounded-full" />
                                    Dosage & Directions
                                </h3>
                                {medicine.dosage && (
                                    <div className="mb-6">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended Dosage</p>
                                        <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">{medicine.dosage}</p>
                                    </div>
                                )}
                                {medicine.directions && (
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Usage Directions</p>
                                        <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">{medicine.directions}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-8">
                        {/* Active Ingredients */}
                        {medicine.activeIngredients?.length > 0 && (
                            <Card className="border-none shadow-sm bg-primary-50/30">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-2 h-8 bg-primary-500 rounded-full" />
                                        Active Ingredients
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {medicine.activeIngredients.map((ingredient: string, i: number) => (
                                            <Badge key={i} variant="info" className="px-4 py-2 text-sm font-medium shadow-sm">
                                                {ingredient}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Warnings */}
                        {medicine.warnings?.length > 0 && (
                            <Card className="border-none shadow-sm bg-gray-800/30">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-gray-300 mb-6 flex items-center gap-3">
                                        <div className="w-2 h-8 bg-red-500 rounded-full" />
                                        Safety Warnings
                                    </h3>
                                    <div className="space-y-3">
                                        {medicine.warnings.map((warning: string, i: number) => (
                                            <div key={i} className="flex items-start gap-4 bg-gray-700 p-4 rounded-xl border border-red-100 shadow-sm">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-gray-300 text-sm font-medium">{warning}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {related.length > 0 && (
                <section className="pt-16 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Related Products</h2>
                            <p className="text-gray-500 mt-1">Customers who bought this also viewed these medicines.</p>
                        </div>
                        <Link href={`/shop?category=${encodeURIComponent(medicine.category)}`} className="text-primary-600 font-bold hover:text-primary-700 transition-colors flex items-center gap-1">
                            View All <Package className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
