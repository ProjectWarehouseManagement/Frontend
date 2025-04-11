  import React, { useState } from 'react';
  import { useForm } from 'react-hook-form';

  interface CreateProviderDto {
    name: string;
    email: string;
    phone: string;
  }

  interface ProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
  }

  export const ProviderModal: React.FC<ProviderModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { 
      register, 
      handleSubmit, 
      formState: { errors }, 
      reset,
      trigger
    } = useForm<CreateProviderDto>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const validatePhone = (value: string) => {
      const phoneRegex = /^\+?[0-9\s\-\(\)]{10,}$/;
      return phoneRegex.test(value) || 'Enter a valid phone number (e.g., +1234567890)';
    };

    const submitProvider = async (data: CreateProviderDto) => {
      setIsSubmitting(true);
      setApiError(null);
      
      try {
        const response = await fetch('http://localhost:3000/orders/provider', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create provider');
        }

        reset();
        onClose();
        if (onSuccess) onSuccess();
        
      } catch (error) {
        console.error('API Error:', error);
        setApiError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Add New Provider</h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 text-2xl"
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>

            {apiError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(submitProvider)}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Name *
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { 
                    required: 'Provider name is required',
                    validate: (value) => !!value.trim() || 'Name cannot be empty'
                  })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  onBlur={() => trigger('name')}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Enter a valid email address'
                    }
                  })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  onBlur={() => trigger('email')}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', { 
                    required: 'Phone number is required',
                    validate: validatePhone
                  })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    errors.phone 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="+1234567890"
                  onBlur={() => trigger('phone')}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };