import Link from 'next/link';
import Image from 'next/image';
import {
  Truck,
  Shield,
  Clock,
  MapPin,
  ArrowRight,
  Package,
  Star,
} from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { ProductCard } from '@/components/customer';
import { Button } from '@/components/ui';
import { Navbar, Footer } from '@/components/layout';

const features = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Get your OTC medicines delivered to your doorstep within hours.',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'All products are sourced from verified pharmacies and handled with care.',
  },
  {
    icon: Clock,
    title: '24/7 Available',
    description: 'Order anytime, anywhere. We are always here to serve you.',
  },
  {
    icon: MapPin,
    title: 'Live Tracking',
    description: 'Track your delivery in real-time with our GPS-enabled system.',
  },
];

async function getFeaturedProducts() {
  try {
    await connectDB();

    const products = await Medicine.find({
      isActive: true,
      isFeatured: true,
      stock: { $gt: 0 },
    })
      .select('name slug description price compareAtPrice category image manufacturer stock isFeatured')
      .lean();

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

async function getCategories() {
  try {
    await connectDB();

    const categories = await Medicine.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  const categoryColors = [
    'bg-red-100 text-red-600',
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-primary-100 text-sm font-medium mb-6 border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Now delivering in your area
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                Your Health, <br />
                <span className="text-primary-300">Delivered.</span>
              </h1>
              <p className="mt-8 text-xl text-primary-100/90 max-w-lg leading-relaxed">
                Get over-the-counter medicines delivered to your doorstep with real-time tracking.
                Fast, reliable, and always there when you need us.
              </p>
              <div className="mt-10 flex flex-wrap gap-5">
                <Link href="/shop">
                  <Button variant="white" size="lg" className="px-10 h-14 text-lg font-bold shadow-xl">
                    Shop Now
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </Link>
                <Link href="/orders">
                  <Button size="lg" variant="secondary" className="bg-primary-700/50 hover:bg-primary-700 text-white border border-primary-500/50 backdrop-blur-sm px-10 h-14 text-lg font-bold">
                    Track Order
                    <MapPin className="w-6 h-6 ml-2 text-primary-300" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500 rounded-full blur-[100px] opacity-20"></div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
                  <Image
                    src="/images/hero-medicine.png"
                    alt="Medicine Delivery"
                    width={400}
                    height={400}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
                    <p className="text-white text-2xl font-bold">Freshly Packed</p>
                    <p className="text-primary-200 text-sm mt-1 uppercase tracking-widest font-medium">Coming to you soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
              Why Choose Medishop?
            </h2>
            <div className="w-20 h-1.5 bg-primary-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              We've redesigned the pharmacy experience to be faster, safer, and completely transparent.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary-100 group"
                >
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-24 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-16">
              <div>
                <div className="inline-flex items-center gap-2 text-primary-600 font-bold text-sm uppercase tracking-widest mb-2">
                  <Star className="w-4 h-4 fill-primary-600" />
                  Trending Medicines
                </div>
                <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                  Featured Products
                </h2>
              </div>
              <Link
                href="/shop?featured=true"
                className="hidden sm:inline-flex items-center gap-2 group text-primary-600 font-bold hover:text-primary-700 transition-colors"
              >
                View Catalog
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product: any) => (
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
            <div className="mt-12 text-center sm:hidden">
              <Link href="/shop?featured=true">
                <Button className="w-full h-12 rounded-xl text-lg font-bold">
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                Browse by Category
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Find exactly what you need in our curated collections.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category: any, index: number) => (
                <Link
                  key={category._id}
                  href={`/shop?category=${encodeURIComponent(category._id)}`}
                  className="group relative"
                >
                  <div className="bg-gray-50 rounded-3xl p-6 text-center hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-primary-100 flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl ${categoryColors[index % categoryColors.length]} mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                      <Package className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {category._id}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium bg-gray-100 px-2.5 py-1 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      {category.count} items
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          <div className="bg-primary-600 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-400 rounded-full blur-[100px] opacity-20"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-800 rounded-full blur-[100px] opacity-30"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-8">
                Get Started with Medishop
              </h2>
              <p className="text-2xl text-primary-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join thousands of happy customers and get your first delivery with <span className="text-white font-bold underline">FREE shipping</span>!
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/register">
                  <Button variant="white" size="lg" className="px-12 h-16 text-xl font-bold shadow-xl sm:w-auto w-full">
                    Create Account
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button size="lg" variant="secondary" className="bg-primary-700 hover:bg-primary-800 text-white border border-primary-500 px-12 h-16 text-xl font-bold sm:w-auto w-full">
                    Browse catalog
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


