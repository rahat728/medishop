'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface CheckoutStepsProps {
    currentStep: number;
}

const steps = [
    { number: 1, label: 'Shipping' },
    { number: 2, label: 'Payment' },
    { number: 3, label: 'Review' },
];

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
    return (
        <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => {
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;

                return (
                    <div key={step.number} className="flex items-center">
                        {/* Step Circle */}
                        <div className="relative flex flex-col items-center">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${isCompleted
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                                        : isCurrent
                                            ? 'bg-primary-500 text-white ring-8 ring-primary-50 shadow-lg shadow-primary-100'
                                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                    }
                `}
                            >
                                {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : step.number}
                            </div>
                            <span
                                className={`
                  absolute top-14 text-xs font-bold uppercase tracking-wider whitespace-nowrap
                  ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                `}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className="px-4">
                                <div
                                    className={`
                    w-12 sm:w-20 lg:w-32 h-1 rounded-full overflow-hidden bg-gray-100
                  `}
                                >
                                    <div
                                        className={`h-full bg-primary-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
