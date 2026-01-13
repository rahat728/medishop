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
    address: z.string().min(5, 'Address is required'),
    apartment: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'Valid ZIP code is required'),
    wardNo: z.string().optional(),
    phone: z.string().min(10, 'Valid phone number is required'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export function ShippingForm() {
    const { setShippingAddress, setStep, shippingAddress } = useCheckoutStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ShippingFormData>({
        resolver: zodResolver(shippingSchema),
        defaultValues: shippingAddress || {
            firstName: '',
            lastName: '',
            address: '',
            apartment: '',
            city: '',
            state: '',
            zipCode: '',
            wardNo: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (shippingAddress) {
            reset(shippingAddress);
        }
    }, [shippingAddress, reset]);

    const onSubmit = (data: ShippingFormData) => {
        setShippingAddress(data);
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

                <Input
                    label="Street Address"
                    placeholder="123 Health Ave"
                    {...register('address')}
                    error={errors.address?.message}
                />

                <Input
                    label="Apartment, suite, etc. (optional)"
                    placeholder="Apt 4B"
                    {...register('apartment')}
                    error={errors.apartment?.message}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                        label="City"
                        placeholder="Metropolis"
                        {...register('city')}
                        error={errors.city?.message}
                    />
                    <Input
                        label="State"
                        placeholder="NY"
                        {...register('state')}
                        error={errors.state?.message}
                    />
                    <Input
                        label="ZIP Code"
                        placeholder="10001"
                        {...register('zipCode')}
                        error={errors.zipCode?.message}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Ward Number (optional)"
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

                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        * All fields except apartment are required.
                    </p>
                    <Button type="submit" size="lg" className="px-8 shadow-lg shadow-primary-100" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Continue to Payment
                    </Button>
                </div>
            </form>
        </div>
    );
}
