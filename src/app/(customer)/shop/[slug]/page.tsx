import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    Package,
    Truck,
    Shield,
    AlertTriangle,
    Star,
    Check,
    ArrowRight,
    Clock,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-12 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto whitespace-nowrap">
                <Link href="/shop" className="text-gray-500 hover:text-primary-600 transition-colors font-medium">
                    Shop
                </Link>
                <span className="text-gray-300">/</span>
                <Link
                    href={`/shop?category=${encodeURIComponent(medicine.category)}`}
                    className="text-gray-500 hover:text-primary-600 transition-colors font-medium"
                >
                    {medicine.category}
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-bold truncate">{medicine.name}</span>
            </nav>

            {/* Product Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
                {/* Image */}
                <div className="relative">
                    <div className="aspect-square bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-2xl shadow-gray-200/50 group">
                        {medicine.image ? (
                            <img
                                src={medicine.image}
                                alt={medicine.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <Package className="w-32 h-32 text-gray-200" />
                            </div>
                        )}

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Badges */}
                    <div className="absolute top-6 left-6 flex flex-col gap-3">
                        {discountPercentage > 0 && (
                            <div className="bg-red-500 text-white font-black px-4 py-2 rounded-2xl shadow-xl shadow-red-200 animate-pulse text-lg">
                                -{discountPercentage}% OFF
                            </div>
                        )}
                        {medicine.isFeatured && (
                            <div className="bg-white/90 backdrop-blur-md text-amber-500 font-bold px-4 py-2 rounded-2xl shadow-xl border border-amber-100 flex items-center gap-2">
                                <Star className="w-5 h-5 fill-current" />
                                Premium Choice
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center">
                    <div className="mb-6">
                        <Link
                            href={`/shop?category=${encodeURIComponent(medicine.category)}`}
                            className="inline-flex items-center px-4 py-1.5 bg-primary-50 text-primary-600 text-xs font-bold rounded-full border border-primary-100 uppercase tracking-widest hover:bg-primary-100 transition-all"
                        >
                            {medicine.category}
                        </Link>
                    </div>

                    <h1 className="text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
                        {medicine.name}
                    </h1>

                    <p className="text-xl text-gray-500 mb-10 leading-relaxed font-medium">
                        Crafted with care by <span className="text-primary-600 font-bold decoration-primary-200 underline underline-offset-4 decoration-2">{medicine.manufacturer}</span>
                    </p>

                    {/* Price Section */}
                    <div className="mb-12 relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-primary-600 rounded-[32px] translate-y-2 translate-x-2 blur-2xl opacity-5 group-hover:opacity-10 transition-opacity" />

                        <div className="relative p-8 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
                            <div className="flex items-baseline gap-4 mb-6">
                                <span className="text-5xl font-black text-gray-900 tracking-tighter">
                                    ৳{medicine.price.toFixed(2)}
                                </span>
                                {medicine.compareAtPrice && medicine.compareAtPrice > medicine.price && (
                                    <span className="text-2xl text-gray-400 line-through decoration-red-400/50 decoration-2">
                                        ৳{medicine.compareAtPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="mb-10">
                                {inStock ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-2xl border border-green-100">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                            <span className="font-bold text-sm">Ready for Delivery</span>
                                        </div>
                                        <span className="text-gray-400 text-sm font-medium">• Only {medicine.stock} left in stock</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span className="font-bold">Currently Unavailable</span>
                                    </div>
                                )}
                            </div>

                            {/* Add to Cart */}
                            <AddToCartClient product={cartProduct} />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wider">About this product</h2>
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed font-medium">
                            {medicine.description}
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-10 border-t border-gray-100">
                        <div className="p-4 bg-gray-50 rounded-3xl text-center hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                <Truck className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">60m Delivery</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-3xl text-center hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">100% Genuine</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-3xl text-center hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sterile Pack</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Safety & Info Sections */}
            <div className="mb-32">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
                        Safety & Usage Guide
                    </h2>
                    <div className="w-24 h-1.5 bg-primary-500 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Usage Card */}
                    {(medicine.dosage || medicine.directions) && (
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[80px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />

                            <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-4 relative">
                                <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-primary-600" />
                                </div>
                                Directions for Use
                            </h3>

                            <div className="space-y-8 relative">
                                {medicine.dosage && (
                                    <div>
                                        <p className="text-xs font-black text-primary-500 uppercase tracking-widest mb-3">Recommended Dosage</p>
                                        <div className="bg-gray-50 p-6 rounded-3xl text-gray-700 font-medium leading-relaxed border border-gray-100">
                                            {medicine.dosage}
                                        </div>
                                    </div>
                                )}
                                {medicine.directions && (
                                    <div>
                                        <p className="text-xs font-black text-primary-500 uppercase tracking-widest mb-3">Administration</p>
                                        <div className="bg-gray-50 p-6 rounded-3xl text-gray-700 font-medium leading-relaxed border border-gray-100">
                                            {medicine.directions}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-10">
                        {/* Ingredients */}
                        {medicine.activeIngredients?.length > 0 && (
                            <div className="bg-gray-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform" />

                                <h3 className="text-2xl font-black mb-8 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                        <Package className="w-6 h-6 text-primary-300" />
                                    </div>
                                    Composition
                                </h3>

                                <div className="flex flex-wrap gap-3 relative">
                                    {medicine.activeIngredients.map((ingredient: string, i: number) => (
                                        <span key={i} className="px-5 py-2.5 bg-white/10 rounded-2xl text-sm font-bold border border-white/10 hover:bg-primary-500 transition-colors cursor-default">
                                            {ingredient}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Warnings */}
                        {medicine.warnings?.length > 0 && (
                            <div className="bg-red-50 p-10 rounded-[40px] border border-red-100 relative overflow-hidden group">
                                <h3 className="text-2xl font-black text-red-900 mb-8 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    Safety Precautions
                                </h3>

                                <div className="space-y-4">
                                    {medicine.warnings.map((warning: string, i: number) => (
                                        <div key={i} className="flex gap-4 items-start bg-white p-5 rounded-3xl border border-red-100 shadow-sm group-hover:-translate-y-1 transition-transform">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                            <p className="text-red-900/80 font-bold text-sm leading-relaxed">{warning}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {related.length > 0 && (
                <section className="pt-24 border-t border-gray-100">
                    <div className="flex items-end justify-between mb-16">
                        <div>
                            <div className="inline-flex items-center gap-2 text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">
                                <Package className="w-5 h-5" />
                                Handpicked for you
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">You might also need</h2>
                        </div>
                        <Link href={`/shop?category=${encodeURIComponent(medicine.category)}`} className="group text-primary-600 font-black hover:text-primary-700 transition-colors flex items-center gap-2">
                            Explore All <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
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
