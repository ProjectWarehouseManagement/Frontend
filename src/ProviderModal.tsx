  import React, { useState } from 'react';
  import { useForm } from 'react-hook-form';
  import 'bootstrap/dist/css/bootstrap.min.css'; 

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
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Add New Provider</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClose}
            disabled={isSubmitting}
          ></button>
        </div>

        <div className="modal-body">
          {apiError && (
            <div className="alert alert-danger mb-3">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(submitProvider)}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                Provider Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { 
                  required: 'Provider name is required',
                  validate: (value) => !!value.trim() || 'Name cannot be empty'
                })}
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                onBlur={() => trigger('name')}
                disabled={isSubmitting}
              />
              {errors.name && (
                <div className="invalid-feedback">
                  {errors.name.message}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
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
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                onBlur={() => trigger('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <div className="invalid-feedback">
                  {errors.email.message}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="form-label">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone', { 
                  required: 'Phone number is required',
                  validate: validatePhone
                })}
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="+1234567890"
                onBlur={() => trigger('phone')}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <div className="invalid-feedback">
                  {errors.phone.message}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : 'Save Provider'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
    );
  };