'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCheckoutStore } from '@/store';
import { Button, Input } from '@/components/ui';
import { ArrowRight, MapPin } from 'lucide-react';

const shippingSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    wardNo: z.string().min(1, 'Ward number is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export function ShippingForm() {
    const { setShippingAddress, setStep, shippingAddress, isEmergency, setIsEmergency } = useCheckoutStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ShippingFormData>({
        resolver: zodResolver(shippingSchema),
        defaultValues: {
            firstName: shippingAddress?.firstName || '',
            lastName: shippingAddress?.lastName || '',
            wardNo: shippingAddress?.wardNo || '',
            phone: shippingAddress?.phone || '',
        },
    });

    useEffect(() => {
        if (shippingAddress) {
            reset({
                firstName: shippingAddress.firstName || '',
                lastName: shippingAddress.lastName || '',
                wardNo: shippingAddress.wardNo || '',
                phone: shippingAddress.phone || '',
            });
        }
    }, [shippingAddress, reset]);

    const onSubmit = (data: ShippingFormData) => {
        // We still need to pass the structure expected by the store/backend, 
        // effectively filling missing fields with empty strings if they are optional now.
        setShippingAddress({
            ...data,
            address: '',
            apartment: '',
            city: '',
            state: '',
            zipCode: '',
        });
        setStep(2);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
                    <p className="text-sm text-gray-500">Provide your delivery details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="First Name"
                        placeholder="John"
                        {...register('firstName')}
                        error={errors.firstName?.message}
                    />
                    <Input
                        label="Last Name"
                        placeholder="Doe"
                        {...register('lastName')}
                        error={errors.lastName?.message}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Ward Number"
                        placeholder="Ward 05"
                        {...register('wardNo')}
                        error={errors.wardNo?.message}
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="(555) 000-0000"
                        {...register('phone')}
                        error={errors.phone?.message}
                    />
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <div
                        className={`p-4 rounded-xl border-2 transition-colors cursor-pointer flex items-start gap-3 ${isEmergency ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-red-200'}`}
                        onClick={() => setIsEmergency(!isEmergency)}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${isEmergency ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                            {isEmergency && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h4 className={`font-bold ${isEmergency ? 'text-red-700' : 'text-gray-900'}`}>🚑 Emergency Delivery (৳99)</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Need it urgent? Get your medicine delivered within 30 minutes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        * All fields are required.
                    </p>
                    <Button type="submit" size="lg" className="px-8 shadow-lg shadow-primary-100" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Continue to Payment
                    </Button>
                </div>
            </form>
        </div>
    );
}
