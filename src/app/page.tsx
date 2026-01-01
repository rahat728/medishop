import Link from 'next/link';
import { Navbar } from '@/components/layout';
import { Footer } from '@/components/layout';
import { 
  Truck, 
  Shield, 
  Clock, 
  MapPin,
  ArrowRight,
  Package
} from 'lucide-react';

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

const categories = [
  { name: 'Pain Relief', count: 24, color: 'bg-red-100 text-red-600' },
  { name: 'Cold & Flu', count: 18, color: 'bg-blue-100 text-blue-600' },
  { name: 'Digestive Health', count: 15, color: 'bg-green-100 text-green-600' },
  { name: 'Vitamins', count: 32, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'First Aid', count: 21, color: 'bg-purple-100 text-purple-600' },
  { name: 'Skin Care', count: 27, color: 'bg-pink-100 text-pink-600' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Health,{' '}
                <span className="text-primary-200">Delivered</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-primary-100 max-w-lg">
                Get OTC medicines delivered to your doorstep with live tracking. 
                Fast, reliable, and always there when you need us.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors border border-primary-400"
                >
                  Track Order
                  <MapPin className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 bg-primary-400/30 rounded-full absolute -top-4 -left-4" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                  <Package className="w-32 h-32 text-primary-500 mx-auto" />
                  <p className="text-gray-900 font-semibold text-center mt-4">
                    Order medicines online
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Choose MedDelivery?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              We make getting your OTC medicines simple, fast, and reliable.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Browse Categories
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Find what you need from our wide range of OTC medicines.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/shop?category=${category.name.toLowerCase().replace(' ', '-')}`}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-center group"
              >
                <div className={`w-12 h-12 rounded-full ${category.color} mx-auto mb-3 flex items-center justify-center`}>
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {category.count} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Create an account today and get your first delivery with free shipping!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Create Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Browse as Guest
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
