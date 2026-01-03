import Link from 'next/link';
import { CheckCircle, ArrowRight, Package, Home, Calendar } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface SuccessPageProps {
    searchParams: Promise<{ orderId: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { orderId } = await searchParams;

    return (
        <div className="bg-gray-50 min-h-screen pt-12 pb-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-8 shadow-lg shadow-green-100 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">
                        Thank You for Your Order!
                    </h1>

                    <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        We've received your request and our pharmacists are verifying your order.
                        You'll receive a confirmation email with delivery details shortly.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                                <p className="font-mono font-bold text-gray-900">{orderId || 'PENDING'}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Est. Delivery</p>
                                <p className="font-bold text-gray-900">Within 60 Minutes</p>
                            </div>
                        </div>
                    </div>

                    <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden mb-12">
                        <CardContent className="p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h3>
                            <div className="space-y-4 text-left">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                                    <p className="text-gray-600"><span className="font-bold text-gray-900">Verification:</span> Our team will confirm the availability of your items.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                    <p className="text-gray-600"><span className="font-bold text-gray-900">Preparation:</span> Your package will be securely sealed by a professional pharmacist.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                                    <p className="text-gray-600"><span className="font-bold text-gray-900">Delivery:</span> A nearby delivery partner will pick up and drop off your order.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/orders">
                            <Button size="lg" className="w-full sm:w-auto px-8 py-6 rounded-2xl shadow-lg shadow-primary-100" leftIcon={<Package className="w-5 h-5" />}>
                                Track Your Order
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 py-6 rounded-2xl" leftIcon={<Home className="w-5 h-5" />}>
                                Return Home
                            </Button>
                        </Link>
                    </div>

                    <Link href="/shop" className="inline-flex items-center gap-2 text-primary-600 font-bold mt-12 hover:underline">
                        Continue Shopping <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
