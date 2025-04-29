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
          throw new Error(errorData.message || 'Beszállító hozzáadása sikertelen');
        }

        reset();
        onClose();
        if (onSuccess) onSuccess();
        
      } catch (error) {
        console.error('API Error:', error);
        setApiError(error instanceof Error ? error.message : 'Ismeretlen hiba történt.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="modal-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1050,
        backdropFilter: 'blur(5px)'
      }}>
        <div className="formWrapper" style={{
          margin: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          borderRadius: '12px',
          background: 'hsla(220, 30%, 10%, 0.9)',
          width: '90%',
          maxWidth: '450px',
          boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6), 0px 15px 35px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid hsla(220, 30%, 40%, 0.3)',
          color: 'white'
        }}>
          <div className="modal-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)',
            paddingBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 10vw, 2.15rem)',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>Beszállító Hozzáadása</h2>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                filter: 'invert(1)',
                opacity: isSubmitting ? '0.5' : '1',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            ></button>
          </div>
    
          <div className="modal-body">
            {apiError && (
              <div className="alert alert-danger mb-3" style={{
                backgroundColor: 'hsla(0, 100%, 30%, 0.2)',
                border: '1px solid #FF5252',
                color: '#FF5252',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.25rem',
                marginBottom: '1rem'
              }}>
                {apiError}
              </div>
            )}
    
            <form onSubmit={handleSubmit(submitProvider)}>
              <div className="mb-3" style={{ marginBottom: '1rem' }}>
                <label htmlFor="name" className="form-label" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'white'
                }}>
                  Beszállító Neve
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { 
                    required: 'Beszállító nevének megadása kötelező',
                    validate: (value) => !!value.trim() || 'Beszállító neve nem lehet üres'
                  })}
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  onBlur={() => trigger('name')}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #555',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    backgroundColor: 'black',
                    color: 'white',
                    transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
                    borderColor: errors.name ? '#FF5252' : '#555'
                  }}
                />
                {errors.name && (
                  <div className="invalid-feedback" style={{
                    width: '100%',
                    marginTop: '0.25rem',
                    fontSize: '0.875em',
                    color: '#FF5252'
                  }}>
                    {errors.name.message}
                  </div>
                )}
              </div>
    
              <div className="mb-3" style={{ marginBottom: '1rem' }}>
                <label htmlFor="email" className="form-label" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'white'
                }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'A beszállító email címének megadása kötelező',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Enter a valid email address'
                    }
                  })}
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  onBlur={() => trigger('email')}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #555',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    backgroundColor: 'black',
                    color: 'white',
                    transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
                    borderColor: errors.email ? '#FF5252' : '#555'
                  }}
                />
                {errors.email && (
                  <div className="invalid-feedback" style={{
                    width: '100%',
                    marginTop: '0.25rem',
                    fontSize: '0.875em',
                    color: '#FF5252'
                  }}>
                    {errors.email.message}
                  </div>
                )}
              </div>
    
              <div className="mb-3" style={{ marginBottom: '1rem' }}>
                <label htmlFor="phone" className="form-label" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'white'
                }}>
                  Telefonszám
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', { 
                    required: 'A beszállító telefonszámának megadása kötelező',
                    validate: validatePhone
                  })}
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder="+1234567890"
                  onBlur={() => trigger('phone')}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #555',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    backgroundColor: 'black',
                    color: 'white',
                    transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
                    borderColor: errors.phone ? '#FF5252' : '#555'
                  }}
                />
                {errors.phone && (
                  <div className="invalid-feedback" style={{
                    width: '100%',
                    marginTop: '0.25rem',
                    fontSize: '0.875em',
                    color: '#FF5252'
                  }}>
                    {errors.phone.message}
                  </div>
                )}
              </div>
    
              <div className="modal-footer" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1.5rem'
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: 'hsla(220, 70%, 8%, 1)',
                    color: 'white',
                    padding: '12px',
                    fontSize: '1rem',
                    border: '1px solid hsla(220, 70%, 20%, 1)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    width: '45%',
                    opacity: isSubmitting ? '0.5' : '1',
                  }}
                >
                  Vissza
                </button>
                <button
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: 'hsla(220, 70%, 8%, 1)',
                    color: 'white',
                    padding: '12px',
                    fontSize: '1.1rem',
                    border: '1px solid hsla(220, 70%, 20%, 1)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    width: '45%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isSubmitting ? '0.5' : '1',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Mentés...
                    </>
                  ) : 'Mentés'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };